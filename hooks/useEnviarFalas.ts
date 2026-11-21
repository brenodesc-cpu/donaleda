'use client';

import { useEffect, useRef } from 'react';
import { falasNovasDoIdoso, type ItemDoTranscript } from '@/lib/conversation';
import { avisarServidor } from '@/lib/avisarServidor';

// Espera a frase parar de crescer por um instante antes de mandar, pra não mandar
// palavra por palavra. A regra de queda e de golpe roda no servidor, na frase inteira.
const ESPERA_MS = 600;

/**
 * Manda ao servidor cada fala do idoso, e manda de novo quando o mesmo turno cresce.
 * É lá que as regras de segurança (queda, golpe) olham o que foi dito.
 */
export function useEnviarFalas(
  transcript: ItemDoTranscript[],
  conversaId: string,
  uidDaAssistente: string,
): void {
  const enviadas = useRef<Map<string, string>>(new Map());
  const pendentes = useRef<Map<string, { texto: string; relogio: ReturnType<typeof setTimeout> }>>(new Map());

  useEffect(() => {
    for (const fala of falasNovasDoIdoso(transcript, uidDaAssistente, enviadas.current)) {
      const pendente = pendentes.current.get(fala.id);
      if (pendente?.texto === fala.texto) continue;
      if (pendente) clearTimeout(pendente.relogio);
      const relogio = setTimeout(() => {
        pendentes.current.delete(fala.id);
        enviadas.current.set(fala.id, fala.texto);
        void avisarServidor({ tipo: 'fala', conversaId, texto: fala.texto });
      }, ESPERA_MS);
      pendentes.current.set(fala.id, { texto: fala.texto, relogio });
    }
  }, [transcript, conversaId, uidDaAssistente]);

  // No fim da conversa, o que ainda estava esperando vai na hora.
  useEffect(() => {
    const aguardando = pendentes.current;
    const jaEnviadas = enviadas.current;
    return () => {
      for (const [id, { texto, relogio }] of aguardando) {
        clearTimeout(relogio);
        jaEnviadas.set(id, texto);
        void avisarServidor({ tipo: 'fala', conversaId, texto });
      }
      aguardando.clear();
    };
  }, [conversaId]);
}
