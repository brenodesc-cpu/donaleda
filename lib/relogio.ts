// O relógio do servidor. A cada 5 segundos ele faz as ligações andarem, mesmo
// com o aparelho do idoso desligado e o painel fechado. É isso que garante o
// aviso de "não atendeu" quando ninguém está olhando.

import { avancarChamadas } from './chamadas';
import { mudarBaseQuando } from './dados';

const global = globalThis as typeof globalThis & {
  __relogioDaLia?: ReturnType<typeof setInterval>;
};

export function ligarRelogio(): void {
  if (global.__relogioDaLia) return;
  global.__relogioDaLia = setInterval(() => {
    const agora = new Date();
    mudarBaseQuando((base) => ({
      gravar: avancarChamadas(base, agora).mudou,
      resultado: null,
    })).catch((erro) => console.error('[relógio] não consegui avançar as ligações:', erro));
  }, 5000);
  global.__relogioDaLia.unref?.();
}
