// A conta da tela "Todos os moradores": em que situação cada morador está hoje,
// em que ordem eles aparecem e os números do topo. Conta pura, sem busca.

import { avisoAberto } from '@/lib/avisos';
import type { Alerta, PainelDaFamilia } from '@/lib/tipos';

/** Da que mais pede a equipe pra que menos pede. */
export type Situacao = 'urgente' | 'atencao' | 'conversando' | 'sem_conversa' | 'conversou';

const PESO: Record<Situacao, number> = {
  urgente: 0,
  atencao: 1,
  conversando: 2,
  sem_conversa: 3,
  conversou: 4,
};

export interface Morador {
  id: string;
  painel: PainelDaFamilia;
  situacao: Situacao;
  /** Avisos abertos (ninguém viu, ou quem viu ainda não contou o que fez), o mais novo primeiro. */
  avisosNovos: Alerta[];
}

export interface ContaDaCasa {
  moradores: number;
  avisosNovos: number;
  urgentes: number;
  conversaram: number;
  conversandoAgora: number;
  aindaNao: number;
}

function maisNovoPrimeiro(a: Alerta, b: Alerta): number {
  return b.criadoEm.localeCompare(a.criadoEm);
}

export function situacaoDe(painel: PainelDaFamilia): Situacao {
  const novos = painel.alertas.filter(avisoAberto);
  if (novos.some((a) => a.gravidade === 'urgente')) return 'urgente';
  if (novos.length > 0) return 'atencao';
  if (painel.ultimaConversa?.emAndamento) return 'conversando';
  if (!painel.conversouHoje) return 'sem_conversa';
  return 'conversou';
}

/** Ordem da tela: situação, depois o aviso mais novo, depois o nome. */
export function ordenarMoradores(paineis: { id: string; painel: PainelDaFamilia }[]): Morador[] {
  return paineis
    .map(({ id, painel }) => ({
      id,
      painel,
      situacao: situacaoDe(painel),
      avisosNovos: painel.alertas.filter(avisoAberto).sort(maisNovoPrimeiro),
    }))
    .sort((a, b) => {
      const peso = PESO[a.situacao] - PESO[b.situacao];
      if (peso !== 0) return peso;
      const avisoA = a.avisosNovos[0]?.criadoEm ?? '';
      const avisoB = b.avisosNovos[0]?.criadoEm ?? '';
      if (avisoA !== avisoB) return avisoB.localeCompare(avisoA);
      return a.painel.idoso.nome.localeCompare(b.painel.idoso.nome, 'pt-BR');
    });
}

export function contarCasa(moradores: Morador[]): ContaDaCasa {
  const conta: ContaDaCasa = {
    moradores: moradores.length,
    avisosNovos: 0,
    urgentes: 0,
    conversaram: 0,
    conversandoAgora: 0,
    aindaNao: 0,
  };
  for (const { painel, avisosNovos } of moradores) {
    conta.avisosNovos += avisosNovos.length;
    conta.urgentes += avisosNovos.filter((a) => a.gravidade === 'urgente').length;
    if (painel.ultimaConversa?.emAndamento) conta.conversandoAgora += 1;
    else if (painel.conversouHoje) conta.conversaram += 1;
    else conta.aindaNao += 1;
  }
  return conta;
}
