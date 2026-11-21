'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Conta os segundos que faltam até a ligação ser atendida sozinha.
 * Com `segundos` null não conta nada. `aoZerar` é chamado uma vez, no zero.
 */
export function useContagem(
  segundos: number | null,
  aoZerar: () => void,
): number | null {
  const [resta, setResta] = useState<number | null>(segundos);
  const aoZerarAtual = useRef(aoZerar);

  useEffect(() => {
    aoZerarAtual.current = aoZerar;
  }, [aoZerar]);

  useEffect(() => {
    if (segundos === null) {
      setResta(null);
      return;
    }
    const fim = Date.now() + segundos * 1000;
    setResta(Math.ceil(segundos));
    const relogio = window.setInterval(() => {
      const falta = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
      setResta(falta);
      if (falta === 0) {
        window.clearInterval(relogio);
        aoZerarAtual.current();
      }
    }, 250);
    return () => window.clearInterval(relogio);
  }, [segundos]);

  return resta;
}
