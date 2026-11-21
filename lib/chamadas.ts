// As ligações que a assistente faz pro aparelho do idoso. Ela liga nas horas
// marcadas e quando a família pede. Ligação que ninguém atende vira aviso pra
// família, porque o silêncio também é informação.
// Tudo aqui é função pura em cima da Base: quem chama decide quando gravar.

import { randomUUID } from 'node:crypto';
import { FUSO, NOME_DA_ASSISTENTE, dataEmBrasilia } from './assistente';
import { criarAlerta } from './dados';
import type { Base, Chamada, SituacaoDaChamada } from './tipos';

/** Quanto tempo a ligação fica tocando antes de contar como não atendida. */
export const TOCA_POR_MS = 45_000;
/** Depois da hora marcada, por quantos minutos a assistente ainda tenta ligar. */
const JANELA_DO_HORARIO_MIN = 20;
/** Espera entre a primeira e a segunda tentativa da mesma hora marcada. */
const ESPERA_ENTRE_TENTATIVAS_MS = 3 * 60_000;
const TENTATIVAS_POR_HORARIO = 2;
/** Conversa começada até uma hora antes da hora marcada já vale por ela. */
const CONVERSA_VALE_POR_MIN = 60;
export const SEGUNDOS_PRA_ATENDER_SOZINHO = 10;
const DUAS_HORAS = 2 * 60 * 60 * 1000;

export function horaValida(hora: unknown): hora is string {
  return typeof hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);
}

/** "HH:MM" no horário de Brasília. */
export function horaMinutoEmBrasilia(quando: Date): string {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: FUSO,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(quando);
  const hora = partes.find((p) => p.type === 'hour')?.value ?? '00';
  const minuto = partes.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hora === '24' ? '00' : hora}:${minuto}`;
}

function emMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Arruma a lista de horas: só as válidas, sem repetir, em ordem, no máximo seis. */
export function arrumarHorarios(horarios: unknown): string[] {
  if (!Array.isArray(horarios)) return [];
  return [...new Set(horarios.filter(horaValida))].sort().slice(0, 6);
}

export function emConversa(base: Base, agora: Date): boolean {
  const ultima = base.conversas[base.conversas.length - 1];
  if (!ultima || ultima.fim) return false;
  return agora.getTime() - new Date(ultima.inicio).getTime() < DUAS_HORAS;
}

export function chamadaTocando(base: Base): Chamada | null {
  return base.chamadas.find((c) => c.estado === 'tocando') ?? null;
}

function novaChamada(
  base: Base,
  dados: Pick<Chamada, 'motivo' | 'horario' | 'tentativa'>,
  agora: Date,
): Chamada {
  const chamada: Chamada = {
    id: randomUUID(),
    estado: 'tocando',
    pedidaEm: agora.toISOString(),
    ...dados,
  };
  base.chamadas.push(chamada);
  if (base.chamadas.length > 60) base.chamadas.splice(0, base.chamadas.length - 60);
  return chamada;
}

/** Marca a ligação como não atendida e, na última tentativa, avisa a família. */
function darPorPerdida(base: Base, chamada: Chamada, agora: Date): void {
  chamada.estado = 'perdida';
  chamada.resolvidaEm = agora.toISOString();
  const ultimaTentativa =
    chamada.motivo === 'familia' || chamada.tentativa >= TENTATIVAS_POR_HORARIO;
  if (ultimaTentativa) {
    const texto =
      chamada.motivo === 'familia'
        ? `Não atendeu a ligação que a família pediu às ${horaMinutoEmBrasilia(new Date(chamada.pedidaEm))}.`
        : `Não atendeu a ligação das ${chamada.horario}, em ${chamada.tentativa} tentativas.`;
    criarAlerta(base, { tipo: 'ligacao', gravidade: 'atencao', texto, origem: 'regra' }, agora);
  }
}

/**
 * Ligação que atendeu (sozinha ou com um toque) e acabou sem o idoso dizer nada vale
 * como não atendida: a segunda tentativa acontece e, na última, a família é avisada.
 */
export function ligacaoSemFala(base: Base, conversaId: string, agora: Date = new Date()): boolean {
  const conversa = base.conversas.find((c) => c.id === conversaId);
  if (!conversa || conversa.falasDoIdoso > 0 || !conversa.chamadaId) return false;
  const chamada = base.chamadas.find((c) => c.id === conversa.chamadaId);
  if (!chamada || chamada.estado !== 'atendida') return false;
  darPorPerdida(base, chamada, agora);
  return true;
}

/**
 * Faz o relógio das ligações andar: dá por perdida a ligação que tocou demais e
 * começa a ligação da hora marcada. Devolve se algo mudou, pra só então gravar.
 */
export function avancarChamadas(base: Base, agora: Date = new Date()): { mudou: boolean } {
  let mudou = false;

  for (const chamada of base.chamadas) {
    if (chamada.estado !== 'tocando') continue;
    if (agora.getTime() - new Date(chamada.pedidaEm).getTime() <= TOCA_POR_MS) continue;
    darPorPerdida(base, chamada, agora);
    mudou = true;
  }

  if (chamadaTocando(base) || emConversa(base, agora)) return { mudou };

  const hoje = dataEmBrasilia(agora);
  const minutosAgora = emMinutos(horaMinutoEmBrasilia(agora));
  // Conversa em que o idoso não falou nada não segura a ligação da hora marcada.
  const conversasDeHoje = base.conversas
    .filter((c) => dataEmBrasilia(new Date(c.inicio)) === hoje && (c.falasDoIdoso > 0 || !c.fim))
    .map((c) => emMinutos(horaMinutoEmBrasilia(new Date(c.inicio))));

  for (const horario of arrumarHorarios(base.idoso.horariosDeLigacao)) {
    const minutosDoHorario = emMinutos(horario);
    const dentroDaJanela =
      minutosAgora >= minutosDoHorario &&
      minutosAgora < minutosDoHorario + JANELA_DO_HORARIO_MIN;
    if (!dentroDaJanela) continue;

    // Se o idoso já conversou perto dessa hora, a ligação marcada não precisa tocar.
    if (conversasDeHoje.some((m) => m >= minutosDoHorario - CONVERSA_VALE_POR_MIN)) continue;

    const doHorario = base.chamadas.filter(
      (c) =>
        c.motivo === 'horario' &&
        c.horario === horario &&
        dataEmBrasilia(new Date(c.pedidaEm)) === hoje,
    );
    const ultima = doHorario[doHorario.length - 1];

    if (!ultima) {
      novaChamada(base, { motivo: 'horario', horario, tentativa: 1 }, agora);
      return { mudou: true };
    }

    // Ligação em que a Dona Leda não conseguiu entrar também ganha a segunda tentativa.
    const podeTentarDeNovo =
      (ultima.estado === 'perdida' || ultima.estado === 'falhou') &&
      doHorario.length < TENTATIVAS_POR_HORARIO &&
      agora.getTime() - new Date(ultima.resolvidaEm ?? ultima.pedidaEm).getTime() >=
        ESPERA_ENTRE_TENTATIVAS_MS;
    if (podeTentarDeNovo) {
      novaChamada(base, { motivo: 'horario', horario, tentativa: doHorario.length + 1 }, agora);
      return { mudou: true };
    }
  }

  return { mudou };
}

/** A família pede uma ligação agora. Devolve null se já está tocando ou em conversa. */
export function pedirChamadaDaFamilia(base: Base, agora: Date = new Date()): Chamada | null {
  avancarChamadas(base, agora);
  if (chamadaTocando(base) || emConversa(base, agora)) return null;
  return novaChamada(base, { motivo: 'familia', tentativa: 1 }, agora);
}

/** O aparelho do idoso conta que atendeu ou que tocou em "Agora não". */
export function responderChamada(
  base: Base,
  chamadaId: string,
  acao: 'atender' | 'recusar',
  agora: Date = new Date(),
): Chamada | null {
  const chamada = base.chamadas.find((c) => c.id === chamadaId);
  if (!chamada) return null;
  if (chamada.estado !== 'tocando') return chamada;

  chamada.resolvidaEm = agora.toISOString();
  if (acao === 'atender') {
    chamada.estado = 'atendida';
    return chamada;
  }

  chamada.estado = 'recusada';
  const hora = chamada.horario ?? horaMinutoEmBrasilia(new Date(chamada.pedidaEm));
  criarAlerta(
    base,
    {
      tipo: 'ligacao',
      gravidade: 'atencao',
      texto: `Tocou em "Agora não" na ligação das ${hora}.`,
      origem: 'regra',
    },
    agora,
  );
  return chamada;
}

function proximaLigacao(base: Base, agora: Date): string | null {
  const horarios = arrumarHorarios(base.idoso.horariosDeLigacao);
  if (horarios.length === 0) return null;
  const agoraEmMinutos = emMinutos(horaMinutoEmBrasilia(agora));
  return horarios.find((h) => emMinutos(h) > agoraEmMinutos) ?? horarios[0];
}

export function situacaoDaChamada(base: Base, agora: Date = new Date()): SituacaoDaChamada {
  return {
    assistente: NOME_DA_ASSISTENTE,
    tratamento: base.idoso.tratamento,
    chamada: chamadaTocando(base),
    atenderSozinhoEm: base.idoso.atenderSozinho ? SEGUNDOS_PRA_ATENDER_SOZINHO : null,
    proximaLigacao: proximaLigacao(base, agora),
    horariosDeLigacao: arrumarHorarios(base.idoso.horariosDeLigacao),
  };
}

/**
 * A Agora recusou a assistente (cota, chave, fora do ar) depois de o aparelho atender.
 * A ligação deixa de contar como atendida e a família recebe um aviso, pra não achar
 * que houve conversa. Sem ligação (o idoso chamou), o aviso diz que ele chamou.
 */
export function assistenteNaoEntrou(base: Base, chamadaId: string | undefined, agora: Date = new Date()): void {
  const chamada = chamadaId ? base.chamadas.find((c) => c.id === chamadaId) : undefined;
  if (chamada && chamada.estado === 'atendida') {
    chamada.estado = 'falhou';
    chamada.resolvidaEm = agora.toISOString();
  }
  const hora = chamada?.horario ?? horaMinutoEmBrasilia(agora);
  const { tratamento } = base.idoso;
  const texto = chamada
    ? `A ${NOME_DA_ASSISTENTE} não conseguiu entrar na ligação das ${hora}. Ligue pra ${tratamento} pra saber como está.`
    : `${tratamento[0].toUpperCase()}${tratamento.slice(1)} chamou às ${hora}, mas a ${NOME_DA_ASSISTENTE} não conseguiu entrar na ligação.`;
  criarAlerta(base, { tipo: 'ligacao', gravidade: 'atencao', texto, origem: 'regra' }, agora);
}
