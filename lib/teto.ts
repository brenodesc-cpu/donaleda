// Quando a ligação encerra sozinha. É uma conta pura, separada da tela, pra ter prova.
//
// Dois relógios:
// - Teto da ligação: 10 minutos desde que a assistente entrou. Passado o teto, a
//   ligação espera um respiro (ninguém falando por 2 segundos) pra não cortar a frase
//   de ninguém, e encerra de qualquer jeito 30 segundos depois.
// - Silêncio: 2 minutos sem o idoso falar. Zera quando chega fala nova dele na
//   legenda OU quando o microfone dele capta voz, porque a legenda vem por outro
//   canal e pode falhar sem o som falhar. Enquanto a assistente fala, o relógio pausa.

export const RESPIRO_MS = 2_000;
export const FOLGA_DO_TETO_MS = 30_000;
/** Quanto tempo antes do teto a assistente recebe o sinal pra encaminhar a despedida com calma. */
export const AVISO_DE_ENCERRAMENTO_MS = 90_000;
/** Volume do microfone (0 a 1) a partir do qual conta como o idoso falando. */
export const LIMIAR_DA_VOZ = 0.08;

export interface RelogiosDoTeto {
  /** Tempo desde que a assistente entrou na linha. */
  total: number;
  /** Tempo sem o idoso falar, sem contar quando a assistente está falando. */
  semFala: number;
  /** Tempo desde a última vez que alguém falou (o idoso ou a assistente). */
  desdeQueAlguemFalou: number;
  /** true depois que o sinal de encaminhar a despedida já foi disparado nesta ligação. */
  avisoEnviado?: boolean;
}

export interface LeituraDoTeto {
  /** Chegou fala nova do idoso na legenda desde a última leitura. */
  legendaMudou: boolean;
  /** Volume atual do microfone do idoso, de 0 a 1. */
  volumeDoIdoso: number;
  /** A assistente está falando agora. */
  assistenteFalando: boolean;
}

export interface LimitesDoTeto {
  tetoMs: number;
  /** 0 desliga o corte por silêncio. */
  semFalaMs: number;
}

export const RELOGIOS_ZERADOS: RelogiosDoTeto = {
  total: 0,
  semFala: 0,
  desdeQueAlguemFalou: 0,
  avisoEnviado: false,
};

/** Avança os relógios em `passoMs` e diz se é hora de encaminhar o fim ou encerrar a ligação. */
export function avancarTeto(
  relogios: RelogiosDoTeto,
  leitura: LeituraDoTeto,
  passoMs: number,
  limites: LimitesDoTeto,
): { relogios: RelogiosDoTeto; encerrar: 'teto' | 'sem_fala' | null; avisarFim: boolean } {
  const idosoFalando = leitura.legendaMudou || leitura.volumeDoIdoso >= LIMIAR_DA_VOZ;
  const alguemFalando = idosoFalando || leitura.assistenteFalando;

  const total = relogios.total + passoMs;
  const limiarDoAviso = limites.tetoMs - AVISO_DE_ENCERRAMENTO_MS;
  const avisarFim =
    !relogios.avisoEnviado &&
    limiarDoAviso > 0 &&
    total >= limiarDoAviso &&
    total < limites.tetoMs;

  const proximos: RelogiosDoTeto = {
    total,
    semFala: idosoFalando ? 0 : leitura.assistenteFalando ? relogios.semFala : relogios.semFala + passoMs,
    desdeQueAlguemFalou: alguemFalando ? 0 : relogios.desdeQueAlguemFalou + passoMs,
    avisoEnviado: Boolean(relogios.avisoEnviado || avisarFim),
  };

  if (proximos.total >= limites.tetoMs) {
    const respirou = proximos.desdeQueAlguemFalou >= RESPIRO_MS;
    const passouDaFolga = proximos.total >= limites.tetoMs + FOLGA_DO_TETO_MS;
    if (respirou || passouDaFolga) return { relogios: proximos, encerrar: 'teto', avisarFim: false };
  }
  if (limites.semFalaMs > 0 && proximos.semFala >= limites.semFalaMs) {
    return { relogios: proximos, encerrar: 'sem_fala', avisarFim: false };
  }
  return { relogios: proximos, encerrar: null, avisarFim };
}
