'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AgoraRTC, {
  RemoteAudioTrack,
  useClientEvent,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useRemoteUserTrack,
  useRTCClient,
} from 'agora-rtc-react';
import type { RTMClient } from 'agora-rtm';
import { SomDoRemoto } from '@/components/PalcoDaAssistente';
import { useFiltroDeRuido } from '@/hooks/useFiltroDeRuido';
import { useNivelDoAudio } from '@/hooks/useNivelDoAudio';
import { usePresencaDaAssistente } from '@/hooks/usePresencaDaAssistente';
import { useSomPreso } from '@/hooks/useSomPreso';
import { useVozDaAssistente } from '@/hooks/useVozDaAssistente';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { estadoDoRosto, extrairFalasDaSessao, legendaDaAssistente } from '@/lib/conversation';
import type { FalaDaSessao } from '@/lib/tipos';
import type { SalaDaDemonstracao } from '@/lib/tiposDaDemonstracao';
import { TelaDaLigacao, useRelogioDaDemonstracao } from './TelaDaLigacao';

type AgoraComParametros = typeof AgoraRTC & {
  setParameter?: (chave: string, valor: unknown) => void;
};

interface Props {
  sala: SalaDaDemonstracao;
  rtmClient: RTMClient;
  teto: number;
  /** A ligação acabou: as falas vão pra ficha do fim, só em memória. */
  onFim: (falas: FalaDaSessao[]) => void;
  /** A Dona Leda nem entrou na linha. */
  onFalha: () => void;
}

/**
 * A ligação da demonstração pelo motor da Agora, com as mesmas peças da ligação
 * do aparelho do idoso (components/Conversa.tsx). Fica de fora tudo que avisa o
 * servidor no meio da ligação: as falas não saem do aparelho até o fim.
 */
export default function LigacaoPelaAgora({ sala, rtmClient, teto, onFim, onFalha }: Props) {
  const client = useRTCClient();
  const usuariosRemotos = useRemoteUsers();
  const uidDaAssistente = String(DEFAULT_AGENT_UID);

  // Guarda do StrictMode, igual à de components/Conversa.tsx.
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const relogio = setTimeout(() => setPronto(true), 0);
    return () => {
      clearTimeout(relogio);
      setPronto(false);
    };
  }, []);

  const { isConnected: entrou } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: sala.channel,
      token: sala.token,
      uid: parseInt(sala.uid, 10),
    },
    pronto,
  );
  const { localMicrophoneTrack, error: erroDoMicrofone } = useLocalMicrophoneTrack(pronto);
  usePublish([localMicrophoneTrack]);
  useFiltroDeRuido(localMicrophoneTrack);

  useEffect(() => {
    try {
      (AgoraRTC as AgoraComParametros).setParameter?.('ENABLE_AUDIO_PTS', true);
    } catch {
      // A legenda só fica menos colada na voz.
    }
  }, [client]);

  const { transcript, estadoDoAgente } = useVozDaAssistente({
    client,
    rtmClient,
    canal: sala.channel,
    pronto: pronto && entrou,
  });

  const acabar = useCallback(() => {
    onFim(extrairFalasDaSessao(transcript, uidDaAssistente));
  }, [onFim, transcript, uidDaAssistente]);

  const alguemNaLinha = usuariosRemotos.length > 0;
  const donoDaVoz =
    usuariosRemotos.find((u) => String(u.uid) === uidDaAssistente && u.hasAudio) ??
    usuariosRemotos.find((u) => u.hasAudio);
  const { track: faixaDaVoz } = useRemoteUserTrack(donoDaVoz, 'audio');
  const nivel = useNivelDoAudio(faixaDaVoz);
  const outrosComSom = usuariosRemotos.filter((u) => u.hasAudio && u.uid !== donoDaVoz?.uid);
  const [somPreso, soltarSom] = useSomPreso();

  useEffect(() => {
    if (erroDoMicrofone) onFalha();
  }, [erroDoMicrofone, onFalha]);

  usePresencaDaAssistente(alguemNaLinha, acabar, onFalha);

  // O passe da sala vence logo depois do teto e não é renovado: cair da sala é o fim da ligação.
  useClientEvent(client, 'connection-state-change', (atual, _anterior, razao) => {
    if (atual === 'DISCONNECTED' && String(razao) !== 'LEAVE') acabar();
  });

  const restam = useRelogioDaDemonstracao(teto, alguemNaLinha, acabar);
  const estado = estadoDoRosto(estadoDoAgente, alguemNaLinha, nivel);
  const legenda = useMemo(() => legendaDaAssistente(transcript, uidDaAssistente), [transcript, uidDaAssistente]);

  return (
    <TelaDaLigacao
      estado={estado}
      nivel={nivel}
      legenda={legenda}
      restam={restam}
      somPreso={somPreso}
      onSoltarSom={soltarSom}
      onDesligar={acabar}
    >
      <RemoteAudioTrack track={faixaDaVoz} play />
      {outrosComSom.map((usuario) => (
        <SomDoRemoto key={usuario.uid} usuario={usuario} />
      ))}
    </TelaDaLigacao>
  );
}
