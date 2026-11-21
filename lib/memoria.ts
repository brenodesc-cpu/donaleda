// O segundo cérebro do idoso: o que a Dona Leda sabe da vida da pessoa, em oito
// gavetas. Tudo aqui é puro (mexe no objeto Base) e mora dentro da ficha, sem
// tabela nova. Desenho em conhecimento/segundo-cerebro.md.

import { randomUUID } from 'node:crypto';
import { FUSO, dataEmBrasilia, somarDias } from './assistente';
import { semAcento } from './regras';
import type { Base, CategoriaDeLembranca, Lembranca } from './tipos';

export const GAVETAS: CategoriaDeLembranca[] = [
  'pessoa',
  'saude',
  'dificuldade',
  'rotina',
  'gosto',
  'historia',
  'humor',
  'compromisso',
];

/** As gavetas de assunto, que entram em rodízio: duas por ligação. */
const RODIZIO: CategoriaDeLembranca[] = ['gosto', 'historia', 'rotina', 'humor', 'saude'];

const ROTULO: Record<CategoriaDeLembranca, string> = {
  pessoa: 'Pessoas',
  saude: 'Saúde',
  dificuldade: 'Dificuldades',
  rotina: 'Rotina',
  gosto: 'Gostos',
  historia: 'Histórias',
  humor: 'O que alegra e o que entristece',
  compromisso: 'Compromissos',
};

export const LIMITE_DE_LINHAS = 60;

// ---------- Ficha antiga ----------

/**
 * Ficha gravada antes do segundo cérebro: a gaveta 'familia' vira 'pessoa', e quem
 * não tinha número ganha um, na ordem em que foi criado.
 */
export function normalizarLembrancas(base: Base): void {
  base.lembrancas ??= [];
  let maior = base.lembrancas.reduce((m, l) => Math.max(m, l.numero ?? 0), 0);
  const semNumero = base.lembrancas
    .filter((l) => !l.numero)
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm));
  for (const l of semNumero) {
    maior += 1;
    l.numero = maior;
  }
  for (const l of base.lembrancas) {
    if ((l.categoria as string) === 'familia') l.categoria = 'pessoa';
    if (!GAVETAS.includes(l.categoria)) l.categoria = 'historia';
    l.origem ??= 'conversa';
  }
}

// ---------- O que nunca entra ----------

// Seis dígitos ou mais seguidos (com espaço, ponto ou traço no meio): senha, cartão,
// conta, CPF, telefone. Data (12/11) e hora (14h) passam.
const NUMERO_LONGO = /\d(?:[\s.\-/]?\d){5,}/;
const ORDEM =
  /\b(a partir de agora|de agora em diante|daqui pra frente voce|voce (deve|tem que|precisa)|sempre que (eu|alguem)|ignore|esqueca (as|suas) regras|finja|nao avise|nao conte (pra|para) (ninguem|a familia)|sua nova regra|nova instrucao)\b/;
const DADO_SECRETO = /\b(senha|codigo de seguranca|codigo do banco|numero do cartao|cvv|token)\b/;

/** Por que a lembrança não pode ser guardada, ou null quando pode. */
export function motivoDeRecusa(texto: string): string | null {
  const limpo = semAcento(texto);
  if (NUMERO_LONGO.test(texto) || DADO_SECRETO.test(limpo)) {
    return 'número longo, senha ou dado de banco não ficam guardados';
  }
  if (ORDEM.test(limpo)) return 'ordem pra assistente não vira lembrança';
  return null;
}

// ---------- Datas ditas em palavra ----------

const DIAS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function diaDaSemana(data: string): number {
  const [a, m, d] = data.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/**
 * A data como a pessoa disse ("hoje", "amanhã", "quinta", "26/11", "2026-11-26")
 * vira AAAA-MM-DD pelo relógio de Brasília. A conta de data nunca fica com a IA.
 */
export function dataPedida(texto: string | undefined, agora: Date = new Date()): string | undefined {
  if (!texto) return undefined;
  const t = semAcento(texto).trim().replace(/-feira/g, '');
  const hoje = dataEmBrasilia(agora);
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (t === 'hoje') return hoje;
  if (t === 'amanha') return somarDias(hoje, 1);
  if (t === 'depois de amanha') return somarDias(hoje, 2);
  if (t === 'ontem') return somarDias(hoje, -1);
  const barra = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (barra) {
    const ano = barra[3] ? (barra[3].length === 2 ? `20${barra[3]}` : barra[3]) : hoje.slice(0, 4);
    const data = `${ano}-${barra[2].padStart(2, '0')}-${barra[1].padStart(2, '0')}`;
    // Sem ano e já passou: é o do ano que vem.
    return !barra[3] && data < hoje ? `${Number(ano) + 1}${data.slice(4)}` : data;
  }
  const qual = DIAS.findIndex((d) => t.startsWith(d) || t.endsWith(d));
  if (qual >= 0) {
    const falta = (qual - diaDaSemana(hoje) + 7) % 7;
    return somarDias(hoje, falta);
  }
  return undefined;
}

/** "14h", "14:30", "2 da tarde" → "HH:MM". */
export function horaPedida(texto: string | undefined): string | undefined {
  if (!texto) return undefined;
  const t = semAcento(texto).trim();
  const m = t.match(/^(\d{1,2})(?:[:h](\d{2})?)?\s*(?:h|horas)?\s*(da tarde|da noite|da manha)?$/);
  if (!m) return undefined;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if ((m[3] === 'da tarde' || m[3] === 'da noite') && h < 12) h += 12;
  if (h > 23 || min > 59) return undefined;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

// ---------- Guardar, mudar, buscar ----------

export interface NovaLembranca {
  texto: string;
  categoria: CategoriaDeLembranca;
  sobre?: string;
  data?: string;
  hora?: string;
  reservada?: boolean;
  origem: 'conversa' | 'familia';
}

export type ResultadoDeGuardar =
  | { ok: true; lembranca: Lembranca; jaExistia: boolean }
  | { ok: false; motivo: string };

function igual(a: string, b: string): boolean {
  return semAcento(a).replace(/\s+/g, ' ').trim() === semAcento(b).replace(/\s+/g, ' ').trim();
}

export function guardar(base: Base, nova: NovaLembranca, agora: Date = new Date()): ResultadoDeGuardar {
  normalizarLembrancas(base);
  const texto = nova.texto.trim().replace(/\s+/g, ' ').slice(0, 240);
  if (!texto) return { ok: false, motivo: 'faltou o texto' };
  const motivo = motivoDeRecusa(texto);
  if (motivo) return { ok: false, motivo };

  const repetida = base.lembrancas.find((l) => igual(l.texto, texto));
  if (repetida) {
    if (nova.reservada !== undefined) repetida.reservada = nova.reservada;
    if (nova.data) repetida.data = nova.data;
    if (nova.hora) repetida.hora = nova.hora;
    return { ok: true, lembranca: repetida, jaExistia: true };
  }

  const lembranca: Lembranca = {
    id: randomUUID(),
    numero: base.lembrancas.reduce((m, l) => Math.max(m, l.numero ?? 0), 0) + 1,
    texto,
    categoria: GAVETAS.includes(nova.categoria) ? nova.categoria : 'historia',
    ...(nova.sobre?.trim() ? { sobre: nova.sobre.trim().slice(0, 60) } : {}),
    ...(nova.data ? { data: nova.data } : {}),
    ...(nova.hora ? { hora: nova.hora } : {}),
    ...(nova.reservada ? { reservada: true } : {}),
    origem: nova.origem,
    criadaEm: agora.toISOString(),
  };
  base.lembrancas.push(lembranca);
  return { ok: true, lembranca, jaExistia: false };
}

export type Mudanca =
  | { acao: 'corrigir'; texto?: string; categoria?: CategoriaDeLembranca; sobre?: string; data?: string; hora?: string }
  | { acao: 'esquecer' }
  | { acao: 'reservar' }
  | { acao: 'liberar' };

export type ResultadoDeMudar =
  | { ok: true; lembranca: Lembranca | null }
  | { ok: false; motivo: string };

/** Corrige, esquece, reserva ou libera uma lembrança, achada pelo número ou pelo id. */
export function mudar(
  base: Base,
  qual: { numero?: number; id?: string },
  mudanca: Mudanca,
  agora: Date = new Date(),
): ResultadoDeMudar {
  normalizarLembrancas(base);
  const i = base.lembrancas.findIndex((l) =>
    qual.id ? l.id === qual.id : l.numero === qual.numero,
  );
  if (i < 0) return { ok: false, motivo: 'não achei essa lembrança' };
  const l = base.lembrancas[i];

  if (mudanca.acao === 'esquecer') {
    base.lembrancas.splice(i, 1);
    return { ok: true, lembranca: null };
  }
  if (mudanca.acao === 'reservar') l.reservada = true;
  if (mudanca.acao === 'liberar') delete l.reservada;
  if (mudanca.acao === 'corrigir') {
    if (mudanca.texto?.trim()) {
      const motivo = motivoDeRecusa(mudanca.texto);
      if (motivo) return { ok: false, motivo };
      l.texto = mudanca.texto.trim().slice(0, 240);
    }
    if (mudanca.categoria && GAVETAS.includes(mudanca.categoria)) l.categoria = mudanca.categoria;
    if (mudanca.sobre !== undefined) l.sobre = mudanca.sobre.trim() || undefined;
    if (mudanca.data !== undefined) l.data = mudanca.data || undefined;
    if (mudanca.hora !== undefined) l.hora = mudanca.hora || undefined;
  }
  l.atualizadaEm = agora.toISOString();
  delete l.exemplo;
  return { ok: true, lembranca: l };
}

const PALAVRAS_VAZIAS = new Set(
  'a o as os um uma de da do das dos em no na nos nas que e eu me meu minha voce sabe qual quando quem como onde pra para por com tem sobre isso esse essa ele ela foi era ja hoje'.split(' '),
);

function palavras(texto: string): string[] {
  return semAcento(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 3 && !PALAVRAS_VAZIAS.has(p))
    .map((p) => p.slice(0, 6));
}

/** Procura na ficha inteira pelas palavras da pergunta, sem ligar pra acento. */
export function buscar(base: Base, pergunta: string, limite = 8): Lembranca[] {
  normalizarLembrancas(base);
  const procuradas = palavras(pergunta);
  if (procuradas.length === 0) return [];
  return base.lembrancas
    .map((l) => {
      const alvo = new Set(palavras(`${l.texto} ${l.sobre ?? ''} ${ROTULO[l.categoria]}`));
      const pontos = procuradas.filter((p) => alvo.has(p)).length;
      return { l, pontos };
    })
    .filter((x) => x.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || b.l.criadaEm.localeCompare(a.l.criadaEm))
    .slice(0, limite)
    .map((x) => x.l);
}

// ---------- O que vai na instrução de cada ligação ----------

function quando(data: string, hora?: string): string {
  const [a, m, d] = data.split('-').map(Number);
  const dia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long' }).format(
    new Date(Date.UTC(a, m - 1, d)),
  );
  return `${dia.replace('-feira', '')}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}${hora ? ` às ${hora.replace(':00', 'h')}` : ''}`;
}

function criadaEmCurto(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit' }).format(
    new Date(iso),
  );
}

/** Uma linha da lembrança na instrução: número, texto, data e quem contou. */
export function linha(l: Lembranca, familiar: string): string {
  const extras = [
    l.data ? quando(l.data, l.hora) : null,
    l.origem === 'familia' ? `${familiar} contou` : `contou em ${criadaEmCurto(l.criadaEm)}`,
    l.reservada ? 'só entre vocês' : null,
  ].filter(Boolean);
  return `- [${l.numero}] ${l.texto} (${extras.join('; ')})`;
}

/**
 * O bloco "o que você sabe" de cada ligação, com até 60 linhas: os compromissos de
 * ontem a 14 dias, os aniversários da semana, as dificuldades e as 10 pessoas mais
 * recentes sempre; duas gavetas de assunto em rodízio, até 8 cada. O resto ela busca.
 */
export function blocoDeLembrancas(base: Base, agora: Date = new Date()): string {
  normalizarLembrancas(base);
  const hoje = dataEmBrasilia(agora);
  const ontem = somarDias(hoje, -1);
  const daquiA14 = somarDias(hoje, 14);
  const familiar = base.idoso.familiar.nome;
  const porGaveta = (g: CategoriaDeLembranca) =>
    base.lembrancas
      .filter((l) => l.categoria === g)
      .sort((a, b) => (b.atualizadaEm ?? b.criadaEm).localeCompare(a.atualizadaEm ?? a.criadaEm));

  const partes: string[] = [];
  const secao = (titulo: string, itens: Lembranca[]) => {
    if (itens.length) partes.push(`## ${titulo}`, ...itens.map((l) => linha(l, familiar)));
  };

  const compromissos = base.lembrancas
    .filter((l) => l.categoria === 'compromisso' && l.data && l.data >= ontem && l.data <= daquiA14)
    .sort((a, b) => `${a.data}${a.hora ?? ''}`.localeCompare(`${b.data}${b.hora ?? ''}`))
    .slice(0, 6);
  secao('Compromissos (de ontem às próximas duas semanas)', compromissos);
  secao('Dificuldades (mudam o seu jeito de falar)', porGaveta('dificuldade').slice(0, 6));
  secao('Pessoas', porGaveta('pessoa').slice(0, 10));
  const semData = porGaveta('compromisso').filter((l) => !l.data).slice(0, 3);
  secao('Compromissos sem data', semData);

  const vez = base.conversas.length % RODIZIO.length;
  for (const g of [RODIZIO[vez], RODIZIO[(vez + 1) % RODIZIO.length]]) {
    secao(ROTULO[g], porGaveta(g).slice(0, 8));
  }

  const linhas = partes.slice(0, LIMITE_DE_LINHAS);
  const fora = base.lembrancas.length - linhas.filter((l) => l.startsWith('- [')).length;
  if (fora > 0 && linhas.length < LIMITE_DE_LINHAS) {
    linhas.push(`(Mais ${fora} lembranças guardadas. Use buscar_lembranca quando a pessoa perguntar algo que não está aqui.)`);
  }
  return linhas.join('\n');
}

// ---------- O que a família vê ----------

export function paraOPainel(base: Base): { lembrancas: Lembranca[]; reservadas: number } {
  normalizarLembrancas(base);
  const visiveis = base.lembrancas.filter((l) => !l.reservada);
  const comData = visiveis
    .filter((l) => l.categoria === 'compromisso' && l.data)
    .sort((a, b) => `${a.data}${a.hora ?? ''}`.localeCompare(`${b.data}${b.hora ?? ''}`));
  const resto = visiveis
    .filter((l) => !(l.categoria === 'compromisso' && l.data))
    .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  return {
    lembrancas: [...comData, ...resto],
    reservadas: base.lembrancas.length - visiveis.length,
  };
}
