// O modo direto da voz: o aparelho do idoso conversa com o Gemini ao vivo sem
// passar pelo motor de conversa da Agora, e publica na sala da Agora o microfone
// e a voz da assistente. O servidor só emite o passe temporário do Google e
// executa as ações. Liga só com ?modo=direto no endereço.
//
// Este arquivo guarda as contas e os formatos, sem navegador e sem servidor, pra
// rodar na bateria de provas: o pedido de abertura, a legenda das duas falas, a
// soma dos tokens que o Google devolve e o custo por minuto.

import type { Ferramenta } from './ferramentas';
import type { UsoDoGemini } from './tipos';

/** O endereço que aceita o passe temporário (o comum recusa quem não manda a chave). */
export const ENDERECO_DO_GEMINI =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';

/** O Gemini recebe o microfone em 16 kHz e devolve a voz em 24 kHz. */
export const TAXA_DO_MICROFONE = 16_000;
export const TAXA_DA_VOZ = 24_000;

// ---------- O pedido de abertura ----------

/** O Gemini não aceita additionalProperties no esquema das ações. */
export function esquemaParaGemini(esquema: unknown): unknown {
  if (Array.isArray(esquema)) return esquema.map(esquemaParaGemini);
  if (!esquema || typeof esquema !== 'object') return esquema;
  const saida: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(esquema)) {
    if (chave === 'additionalProperties') continue;
    saida[chave] = esquemaParaGemini(valor);
  }
  return saida;
}

export interface PedidoDeAbertura {
  modelo: string;
  voz: string;
  instrucoes: string;
  ferramentas: Ferramenta[];
  /** Quanto silêncio ela espera antes de responder, em milissegundos. */
  silencioMs: number;
}

/**
 * A primeira mensagem da conversa com o Gemini: o mesmo modelo, a mesma voz, as
 * mesmas instruções e as mesmas ações do modo que passa pelo motor da Agora.
 */
export function montarAbertura(pedido: PedidoDeAbertura): Record<string, unknown> {
  return {
    setup: {
      model: pedido.modelo.startsWith('models/') ? pedido.modelo : `models/${pedido.modelo}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          languageCode: 'pt-BR',
          voiceConfig: { prebuiltVoiceConfig: { voiceName: pedido.voz } },
        },
      },
      // Quem tem mais idade faz pausas no meio da frase: ela espera o mesmo
      // silêncio do modo da Agora antes de responder.
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
          endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
          prefixPaddingMs: 300,
          silenceDurationMs: pedido.silencioMs,
        },
      },
      systemInstruction: { parts: [{ text: pedido.instrucoes }] },
      ...(pedido.ferramentas.length > 0
        ? {
            tools: [
              {
                functionDeclarations: pedido.ferramentas.map((f) => ({
                  name: f.name,
                  description: f.description,
                  parameters: esquemaParaGemini(f.inputSchema),
                })),
              },
            ],
          }
        : {}),
      // A legenda das duas falas: a do idoso vai pras regras fixas de segurança
      // e as duas vão pro resumo do fim da ligação.
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  };
}

/**
 * O pedido que faz a assistente falar primeiro. No motor da Agora a saudação é
 * dita pela própria Agora; aqui o modelo recebe a frase pronta e diz ela.
 */
export function pedidoDaSaudacao(saudacao: string): Record<string, unknown> {
  return {
    clientContent: {
      turns: [
        {
          role: 'user',
          parts: [
            {
              text: `A pessoa acabou de atender a ligação. Comece a conversa dizendo exatamente esta saudação, sem acrescentar nada: "${saudacao}"`,
            },
          ],
        },
      ],
      turnComplete: true,
    },
  };
}

// ---------- A legenda das duas falas ----------

// Os mesmos números que a Agora usa em TurnStatus, pra tela reaproveitar a
// legenda, o envio das falas e o teto da ligação sem saber de onde o texto veio.
export const FALA_EM_ANDAMENTO = 0;
export const FALA_TERMINADA = 1;
export const FALA_INTERROMPIDA = 2;

/** Uma fala da conversa, no formato que a tela já usa pra legenda da Agora. */
export interface FalaDireta {
  uid: string;
  stream_id: number;
  turn_id: number;
  _time: number;
  text: string;
  status: number;
  metadata: null;
}

export type EventoDaLegenda =
  | { tipo: 'idoso'; texto: string }
  | { tipo: 'assistente'; texto: string }
  | { tipo: 'interrompida' }
  | { tipo: 'fim' };

export interface EstadoDaLegenda {
  falas: FalaDireta[];
  /** A fala que interrompeu a assistente fecha o turno dela, e o fim que chega depois é desse turno. */
  ignorarProximoFim: boolean;
}

export const LEGENDA_VAZIA: EstadoDaLegenda = { falas: [], ignorarProximoFim: false };

/** O uid que a tela trata como "quem está no aparelho" (o mesmo que o toolkit da Agora usa). */
const UID_DO_IDOSO = '0';

function abertaDe(falas: FalaDireta[], uid: string): number {
  for (let i = falas.length - 1; i >= 0; i -= 1) {
    if (falas[i].uid === uid) return falas[i].status === FALA_EM_ANDAMENTO ? i : -1;
  }
  return -1;
}

function acrescentar(falas: FalaDireta[], uid: string, texto: string, agora: number): FalaDireta[] {
  const indice = abertaDe(falas, uid);
  if (indice >= 0) {
    const copia = falas.slice();
    copia[indice] = { ...copia[indice], text: copia[indice].text + texto };
    return copia;
  }
  const proximo = falas.reduce((maior, f) => Math.max(maior, f.turn_id), 0) + 1;
  return [
    ...falas,
    { uid, stream_id: 0, turn_id: proximo, _time: agora, text: texto, status: FALA_EM_ANDAMENTO, metadata: null },
  ];
}

function fechar(falas: FalaDireta[], uid: string, status: number): FalaDireta[] {
  const indice = abertaDe(falas, uid);
  if (indice < 0) return falas;
  const copia = falas.slice();
  copia[indice] = { ...copia[indice], status };
  return copia;
}

/**
 * Junta os pedaços de legenda que o Gemini manda. A fala do idoso fica aberta
 * até a assistente terminar de responder, porque a legenda dele chega em pedaços
 * e às vezes atrasada: assim "Eu caí" e "no banheiro" ficam na mesma fala, que é
 * o que a regra de queda precisa ler inteiro. Quando ele fala por cima dela, a
 * fala dele continua a mesma e só a dela é fechada.
 */
export function juntarLegenda(
  estado: EstadoDaLegenda,
  evento: EventoDaLegenda,
  uidDaAssistente: string,
  agora: number = Date.now(),
): EstadoDaLegenda {
  if (evento.tipo === 'idoso') {
    if (!evento.texto) return estado;
    return { ...estado, falas: acrescentar(estado.falas, UID_DO_IDOSO, evento.texto, agora) };
  }
  if (evento.tipo === 'assistente') {
    if (!evento.texto) return estado;
    return { ...estado, falas: acrescentar(estado.falas, uidDaAssistente, evento.texto, agora) };
  }
  if (evento.tipo === 'interrompida') {
    return {
      falas: fechar(estado.falas, uidDaAssistente, FALA_INTERROMPIDA),
      ignorarProximoFim: true,
    };
  }
  if (estado.ignorarProximoFim) return { ...estado, ignorarProximoFim: false };
  return {
    falas: fechar(fechar(estado.falas, uidDaAssistente, FALA_TERMINADA), UID_DO_IDOSO, FALA_TERMINADA),
    ignorarProximoFim: false,
  };
}

// ---------- Os tokens e o custo ----------

export const usoZerado = (): UsoDoGemini => ({
  entradaTexto: 0,
  entradaAudio: 0,
  saidaTexto: 0,
  saidaAudio: 0,
  raciocinio: 0,
  respostas: 0,
});

const positivo = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : 0;

/** Quanto de uma lista `[{ modality, tokenCount }]` é áudio. */
function audioDe(detalhes: unknown): number {
  if (!Array.isArray(detalhes)) return 0;
  return detalhes
    .filter((d) => d?.modality === 'AUDIO')
    .reduce((soma, d) => soma + positivo(d?.tokenCount), 0);
}

/**
 * Soma um `usageMetadata` ao que a ligação já gastou. O Google manda um por
 * resposta, e a entrada de cada resposta já traz a conversa inteira até ali:
 * cada bloco é o que aquela resposta custou, e somar os blocos dá a conta dele.
 * O resultado de uma ação entra como texto que o Google leu. Sem a lista de
 * modalidades tudo conta como texto, o preço mais baixo: a conta erra pra menos
 * e nunca inventa áudio. É a mesma soma que o Virte usa em produção.
 */
export function somarUso(acumulado: UsoDoGemini, meta: unknown): UsoDoGemini {
  if (!meta || typeof meta !== 'object') return acumulado;
  const m = meta as Record<string, unknown>;
  const entrada = positivo(m.promptTokenCount) + positivo(m.toolUsePromptTokenCount);
  const entradaAudio = Math.min(
    entrada,
    audioDe(m.promptTokensDetails) + audioDe(m.toolUsePromptTokensDetails),
  );
  const saida = positivo(m.responseTokenCount ?? m.candidatesTokenCount);
  const saidaAudio = Math.min(saida, audioDe(m.responseTokensDetails ?? m.candidatesTokensDetails));
  return {
    entradaTexto: acumulado.entradaTexto + entrada - entradaAudio,
    entradaAudio: acumulado.entradaAudio + entradaAudio,
    saidaTexto: acumulado.saidaTexto + saida - saidaAudio,
    saidaAudio: acumulado.saidaAudio + saidaAudio,
    raciocinio: acumulado.raciocinio + positivo(m.thoughtsTokenCount),
    respostas: acumulado.respostas + 1,
  };
}

/**
 * Dólares por milhão de tokens do Gemini ao vivo, pelo preço publicado, lido em
 * 21/11/2026 (o mesmo de conhecimento/tese.md). O raciocínio é cobrado como
 * texto que sai.
 */
export const PRECO_POR_MILHAO = {
  entradaTexto: 0.75,
  entradaAudio: 3,
  saidaTexto: 4.5,
  saidaAudio: 12,
} as const;

/** Quanto a ligação custou no Google, em dólares. */
export function custoEmDolar(uso: UsoDoGemini): number {
  const total =
    uso.entradaTexto * PRECO_POR_MILHAO.entradaTexto +
    uso.entradaAudio * PRECO_POR_MILHAO.entradaAudio +
    (uso.saidaTexto + uso.raciocinio) * PRECO_POR_MILHAO.saidaTexto +
    uso.saidaAudio * PRECO_POR_MILHAO.saidaAudio;
  return total / 1_000_000;
}

/** Dólares por minuto de ligação, ou null quando a ligação não chegou a 1 segundo. */
export function custoPorMinuto(uso: UsoDoGemini, segundos: number): number | null {
  if (!Number.isFinite(segundos) || segundos < 1) return null;
  return custoEmDolar(uso) / (segundos / 60);
}

/** Uma ligação de dez minutos fica longe disso; acima é número quebrado. */
const TETO_DE_TOKENS = 5_000_000;
const TETO_DE_SEGUNDOS = 2 * 60 * 60;

const inteiro = (v: unknown): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= TETO_DE_TOKENS ? v : null;

/** Confere a conta que chega do aparelho. Número negativo, quebrado ou absurdo vira nada. */
export function limparUso(entrada: unknown): UsoDoGemini | null {
  if (!entrada || typeof entrada !== 'object') return null;
  const u = entrada as Record<string, unknown>;
  const entradaTexto = inteiro(u.entradaTexto);
  const entradaAudio = inteiro(u.entradaAudio);
  const saidaTexto = inteiro(u.saidaTexto);
  const saidaAudio = inteiro(u.saidaAudio);
  const raciocinio = inteiro(u.raciocinio);
  const respostas = inteiro(u.respostas);
  if (
    entradaTexto === null ||
    entradaAudio === null ||
    saidaTexto === null ||
    saidaAudio === null ||
    raciocinio === null ||
    respostas === null ||
    respostas === 0
  ) {
    return null;
  }
  return { entradaTexto, entradaAudio, saidaTexto, saidaAudio, raciocinio, respostas };
}

export function limparSegundos(entrada: unknown): number | null {
  return typeof entrada === 'number' && Number.isFinite(entrada) && entrada >= 0 && entrada <= TETO_DE_SEGUNDOS
    ? Math.round(entrada)
    : null;
}

const dolar = (valor: number) => `US$ ${valor.toFixed(4).replace('.', ',')}`;

/** Uma linha curta pra quem testa, com os tokens, o custo da ligação e o custo por minuto. */
export function linhaDoUso(uso: UsoDoGemini, segundos: number): string {
  if (uso.respostas === 0) return 'Esperando a primeira conta do Google';
  const porMinuto = custoPorMinuto(uso, segundos);
  const tempo = `${Math.floor(segundos / 60)} min ${String(Math.round(segundos % 60)).padStart(2, '0')} s`;
  return [
    tempo,
    `entra ${uso.entradaAudio} de áudio e ${uso.entradaTexto} de texto`,
    `sai ${uso.saidaAudio} de áudio e ${uso.saidaTexto + uso.raciocinio} de texto`,
    dolar(custoEmDolar(uso)),
    porMinuto === null ? '' : `${dolar(porMinuto)} por minuto`,
  ]
    .filter(Boolean)
    .join(' · ');
}

// ---------- O som ----------

/**
 * Traz o som do microfone pra taxa que o Gemini espera. O navegador entrega em
 * blocos na taxa do aparelho (48 kHz, 44,1 kHz), e cada amostra de saída é a
 * média do trecho correspondente. O que sobra de um bloco entra no começo do
 * seguinte, então nenhum pedaço de som se perde entre um bloco e outro.
 */
export function criarReamostrador(de: number, para: number): (bloco: Float32Array) => Float32Array {
  if (de === para) return (bloco) => bloco;
  const razao = de / para;
  let sobra = new Float32Array(0);
  let posicao = 0;
  return (bloco) => {
    const tudo = new Float32Array(sobra.length + bloco.length);
    tudo.set(sobra, 0);
    tudo.set(bloco, sobra.length);
    const saida = new Float32Array(Math.max(0, Math.floor((tudo.length - posicao) / razao)));
    let escritas = 0;
    let p = posicao;
    while (p + razao <= tudo.length && escritas < saida.length) {
      const inicio = Math.floor(p);
      const fim = Math.max(inicio + 1, Math.floor(p + razao));
      let soma = 0;
      for (let j = inicio; j < fim; j += 1) soma += tudo[j];
      saida[escritas] = soma / (fim - inicio);
      escritas += 1;
      p += razao;
    }
    const consumidas = Math.floor(p);
    sobra = tudo.slice(consumidas);
    posicao = p - consumidas;
    return escritas === saida.length ? saida : saida.slice(0, escritas);
  };
}

/** Som do navegador (de -1 a 1) pro formato que o Gemini recebe: 16 bits, em base64. */
export function somParaBase64(amostras: Float32Array): string {
  const bytes = new Uint8Array(amostras.length * 2);
  const vista = new DataView(bytes.buffer);
  for (let i = 0; i < amostras.length; i += 1) {
    const limitada = Math.max(-1, Math.min(1, amostras[i]));
    vista.setInt16(i * 2, limitada < 0 ? limitada * 0x8000 : limitada * 0x7fff, true);
  }
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

/** A voz que o Gemini manda (16 bits, em base64) pro formato que o navegador toca. */
export function base64ParaSom(base64: string): Float32Array {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  const vista = new DataView(bytes.buffer);
  const amostras = new Float32Array(Math.floor(bytes.length / 2));
  for (let i = 0; i < amostras.length; i += 1) amostras[i] = vista.getInt16(i * 2, true) / 0x8000;
  return amostras;
}
