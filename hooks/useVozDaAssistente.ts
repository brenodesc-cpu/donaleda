'use client';

import { useEffect, useState } from 'react';
import type { RTMClient } from 'agora-rtm';
import type { IAgoraRTCClient } from 'agora-rtc-react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  TranscriptHelperMode,
  type AgentState,
} from 'agora-agent-client-toolkit';
import type { ItemDoTranscript } from '@/lib/conversation';

interface Entrada {
  client: IAgoraRTCClient;
  rtmClient: RTMClient;
  canal: string;
  /** Só liga depois de entrar no canal e de passar o falso desmonte do StrictMode. */
  pronto: boolean;
}

/**
 * Liga o toolkit da Agora que entrega o texto da conversa e o estado da
 * assistente (ouvindo, pensando, falando). O toolkit é um só por página, então
 * ele é criado uma vez, quando `pronto` vira true, e desfeito na saída.
 */
export function useVozDaAssistente({ client, rtmClient, canal, pronto }: Entrada) {
  const [transcript, setTranscript] = useState<ItemDoTranscript[]>([]);
  const [estadoDoAgente, setEstadoDoAgente] = useState<AgentState | null>(null);

  useEffect(() => {
    if (!pronto) return;
    let cancelado = false;

    (async () => {
      try {
        const voz = await AgoraVoiceAI.init({
          rtcEngine: client,
          rtmEngine: rtmClient,
          renderMode: TranscriptHelperMode.TEXT,
          enableLog: false,
        });

        if (cancelado) {
          try {
            if (AgoraVoiceAI.getInstance() === voz) {
              voz.unsubscribe();
              voz.destroy();
            }
          } catch {}
          return;
        }

        voz.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (itens) => {
          setTranscript([...itens]);
        });
        voz.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_, evento) => {
          setEstadoDoAgente(evento.state);
        });
        voz.subscribeMessage(canal);
      } catch (erro) {
        if (!cancelado) console.error('[voz da assistente] não ligou:', erro);
      }
    })();

    return () => {
      cancelado = true;
      try {
        const voz = AgoraVoiceAI.getInstance();
        if (voz) {
          voz.unsubscribe();
          voz.destroy();
        }
      } catch {}
    };
    // O toolkit é criado uma vez por conversa: client, rtmClient e canal não mudam nela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  return { transcript, estadoDoAgente };
}
