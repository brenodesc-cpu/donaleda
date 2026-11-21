// Limite de conversa por dia: o plano vende até 10 minutos de conversa por dia, e o
// cadastro marca duas ligações de até 10 minutos cada. A soma das conversas do dia
// (horário de Brasília) não passa do limite. Ligação pedida pela família pelo botão
// "Ligar agora" continua passando, porque pode ser uma urgência.
// Conta pura em cima da Base: quem chama decide o que fazer com o resultado.

import { dataEmBrasilia } from './assistente';
import { AVISO_DE_ENCERRAMENTO_MS } from './teto';
import type { Base, LimiteDoDia } from './tipos';

function minutosDaVariavel(variavel: string | undefined, padrao: number): number {
  const pedido = Number(variavel);
  return Number.isFinite(pedido) && pedido >= 1 && pedido <= 120 ? pedido : padrao;
}

/** Minutos de conversa por dia do plano. Trocável por LIA_LIMITE_DO_DIA_MIN. */
export const LIMITE_DO_DIA_MIN = minutosDaVariavel(process.env.LIA_LIMITE_DO_DIA_MIN, 10);

/** Teto normal de cada ligação, o mesmo da tela (NEXT_PUBLIC_LIA_TETO_MIN, 10 minutos). */
export const TETO_NORMAL_MS = minutosDaVariavel(process.env.NEXT_PUBLIC_LIA_TETO_MIN, 10) * 60_000;

/**
 * Com menos que isso sobrando, uma conversa nova não começa. Tem que caber o sinal de
 * encaminhar a despedida (lib/teto.ts, 90 s antes do teto) e mais um pouco de conversa,
 * pra toda ligação terminar com a despedida gentil e nunca cortada no meio.
 */
export const SOBRA_MINIMA_MS = AVISO_DE_ENCERRAMENTO_MS + 30_000;

/** Conversa sem fim depois disso conta como encerrada (aba fechada, queda de conexão). */
const CONVERSA_ABERTA_CONTA_ATE_MS = 15 * 60_000;

/** Quanto tempo de conversa o idoso já teve hoje, em milissegundos. */
export function conversaDeHojeMs(base: Base, agora: Date = new Date()): number {
  const hoje = dataEmBrasilia(agora);
  let total = 0;
  for (const c of base.conversas) {
    // As conversas inventadas dos dados de exemplo (id "ex-...") não gastam minutos de ninguém.
    if (c.id.startsWith('ex-')) continue;
    const inicio = new Date(c.inicio).getTime();
    if (!Number.isFinite(inicio) || dataEmBrasilia(new Date(inicio)) !== hoje) continue;
    const fim = c.fim
      ? new Date(c.fim).getTime()
      : Math.min(agora.getTime(), inicio + CONVERSA_ABERTA_CONTA_ATE_MS);
    total += Math.max(0, fim - inicio);
  }
  return total;
}

/** Quanto do limite de hoje já foi usado e quanto sobra. */
export function limiteDoDia(
  base: Base,
  agora: Date = new Date(),
  limiteMin: number = LIMITE_DO_DIA_MIN,
): LimiteDoDia {
  const limiteMs = limiteMin * 60_000;
  const usadoMs = conversaDeHojeMs(base, agora);
  const restanteMs = Math.max(0, limiteMs - usadoMs);
  return {
    limiteMin,
    usadoMin: Math.min(limiteMin, Math.round(usadoMs / 60_000)),
    restanteMs,
    acabou: restanteMs < SOBRA_MINIMA_MS,
  };
}

/** Quem começou a ligação: a hora marcada, a família pelo painel ou o próprio idoso. */
export type QuemLiga = 'horario' | 'familia' | 'idoso';

/** Se uma conversa pode começar agora. A família sempre pode: pode ser uma urgência. */
export function podeComecarConversa(base: Base, quem: QuemLiga, agora: Date = new Date()): boolean {
  if (quem === 'familia') return true;
  return !limiteDoDia(base, agora).acabou;
}

/**
 * Teto desta ligação: o teto normal de cada ligação, ou o que sobra do dia, o que for
 * menor. Ligação pedida pela família leva o teto normal inteiro.
 */
export function tetoDaConversaMs(
  base: Base,
  quem: QuemLiga,
  tetoNormalMs: number,
  agora: Date = new Date(),
): number {
  if (quem === 'familia') return tetoNormalMs;
  return Math.min(tetoNormalMs, limiteDoDia(base, agora).restanteMs);
}
