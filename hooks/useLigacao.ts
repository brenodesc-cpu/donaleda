'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RTMClient } from 'agora-rtm';
import { avisarServidor } from '@/lib/avisarServidor';
import type { InicioDaConversa } from '@/lib/tipos';
import type {
  AgoraRenewalTokens,
  ClientStartRequest,
  DadosDaLigacao,
  MotivoDaFalha,
  StopConversationRequest,
} from '@/types/conversation';

export type FaseDaLigacao = 'parada' | 'ligando' | 'conversando' | 'erro';

interface TokenDaAgora {
  token: string;
  uid: string;
  channel: string;
}

/** Pede o microfone antes de chamar a assistente, pra não gastar a ligação se a pessoa negar. */
async function conseguirMicrofone(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const som = await navigator.mediaDevices.getUserMedia({ audio: true });
    som.getTracks().forEach((faixa) => faixa.stop());
    return true;
  } catch {
    return false;
  }
}

async function pedirToken(parametros = ''): Promise<TokenDaAgora> {
  const resposta = await fetch(`/api/generate-agora-token${parametros}`);
  if (!resposta.ok) throw new Error('o token da Agora não veio');
  return (await resposta.json()) as TokenDaAgora;
}

async function chamarAssistente(token: TokenDaAgora): Promise<InicioDaConversa> {
  const pedido: ClientStartRequest = {
    requester_id: token.uid,
    channel_name: token.channel,
  };
  const resposta = await fetch('/api/invite-agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });
  if (!resposta.ok) throw new Error('a assistente não entrou');
  return (await resposta.json()) as InicioDaConversa;
}

async function ligarRtm(token: TokenDaAgora): Promise<RTMClient> {
  const { default: AgoraRTM } = await import('agora-rtm');
  const rtm: RTMClient = new AgoraRTM.RTM(
    process.env.NEXT_PUBLIC_AGORA_APP_ID!,
    token.uid,
  );
  await rtm.login({ token: token.token });
  await rtm.subscribe(token.channel);
  return rtm;
}

function pararAssistente(agentId: string): Promise<void> {
  const pedido: StopConversationRequest = { agent_id: agentId };
  return fetch('/api/stop-conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
    // keepalive deixa o pedido sair mesmo se a pessoa fechar a aba.
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

/** Avisa o fim ao servidor e depois manda a assistente sair da ligação. */
async function fecharNoServidor(conversaId: string, agentId: string) {
  await avisarServidor({ tipo: 'fim', conversaId });
  await pararAssistente(agentId);
}

/** Cuida de ligar e desligar a conversa: token, assistente, canal de mensagens e avisos ao servidor. */
export function useLigacao() {
  const [fase, setFase] = useState<FaseDaLigacao>('parada');
  const [motivo, setMotivo] = useState<MotivoDaFalha | null>(null);
  const [dados, setDados] = useState<DadosDaLigacao | null>(null);
  const [rtm, setRtm] = useState<RTMClient | null>(null);
  // Evita mandar o fim da conversa duas vezes (botão, falha e fechar a aba).
  const fimAvisado = useRef(false);

  // Os módulos da Agora são pesados: carregar antes deixa o toque no botão mais rápido.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
  }, []);

  const desligar = useCallback(
    (proximaFase: FaseDaLigacao, falha: MotivoDaFalha | null) => {
      if (fimAvisado.current) return;
      fimAvisado.current = true;
      // A tela troca na hora (o som para já); o servidor é avisado em seguida.
      setMotivo(falha);
      setFase(proximaFase);
      setDados(null);
      setRtm(null);
      if (dados) void fecharNoServidor(dados.conversaId, dados.agentId);
      rtm?.logout().catch(() => {});
    },
    [dados, rtm],
  );

  const ligar = useCallback(async () => {
    setFase('ligando');
    setMotivo(null);
    try {
      if (!(await conseguirMicrofone())) {
        setMotivo('microfone');
        setFase('erro');
        return;
      }
      const token = await pedirToken();
      // O canal de mensagens precisa estar pronto antes de a conversa aparecer na tela.
      const [inicio, mensagens] = await Promise.allSettled([
        chamarAssistente(token),
        ligarRtm(token),
      ]);
      if (inicio.status !== 'fulfilled' || mensagens.status !== 'fulfilled') {
        // Metade ligou: desfaz essa metade pra não deixar assistente sozinha na linha.
        if (mensagens.status === 'fulfilled') {
          mensagens.value.logout().catch(() => {});
        }
        if (inicio.status === 'fulfilled') {
          void fecharNoServidor(inicio.value.conversa_id, inicio.value.agent_id);
        }
        throw new Error('a ligação não completou');
      }
      fimAvisado.current = false;
      setRtm(mensagens.value);
      setDados({
        ...token,
        agentId: inicio.value.agent_id,
        conversaId: inicio.value.conversa_id,
      });
      setFase('conversando');
    } catch (erro) {
      console.error('Não consegui ligar:', erro);
      setMotivo('conexao');
      setFase('erro');
    }
  }, []);

  const encerrar = useCallback(() => desligar('parada', null), [desligar]);

  const falhar = useCallback(
    (falha: MotivoDaFalha) => desligar('erro', falha),
    [desligar],
  );

  const renovarTokens = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      if (!dados) throw new Error('sem conversa pra renovar o token');
      const [rtc, mensagens] = await Promise.all([
        pedirToken(`?channel=${dados.channel}&uid=${uid}`),
        pedirToken(`?channel=${dados.channel}&uid=${dados.uid}`),
      ]);
      return { rtcToken: rtc.token, rtmToken: mensagens.token };
    },
    [dados],
  );

  // Se a pessoa fechar a aba no meio da conversa, o servidor ainda fica sabendo do fim.
  useEffect(() => {
    if (fase !== 'conversando' || !dados) return;
    const aoSair = () => {
      if (fimAvisado.current) return;
      fimAvisado.current = true;
      void fecharNoServidor(dados.conversaId, dados.agentId);
    };
    window.addEventListener('pagehide', aoSair);
    return () => window.removeEventListener('pagehide', aoSair);
  }, [fase, dados]);

  return { fase, motivo, dados, rtm, ligar, encerrar, falhar, renovarTokens };
}
