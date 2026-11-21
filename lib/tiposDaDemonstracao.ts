// O que a página /experimente troca com o servidor. Sem nada do servidor aqui
// dentro, pra tela poder importar.

import type { InicioDireto, PainelDaFamilia } from './tipos';

/** Por que a demonstração não liga agora. 'fora' é quando nem a Agora nem o modo direto atenderam. */
export type MotivoDaRecusa = 'desligada' | 'cheia' | 'visitante' | 'rede' | 'fora';

export interface SalaDaDemonstracao {
  token: string;
  uid: string;
  channel: string;
}

/** O que a página recebe ao pedir a ligação. */
export type RespostaDaDemonstracao =
  | {
      ok: true;
      modo: 'agora';
      teto: number;
      passe: string;
      sala: SalaDaDemonstracao;
    }
  | {
      ok: true;
      modo: 'direto';
      teto: number;
      passe: string;
      direto: InicioDireto;
      /** true quando a página pediu o motor da Agora e ele recusou. */
      reserva: boolean;
    }
  | { ok: false; motivo: MotivoDaRecusa; video: string | null };

/** GET /api/experimente. */
export interface SituacaoDaDemonstracao {
  aberta: boolean;
  motivo: MotivoDaRecusa | null;
  video: string | null;
}

/** POST /api/experimente/fim devolve o que a família veria. */
export type FichaDaDemonstracao = { ok: true; painel: PainelDaFamilia } | { ok: false };
