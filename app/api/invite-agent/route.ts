// Começa a conversa: põe a assistente na mesma sala de áudio da Agora em que o
// idoso entrou. A fala dele vira texto (Deepgram), o modelo responde (OpenAI) e a
// resposta vira voz, tudo com as chaves gerenciadas pela Agora. As ações da
// assistente (anotar na ficha, avisar a família) entram pelo endereço /api/mcp.

import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  AnamAvatar,
  Area,
  DeepgramSTT,
  ElevenLabsTTS,
  ExpiresIn,
  HeyGenAvatar,
  MiniMaxTTS,
  OpenAI,
  OpenAITTS,
} from 'agora-agents';
import type { ClientStartRequest } from '@/types/conversation';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { abrirConversa, lerBase, mudarBase } from '@/lib/dados';
import { FERRAMENTAS } from '@/lib/ferramentas';
import { montarInstrucoes, montarSaudacao, type OrigemDaLigacao } from '@/lib/persona';
import { chaveDasFerramentas, exigirVariavel, urlPublica } from '@/lib/servidor';
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

export async function POST(request: NextRequest) {
  try {
    const body: ClientStartRequest & { chamada_id?: string } = await request.json();
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
    const base = await lerBase();
    const enderecoPublico = urlPublica();
    const chave = chaveDasFerramentas();
    const comFerramentas = Boolean(enderecoPublico && chave);
    const instrucoes = montarInstrucoes(base, agora, comFerramentas);
    // A saudação muda conforme quem começou a ligação.
    const chamada = body.chamada_id
      ? base.chamadas.find((c) => c.id === body.chamada_id)
      : undefined;
    const origem: OrigemDaLigacao = chamada ? chamada.motivo : 'idoso';
    const saudacao = montarSaudacao(base, agora, origem);

    const client = new AgoraClient({ area: Area.US, appId, appCertificate });

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
      // enable_rtm leva a legenda e o estado da assistente pra tela.
      // enable_tools libera as ações em /api/mcp.
      advancedFeatures: { enable_rtm: true, enable_tools: comFerramentas },
      parameters: {
        audio_scenario: 'chorus',
        data_channel: 'rtm',
        enable_error_message: true,
        enable_metrics: true,
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
          ...(comFerramentas
            ? {
                mcpServers: [
                  {
                    name: 'lia',
                    endpoint: `${enderecoPublico}/api/mcp?chave=${chave}`,
                    transport: 'streamable_http',
                    headers: { Authorization: `Bearer ${chave}` },
                    allowed_tools: FERRAMENTAS.map((f) => f.name),
                    timeout_ms: 10000,
                  },
                ],
              }
            : {}),
        }),
      )
      .withTts(voz());

    // Com um avatar configurado, a assistente aparece em vídeo na chamada.
    const video = avatar();
    type AceitaAvatar = { withAvatar(vendor: unknown): typeof agent };
    const agenteDaLigacao = video
      ? (agent as unknown as AceitaAvatar).withAvatar(video)
      : agent;

    const session = agenteDaLigacao.createSession({
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      // A assistente espera dois minutos de silêncio antes de sair sozinha.
      idleTimeout: 120,
      expiresIn: ExpiresIn.hours(1),
      debug: process.env.LIA_DEPURAR === '1',
    });

    const agentId = await session.start();
    const conversa = await mudarBase((b) => abrirConversa(b, agora));

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
      conversa_id: conversa.id,
      ferramentas: comFerramentas,
      avatar: Boolean(video),
    } satisfies InicioDaConversa);
  } catch (error) {
    console.error('Erro ao começar a conversa:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível começar a conversa' },
      { status: 500 },
    );
  }
}
