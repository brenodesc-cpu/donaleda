'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AgoraRTC, {
  useClientEvent,
  useJoin,
  useRemoteUsers,
  useRTCClient,
  type IAgoraRTCClient,
  type ILocalAudioTrack,
  type IMicrophoneAudioTrack,
} from 'agora-rtc-react';
import { PhoneOff } from 'lucide-react';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import {
  extrairFalasDaSessao,
  legendaDaAssistente,
  TEXTO_DO_ESTADO,
  type EstadoDoRosto,
} from '@/lib/conversation';
import { linhaDoUso } from '@/lib/direto';
import { medidorLigado } from '@/lib/medicao';
import { useEnviarFalas } from '@/hooks/useEnviarFalas';
import { useGeminiDireto } from '@/hooks/useGeminiDireto';
import { useTetoDaLigacao } from '@/hooks/useTetoDaLigacao';
import type { PropsDaConversa } from '@/types/conversation';
import { BotaoGrande } from './BotaoGrande';
import { PalcoDaAssistente, SomDoRemoto } from './PalcoDaAssistente';

/**
 * Abre o microfone uma vez só. O mesmo som vai pro Gemini e pra sala da Agora:
 * o microfone que a própria Agora abre chegava mudo no caminho do Gemini
 * (medido em 21/11), e no iPhone dois microfones abertos derrubam um ao outro.
 */
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

/**
 * Põe uma faixa de som deste aparelho na sala da Agora. Com duas faixas (o
 * microfone e a voz da assistente) a Agora junta as duas, e quem entrar na sala
 * ouve as duas. Ao sair, só tira da sala: quem abriu a faixa é quem fecha.
 */
function useFaixaNaSala(
  client: IAgoraRTCClient,
  entrou: boolean,
  faixa: MediaStreamTrack | null,
  nome: string,
): ILocalAudioTrack | null {
  const [naSala, setNaSala] = useState<ILocalAudioTrack | null>(null);

  useEffect(() => {
    if (!entrou || !faixa) return;
    let saiu = false;
    let criada: ILocalAudioTrack;
    try {
      criada = AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: faixa });
    } catch (erro) {
      console.warn(`[direto] não consegui preparar ${nome} pra sala da Agora:`, erro);
      return;
    }
    setNaSala(criada);
    client.publish(criada).catch((erro) => {
      if (!saiu) console.warn(`[direto] ${nome} não entrou na sala da Agora:`, erro);
    });
    return () => {
      saiu = true;
      setNaSala(null);
      client.unpublish(criada).catch(() => undefined);
    };
  }, [client, entrou, faixa, nome]);

  return naSala;
}

/**
 * A ligação no modo direto (?modo=direto). A tela é a mesma da ligação comum; o
 * que muda é por onde a voz passa: o aparelho conversa com o Gemini sem o motor
 * de conversa da Agora, e entra na sala da Agora publicando o microfone do idoso
 * e a voz da assistente, pra família poder entrar e ouvir as duas.
 */
export default function ConversaDireta({
  dados,
  rtmClient,
  onRenovarTokens,
  onFalasAtualizadas,
  onEncerrar,
  onFalha,
}: PropsDaConversa) {
  const client = useRTCClient();
  const usuariosRemotos = useRemoteUsers();
  // Não tem assistente da Agora na sala; o número só separa as falas dela das do idoso.
  const uidDaAssistente = String(DEFAULT_AGENT_UID);

  // Guarda do StrictMode, igual à da ligação comum: entrar na sala, abrir o
  // microfone e gastar o passe do Google acontecem uma vez só.
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

  const microfone = useMicrofone(pronto);
  useEffect(() => {
    if (microfone.falhou) onFalha('microfone');
  }, [microfone.falhou, onFalha]);

  // Conversa que nem abriu vira aviso simples. Conversa que abriu e caiu acabou:
  // a tela volta a esperar a próxima, e o resumo sai com o que foi dito.
  const aoCair = useCallback(
    (jaConversou: boolean) => {
      if (jaConversou) onEncerrar();
      else onFalha('conexao');
    },
    [onEncerrar, onFalha],
  );

  const { transcript, naLinha, falando, agindo, nivel, faixaDaVoz, conta, somPreso, soltarSom } =
    useGeminiDireto({
      direto: dados.direto!,
      conversaId: dados.conversaId,
      uidDaAssistente,
      microfone: microfone.faixa,
      pronto,
      aoCair,
    });

  // O aparelho entra na sala da Agora com o microfone do idoso e com a voz dela,
  // pra família poder entrar na ligação e ouvir os dois.
  const microfoneNaSala = useFaixaNaSala(client, entrou, microfone.faixa, 'o microfone');
  useFaixaNaSala(client, entrou, faixaDaVoz, 'a voz da assistente');

  useEnviarFalas(transcript, dados.conversaId, uidDaAssistente);

  // Mantém a cópia efêmera das falas pra consolidar resumo/ficha no encerramento.
  useEffect(() => {
    if (!onFalasAtualizadas) return;
    onFalasAtualizadas(extrairFalasDaSessao(transcript, uidDaAssistente));
  }, [transcript, uidDaAssistente, onFalasAtualizadas]);

  const encerrarComFalas = useCallback(() => {
    onEncerrar(extrairFalasDaSessao(transcript, uidDaAssistente));
  }, [onEncerrar, transcript, uidDaAssistente]);

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

  const estado: EstadoDoRosto = !naLinha
    ? 'ligando'
    : falando
      ? 'falando'
      : agindo
        ? 'pensando'
        : 'ouvindo';

  // O mesmo teto da ligação comum: 10 minutos, esperando um respiro pra desligar.
  // O teto só lê o volume do microfone, que a faixa da sala também informa.
  useTetoDaLigacao(
    transcript,
    uidDaAssistente,
    naLinha,
    falando,
    microfoneNaSala as IMicrophoneAudioTrack | null,
    onEncerrar,
  );

  const legenda = useMemo(
    () => legendaDaAssistente(transcript, uidDaAssistente),
    [transcript, uidDaAssistente],
  );
  const [mostrarMedicao] = useState(medidorLigado);
  // Quem entra na sala além deste aparelho é a família, e o idoso ouve ela.
  const outrosComSom = usuariosRemotos.filter((usuario) => usuario.hasAudio);

  return (
    <section
      aria-label={`Ligação com a ${NOME_DA_ASSISTENTE}`}
      className="flex w-full flex-1 flex-col items-center justify-between gap-4"
    >
      <PalcoDaAssistente comVideo={undefined} estado={estado} nivel={nivel} />

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
          {`direto · ${linhaDoUso(conta.uso, conta.segundos)}`}
        </p>
      ) : null}

      {/* O som de quem mais estiver na sala toca por aqui; nada disso aparece na tela. */}
      {outrosComSom.map((usuario) => (
        <SomDoRemoto key={usuario.uid} usuario={usuario} />
      ))}
    </section>
  );
}
