'use client';

import { useEffect, useRef } from 'react';
import {
  falasTerminadasDoIdoso,
  type ItemDoTranscript,
} from '@/lib/conversation';
import { avisarServidor } from '@/lib/avisarServidor';

/**
 * Cada fala que o idoso termina vai ao servidor uma vez. É lá que as regras de
 * segurança (queda, golpe) olham o que foi dito. A tela não mostra nada disso.
 */
export function useEnviarFalas(
  transcript: ItemDoTranscript[],
  conversaId: string,
  uidDaAssistente: string,
): void {
  const enviadas = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const fala of falasTerminadasDoIdoso(transcript, uidDaAssistente)) {
      if (enviadas.current.has(fala.id)) continue;
      enviadas.current.add(fala.id);
      void avisarServidor({ tipo: 'fala', conversaId, texto: fala.texto });
    }
  }, [transcript, conversaId, uidDaAssistente]);
}
