'use client';

import { useCallback, useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-react';
import { destravarSom } from './somDoAparelho';

/**
 * Quando a ligação é atendida sozinha, sem toque de dedo, o navegador pode
 * segurar o som da assistente. A Agora avisa, e a tela mostra um botão pra
 * pessoa tocar. Depois do toque o som volta sozinho.
 */
export function useSomPreso(): [preso: boolean, soltar: () => void] {
  const [preso, setPreso] = useState(false);

  useEffect(() => {
    const anterior = AgoraRTC.onAutoplayFailed;
    AgoraRTC.onAutoplayFailed = () => setPreso(true);
    return () => {
      AgoraRTC.onAutoplayFailed = anterior;
    };
  }, []);

  const soltar = useCallback(() => {
    void destravarSom();
    setPreso(false);
  }, []);

  return [preso, soltar];
}
