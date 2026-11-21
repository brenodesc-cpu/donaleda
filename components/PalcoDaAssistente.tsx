'use client';

import {
  RemoteAudioTrack,
  RemoteVideoTrack,
  useRemoteUserTrack,
  type IAgoraRTCRemoteUser,
} from 'agora-rtc-react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { EstadoDoRosto } from '@/lib/conversation';
import { cn } from '@/lib/utils';
import { Rosto } from './Rosto';

/** O vídeo do avatar, quando a assistente entra na ligação com imagem. */
function VideoDaAssistente({ usuario }: { usuario: IAgoraRTCRemoteUser }) {
  const { track } = useRemoteUserTrack(usuario, 'video');
  return (
    <RemoteVideoTrack
      track={track}
      play
      aria-label={`Vídeo da ${NOME_DA_ASSISTENTE}`}
      className="absolute inset-0 h-full w-full"
    />
  );
}

/** Toca o som de um participante da ligação. Não aparece na tela. */
export function SomDoRemoto({ usuario }: { usuario: IAgoraRTCRemoteUser }) {
  const { track } = useRemoteUserTrack(usuario, 'audio');
  return <RemoteAudioTrack track={track} play />;
}

interface PalcoDaAssistenteProps {
  /** Quem está mandando vídeo na ligação (o avatar), se houver. */
  comVideo: IAgoraRTCRemoteUser | undefined;
  estado: EstadoDoRosto;
  nivel: number;
}

/**
 * O "vídeo" da assistente, que ocupa a tela como numa chamada de vídeo: o
 * avatar quando ele existe, ou o rosto desenhado.
 */
export function PalcoDaAssistente({
  comVideo,
  estado,
  nivel,
}: PalcoDaAssistenteProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-64 w-full max-w-md flex-1 items-center justify-center overflow-hidden rounded-3xl',
        comVideo ? 'bg-foreground' : 'bg-muted',
      )}
    >
      {comVideo ? (
        <VideoDaAssistente usuario={comVideo} />
      ) : (
        <Rosto estado={estado} nivel={nivel} className="sm:h-80 sm:w-80" />
      )}
      <p className="absolute left-3 top-3 rounded-full bg-card/90 px-4 py-1.5 font-titulo text-lg font-semibold shadow-sm">
        {NOME_DA_ASSISTENTE}, assistente virtual
      </p>
    </div>
  );
}
