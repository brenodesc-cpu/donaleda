// A ligação da demonstração pública (/experimente), aberta por QR Code e sem
// cadastro. GET diz se ainda cabe uma ligação hoje. POST reserva os dois minutos
// e põe a Dona Leda na linha: pelo motor da Agora, que é o padrão, ou pelo modo
// direto (?modo=direto na página, ou sozinho quando a Agora recusa).
// A pessoa de exemplo nasce em memória a cada ligação e nada do que o visitante
// diz é gravado. As ações respondem sem anotar (app/api/experimente/mcp).

import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { Agent, AgoraClient, Area, GeminiLive } from 'agora-agents';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import {
  SEGUNDOS_DO_PASSE_DA_ASSISTENTE,
  SEGUNDOS_DO_PASSE_DA_SALA,
  SEGUNDOS_POR_LIGACAO,
  baseDaDemonstracao,
  chaveDaDemonstracao,
  limitesDaDemonstracao,
  passeDaFicha,
  saudacaoDaDemonstracao,
  type RecusaDaDemonstracao,
} from '@/lib/demonstracao';
import { montarAbertura } from '@/lib/direto';
import { FERRAMENTAS } from '@/lib/ferramentas';
import { pedirPasseDoGemini } from '@/lib/passeDoGemini';
import { montarInstrucoes } from '@/lib/persona';
import { cabeMaisUmaHoje, reservarLigacao } from '@/lib/reservaDaDemonstracao';
import { urlPublica } from '@/lib/servidor';
import type { RespostaDaDemonstracao, SalaDaDemonstracao } from '@/lib/tiposDaDemonstracao';
import type { InicioDireto } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

const COOKIE_DO_VISITANTE = 'donaleda-visitante';
const SE_FALHAR = 'Só um instante, por favor.';

function esperaDeSilencio(): number {
  const pedido = Number(process.env.LIA_SILENCIO_MS);
  return Number.isFinite(pedido) && pedido >= 300 && pedido <= 2000 ? pedido : 650;
}

function modeloDoGemini(): string {
  return process.env.LIA_MODELO_GEMINI?.trim() || 'models/gemini-3.8-live';
}

function vozDoGemini(): string {
  return process.env.LIA_VOZ_GEMINI?.trim() || 'Leda';
}

/** O mesmo Gemini Live com ações de /api/invite-agent (o SDK ainda não leva MCP nesse modo). */
class GeminiLiveComAcoes extends GeminiLive {
  constructor(
    opcoes: ConstructorParameters<typeof GeminiLive>[0],
    private readonly servidores: Record<string, unknown>[] | undefined,
  ) {
    super(opcoes);
  }

  toConfig() {
    const config = super.toConfig();
    return this.servidores ? { ...config, mcp_servers: this.servidores } : config;
  }
}

/** O primeiro endereço da lista que a Vercel manda: a rede de onde o visitante liga. */
function redeDe(request: NextRequest): string {
  const lista = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '';
  return lista.split(',')[0]?.trim() || 'sem-rede';
}

export async function GET() {
  const limites = limitesDaDemonstracao();
  const aberta = await cabeMaisUmaHoje();
  return NextResponse.json(
    { aberta, motivo: limites.desligada ? 'desligada' : aberta ? null : 'cheia', video: limites.video },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

/** Põe a Dona Leda na sala pelo motor da Agora, com o Gemini Live e as ações que não anotam. */
async function ligarPelaAgora(instrucoes: string, saudacao: string) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.NEXT_AGORA_APP_CERTIFICATE;
  const chaveDoGoogle = process.env.LIA_GEMINI_KEY?.trim();
  if (!appId || !appCertificate || !chaveDoGoogle) throw new Error('faltam as chaves da Agora ou do Google');

  const channel = `demonstracao-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const uid = String(Math.floor(Math.random() * 9_000_000) + 1_000_000);
  // O passe da sala vence logo depois do teto e a tela não renova: quem tentar
  // esticar a ligação cai da sala, e a assistente sai sozinha em seguida.
  const vence = Math.floor(Date.now() / 1000) + SEGUNDOS_DO_PASSE_DA_SALA;
  const token = RtcTokenBuilder.buildTokenWithRtm(appId, appCertificate, channel, uid, RtcRole.PUBLISHER, vence, vence);

  const enderecoPublico = urlPublica();
  const chave = chaveDaDemonstracao();
  const servidores =
    enderecoPublico && chave
      ? [
          {
            name: 'donaleda',
            endpoint: `${enderecoPublico}/api/experimente/mcp?chave=${chave}`,
            transport: 'streamable_http',
            headers: { Authorization: `Bearer ${chave}` },
            allowed_tools: FERRAMENTAS.map((f) => f.name),
            timeout_ms: 10000,
          },
        ]
      : undefined;

  const client = new AgoraClient({ area: Area.US, appId, appCertificate });
  const agente = new Agent({
    client,
    advancedFeatures: { enable_rtm: true, enable_tools: Boolean(servidores), enable_sal: false },
    parameters: {
      audio_scenario: 'chorus' as const,
      data_channel: 'rtm' as const,
      enable_error_message: true,
      enable_metrics: true,
    },
  }).withMllm(
    new GeminiLiveComAcoes(
      {
        apiKey: chaveDoGoogle,
        model: modeloDoGemini(),
        languageCodes: ['pt-BR'],
        voice: vozDoGemini(),
        instructions: instrucoes,
        greetingMessage: saudacao,
        failureMessage: SE_FALHAR,
        transcribeAgent: true,
        transcribeUser: true,
        inputModalities: ['audio'],
        outputModalities: ['audio'],
        turnDetection: {
          mode: 'server_vad',
          server_vad_config: {
            prefix_padding_ms: 300,
            silence_duration_ms: esperaDeSilencio(),
            start_of_speech_sensitivity: 'START_SENSITIVITY_HIGH',
            end_of_speech_sensitivity: 'END_SENSITIVITY_LOW',
          },
        } as never,
      },
      servidores,
    ),
  );

  const sessao = agente.createSession({
    channel,
    agentUid: String(DEFAULT_AGENT_UID),
    remoteUids: [uid],
    // Visitante que sai da sala (ou cai quando o passe vence) leva a assistente junto.
    idleTimeout: 10,
    expiresIn: SEGUNDOS_DO_PASSE_DA_ASSISTENTE,
    debug: process.env.LIA_DEPURAR === '1',
  });
  const agentId = await sessao.start();
  return { agentId, sala: { token, uid, channel } satisfies SalaDaDemonstracao };
}

/** O passe do Google pro modo direto, com as mesmas instruções e as mesmas ações. */
async function ligarDireto(instrucoes: string, saudacao: string): Promise<InicioDireto> {
  const chaveDoGoogle = process.env.LIA_GEMINI_KEY?.trim();
  if (!chaveDoGoogle) throw new Error('falta a chave do Google');
  const passe = await pedirPasseDoGemini(chaveDoGoogle);
  if (!passe.ok) throw new Error(`o Google recusou o passe (${passe.status})`);
  const modelo = modeloDoGemini();
  return {
    passe: passe.token,
    abertura: montarAbertura({
      modelo,
      voz: vozDoGemini(),
      instrucoes,
      ferramentas: FERRAMENTAS,
      silencioMs: esperaDeSilencio(),
    }),
    saudacao,
    modelo,
    silencioMs: esperaDeSilencio(),
  };
}

export async function POST(request: NextRequest) {
  const limites = limitesDaDemonstracao();
  const recusar = (motivo: RecusaDaDemonstracao | 'fora', status: number) =>
    NextResponse.json({ ok: false, motivo, video: limites.video } satisfies RespostaDaDemonstracao, { status });

  const pedido = (await request.json().catch(() => ({}))) as { modo?: unknown };
  const pediuDireto = pedido.modo === 'direto';

  const visitante = request.cookies.get(COOKIE_DO_VISITANTE)?.value || randomUUID();
  let reserva;
  try {
    reserva = await reservarLigacao(visitante, redeDe(request));
  } catch (erro) {
    console.error('[experimente] não consegui reservar:', erro);
    return recusar('fora', 503);
  }
  if (!reserva.ok) return recusar(reserva.motivo, reserva.motivo === 'desligada' ? 503 : 429);

  const agora = new Date();
  const instrucoes = montarInstrucoes(baseDaDemonstracao(), agora, true);
  const saudacao = saudacaoDaDemonstracao(agora);

  let resposta: RespostaDaDemonstracao | null = null;
  if (!pediuDireto) {
    try {
      const { agentId, sala } = await ligarPelaAgora(instrucoes, saudacao);
      const passe = passeDaFicha(agora, agentId);
      if (passe) resposta = { ok: true, modo: 'agora', teto: SEGUNDOS_POR_LIGACAO, passe, sala };
    } catch (erro) {
      console.error('[experimente] a Agora recusou, vou pelo modo direto:', erro);
    }
  }

  if (!resposta) {
    try {
      const direto = await ligarDireto(instrucoes, saudacao);
      const passe = passeDaFicha(agora, '');
      if (passe) {
        resposta = { ok: true, modo: 'direto', teto: SEGUNDOS_POR_LIGACAO, passe, direto, reserva: !pediuDireto };
      }
    } catch (erro) {
      console.error('[experimente] o modo direto também não ligou:', erro);
    }
  }

  if (!resposta) return recusar('fora', 503);

  const saida = NextResponse.json(resposta, { headers: { 'Cache-Control': 'no-store' } });
  saida.cookies.set(COOKIE_DO_VISITANTE, visitante, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return saida;
}
