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
// conta, CPF, telefone. Data (12/11, 12/06/1965) e hora (14h) passam: a data sai do
// texto antes da conferência, pra "casou em 12/06/1965" não ser lida como número longo.
const NUMERO_LONGO = /\d(?:[\s.\-/]?\d){5,}/;
const DATA_ESCRITA = /\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b|\b\d{4}-\d{2}-\d{2}\b/g;
// Ordem dirigida à assistente. "Sempre que" só conta quando fala com ela ("sempre que eu
// disser X, você..."); "sempre que alguém visita, ela faz bolo" é rotina e fica guardada.
const ORDEM =
  /\b(a partir de agora|de agora em diante|daqui pra frente voce|voce (deve|tem que|precisa)|sempre que [^.]*\bvoce\b|ignore|esqueca (as|suas) regras|finja|nao avise|nao conte (pra|para) (ninguem|a familia)|sua nova regra|nova instrucao)\b/;
const DADO_SECRETO = /\b(senha|codigo de seguranca|codigo do banco|numero do cartao|cvv|token)\b/;

/** Por que a lembrança não pode ser guardada, ou null quando pode. */
export function motivoDeRecusa(texto: string): string | null {
  const limpo = semAcento(texto);
  if (NUMERO_LONGO.test(texto.replace(DATA_ESCRITA, ' ')) || DADO_SECRETO.test(limpo)) {
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

const MESES = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const NUMEROS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, quinze: 15,
};

/** AAAA-MM-DD se o dia existe naquele mês (31/11 não existe), senão undefined. */
function dataValida(ano: number, mes: number, dia: number): string | undefined {
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return undefined;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Dia e mês sem ano: este ano, ou o que vem se já passou. */
function proximaData(hoje: string, mes: number, dia: number): string | undefined {
  const ano = Number(hoje.slice(0, 4));
  const data = dataValida(ano, mes, dia);
  if (data && data >= hoje) return data;
  return dataValida(ano + 1, mes, dia);
}

/**
 * A data como a pessoa disse ("hoje", "amanhã", "quinta", "sábado que vem", "dia 26",
 * "26 de novembro", "26/11", "daqui a 3 dias", "2026-11-26") vira AAAA-MM-DD pelo
 * relógio de Brasília. A conta de data nunca fica com a IA.
 */
export function dataPedida(texto: string | undefined, agora: Date = new Date()): string | undefined {
  if (!texto) return undefined;
  const t = semAcento(texto).trim().replace(/-feira/g, '').replace(/\s+/g, ' ');
  const hoje = dataEmBrasilia(agora);
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  if (/^(hoje|hoje mesmo)$/.test(t)) return hoje;
  if (/\bdepois de amanha\b/.test(t)) return somarDias(hoje, 2);
  if (/\bamanha\b/.test(t)) return somarDias(hoje, 1);
  if (/^ontem$/.test(t)) return somarDias(hoje, -1);

  const daqui = t.match(/\bdaqui a (\d{1,3}|\w+) dias?\b/);
  if (daqui) {
    const n = /^\d+$/.test(daqui[1]) ? Number(daqui[1]) : NUMEROS[daqui[1]];
    if (n) return somarDias(hoje, n);
  }

  // "26/11", "dia 26/11/2026"
  const barra = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (barra) {
    const [dia, mes] = [Number(barra[1]), Number(barra[2])];
    if (!barra[3]) return proximaData(hoje, mes, dia);
    const ano = barra[3].length === 2 ? 2000 + Number(barra[3]) : Number(barra[3]);
    return dataValida(ano, mes, dia);
  }

  // "26 de novembro", "dia 3 de dezembro de 2026"
  const porExtenso = t.match(new RegExp(`\\b(\\d{1,2}) de (${MESES.join('|')})(?: de (\\d{4}))?\\b`));
  if (porExtenso) {
    const [dia, mes] = [Number(porExtenso[1]), MESES.indexOf(porExtenso[2]) + 1];
    return porExtenso[3] ? dataValida(Number(porExtenso[3]), mes, dia) : proximaData(hoje, mes, dia);
  }

  // "dia 26": este mês, ou o que vem se já passou.
  const soDia = t.match(/\bdia (\d{1,2})\b/);
  if (soDia) {
    const dia = Number(soDia[1]);
    const [ano, mes] = [Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7))];
    for (let i = 0; i < 3; i++) {
      const m = ((mes - 1 + i) % 12) + 1;
      const data = dataValida(ano + Math.floor((mes - 1 + i) / 12), m, dia);
      if (data && data >= hoje) return data;
    }
    return undefined;
  }

  const qual = DIAS.findIndex((d) => new RegExp(`\\b${d}\\b`).test(t));
  if (qual >= 0) {
    const semana = diaDaSemana(hoje);
    let falta = (qual - semana + 7) % 7;
    // "sábado que vem" dito num sábado é o da outra semana.
    if (falta === 0 && /\b(que vem|proxim[oa])\b/.test(t)) falta = 7;
    // "quinta da semana que vem" dito numa segunda pula a quinta desta semana.
    if (/\b(semana que vem|proxima semana)\b/.test(t) && semana + falta <= 6) falta += 7;
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

// ---------- O segredo não sai pela família ----------

// Palavras que aparecem em qualquer aviso ou resumo e não dizem qual é o segredo:
// ligação, família, tempo, sentimento. Sem elas, "triste" ou "filha" bloqueariam tudo.
const PALAVRAS_COMUNS = new Set(
  `esta este isso essa esse aquele aquela aquilo pela pelo para como quando onde porque mais menos muito muita
  muitos muitas pouco pouca tudo nada todo toda todos todas sempre nunca ainda agora depois antes hoje ontem amanha
  semana dias meses anos sobre entre desde mesmo mesma outra outro outras outros algum alguma alguem ninguem nenhum
  nenhuma cada qual quem assim tambem apenas pode podia quer queria quero querem sabe saber saiba sabia saibam conta
  contar contou conte falar falou fala falando disse dizer dizendo pede pediu pedir pedindo ficar fica ficou estar
  estava estao estou anda andar andava andando tinha teve fazer fazia vezes coisa coisas vida tempo hora horas
  conversa conversar conversou ligacao ligar ligue ligou vale avisar aviso avisada avisado dela dele delas deles
  nossa nosso minha seus suas dona senhora senhor gente casa familia filha filho filhas filhos neta neto netas netos
  marido esposa segredo guardar guarda guardou entre triste tristeza chora chorando chorou choro chorar preocupada
  preocupado preocupacao nervosa nervoso ansiosa ansioso medo sozinha sozinho cansada cansado desanimada desanimado
  abatida abatido feliz alegre dormiu dormir sono comeu comer remedio remedios tomou tomar saude sente sentindo
  sentiu sentia melhor pior forte fraca fraco causa motivo vontade semanas todo dias muito bastante pouco pessoa
  assistente virtual contou disse acha achou`
    .split(/\s+/)
    .filter(Boolean)
    .map(radical),
);

function radical(palavra: string): string {
  return palavra.length > 6 ? palavra.slice(0, 6) : palavra;
}

function palavrasDe(texto: string): string[] {
  return (semAcento(texto).match(/[a-z]{4,}/g) ?? []).map(radical);
}

/**
 * As palavras que só aparecem nas lembranças reservadas: o assunto do segredo
 * ("aluguel" em "anda preocupada com o aluguel e não quer que a filha saiba").
 * Ficam de fora o que a família já vê nas outras lembranças, os nomes da ficha
 * e as palavras comuns.
 */
export function assuntoDoSegredo(base: Base): Set<string> {
  const reservadas = base.lembrancas.filter((l) => l.reservada);
  if (reservadas.length === 0) return new Set();
  const conhecidas = new Set(
    palavrasDe(
      [
        base.idoso.nome,
        base.idoso.tratamento,
        base.idoso.familiar.nome,
        base.idoso.familiar.parentesco,
        ...base.lembrancas.filter((l) => !l.reservada).map((l) => `${l.texto} ${l.sobre ?? ''}`),
      ].join(' '),
    ),
  );
  const assunto = new Set<string>();
  for (const l of reservadas) {
    for (const p of palavrasDe(`${l.texto} ${l.sobre ?? ''}`)) {
      if (!conhecidas.has(p) && !PALAVRAS_COMUNS.has(p)) assunto.add(p);
    }
  }
  return assunto;
}

/** O texto cita o assunto de alguma lembrança reservada? */
export function citaSegredo(base: Base, texto: string): boolean {
  const assunto = assuntoDoSegredo(base);
  return assunto.size > 0 && palavrasDe(texto).some((p) => assunto.has(p));
}

/** O resumo sem as frases que citam o segredo. */
export function resumoSemSegredo(base: Base, resumo: string): { resumo: string; cortou: boolean } {
  const frases = resumo.trim().split(/(?<=[.!?])\s+/).filter((f) => f.trim());
  const ficam = frases.filter((f) => !citaSegredo(base, f));
  if (ficam.length === frases.length) return { resumo: resumo.trim(), cortou: false };
  return { resumo: ficam.length ? ficam.join(' ') : 'Conversaram hoje.', cortou: true };
}
