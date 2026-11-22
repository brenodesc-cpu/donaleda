'use client';

import { useEffect, useRef } from 'react';

/** Tempo que a tela espera a assistente entrar antes de avisar que não deu. */
const ESPERA_PELA_ASSISTENTE_MS = 15_000;
/** Folga entre a assistente sair e a tela dar a ligação por encerrada. */
const FOLGA_NA_SAIDA_MS = 1_500;
/** Folga maior quando há convite aberto ou família entrando na sala (transição Dona Leda → família). */
const FOLGA_COM_FAMILIA_MS = 30_000;

/**
 * Acompanha se há alguém (assistente ou família) na ligação. Se ninguém entra em 15 s,
 * avisa a falha. Se esteve e saiu, a ligação acabou — exceto durante a transição pra família
 * entrar, quando segura a sala por até 30 s pra não derrubar o idoso antes do familiar conectar.
 */
export function usePresencaDaAssistente(
  naLinha: boolean,
  aoAcabar: () => void,
  aoNaoEntrar: () => void,
  esperandoFamilia = false,
  familiaNaLinha = false,
): void {
  const jaEntrou = useRef(false);
  const familiaJaEntrou = useRef(false);

  useEffect(() => {
    if (familiaNaLinha) familiaJaEntrou.current = true;
    if (naLinha) {
      jaEntrou.current = true;
      return;
    }
    const folga =
      esperandoFamilia && !familiaJaEntrou.current ? FOLGA_COM_FAMILIA_MS : FOLGA_NA_SAIDA_MS;
    const relogio = jaEntrou.current
      ? setTimeout(aoAcabar, folga)
      : setTimeout(aoNaoEntrar, ESPERA_PELA_ASSISTENTE_MS);
    return () => clearTimeout(relogio);
  }, [naLinha, aoAcabar, aoNaoEntrar, esperandoFamilia, familiaNaLinha]);
}
