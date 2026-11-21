// O tempo de resposta da Dona Leda, medido pela própria Agora. A cada fala, o motor
// de conversa manda quanto cada peça levou pra começar a responder (o modelo, a voz,
// ou o Gemini quando ele faz tudo). A tela soma isso durante a ligação e manda o
// resumo pro servidor no fim, uma vez só, pra ficar junto da conversa.

import type { TemposDaConversa } from './tipos';

/** O que a Agora manda a cada medição: a peça, o nome da medida e o valor em ms. */
export interface MedidaDaAgora {
  type: string;
  name: string;
  value: number;
}

/** Soma de cada medida durante a ligação, por "peça.medida" (ex.: "llm.ttfb"). */
export type Medicao = Record<string, { n: number; soma: number; pior: number }>;

const MAXIMO_DE_MEDIDAS = 12;
const MAIOR_VALOR_ACEITO_MS = 120_000;

function chaveDa(medida: MedidaDaAgora): string | null {
  const peca = String(medida.type ?? '').trim().toLowerCase();
  const nome = String(medida.name ?? '').trim().toLowerCase();
  if (!peca || !nome || !/^[a-z0-9_.-]{1,40}$/.test(`${peca}.${nome}`)) return null;
  return `${peca}.${nome}`;
}

/** Junta mais uma medida. Valor estranho (negativo, infinito, maior que 2 min) fica de fora. */
export function somarMedida(medicao: Medicao, medida: MedidaDaAgora): Medicao {
  const chave = chaveDa(medida);
  const valor = medida.value;
  if (!chave || typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > MAIOR_VALOR_ACEITO_MS) {
    return medicao;
  }
  const atual = medicao[chave];
  if (!atual && Object.keys(medicao).length >= MAXIMO_DE_MEDIDAS) return medicao;
  return {
    ...medicao,
    [chave]: {
      n: (atual?.n ?? 0) + 1,
      soma: (atual?.soma ?? 0) + valor,
      pior: Math.max(atual?.pior ?? 0, valor),
    },
  };
}

/** O resumo que vai pro servidor: quantas vezes, a média e o pior caso, em ms inteiros. */
export function resumirMedicao(medicao: Medicao): TemposDaConversa {
  const resumo: TemposDaConversa = {};
  for (const [chave, { n, soma, pior }] of Object.entries(medicao)) {
    if (n > 0) resumo[chave] = { n, mediaMs: Math.round(soma / n), piorMs: Math.round(pior) };
  }
  return resumo;
}

/**
 * O servidor só aceita o formato esperado: no máximo 12 medidas, nome curto e
 * números dentro do razoável. Qualquer outra coisa vem do aparelho e é descartada.
 */
export function limparTempos(entrada: unknown): TemposDaConversa | null {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return null;
  const limpo: TemposDaConversa = {};
  for (const [chave, valor] of Object.entries(entrada as Record<string, unknown>)) {
    if (Object.keys(limpo).length >= MAXIMO_DE_MEDIDAS) break;
    if (!/^[a-z0-9_.-]{1,40}$/.test(chave) || !valor || typeof valor !== 'object') continue;
    const { n, mediaMs, piorMs } = valor as Record<string, unknown>;
    const numeros = [n, mediaMs, piorMs];
    if (numeros.some((x) => typeof x !== 'number' || !Number.isFinite(x) || x < 0)) continue;
    const [vezes, media, pior] = numeros as number[];
    if (vezes < 1 || vezes > 10_000 || media > pior || pior > MAIOR_VALOR_ACEITO_MS) continue;
    limpo[chave] = { n: Math.round(vezes), mediaMs: Math.round(media), piorMs: Math.round(pior) };
  }
  return Object.keys(limpo).length > 0 ? limpo : null;
}

/** Uma linha curta pra quem testa: "turno.e2e 1450 ms (6) · llm.ttfb 820 ms (6)". */
export function linhaDaMedicao(medicao: Medicao): string {
  const resumo = resumirMedicao(medicao);
  return Object.entries(resumo)
    .map(([chave, { n, mediaMs }]) => `${chave} ${mediaMs} ms (${n})`)
    .join(' · ');
}

const CHAVE_DO_MEDIDOR = 'donaleda-medir';

/**
 * ?medir=1 no endereço mostra o tempo de resposta na tela durante o teste, e fica
 * guardado no aparelho até ?medir=0. A idosa nunca vê isso sem alguém pedir.
 */
export function medidorLigado(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const pedido = new URLSearchParams(window.location.search).get('medir');
    if (pedido === '1') window.localStorage.setItem(CHAVE_DO_MEDIDOR, '1');
    if (pedido === '0') window.localStorage.removeItem(CHAVE_DO_MEDIDOR);
    return window.localStorage.getItem(CHAVE_DO_MEDIDOR) === '1';
  } catch {
    return false;
  }
}
