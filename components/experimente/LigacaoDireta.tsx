'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGeminiDireto } from '@/hooks/useGeminiDireto';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { extrairFalasDaSessao, legendaDaAssistente, type EstadoDoRosto } from '@/lib/conversation';
import type { FalaDaSessao, InicioDireto } from '@/lib/tipos';
import { TelaDaLigacao, useRelogioDaDemonstracao } from './TelaDaLigacao';

/** O microfone aberto uma vez, como em components/ConversaDireta.tsx. */
function useMicrofone(pronto: boolean): { faixa: MediaStreamTrack | null; falhou: boolean } {
  const [faixa, setFaixa] = useState<MediaStreamTrack | null>(null);
  const [falhou, setFalhou] = useState(false);
  useEffect(() => {
    if (!pronto) return;
    let saiu = false;
    let aberta: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      .then((som) => {
        if (saiu) {
          som.getTracks().forEach((f) => f.stop());
          return;
        }
        aberta = som;
        setFaixa(som.getAudioTracks()[0] ?? null);
      })
      .catch(() => {
        if (!saiu) setFalhou(true);
      });
    return () => {
      saiu = true;
      aberta?.getTracks().forEach((f) => f.stop());
      setFaixa(null);
    };
  }, [pronto]);
  return { faixa, falhou };
}

interface Props {
  direto: InicioDireto;
  teto: number;
  onFim: (falas: FalaDaSessao[]) => void;
  onFalha: () => void;
}

/**
 * A ligação da demonstração no modo direto: o aparelho do visitante conversa com
 * o Gemini sem o motor da Agora. Não entra em sala nenhuma, as ações vão pra uma
 * rota que não anota nada e a conta de tokens não é mandada.
 */
export default function LigacaoDireta({ direto, teto, onFim, onFalha }: Props) {
  const uidDaAssistente = String(DEFAULT_AGENT_UID);
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    const relogio = setTimeout(() => setPronto(true), 0);
    return () => {
      clearTimeout(relogio);
      setPronto(false);
    };
  }, []);

  const microfone = useMicrofone(pronto);
  useEffect(() => {
    if (microfone.falhou) onFalha();
  }, [microfone.falhou, onFalha]);

  // As falas mais novas, pra quando a conversa cair sozinha.
  const [ultimas, setUltimas] = useState<FalaDaSessao[]>([]);
  const aoCair = useCallback(
    (jaConversou: boolean) => {
      if (jaConversou) onFim(ultimas);
      else onFalha();
    },
    [onFim, onFalha, ultimas],
  );

  const { transcript, naLinha, falando, agindo, nivel, somPreso, soltarSom } = useGeminiDireto({
    direto,
    conversaId: 'demonstracao',
    uidDaAssistente,
    microfone: microfone.faixa,
    pronto,
    aoCair,
    rotaDasAcoes: '/api/experimente/acao',
    rotaDaConta: null,
  });

  useEffect(() => {
    setUltimas(extrairFalasDaSessao(transcript, uidDaAssistente));
  }, [transcript, uidDaAssistente]);

  const acabar = useCallback(() => {
    onFim(extrairFalasDaSessao(transcript, uidDaAssistente));
  }, [onFim, transcript, uidDaAssistente]);

  const restam = useRelogioDaDemonstracao(teto, naLinha, acabar);
  const estado: EstadoDoRosto = !naLinha ? 'ligando' : falando ? 'falando' : agindo ? 'pensando' : 'ouvindo';
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
    />
  );
}
