import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Base, InicioDaConversa } from '@/lib/tipos';
import {
  base64ParaSom,
  criarReamostrador,
  custoEmDolar,
  custoPorMinuto,
  FALA_EM_ANDAMENTO,
  FALA_INTERROMPIDA,
  FALA_TERMINADA,
  juntarLegenda,
  LEGENDA_VAZIA,
  limparUso,
  montarAbertura,
  somarUso,
  somParaBase64,
  usoZerado,
  type EstadoDaLegenda,
  type EventoDaLegenda,
} from '@/lib/direto';
import { FERRAMENTAS } from '@/lib/ferramentas';

// O modo direto: o aparelho fala com o Gemini sem o motor de conversa da Agora.
// Aqui ficam as contas (legenda, tokens, custo, som) e as três rotas do servidor.

const IDOSO = 'idoso-do-direto';
const OUTRO = 'outro-idoso-do-direto';
const TOKEN_DO_APARELHO = 'aparelho-de-teste';
const CHAVE_DO_GOOGLE = 'chave-secreta-de-teste';
const ASSISTENTE = '123456';

/** O miolo da abertura mandada ao Gemini, só com o que as provas leem. */
interface Setup {
  model: string;
  generationConfig: { speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } };
  realtimeInputConfig: { automaticActivityDetection: { silenceDurationMs: number } };
  systemInstruction: { parts: { text: string }[] };
  tools: { functionDeclarations: { name: string }[] }[];
  inputAudioTranscription: unknown;
  outputAudioTranscription: unknown;
}

// O aparelho pareado: quem manda o token de teste é o aparelho do IDOSO.
vi.mock('@/lib/sessao', async () => {
  const { NextResponse } = await import('next/server');
  return {
    exigirAparelho: async (request: Request) =>
      request.headers.get('x-teste-aparelho') === TOKEN_DO_APARELHO
        ? { ok: true, valor: IDOSO }
        : { ok: false, resposta: NextResponse.json({ ok: false }, { status: 401 }) },
  };
});

let abrir: (request: never) => Promise<Response>;
let agir: (request: Request) => Promise<Response>;
let contar: (request: Request) => Promise<Response>;
let lerBase: (idosoId: string) => Promise<Base>;
const pedidosAoGoogle: { url: string; chave: string | null }[] = [];

beforeAll(async () => {
  process.env.LIA_DADOS = 'memoria';
  process.env.LIA_GEMINI_KEY = CHAVE_DO_GOOGLE;
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    pedidosAoGoogle.push({ url: String(url), chave: new Headers(init?.headers).get('x-goog-api-key') });
    return new Response(JSON.stringify({ name: 'auth_tokens/passe-de-teste' }), { status: 200 });
  });
  ({ POST: abrir } = (await import('@/app/api/direto/route')) as never);
  ({ POST: agir } = await import('@/app/api/direto/acao/route'));
  ({ POST: contar } = await import('@/app/api/direto/uso/route'));
  const dados = await import('@/lib/dados');
  lerBase = dados.lerBase;
  const { baseDeExemplo } = await import('@/lib/exemplo');
  await dados.criarFicha(IDOSO, baseDeExemplo(new Date(), IDOSO));
  await dados.criarFicha(OUTRO, baseDeExemplo(new Date(), OUTRO));
});

function pedido(rota: string, corpo: unknown, comAparelho = true): Request {
  return new Request(`http://localhost/api/direto${rota}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(comAparelho ? { 'x-teste-aparelho': TOKEN_DO_APARELHO } : {}),
    },
    body: JSON.stringify(corpo),
  });
}

describe('começar a conversa direta (/api/direto)', () => {
  it('recusa quem não é aparelho pareado', async () => {
    const resposta = await abrir(pedido('', {}, false) as never);
    expect(resposta.status).toBe(401);
  });

  it('devolve o passe temporário e nunca a chave do Google', async () => {
    const resposta = await abrir(pedido('', {}) as never);
    expect(resposta.status).toBe(200);
    const texto = await resposta.text();
    expect(texto).not.toContain(CHAVE_DO_GOOGLE);
    const inicio = JSON.parse(texto) as InicioDaConversa;
    expect(inicio.modo).toBe('direto');
    expect(inicio.agent_id).toBe('');
    expect(inicio.direto?.passe).toBe('auth_tokens/passe-de-teste');
    // A chave foi só pro Google, no pedido do passe.
    expect(pedidosAoGoogle.at(-1)).toEqual({
      url: 'https://generativelanguage.googleapis.com/v1beta/auth_tokens',
      chave: CHAVE_DO_GOOGLE,
    });
  });

  it('abre a conversa na ficha e manda o modelo, a voz, as instruções e as ações do modo gemini', async () => {
    const resposta = await abrir(pedido('', {}) as never);
    const inicio = (await resposta.json()) as InicioDaConversa;
    const base = await lerBase(IDOSO);
    expect(base.conversas.at(-1)?.id).toBe(inicio.conversa_id);

    const setup = (inicio.direto?.abertura as unknown as { setup: Setup }).setup;
    expect(setup.model).toBe('models/gemini-3.8-live');
    expect(setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Leda');
    expect(setup.systemInstruction.parts[0].text).toContain(base.idoso.tratamento);
    expect(setup.tools[0].functionDeclarations.map((f) => f.name)).toEqual(
      FERRAMENTAS.map((f) => f.name),
    );
    // A saudação diz que ela é assistente virtual (regra 1 do projeto).
    expect(inicio.direto?.saudacao).toContain('assistente virtual');
  });
});

describe('a abertura mandada ao Gemini', () => {
  const abertura = montarAbertura({
    modelo: 'gemini-3.8-live',
    voz: 'Leda',
    instrucoes: 'instruções',
    ferramentas: FERRAMENTAS,
    silencioMs: 650,
  }) as unknown as { setup: Setup };

  it('tira o additionalProperties, que o Gemini recusa', () => {
    expect(JSON.stringify(abertura)).not.toContain('additionalProperties');
  });

  it('pede a legenda das duas falas e espera o silêncio combinado', () => {
    expect(abertura.setup.inputAudioTranscription).toEqual({});
    expect(abertura.setup.outputAudioTranscription).toEqual({});
    expect(abertura.setup.realtimeInputConfig.automaticActivityDetection.silenceDurationMs).toBe(650);
    expect(abertura.setup.model).toBe('models/gemini-3.8-live');
  });
});

describe('as ações pelo aparelho (/api/direto/acao)', () => {
  it('recusa quem não é aparelho pareado', async () => {
    const resposta = await agir(pedido('/acao', { nome: 'avisar_familia' }, false));
    expect(resposta.status).toBe(401);
  });

  it('guarda a lembrança na ficha do idoso deste aparelho, e só nela', async () => {
    const antes = (await lerBase(OUTRO)).lembrancas.length;
    const resposta = await agir(
      pedido('/acao', {
        nome: 'guardar_lembranca',
        argumentos: { texto: 'O neto Pedro se forma em dezembro.', categoria: 'pessoa', sobre: 'Pedro' },
      }),
    );
    expect(resposta.status).toBe(200);
    expect((await resposta.json()).ok).toBe(true);
    const base = await lerBase(IDOSO);
    expect(base.lembrancas.some((l) => l.texto.includes('Pedro se forma'))).toBe(true);
    expect((await lerBase(OUTRO)).lembrancas.length).toBe(antes);
  });

  it('avisa a família', async () => {
    const resposta = await agir(
      pedido('/acao', {
        nome: 'avisar_familia',
        argumentos: { tipo: 'saude', gravidade: 'atencao', mensagem: 'Contou que o remédio da pressão acabou.' },
      }),
    );
    expect(resposta.status).toBe(200);
    const base = await lerBase(IDOSO);
    expect(base.alertas.some((a) => a.texto.includes('remédio da pressão acabou'))).toBe(true);
  });

  it('recusa ação que não existe', async () => {
    const resposta = await agir(pedido('/acao', { nome: 'apagar_tudo' }));
    expect(resposta.status).toBe(400);
  });
});

describe('a legenda das duas falas', () => {
  const juntar = (eventos: EventoDaLegenda[]): EstadoDaLegenda =>
    eventos.reduce((estado, evento) => juntarLegenda(estado, evento, ASSISTENTE, 0), LEGENDA_VAZIA);

  it('junta os pedaços da fala do idoso numa fala só, mesmo com a resposta no meio', () => {
    const { falas } = juntar([
      { tipo: 'idoso', texto: 'Eu caí' },
      { tipo: 'assistente', texto: 'Meu Deus,' },
      { tipo: 'idoso', texto: ' no banheiro' },
      { tipo: 'assistente', texto: ' a senhora se machucou?' },
    ]);
    const doIdoso = falas.filter((f) => f.uid !== ASSISTENTE);
    expect(doIdoso).toHaveLength(1);
    expect(doIdoso[0].text).toBe('Eu caí no banheiro');
    expect(doIdoso[0].status).toBe(FALA_EM_ANDAMENTO);
  });

  it('fecha as duas falas quando ela termina de responder, e a próxima é fala nova', () => {
    const { falas } = juntar([
      { tipo: 'idoso', texto: 'Dormi bem.' },
      { tipo: 'assistente', texto: 'Que bom!' },
      { tipo: 'fim' },
      { tipo: 'idoso', texto: 'E tomei o remédio.' },
    ]);
    expect(falas.map((f) => [f.uid === ASSISTENTE ? 'ela' : 'idoso', f.text, f.status])).toEqual([
      ['idoso', 'Dormi bem.', FALA_TERMINADA],
      ['ela', 'Que bom!', FALA_TERMINADA],
      ['idoso', 'E tomei o remédio.', FALA_EM_ANDAMENTO],
    ]);
    expect(new Set(falas.map((f) => f.turn_id)).size).toBe(3);
  });

  it('quando o idoso fala por cima, só a fala dela é cortada', () => {
    const { falas } = juntar([
      { tipo: 'assistente', texto: 'Hoje eu queria saber' },
      { tipo: 'idoso', texto: 'Espera, eu caí' },
      { tipo: 'interrompida' },
      { tipo: 'fim' },
      { tipo: 'idoso', texto: ' ontem.' },
    ]);
    expect(falas.find((f) => f.uid === ASSISTENTE)?.status).toBe(FALA_INTERROMPIDA);
    const doIdoso = falas.filter((f) => f.uid !== ASSISTENTE);
    expect(doIdoso).toHaveLength(1);
    expect(doIdoso[0].text).toBe('Espera, eu caí ontem.');
  });
});

describe('os tokens e o custo da ligação', () => {
  const resposta1 = {
    promptTokenCount: 3000,
    promptTokensDetails: [
      { modality: 'TEXT', tokenCount: 2500 },
      { modality: 'AUDIO', tokenCount: 500 },
    ],
    responseTokenCount: 400,
    responseTokensDetails: [{ modality: 'AUDIO', tokenCount: 400 }],
  };
  const resposta2 = {
    promptTokenCount: 4000,
    promptTokensDetails: [
      { modality: 'TEXT', tokenCount: 2600 },
      { modality: 'AUDIO', tokenCount: 1400 },
    ],
    responseTokenCount: 600,
    responseTokensDetails: [
      { modality: 'AUDIO', tokenCount: 500 },
      { modality: 'TEXT', tokenCount: 100 },
    ],
    thoughtsTokenCount: 50,
    toolUsePromptTokenCount: 80,
  };

  it('soma resposta por resposta, separando áudio de texto', () => {
    const uso = somarUso(somarUso(usoZerado(), resposta1), resposta2);
    expect(uso).toEqual({
      entradaTexto: 2500 + 2600 + 80,
      entradaAudio: 500 + 1400,
      saidaTexto: 100,
      saidaAudio: 400 + 500,
      raciocinio: 50,
      respostas: 2,
    });
  });

  it('sem a lista de modalidades tudo conta como texto, o preço mais baixo', () => {
    const uso = somarUso(usoZerado(), { promptTokenCount: 1000, responseTokenCount: 200 });
    expect(uso.entradaAudio).toBe(0);
    expect(uso.saidaAudio).toBe(0);
    expect(uso.entradaTexto).toBe(1000);
  });

  it('calcula o custo pelo preço publicado e o custo por minuto', () => {
    const uso = {
      entradaTexto: 1_000_000,
      entradaAudio: 1_000_000,
      saidaTexto: 900_000,
      saidaAudio: 1_000_000,
      raciocinio: 100_000,
      respostas: 10,
    };
    // 0,75 + 3 + 4,50 + 12 dólares por milhão.
    expect(custoEmDolar(uso)).toBeCloseTo(20.25, 6);
    expect(custoPorMinuto(uso, 120)).toBeCloseTo(10.125, 6);
    expect(custoPorMinuto(uso, 0)).toBeNull();
  });

  it('recusa conta quebrada vinda do aparelho', () => {
    expect(limparUso({ ...usoZerado(), respostas: 1, saidaAudio: -5 })).toBeNull();
    expect(limparUso({ ...usoZerado(), respostas: 1, entradaAudio: 9_000_000_000 })).toBeNull();
    expect(limparUso({ ...usoZerado(), respostas: 0 })).toBeNull();
    expect(limparUso('muito')).toBeNull();
  });

  it('guarda a conta junto da conversa, com o custo por minuto (/api/direto/uso)', async () => {
    const inicio = (await (await abrir(pedido('', {}) as never)).json()) as InicioDaConversa;
    const uso = somarUso(somarUso(usoZerado(), resposta1), resposta2);
    const resposta = await contar(pedido('/uso', { conversaId: inicio.conversa_id, uso, segundos: 90 }));
    expect(resposta.status).toBe(200);
    const guardada = (await lerBase(IDOSO)).conversas.find((c) => c.id === inicio.conversa_id)?.uso;
    expect(guardada?.segundos).toBe(90);
    expect(guardada?.dolares).toBeCloseTo(custoEmDolar(uso), 6);
    expect(guardada?.dolaresPorMinuto).toBeCloseTo(custoEmDolar(uso) / 1.5, 6);

    const quebrada = await contar(pedido('/uso', { conversaId: inicio.conversa_id, uso: { respostas: -1 }, segundos: 90 }));
    expect(quebrada.status).toBe(400);
    const semAparelho = await contar(pedido('/uso', { conversaId: inicio.conversa_id, uso, segundos: 90 }, false));
    expect(semAparelho.status).toBe(401);
  });
});

describe('o som', () => {
  it('traz 48 kHz pra 16 kHz sem perder pedaço entre um bloco e outro', () => {
    const reamostrar = criarReamostrador(48_000, 16_000);
    let total = 0;
    for (let bloco = 0; bloco < 30; bloco += 1) total += reamostrar(new Float32Array(2048).fill(0.5)).length;
    // 30 blocos de 2.048 amostras são 61.440; um terço disso são 20.480.
    expect(total).toBe(20_480);
  });

  it('traz 44,1 kHz pra 16 kHz no tamanho certo', () => {
    const reamostrar = criarReamostrador(44_100, 16_000);
    let total = 0;
    for (let bloco = 0; bloco < 100; bloco += 1) total += reamostrar(new Float32Array(2048).fill(0.25)).length;
    const esperado = (100 * 2048 * 16_000) / 44_100;
    expect(Math.abs(total - esperado)).toBeLessThanOrEqual(1);
  });

  it('o som vai e volta do formato do Gemini sem mudar', () => {
    const original = new Float32Array([0, 0.5, -0.5, 0.999, -1]);
    const volta = base64ParaSom(somParaBase64(original));
    expect(volta).toHaveLength(original.length);
    for (let i = 0; i < original.length; i += 1) expect(volta[i]).toBeCloseTo(original[i], 3);
  });
});
