'use client';

import { useEffect } from 'react';
import { bipe, contextoDeSom } from './somDoAparelho';

/** De quanto em quanto tempo o toque se repete. */
const CICLO_MS = 2200;

function vibrar(padrao: number | number[]) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(padrao);
  } catch {}
}

/**
 * O toque de chamada: dois bipes suaves que se repetem, mais a vibração onde o
 * aparelho tiver. Para na hora em que `tocando` vira false ou a tela sai.
 * Sem um toque de dedo anterior na página, o navegador deixa a chamada muda,
 * e aí só a tela avisa.
 */
export function useToque(tocando: boolean): void {
  useEffect(() => {
    if (!tocando) return;
    const som = contextoDeSom();
    void som?.resume().catch(() => undefined);
    let cortar: Array<() => void> = [];

    const tocar = () => {
      vibrar([350, 150, 350]);
      if (!som || som.state !== 'running') return;
      cortar = [bipe(som, 784, 0), bipe(som, 988, 0.38)];
    };

    tocar();
    const relogio = window.setInterval(tocar, CICLO_MS);
    return () => {
      window.clearInterval(relogio);
      cortar.forEach((parar) => parar());
      vibrar(0);
    };
  }, [tocando]);
}
