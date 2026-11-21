'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { PhoneOff } from 'lucide-react';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { fetchDoAparelho } from '@/lib/aparelho';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import {
  estadoDoRosto,
  extrairFalasDaSessao,
  legendaDaAssistente,
  TEXTO_DO_ESTADO,
} from '@/lib/conversation';
import { avisarServidor } from '@/lib/avisarServidor';
import { linhaDaMedicao, medidorLigado, resumirMedicao } from '@/lib/medicao';
import { useEnviarFalas } from '@/hooks/useEnviarFalas';
import { useFiltroDeRuido } from '@/hooks/useFiltroDeRuido';
import { useNivelDoAudio } from '@/hooks/useNivelDoAudio';
import { usePresencaDaAssistente } from '@/hooks/usePresencaDaAssistente';
import { useSomPreso } from '@/hooks/useSomPreso';
import { useTetoDaLigacao } from '@/hooks/useTetoDaLigacao';
import { useVozDaAssistente } from '@/hooks/useVozDaAssistente';
import type { PropsDaConversa } from '@/types/conversation';
import { BotaoGrande } from './BotaoGrande';
import { PalcoDaAssistente, SomDoRemoto } from './PalcoDaAssistente';

type AgoraComParametros = typeof AgoraRTC & {
  setParameter?: (chave: string, valor: unknown) => void;
};

/** A ligação em andamento, com cara de chamada de vídeo. */
export default function Conversa({
  dados,
  rtmClient,
  onRenovarTokens,
  onFalasAtualizadas,
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
  // Filtro de barulho da Agora: tira TV e conversa de fundo antes do áudio sair.
  useFiltroDeRuido(localMicrophoneTrack);

  // Marca o tempo do áudio pra legenda acompanhar a fala. É um parâmetro do
  // módulo da Agora e precisa valer antes de o microfone ser publicado.
  useEffect(() => {
    try {
      (AgoraRTC as AgoraComParametros).setParameter?.('ENABLE_AUDIO_PTS', true);
    } catch (erro) {
      console.warn('Não deu pra ligar ENABLE_AUDIO_PTS:', erro);
    }
  }, [client]);

  const { transcript, estadoDoAgente, medicao } = useVozDaAssistente({
    client,
    rtmClient,
    canal: dados.channel,
    pronto: pronto && entrou,
  });
  useEnviarFalas(transcript, dados.conversaId, uidDaAssistente);

  // Mantém a cópia efêmera das falas pra consolidar resumo/ficha no encerramento.
  useEffect(() => {
    if (!onFalasAtualizadas) return;
    onFalasAtualizadas(extrairFalasDaSessao(transcript, uidDaAssistente));
  }, [transcript, uidDaAssistente, onFalasAtualizadas]);

  const encerrarComFalas = useCallback(() => {
    onEncerrar(extrairFalasDaSessao(transcript, uidDaAssistente));
  }, [onEncerrar, transcript, uidDaAssistente]);

  // O tempo de resposta medido pela Agora vai pro servidor uma vez, quando a
  // ligação acaba, e fica junto da conversa. Com ?medir=1 aparece também na tela.
  const ultimaMedicao = useRef(medicao);
  useEffect(() => {
    ultimaMedicao.current = medicao;
  }, [medicao]);
  useEffect(() => {
    const conversaId = dados.conversaId;
    let enviou = false;
    const mandar = () => {
      if (enviou) return;
      const tempos = resumirMedicao(ultimaMedicao.current);
      if (Object.keys(tempos).length === 0) return;
      enviou = true;
      void avisarServidor({ tipo: 'tempos', conversaId, tempos });
    };
    // Fechar o app ou a aba no meio da ligação não desmonta a tela pelo React.
    window.addEventListener('pagehide', mandar);
    return () => {
      window.removeEventListener('pagehide', mandar);
      mandar();
    };
  }, [dados.conversaId]);
  const [mostrarMedicao] = useState(medidorLigado);

  // Com avatar, a imagem e a voz podem vir de outro participante que não a
  // assistente em si. Por isso a tela toca o som de todos e mostra o vídeo de
  // quem tiver vídeo.
  const alguemNaLinha = usuariosRemotos.length > 0;
  const comVideo = usuariosRemotos.find((usuario) => usuario.hasVideo);
  const donoDaVoz =
    usuariosRemotos.find(
      (usuario) => String(usuario.uid) === uidDaAssistente && usuario.hasAudio,
    ) ?? usuariosRemotos.find((usuario) => usuario.hasAudio);
  const { track: faixaDaVoz } = useRemoteUserTrack(donoDaVoz, 'audio');
  const nivel = useNivelDoAudio(faixaDaVoz);
  const outrosComSom = usuariosRemotos.filter(
    (usuario) => usuario.hasAudio && usuario.uid !== donoDaVoz?.uid,
  );
  const [somPreso, soltarSom] = useSomPreso();

  useEffect(() => {
    if (erroDoMicrofone) onFalha('microfone');
  }, [erroDoMicrofone, onFalha]);

  // Assistente que não entra vira aviso simples. Assistente que esteve e saiu
  // quer dizer que a ligação acabou, e a tela volta a esperar a próxima.
  const naoEntrou = useCallback(() => onFalha('conexao'), [onFalha]);
  usePresencaDaAssistente(alguemNaLinha, onEncerrar, naoEntrou);

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

  const avisarFimDaLigacao = useCallback(() => {
    if (!dados.agentId) return;
    void fetchDoAparelho('/api/stop-conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: dados.agentId,
        channel_name: dados.channel,
        acao: 'avisar_fim',
      }),
    }).catch(() => undefined);
  }, [dados.agentId, dados.channel]);

  const estado = estadoDoRosto(estadoDoAgente, alguemNaLinha, nivel);
  // Teto de 10 minutos por ligação (com sinal suave pra IA encaminhar a despedida aos 8m30s)
  // e 2 minutos sem o idoso falar. O microfone entra junto da legenda, pra ligação não cair
  // se a legenda falhar.
  useTetoDaLigacao(
    transcript,
    uidDaAssistente,
    alguemNaLinha,
    estado === 'falando',
    localMicrophoneTrack,
    encerrarComFalas,
    avisarFimDaLigacao,
    dados.tetoMs,
  );
  const legenda = useMemo(
    () => legendaDaAssistente(transcript, uidDaAssistente),
    [transcript, uidDaAssistente],
  );

  return (
    <section
      aria-label={`Ligação com a ${NOME_DA_ASSISTENTE}`}
      className="flex w-full flex-1 flex-col items-center justify-between gap-4"
    >
      <PalcoDaAssistente comVideo={comVideo} estado={estado} nivel={nivel} />

      <div className="flex w-full flex-col items-center gap-2">
        <p role="status" className="text-xl font-medium text-muted-foreground">
          {estado === 'ligando' ? 'Só um instante...' : TEXTO_DO_ESTADO[estado]}
        </p>
        <p
          aria-live="polite"
          className="min-h-28 w-full max-w-2xl text-balance text-center text-2xl font-medium leading-snug sm:text-3xl"
        >
          {legenda}
        </p>
      </div>

      {somPreso ? (
        <BotaoGrande onClick={soltarSom}>
          Toque aqui pra ouvir a {NOME_DA_ASSISTENTE}
        </BotaoGrande>
      ) : null}

      <BotaoGrande tom={somPreso ? 'discreto' : 'encerrar'} onClick={encerrarComFalas}>
        <PhoneOff aria-hidden className="h-7 w-7 shrink-0" />
        Desligar
      </BotaoGrande>

      {mostrarMedicao ? (
        <p className="w-full text-center font-mono text-xs text-muted-foreground">
          {`${dados.modo === 'gemini' ? 'Gemini' : dados.modo === 'tres' ? 'três peças' : 'modo ?'} · `}
          {linhaDaMedicao(medicao) || 'Esperando a primeira medição da Agora'}
        </p>
      ) : null}

      {/* O som da ligação toca por aqui; nada disso aparece na tela. */}
      <RemoteAudioTrack track={faixaDaVoz} play />
      {outrosComSom.map((usuario) => (
        <SomDoRemoto key={usuario.uid} usuario={usuario} />
      ))}
    </section>
  );
}
