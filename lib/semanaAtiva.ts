// O número do sonho: em quantos dias da semana o idoso saiu de casa e
// conversou com alguém. Conta pura em cima dos dias que o painel já recebe.

import type { Dia } from './tipos';

export interface SemanaAtiva {
  /** Quantos dias entraram na conta (normalmente 7). */
  dias: number;
  /** Dias em que disse que saiu de casa. */
  saiu: number;
  /** Dias em que disse que conversou com alguém. */
  conversou: number;
  /** Dias sem resposta nem sobre sair nem sobre conversar. */
  semResposta: number;
}

export function contarSemana(semana: Dia[]): SemanaAtiva {
  let saiu = 0;
  let conversou = 0;
  let semResposta = 0;
  for (const dia of semana) {
    if (dia.saiuDeCasa === true) saiu += 1;
    if (dia.falouComAlguem === true) conversou += 1;
    if (typeof dia.saiuDeCasa !== 'boolean' && typeof dia.falouComAlguem !== 'boolean') {
      semResposta += 1;
    }
  }
  return { dias: semana.length, saiu, conversou, semResposta };
}

/** A frase do resumo, em palavras. Vazia quando ainda não há nenhuma resposta. */
export function fraseDaSemana(conta: SemanaAtiva): string {
  if (conta.dias === 0 || conta.semResposta === conta.dias) return '';
  const periodo = conta.dias === 1 ? 'No último dia' : `Nos últimos ${conta.dias} dias`;
  const base = `${periodo}, saiu de casa em ${conta.saiu} e conversou com alguém em ${conta.conversou}.`;
  if (conta.semResposta === 0) return base;
  return `${base} ${conta.semResposta === 1 ? 'Em 1 dia não houve resposta.' : `Em ${conta.semResposta} dias não houve resposta.`}`;
}
