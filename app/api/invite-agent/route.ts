// Começa a conversa: põe a assistente na mesma sala de áudio da Agora em que o
// idoso entrou. Dois modos, os dois dentro do Conversational AI da Agora:
// - gemini: o Gemini Live escuta e fala num modelo só (mais rápido e com voz natural).
//   Precisa da chave do Google AI Studio em LIA_GEMINI_KEY.
// - tres: Deepgram escuta, OpenAI responde e a voz da OpenAI fala, com as chaves
//   gerenciadas pela Agora. É a reserva, e o único modo que aceita avatar em vídeo.
// LIA_MODO escolhe; sem ele, usa gemini quando a chave existe. O aparelho pode pedir
// um modo pelo cabeçalho x-donaleda-modo, pra comparar os dois na mesma hora.
// As ações da assistente (anotar na ficha, avisar a família) entram por /api/mcp.

import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  AnamAvatar,
  Area,
  DeepgramSTT,
  ElevenLabsTTS,
  ExpiresIn,
  GeminiLive,
  HeyGenAvatar,
  MiniMaxTTS,
  OpenAI,
  OpenAITTS,
} from 'agora-agents';
import type { ClientStartRequest } from '@/types/conversation';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { assistenteNaoEntrou } from '@/lib/chamadas';
import { abrirConversa, lerBase, mudarBase } from '@/lib/dados';
import { FERRAMENTAS } from '@/lib/ferramentas';
import { montarInstrucoes, montarSaudacao, type OrigemDaLigacao } from '@/lib/persona';
import { chaveDasFerramentas, exigirVariavel, urlPublica } from '@/lib/servidor';
import { exigirAparelho } from '@/lib/sessao';
import type { InicioDaConversa } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

const agentUid = String(DEFAULT_AGENT_UID);
const SE_FALHAR = 'Só um instante, por favor.';

type ModeloGerenciado = 'gpt-4o-mini' | 'gpt-4.1-mini' | 'gpt-5-nano' | 'gpt-5-mini';
const MODELOS: ModeloGerenciado[] = ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-5-nano', 'gpt-5-mini'];

function modelo(): ModeloGerenciado {
  const pedido = process.env.LIA_MODELO as ModeloGerenciado | undefined;
  return pedido && MODELOS.includes(pedido) ? pedido : 'gpt-4o-mini';
}

/**
 * Quanto silêncio a assistente espera antes de responder, em milissegundos.
 * 650 por padrão: menos que isso atropela quem fala com pausas, mais que isso deixa a conversa lenta.
 */
function esperaDeSilencio(): number {
  const pedido = Number(process.env.LIA_SILENCIO_MS);
  return Number.isFinite(pedido) && pedido >= 300 && pedido <= 2000 ? pedido : 650;
}

/**
 * A voz. LIA_VOZ escolhe o fornecedor e a voz, no formato "fornecedor:voz".
 * - openai:nova (padrão, sem chave própria, fala português do Brasil)
 * - minimax:<id da voz> (sem chave própria)
 * - elevenlabs:<id da voz> (precisa de LIA_ELEVENLABS_KEY)
 */
function voz() {
  const [fornecedor, ...resto] = (process.env.LIA_VOZ || 'openai:nova').split(':');
  const qual = resto.join(':').trim();

  if (fornecedor === 'minimax') {
    return new MiniMaxTTS({ model: 'speech_2_8_turbo', voiceId: qual || 'Portuguese_CalmLeader' });
  }
  if (fornecedor === 'elevenlabs') {
    return new ElevenLabsTTS({
      key: exigirVariavel('LIA_ELEVENLABS_KEY'),
      modelId: 'eleven_flash_v2_5',
      baseUrl: 'wss://api.elevenlabs.io/v1',
      voiceId: qual,
      sampleRate: 24000,
    });
  }
  const velocidade = Number(process.env.LIA_VELOCIDADE_DA_VOZ);
  return new OpenAITTS({
    model: 'tts-1',
    voice: qual || 'nova',
    ...(Number.isFinite(velocidade) && velocidade > 0 ? { speed: velocidade } : {}),
  });
}

/**
 * O vídeo da assistente. LIA_AVATAR escolhe o fornecedor e o avatar, no formato
 * "fornecedor:id", e LIA_AVATAR_KEY leva a chave dele. Sem isso, a tela mostra o
 * rosto desenhado. Fornecedores ligados aqui: anam e heygen.
 */
function avatar() {
  const [fornecedor, ...resto] = (process.env.LIA_AVATAR || '').split(':');
  const id = resto.join(':').trim();
  const chave = process.env.LIA_AVATAR_KEY;
  if (!fornecedor || !id || !chave) return null;
  if (fornecedor === 'anam') return new AnamAvatar({ apiKey: chave, avatarId: id });
  if (fornecedor === 'heygen') {
    return new HeyGenAvatar({ apiKey: chave, avatarId: id, quality: 'medium', agoraUid: AVATAR_UID });
  }
  return null;
}

// O avatar entra na sala como mais um participante, com este número.
const AVATAR_UID = '654321';

type Modo = 'gemini' | 'tres';

/** O modo da conversa: o pedido do aparelho vale primeiro, depois LIA_MODO, depois a chave. */
function modoDaConversa(request: Request): Modo {
  const temChave = Boolean(process.env.LIA_GEMINI_KEY?.trim());
  const pedido = (request.headers.get('x-donaleda-modo') || process.env.LIA_MODO || '').trim();
  if (pedido === 'tres') return 'tres';
  if (pedido === 'gemini') return temChave ? 'gemini' : 'tres';
  return temChave ? 'gemini' : 'tres';
}

/** O Gemini Live da Agora, com as ações da assistente (o SDK ainda não leva MCP nesse modo). */
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

/** Segundos de silêncio do idoso até ela perguntar se ele ainda está aí. 9 por padrão. */
function esperaDoLembrete(): number {
  const pedido = Number(process.env.LIA_LEMBRETE_MS);
  return Number.isFinite(pedido) && pedido >= 4000 && pedido <= 60000 ? pedido : 9000;
}

/** A voz do Gemini. LIA_VOZ_GEMINI troca; Leda é o padrão, e Aoede e Kore são as outras pra testar. */
function vozDoGemini(): string {
  return process.env.LIA_VOZ_GEMINI?.trim() || 'Leda';
}

export async function POST(request: NextRequest) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;
  const idosoId = aparelho.valor;

  // Guardado fora do try, pra quando a Agora recusar a assistente o aviso saber qual ligação era.
  let chamadaId: string | undefined;
  try {
    const body: ClientStartRequest & { chamada_id?: string } = await request.json();
    chamadaId = body.chamada_id;
    const { requester_id, channel_name } = body;

    const appId = exigirVariavel('NEXT_PUBLIC_AGORA_APP_ID');
    const appCertificate = exigirVariavel('NEXT_AGORA_APP_CERTIFICATE');

    if (!channel_name || !requester_id) {
      return NextResponse.json(
        { error: 'channel_name e requester_id são obrigatórios' },
        { status: 400 },
      );
    }

    const agora = new Date();
    const base = await lerBase(idosoId);
    const enderecoPublico = urlPublica();
    const chave = chaveDasFerramentas(idosoId);
    const comFerramentas = Boolean(enderecoPublico && chave);
    const instrucoes = montarInstrucoes(base, agora, comFerramentas);
    // A saudação muda conforme quem começou a ligação.
    const chamada = body.chamada_id
      ? base.chamadas.find((c) => c.id === body.chamada_id)
      : undefined;
    const origem: OrigemDaLigacao = chamada ? chamada.motivo : 'idoso';
    const saudacao = montarSaudacao(base, agora, origem);

    const client = new AgoraClient({ area: Area.US, appId, appCertificate });
    const modo = modoDaConversa(request);

    const servidoresDeAcoes = comFerramentas
      ? [
          {
            name: 'donaleda',
            endpoint: `${enderecoPublico}/api/mcp?idoso=${encodeURIComponent(idosoId)}&chave=${chave}`,
            transport: 'streamable_http',
            headers: { Authorization: `Bearer ${chave}` },
            allowed_tools: FERRAMENTAS.map((f) => f.name),
            timeout_ms: 10000,
          },
        ]
      : undefined;

    // A Agora recusa o foco na voz junto com o Gemini Live (testado em 21/11: erro 400).
    const focoNaVoz = modo === 'tres' && process.env.LIA_FOCO_NA_VOZ !== '0';
    const comum = {
      // enable_rtm leva a legenda e o estado da assistente pra tela.
      // enable_tools libera as ações em /api/mcp.
      // enable_sal liga o foco na voz de quem fala com a assistente: a Agora trava
      // na voz do idoso e bloqueia a TV, outras pessoas e o barulho da sala.
      advancedFeatures: { enable_rtm: true, enable_tools: comFerramentas, enable_sal: focoNaVoz },
      ...(focoNaVoz ? { sal: { sal_mode: 'locking' as const } } : {}),
      parameters: {
        audio_scenario: 'chorus' as const,
        data_channel: 'rtm' as const,
        enable_error_message: true,
        enable_metrics: true,
      },
    };

    const agenteGemini =
      modo === 'gemini'
        ? new Agent({ client, ...comum }).withMllm(
            new GeminiLiveComAcoes(
              {
                apiKey: exigirVariavel('LIA_GEMINI_KEY'),
                model: process.env.LIA_MODELO_GEMINI?.trim() || 'models/gemini-3.8-live',
                languageCodes: ['pt-BR'],
                voice: vozDoGemini(),
                instructions: instrucoes,
                greetingMessage: saudacao,
                failureMessage: SE_FALHAR,
                transcribeAgent: true,
                transcribeUser: true,
                inputModalities: ['audio'],
                outputModalities: ['audio'],
                // Quem tem mais idade faz pausas no meio da frase: o Gemini espera
                // o mesmo silêncio do outro modo antes de responder.
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
              servidoresDeAcoes,
            ),
          )
        : null;

    const agent = new Agent({
      client,
      instructions: instrucoes,
      greeting: saudacao,
      failureMessage: SE_FALHAR,
      maxHistory: 50,
      // Quem tem mais idade faz pausas mais longas no meio da frase. A assistente
      // espera quase um segundo de silêncio antes de responder, pra não atropelar.
      turnDetection: {
        config: {
          speech_threshold: 0.5,
          start_of_speech: {
            mode: 'vad',
            vad_config: { interrupt_duration_ms: 240, prefix_padding_ms: 300 },
          },
          end_of_speech: {
            mode: 'vad',
            vad_config: { silence_duration_ms: esperaDeSilencio() },
          },
        },
      },
      ...comum,
      parameters: {
        ...comum.parameters,
        // Se o idoso ficar calado, ela pergunta com calma se ele ainda está aí.
        // A Agora só tem esse lembrete no modo de três peças; no Gemini ele vai nas instruções.
        silence_config: {
          timeout_ms: esperaDoLembrete(),
          action: 'think' as const,
          content: `${base.idoso.tratamento} ficou em silêncio alguns segundos. Pergunte com calma, numa frase curta, se a pessoa ainda está aí, sem repetir a pergunta anterior.`,
        },
      },
    })
      .withStt(new DeepgramSTT({ model: 'nova-3', language: 'pt-BR' }))
      .withLlm(
        new OpenAI({
          model: modelo(),
          greetingMessage: saudacao,
          failureMessage: SE_FALHAR,
          maxHistory: 30,
          params: { max_tokens: 220, temperature: 0.6 },
          ...(servidoresDeAcoes ? { mcpServers: servidoresDeAcoes } : {}),
        }),
      )
      .withTts(voz());

    // Com um avatar configurado, a assistente aparece em vídeo na chamada.
    // A Agora não junta avatar com o Gemini Live, então o avatar só entra no modo de três peças.
    const video = modo === 'tres' ? avatar() : null;
    type AceitaAvatar = { withAvatar(vendor: unknown): typeof agent };
    const agenteDaLigacao =
      agenteGemini ?? (video ? (agent as unknown as AceitaAvatar).withAvatar(video) : agent);

    const session = agenteDaLigacao.createSession({
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      // A assistente espera dois minutos de silêncio antes de sair sozinha.
      // Sozinha na sala por 30 s (o aparelho fechou sem desligar), ela sai e para de gastar minuto.
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
      debug: process.env.LIA_DEPURAR === '1',
    });

    const agentId = await session.start();
    const conversa = await mudarBase(idosoId, (b) => abrirConversa(b, agora, chamada?.id));

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
      conversa_id: conversa.id,
      ferramentas: comFerramentas,
      avatar: Boolean(video),
      modo,
    } satisfies InicioDaConversa);
  } catch (error) {
    console.error('Erro ao começar a conversa:', error);
    try {
      await mudarBase(idosoId, (b) => assistenteNaoEntrou(b, chamadaId, new Date()));
    } catch (erroDoAviso) {
      console.error('Também não consegui avisar a família:', erroDoAviso);
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível começar a conversa' },
      { status: 500 },
    );
  }
}
