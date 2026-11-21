// Como o painel da família transforma a ficha em palavras, horas e cores.
// Tudo aqui é conta pura: nenhuma busca, nenhum estado.

import type {
  CategoriaDeLembranca,
  Chamada,
  Dia,
  TipoDeAlerta,
} from '@/lib/tipos';

const FUSO = 'America/Sao_Paulo';

/** O peso de uma resposta: decide a cor do bloco e do ponto na semana. */
export type Tom = 'bom' | 'atencao' | 'ruim' | 'neutro' | 'vazio';

export interface Leitura {
  texto: string;
  tom: Tom;
}

const SEM_RESPOSTA: Leitura = { texto: 'Ainda sem resposta', tom: 'vazio' };

export const CLASSES_DO_TOM: Record<
  Tom,
  { bloco: string; valor: string; ponto: string }
> = {
  bom: {
    bloco: 'bg-success-soft border-success/30',
    valor: 'text-success',
    ponto: 'bg-success',
  },
  atencao: {
    bloco: 'bg-warning-soft border-warning/40',
    valor: 'text-warning',
    ponto: 'bg-warning',
  },
  ruim: {
    bloco: 'bg-danger-soft border-destructive/40',
    valor: 'text-destructive',
    ponto: 'bg-destructive',
  },
  neutro: {
    bloco: 'bg-card border-border',
    valor: 'text-foreground',
    ponto: 'bg-muted-foreground',
  },
  vazio: {
    bloco: 'bg-card border-border',
    valor: 'text-muted-foreground',
    ponto: 'bg-muted border border-border',
  },
};

export function lerSono(dia: Dia): Leitura {
  if (dia.sono === 'bem') return { texto: 'Dormiu bem', tom: 'bom' };
  if (dia.sono === 'mais_ou_menos')
    return { texto: 'Dormiu mais ou menos', tom: 'atencao' };
  if (dia.sono === 'mal') return { texto: 'Dormiu mal', tom: 'atencao' };
  return SEM_RESPOSTA;
}

export function lerAlimentacao(dia: Dia): Leitura {
  if (dia.alimentacao === 'comeu_bem') return { texto: 'Comeu bem', tom: 'bom' };
  if (dia.alimentacao === 'comeu_pouco')
    return { texto: 'Comeu pouco', tom: 'atencao' };
  if (dia.alimentacao === 'nao_comeu')
    return { texto: 'Não comeu', tom: 'atencao' };
  return SEM_RESPOSTA;
}

export function lerRemedio(dia: Dia): Leitura {
  if (dia.remedio === 'tomou') return { texto: 'Tomou o remédio', tom: 'bom' };
  if (dia.remedio === 'nao_tomou') return { texto: 'Não tomou', tom: 'atencao' };
  if (dia.remedio === 'nao_confirmou')
    return { texto: 'Não confirmou', tom: 'atencao' };
  return SEM_RESPOSTA;
}

/** Dor de 4 pra cima pede atenção, abaixo disso fica neutra. Vermelho fica só pro urgente. */
export function tomDaDor(dor: number): Tom {
  if (dor <= 0) return 'bom';
  if (dor >= 4) return 'atencao';
  return 'neutro';
}

export function lerDor(dia: Dia): Leitura {
  if (typeof dia.dor !== 'number' || Number.isNaN(dia.dor)) return SEM_RESPOSTA;
  const dor = Math.max(0, Math.min(10, Math.round(dia.dor)));
  if (dor === 0) return { texto: 'Sem dor', tom: 'bom' };
  const onde = dia.ondeDoi?.trim();
  if (!onde) return { texto: `Dor ${dor}`, tom: tomDaDor(dor) };
  // "no joelho" entra direto na frase; "joelho" sozinho vai entre parênteses.
  const jaTemPreposicao = /^(no|na|nos|nas|em|do|da|dos|das)\s/i.test(onde);
  return {
    texto: jaTemPreposicao ? `Dor ${dor} ${onde}` : `Dor ${dor} (${onde})`,
    tom: tomDaDor(dor),
  };
}

export function lerHumor(dia: Dia): Leitura {
  switch (dia.humor) {
    case 'bem':
      return { texto: 'Bem', tom: 'bom' };
    case 'triste':
      return { texto: 'Triste', tom: 'atencao' };
    case 'ansioso':
      return { texto: 'Com ansiedade', tom: 'atencao' };
    case 'sozinho':
      return { texto: 'Se sentindo só', tom: 'atencao' };
    case 'irritado':
      return { texto: 'Com irritação', tom: 'atencao' };
    default:
      return SEM_RESPOSTA;
  }
}

export function lerSaiuDeCasa(dia: Dia): Leitura {
  if (dia.saiuDeCasa === true) return { texto: 'Saiu de casa', tom: 'bom' };
  if (dia.saiuDeCasa === false) return { texto: 'Ficou em casa', tom: 'neutro' };
  return SEM_RESPOSTA;
}

export function lerFalouComAlguem(dia: Dia): Leitura {
  if (dia.falouComAlguem === true)
    return { texto: 'Falou com alguém', tom: 'bom' };
  if (dia.falouComAlguem === false)
    return { texto: 'Não falou com ninguém', tom: 'atencao' };
  return SEM_RESPOSTA;
}

/** "ele" pra "seu Antônio", "ela" pra "dona Helena". */
export function pronomeDe(tratamento: string): 'ele' | 'ela' {
  return /^(seu|sr\.?|senhor)\s/i.test(tratamento.trim()) ? 'ele' : 'ela';
}

export function rotuloDoAlerta(tipo: TipoDeAlerta, tratamento: string): string {
  switch (tipo) {
    case 'emergencia':
      return 'Emergência';
    case 'golpe':
      return 'Possível golpe';
    case 'remedio':
      return 'Remédio';
    case 'saude':
      return 'Saúde';
    case 'humor':
      return `Como ${pronomeDe(tratamento)} está`;
    case 'ligacao':
      return 'Ligação';
  }
}

/** Ordem das gavetas no painel. Os compromissos com data vão à parte, no topo. */
export const ORDEM_DAS_CATEGORIAS: CategoriaDeLembranca[] = [
  'pessoa',
  'saude',
  'dificuldade',
  'rotina',
  'gosto',
  'historia',
  'humor',
  'compromisso',
];

export const NOME_DA_CATEGORIA: Record<CategoriaDeLembranca, string> = {
  pessoa: 'Pessoas',
  saude: 'Saúde',
  dificuldade: 'Dificuldades',
  rotina: 'Rotina',
  gosto: 'Gostos',
  historia: 'Histórias',
  humor: 'O que alegra e o que entristece',
  compromisso: 'Compromissos',
};

/** Gaveta conhecida, ou 'pessoa' pra ficha antiga que ainda chega com 'familia'. */
export function gavetaDe(categoria: string): CategoriaDeLembranca {
  return (ORDEM_DAS_CATEGORIAS as string[]).includes(categoria)
    ? (categoria as CategoriaDeLembranca)
    : 'pessoa';
}

/** "14h" ou "14h30" a partir de HH:MM. */
export function horaCurta(hora: string): string {
  const [h, m] = hora.split(':');
  if (!h) return hora;
  const horas = String(Number(h));
  return !m || m === '00' ? `${horas}h` : `${horas}h${m}`;
}

/** "quinta, 26/11, às 14h" a partir de AAAA-MM-DD e HH:MM. */
export function quandoDoCompromisso(data: string, hora?: string): string {
  const quando = partesDaData(data);
  if (!quando) return '';
  const dia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', weekday: 'long' })
    .format(quando)
    .replace('-feira', '');
  const base = `${dia}, ${diaEMes(data)}`;
  return hora ? `${base}, às ${horaCurta(hora)}` : base;
}

export function comMaiuscula(texto: string): string {
  const limpo = texto.trim();
  return limpo ? limpo.charAt(0).toLocaleUpperCase('pt-BR') + limpo.slice(1) : limpo;
}

const FORMATO_DA_HORA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const FORMATO_DA_DATA = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "09:12", sempre no horário de Brasília. */
export function horaDeBrasilia(iso: string): string {
  const quando = new Date(iso);
  return Number.isNaN(quando.getTime()) ? '' : FORMATO_DA_HORA.format(quando);
}

/** AAAA-MM-DD do instante, no horário de Brasília. */
export function dataDeBrasilia(iso: string): string {
  const quando = new Date(iso);
  return Number.isNaN(quando.getTime()) ? '' : FORMATO_DA_DATA.format(quando);
}

function partesDaData(data: string): Date | null {
  const [ano, mes, dia] = data.split('-').map(Number);
  if (!ano || !mes || !dia) return null;
  // Meio-dia em UTC: a data não muda de dia em nenhum fuso.
  return new Date(Date.UTC(ano, mes - 1, dia, 12));
}

/** "20/11" a partir de AAAA-MM-DD. */
export function diaEMes(data: string): string {
  const [, mes, dia] = data.split('-');
  return dia && mes ? `${dia}/${mes}` : data;
}

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export function diaDaSemanaCurto(data: string): string {
  const quando = partesDaData(data);
  return quando ? DIAS_CURTOS[quando.getUTCDay()] : '';
}

/** "sábado, 21 de novembro" a partir de AAAA-MM-DD. */
export function dataPorExtenso(data: string): string {
  const quando = partesDaData(data);
  if (!quando) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(quando);
}

/** "às 09:14" se foi hoje, "20/11 às 09:14" se foi em outro dia. */
export function quandoFoi(iso: string, hoje: string): string {
  const hora = horaDeBrasilia(iso);
  if (!hora) return '';
  const data = dataDeBrasilia(iso);
  return data === hoje ? `às ${hora}` : `${diaEMes(data)} às ${hora}`;
}

export function duracaoEmPalavras(minutos: number | null): string {
  if (minutos === null || Number.isNaN(minutos)) return '';
  const inteiro = Math.round(minutos);
  if (inteiro < 1) return 'menos de um minuto';
  return inteiro === 1 ? '1 minuto' : `${inteiro} minutos`;
}

/** true pra "09:00" e "19:30"; false pra hora que não existe. */
export function horarioValido(horario: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(horario);
}

/** A lista de horários como o servidor espera: válidos, sem repetir, em ordem. */
export function arrumarHorarios(horarios: readonly string[]): string[] {
  const validos = horarios.map((h) => h.trim()).filter(horarioValido);
  return [...new Set(validos)].sort();
}

/** O que aconteceu com a última ligação, em uma frase. Tocando não tem frase. */
export function resultadoDaLigacao(chamada: Chamada, hoje: string): Leitura | null {
  const hora = horaDeBrasilia(chamada.pedidaEm);
  if (!hora) return null;
  const data = dataDeBrasilia(chamada.pedidaEm);
  const foiHoje = data === hoje;
  const daLigacao = foiHoje ? `das ${hora}` : `de ${diaEMes(data)} às ${hora}`;

  if (chamada.estado === 'atendida') {
    return { texto: `Atendeu a ligação ${daLigacao}`, tom: 'bom' };
  }
  if (chamada.estado === 'perdida') {
    return { texto: `Não atendeu a ligação ${daLigacao}`, tom: 'atencao' };
  }
  if (chamada.estado === 'recusada') {
    const quando = foiHoje ? `às ${hora}` : `${diaEMes(data)} às ${hora}`;
    return { texto: `Disse que agora não, ${quando}`, tom: 'neutro' };
  }
  return null;
}
