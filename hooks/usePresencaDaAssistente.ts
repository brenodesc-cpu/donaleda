'use client';

import { useEffect, useRef } from 'react';

/** Tempo que a tela espera a assistente entrar antes de avisar que não deu. */
const ESPERA_PELA_ASSISTENTE_MS = 15_000;
/** Folga entre a assistente sair e a tela dar a ligação por encerrada. */
const FOLGA_NA_SAIDA_MS = 1_500;

/**
 * Acompanha se a assistente está na ligação. Se ela não entra em 15 segundos,
 * avisa a falha. Se ela esteve e saiu, a ligação acabou e a tela volta a esperar.
 */
export function usePresencaDaAssistente(
  naLinha: boolean,
  aoAcabar: () => void,
  aoNaoEntrar: () => void,
): void {
  const jaEntrou = useRef(false);

  useEffect(() => {
    if (naLinha) {
      jaEntrou.current = true;
      return;
    }
    const relogio = jaEntrou.current
      ? setTimeout(aoAcabar, FOLGA_NA_SAIDA_MS)
      : setTimeout(aoNaoEntrar, ESPERA_PELA_ASSISTENTE_MS);
    return () => clearTimeout(relogio);
  }, [naLinha, aoAcabar, aoNaoEntrar]);
}
