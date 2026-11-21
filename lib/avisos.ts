// O que acontece com um aviso depois que ele chega: quem viu, quando, e o que a pessoa
// fez. Conta pura, usada pelo servidor (que grava) e pelo painel (que mostra).

import type { Alerta, RespostaDoAviso } from './tipos';

export const RESPOSTAS_DO_AVISO: RespostaDoAviso[] = ['liguei', 'fui_la', 'chamei_ajuda', 'depois'];

/** O botão, na voz de quem toca nele. */
export const BOTAO_DA_RESPOSTA: Record<RespostaDoAviso, string> = {
  liguei: 'Liguei, está tudo bem',
  fui_la: 'Fui até lá',
  chamei_ajuda: 'Chamei ajuda',
  depois: 'Vou ver mais tarde',
};

/** A linha do aviso, contando o que a pessoa fez. */
export const LINHA_DA_RESPOSTA: Record<RespostaDoAviso, string> = {
  liguei: 'ligou, está tudo bem',
  fui_la: 'foi até lá',
  chamei_ajuda: 'chamou ajuda',
  depois: 'vai ver mais tarde',
};

const LIMITE_DA_NOTA = 140;
const LIMITE_DO_NOME = 60;

export function respostaValida(valor: unknown): valor is RespostaDoAviso {
  return typeof valor === 'string' && (RESPOSTAS_DO_AVISO as string[]).includes(valor);
}

function limpar(texto: unknown, limite: number): string {
  return typeof texto === 'string' ? texto.trim().replace(/\s+/g, ' ').slice(0, limite) : '';
}

/**
 * O aviso continua pedindo atenção enquanto ninguém viu, ou enquanto quem viu não
 * contou o que fez (ou disse que vai ver mais tarde). Aviso visto antes de existir o
 * desfecho, sem a hora em que foi visto, conta como fechado.
 */
export function avisoAberto(alerta: Alerta): boolean {
  if (!alerta.visto) return true;
  if (!alerta.vistoEm) return false;
  return !alerta.desfecho || alerta.desfecho.resposta === 'depois';
}

/** "Já vi": guarda quem viu primeiro e a hora. Ver de novo não troca quem viu. */
export function marcarAvisoVisto(alerta: Alerta, nome: string, agora: Date = new Date()): void {
  if (alerta.visto && alerta.vistoEm) return;
  alerta.visto = true;
  alerta.vistoEm = agora.toISOString();
  alerta.vistoPor = limpar(nome, LIMITE_DO_NOME) || 'Alguém da família';
}

/** O que a pessoa fez. Sem "Já vi" antes, conta como visto agora, pela mesma pessoa. */
export function registrarDesfecho(
  alerta: Alerta,
  resposta: RespostaDoAviso,
  nota: unknown,
  nome: string,
  agora: Date = new Date(),
): void {
  if (!alerta.visto || !alerta.vistoEm) {
    alerta.visto = true;
    alerta.vistoEm = alerta.vistoEm ?? agora.toISOString();
    alerta.vistoPor = alerta.vistoPor ?? (limpar(nome, LIMITE_DO_NOME) || 'Alguém da família');
  }
  const texto = limpar(nota, LIMITE_DA_NOTA);
  alerta.desfecho = {
    resposta,
    ...(texto ? { nota: texto } : {}),
    por: limpar(nome, LIMITE_DO_NOME) || 'Alguém da família',
    em: agora.toISOString(),
  };
}

/** "4 min", "menos de 1 min", "1h20", "2 dias". */
export function tempoEntre(deIso: string, ateIso: string): string {
  const minutos = Math.max(0, Math.round((new Date(ateIso).getTime() - new Date(deIso).getTime()) / 60_000));
  if (minutos < 1) return 'menos de 1 min';
  if (minutos < 60) return `${minutos} min`;
  if (minutos < 24 * 60) {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`;
  }
  const dias = Math.floor(minutos / (24 * 60));
  return dias === 1 ? '1 dia' : `${dias} dias`;
}

function comMaiuscula(texto: string): string {
  return texto ? texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1) : texto;
}

/**
 * A linha que conta o que aconteceu com o aviso, ou null quando não há o que contar
 * (aviso antigo, visto antes do desfecho existir).
 * "Ninguém viu ainda, há 12 min." · "Marina viu em 4 min." · "Marina viu em 4 min. Ligou, está tudo bem."
 */
export function linhaDoAviso(alerta: Alerta, agoraIso: string): string | null {
  if (!alerta.visto) return `Ninguém viu ainda, há ${tempoEntre(alerta.criadoEm, agoraIso)}.`;
  if (!alerta.vistoEm) return null;
  const viu = `${alerta.vistoPor ?? 'Alguém da família'} viu em ${tempoEntre(alerta.criadoEm, alerta.vistoEm)}.`;
  const d = alerta.desfecho;
  if (!d) return viu;
  const quem = d.por && d.por !== alerta.vistoPor ? `${d.por} ` : '';
  const fez = quem ? `${quem}${LINHA_DA_RESPOSTA[d.resposta]}` : comMaiuscula(LINHA_DA_RESPOSTA[d.resposta]);
  return `${viu} ${fez}${d.nota ? `: ${d.nota.replace(/[.!]$/, '')}` : ''}.`;
}
