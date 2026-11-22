// A conta de minutos da demonstração pública, guardada no banco pra valer entre
// os servidores da Vercel. Cada ligação reserva o teto inteiro (dois minutos)
// antes de começar. O banco guarda só o dia, a hora e dois códigos embaralhados
// (do visitante e da rede), nunca o endereço de quem ligou nem o que foi dito.

import { createHash } from 'node:crypto';
import { dataEmBrasilia } from './assistente';
import {
  SEGUNDOS_POR_LIGACAO,
  limitesDaDemonstracao,
  podeReservar,
  type RecusaDaDemonstracao,
} from './demonstracao';

/** O código embaralhado de quem ligou. Muda todo dia, então não dá pra seguir ninguém. */
export function codigoDoVisitante(valor: string, dia: string): string {
  const segredo = process.env.LIA_CHAVE_DAS_FERRAMENTAS?.trim() || process.env.NEXT_AGORA_APP_CERTIFICATE || '';
  return createHash('sha256').update(`demonstracao:${dia}:${segredo}:${valor}`).digest('hex').slice(0, 32);
}

interface Uso {
  segundosHoje: number;
  doVisitante: number;
  daRede: number;
}

interface Reserva {
  dia: string;
  visitante: string;
  rede: string;
  segundos: number;
}

// Só pros testes e pra rodar sem banco (LIA_DADOS=memoria).
const naMemoria: Reserva[] = [];

async function supabase() {
  const { clienteDoServidor } = await import('./supabase/servidor');
  return clienteDoServidor();
}

function usoDe(reservas: Reserva[], dia: string, visitante: string, rede: string): Uso {
  const doDia = reservas.filter((r) => r.dia === dia);
  return {
    segundosHoje: doDia.reduce((soma, r) => soma + r.segundos, 0),
    doVisitante: doDia.filter((r) => r.visitante === visitante).length,
    daRede: doDia.filter((r) => r.rede === rede).length,
  };
}

export type ResultadoDaReserva = { ok: true } | { ok: false; motivo: RecusaDaDemonstracao };

/**
 * Reserva uma ligação. No banco, a conta e a reserva acontecem numa operação só
 * (supabase/migrations/20261121200000_demonstracao.sql), pra dois jurados tocando
 * ao mesmo tempo não passarem juntos do total do dia.
 */
export async function reservarLigacao(visitanteBruto: string, redeBruta: string, agora: Date = new Date()): Promise<ResultadoDaReserva> {
  const limites = limitesDaDemonstracao();
  if (limites.desligada) return { ok: false, motivo: 'desligada' };
  const dia = dataEmBrasilia(agora);
  const visitante = codigoDoVisitante(visitanteBruto, dia);
  const rede = codigoDoVisitante(`rede:${redeBruta}`, dia);

  if (process.env.LIA_DADOS === 'memoria') {
    const recusa = podeReservar(usoDe(naMemoria, dia, visitante, rede), limites);
    if (recusa) return { ok: false, motivo: recusa };
    naMemoria.push({ dia, visitante, rede, segundos: SEGUNDOS_POR_LIGACAO });
    return { ok: true };
  }

  const { data, error } = await (await supabase()).rpc('reservar_demonstracao', {
    p_dia: dia,
    p_visitante: visitante,
    p_rede: rede,
    p_segundos: SEGUNDOS_POR_LIGACAO,
    p_teto_dia: limites.minutosPorDia * 60,
    p_teto_visitante: limites.ligacoesPorVisitante,
    p_teto_rede: limites.ligacoesPorRede,
  });
  if (error) throw new Error(`Não consegui reservar a demonstração: ${error.message}`);
  if (data === 'ok') return { ok: true };
  const motivo: RecusaDaDemonstracao = data === 'visitante' || data === 'rede' ? data : 'cheia';
  return { ok: false, motivo };
}

/** Se ainda cabe uma ligação hoje, pra página avisar antes do toque. Na dúvida, diz que cabe. */
export async function cabeMaisUmaHoje(agora: Date = new Date()): Promise<boolean> {
  const limites = limitesDaDemonstracao();
  if (limites.desligada) return false;
  const dia = dataEmBrasilia(agora);
  if (process.env.LIA_DADOS === 'memoria') {
    return podeReservar(usoDe(naMemoria, dia, '', ''), limites) === null;
  }
  try {
    const { data, error } = await (await supabase())
      .from('demonstracoes')
      .select('segundos')
      .eq('dia', dia);
    if (error) return true;
    const segundosHoje = (data ?? []).reduce((soma, linha) => soma + Number(linha.segundos ?? 0), 0);
    return podeReservar({ segundosHoje, doVisitante: 0, daRede: 0 }, limites) === null;
  } catch {
    return true;
  }
}

/** Só pros testes: esquece as reservas feitas em memória. */
export function zerarReservasNaMemoria(): void {
  naMemoria.length = 0;
}
