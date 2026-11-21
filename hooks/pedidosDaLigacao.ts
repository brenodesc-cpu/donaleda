// Os pedidos que a tela do idoso faz ao servidor pra começar e terminar uma
// ligação: microfone, token da Agora, entrada da assistente e canal de mensagens.

import type { RTMClient } from 'agora-rtm';
import { fetchDoAparelho, modoPedido } from '@/lib/aparelho';
import { avisarServidor } from '@/lib/avisarServidor';
import type { FalaDaSessao, InicioDaConversa } from '@/lib/tipos';
import type {
  ClientStartRequest,
  StopConversationRequest,
} from '@/types/conversation';

export interface TokenDaAgora {
  token: string;
  uid: string;
  channel: string;
}

/** Pede o microfone antes de chamar a assistente, pra não gastar a ligação se a pessoa negar. */
export async function conseguirMicrofone(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    const som = await navigator.mediaDevices.getUserMedia({ audio: true });
    som.getTracks().forEach((faixa) => faixa.stop());
    return true;
  } catch {
    return false;
  }
}

export async function pedirToken(parametros = ''): Promise<TokenDaAgora> {
  const resposta = await fetchDoAparelho(`/api/generate-agora-token${parametros}`);
  if (!resposta.ok) throw new Error('o token da Agora não veio');
  return (await resposta.json()) as TokenDaAgora;
}

export async function chamarAssistente(
  token: TokenDaAgora,
  chamadaId?: string,
): Promise<InicioDaConversa> {
  const pedido: ClientStartRequest = {
    requester_id: token.uid,
    channel_name: token.channel,
    // Só vai quando foi a assistente que ligou e o idoso atendeu.
    ...(chamadaId ? { chamada_id: chamadaId } : {}),
  };
  // No modo direto ninguém chama o motor de conversa da Agora: o servidor abre a
  // conversa na ficha e entrega o passe do Gemini (app/api/direto/route.ts).
  const rota = modoPedido() === 'direto' ? '/api/direto' : '/api/invite-agent';
  const resposta = await fetchDoAparelho(rota, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  });
  if (!resposta.ok) throw new Error('a assistente não entrou');
  return (await resposta.json()) as InicioDaConversa;
}

export async function ligarRtm(token: TokenDaAgora): Promise<RTMClient> {
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
  return fetchDoAparelho('/api/stop-conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
    // keepalive deixa o pedido sair mesmo se a pessoa fechar a aba.
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}

/** Avisa o fim ao servidor (com as falas efêmeras pra extrair resumo/ficha em memória) e para a assistente. */
export async function fecharNoServidor(
  conversaId: string,
  agentId: string,
  falas?: FalaDaSessao[],
) {
  await avisarServidor({
    tipo: 'fim',
    conversaId,
    ...(falas && falas.length > 0 ? { falas } : {}),
  });
  // No modo direto não tem assistente da Agora na sala pra mandar embora.
  if (agentId) await pararAssistente(agentId);
}
