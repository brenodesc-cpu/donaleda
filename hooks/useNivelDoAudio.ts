'use client';

import { useEffect, useState } from 'react';
import type { IRemoteAudioTrack } from 'agora-rtc-react';

const INTERVALO_MS = 80;

/**
 * Volume da voz da assistente, de 0 a 1, lido várias vezes por segundo.
 * A queda é amortecida pra boca do rosto não tremer entre uma sílaba e outra.
 */
export function useNivelDoAudio(faixa: IRemoteAudioTrack | undefined): number {
  const [nivel, setNivel] = useState(0);

  useEffect(() => {
    if (!faixa) {
      setNivel(0);
      return;
    }
    let anterior = 0;
    const relogio = window.setInterval(() => {
      let lido = 0;
      try {
        lido = faixa.getVolumeLevel();
      } catch {
        lido = 0;
      }
      const suave = Math.max(lido, anterior * 0.6);
      const novo = suave < 0.02 ? 0 : suave;
      if (Math.abs(novo - anterior) > 0.02 || (novo === 0 && anterior !== 0)) {
        anterior = novo;
        setNivel(novo);
      }
    }, INTERVALO_MS);
    return () => window.clearInterval(relogio);
  }, [faixa]);

  return nivel;
}
