'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AgoraRTC, {
  RemoteUser,
  useClientEvent,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  useRTCClient,
} from 'agora-rtc-react';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import {
  estadoDoRosto,
  legendaDaAssistente,
  TEXTO_DO_ESTADO,
} from '@/lib/conversation';
import { useEnviarFalas } from '@/hooks/useEnviarFalas';
import { useNivelDoAudio } from '@/hooks/useNivelDoAudio';
import { useVozDaAssistente } from '@/hooks/useVozDaAssistente';
import type { PropsDaConversa } from '@/types/conversation';
import { BotaoGrande } from './BotaoGrande';
import { Rosto } from './Rosto';

/** Tempo que a tela espera a assistente entrar (ou voltar) antes de avisar que não deu. */
const ESPERA_PELA_ASSISTENTE_MS = 15_000;

type AgoraComParametros = typeof AgoraRTC & {
  setParameter?: (chave: string, valor: unknown) => void;
};

export default function Conversa({
  dados,
  rtmClient,
  onRenovarTokens,
  onEncerrar,
  onFalha,
}: PropsDaConversa) {
  const client = useRTCClient();
  const usuariosRemotos = useRemoteUsers();
  const uidDaAssistente = String(DEFAULT_AGENT_UID);

  // Guarda do StrictMode: no modo de desenvolvimento o React monta, desmonta e
  // monta de novo. O timer de 0 ms da primeira montagem é cancelado antes de
  // disparar, então entrar no canal e abrir o microfone acontecem uma vez só.
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
      channel: dados.channel,
      token: dados.token,
      uid: parseInt(dados.uid, 10),
    },
    pronto,
  );

  // O microfone nasce depois de `pronto` pelo mesmo motivo do canal: duas
  // faixas no StrictMode deixariam uns 3 segundos de silêncio no começo.
  const { localMicrophoneTrack, error: erroDoMicrofone } =
    useLocalMicrophoneTrack(pronto);
  usePublish([localMicrophoneTrack]);

  // Marca o tempo do áudio pra legenda acompanhar a fala. É um parâmetro do
  // módulo da Agora e precisa valer antes de o microfone ser publicado.
  useEffect(() => {
    try {
      (AgoraRTC as AgoraComParametros).setParameter?.('ENABLE_AUDIO_PTS', true);
    } catch (erro) {
      console.warn('Não deu pra ligar ENABLE_AUDIO_PTS:', erro);
    }
  }, [client]);

  const { transcript, estadoDoAgente } = useVozDaAssistente({
    client,
    rtmClient,
    canal: dados.channel,
    pronto: pronto && entrou,
  });
  useEnviarFalas(transcript, dados.conversaId, uidDaAssistente);

  const assistente = usuariosRemotos.find(
    (usuario) => String(usuario.uid) === uidDaAssistente,
  );
  const assistenteNaLinha = Boolean(assistente);
  const nivel = useNivelDoAudio(assistente?.audioTrack);

  useEffect(() => {
    if (erroDoMicrofone) onFalha('microfone');
  }, [erroDoMicrofone, onFalha]);

  // Assistente que não entra, ou que sai no meio, vira aviso simples com "Tentar de novo".
  useEffect(() => {
    if (assistenteNaLinha) return;
    const relogio = setTimeout(() => onFalha('conexao'), ESPERA_PELA_ASSISTENTE_MS);
    return () => clearTimeout(relogio);
  }, [assistenteNaLinha, onFalha]);

  useClientEvent(client, 'connection-state-change', (atual, _anterior, razao) => {
    if (atual === 'DISCONNECTED' && String(razao) !== 'LEAVE') onFalha('conexao');
  });

  const renovarTokens = useCallback(async () => {
    const uid = client.uid;
    if (uid === null || uid === undefined) return;
    try {
      const { rtcToken, rtmToken } = await onRenovarTokens(String(uid));
      await client.renewToken(rtcToken);
      await rtmClient.renewToken(rtmToken);
    } catch (erro) {
      console.error('Não consegui renovar o token da Agora:', erro);
    }
  }, [client, onRenovarTokens, rtmClient]);
  useClientEvent(client, 'token-privilege-will-expire', renovarTokens);

  const estado = estadoDoRosto(estadoDoAgente, assistenteNaLinha, nivel);
  const legenda = useMemo(
    () => legendaDaAssistente(transcript, uidDaAssistente),
    [transcript, uidDaAssistente],
  );

  return (
    <section
      aria-label="Conversa com a assistente"
      className="flex w-full flex-1 flex-col items-center justify-between gap-6"
    >
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
        <Rosto estado={estado} nivel={nivel} />
        <p role="status" className="text-xl font-medium text-muted-foreground">
          {TEXTO_DO_ESTADO[estado]}
        </p>
        <p
          aria-live="polite"
          className="min-h-32 w-full max-w-2xl text-balance text-center text-2xl font-medium leading-snug sm:text-3xl"
        >
          {legenda}
        </p>
      </div>

      <BotaoGrande tom="encerrar" onClick={onEncerrar}>
        Encerrar conversa
      </BotaoGrande>

      {/* O som da assistente toca por aqui; nada disso aparece na tela. */}
      {usuariosRemotos.map((usuario) => (
        <div key={usuario.uid} className="hidden">
          <RemoteUser user={usuario} />
        </div>
      ))}
    </section>
  );
}
