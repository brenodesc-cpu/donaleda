'use client';

// A sala da ligação do lado da família: entra na mesma sala da Agora em que o
// idoso está, com microfone e câmera, mostra o vídeo do idoso quando o aparelho
// manda e toca o som de todos (o idoso e a Dona Leda).

import {
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useRemoteUserTrack,
  type IAgoraRTCRemoteUser,
} from 'agora-rtc-react';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DEFAULT_AGENT_UID, ehDaFamilia } from '@/lib/agora';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { EntradaNaLigacao } from '@/lib/tipos';

function Som({ usuario }: { usuario: IAgoraRTCRemoteUser }) {
  const { track } = useRemoteUserTrack(usuario, 'audio');
  return <RemoteAudioTrack track={track} play />;
}

function VideoDoIdoso({ usuario, nome }: { usuario: IAgoraRTCRemoteUser; nome: string }) {
  const { track } = useRemoteUserTrack(usuario, 'video');
  return <RemoteVideoTrack track={track} play aria-label={`Vídeo de ${nome}`} className="absolute inset-0 h-full w-full" />;
}

interface Props {
  entrada: EntradaNaLigacao;
  tratamento: string;
  onSair: () => void;
}

export default function SalaDaFamilia({ entrada, tratamento, onSair }: Props) {
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const relogio = setTimeout(() => setPronto(true), 0);
    return () => {
      clearTimeout(relogio);
      setPronto(false);
    };
  }, []);

  const { isConnected } = useJoin(
    { appid: entrada.appId, channel: entrada.canal, token: entrada.token, uid: Number(entrada.uid) },
    pronto,
  );
  const [microfoneLigado, setMicrofoneLigado] = useState(true);
  const [cameraLigada, setCameraLigada] = useState(true);
  const { localMicrophoneTrack, error: erroDoMicrofone } = useLocalMicrophoneTrack(pronto);
  const { localCameraTrack, error: erroDaCamera } = useLocalCameraTrack(pronto);
  usePublish([localMicrophoneTrack, localCameraTrack]);
  useEffect(() => {
    void localMicrophoneTrack?.setEnabled(microfoneLigado);
  }, [localMicrophoneTrack, microfoneLigado]);
  useEffect(() => {
    void localCameraTrack?.setEnabled(cameraLigada);
  }, [localCameraTrack, cameraLigada]);

  const remotos = useRemoteUsers();
  const idoso = remotos.find((u) => String(u.uid) !== String(DEFAULT_AGENT_UID) && !ehDaFamilia(u.uid));
  const assistenteNaLinha = remotos.some((u) => String(u.uid) === String(DEFAULT_AGENT_UID));
  const comSom = remotos.filter((u) => u.hasAudio);

  return (
    <section aria-label={`Ligação com ${tratamento}`} className="flex w-full flex-1 flex-col items-center gap-4">
      <div className="relative flex min-h-80 w-full max-w-xl flex-1 items-center justify-center overflow-hidden rounded-3xl bg-foreground">
        {idoso?.hasVideo ? (
          <VideoDoIdoso usuario={idoso} nome={tratamento} />
        ) : (
          <p className="px-6 text-center text-2xl font-semibold text-background">
            {!isConnected
              ? 'Entrando na ligação...'
              : idoso
                ? `Você está falando com ${tratamento}`
                : `${tratamento[0].toUpperCase()}${tratamento.slice(1)} saiu da ligação.`}
          </p>
        )}
        {localCameraTrack && cameraLigada ? (
          <div className="absolute bottom-3 right-3 h-32 w-24 overflow-hidden rounded-xl border-2 border-background">
            <LocalVideoTrack track={localCameraTrack} play className="h-full w-full" />
          </div>
        ) : null}
      </div>

      <p role="status" className="text-center text-lg text-muted-foreground">
        {isConnected
          ? assistenteNaLinha
            ? `A ${NOME_DA_ASSISTENTE} está contando que você entrou e já sai da ligação.`
            : `Só você e ${tratamento} na ligação.`
          : 'Conectando...'}
      </p>

      <div className="flex w-full max-w-xl gap-3">
        <button
          type="button"
          onClick={() => setMicrofoneLigado((v) => !v)}
          aria-pressed={!microfoneLigado}
          className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-foreground bg-card px-4 text-lg font-medium"
        >
          {microfoneLigado ? <Mic aria-hidden="true" className="h-6 w-6" /> : <MicOff aria-hidden="true" className="h-6 w-6" />}
          {microfoneLigado ? 'Silenciar' : 'Voltar a falar'}
        </button>
        <button
          type="button"
          onClick={() => setCameraLigada((v) => !v)}
          aria-pressed={!cameraLigada}
          className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-foreground bg-card px-4 text-lg font-medium"
        >
          {cameraLigada ? <Video aria-hidden="true" className="h-6 w-6" /> : <VideoOff aria-hidden="true" className="h-6 w-6" />}
          {cameraLigada ? 'Desligar câmera' : 'Ligar câmera'}
        </button>
      </div>
      {erroDoMicrofone || erroDaCamera ? (
        <p className="text-center text-base text-destructive">
          {erroDoMicrofone ? 'O navegador não liberou o microfone. ' : ''}
          {erroDaCamera ? 'O navegador não liberou a câmera.' : ''}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSair}
        className="inline-flex min-h-14 w-full max-w-xl items-center justify-center gap-3 rounded-2xl bg-destructive px-6 text-xl font-semibold text-destructive-foreground"
      >
        <PhoneOff aria-hidden="true" className="h-6 w-6" />
        Sair da ligação
      </button>

      {comSom.map((u) => (
        <Som key={String(u.uid)} usuario={u} />
      ))}
    </section>
  );
}
