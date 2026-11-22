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

/**
 * Confere se o microfone está liberado antes de chamar a assistente.
 * Se a permissão já foi concedida antes, evita abrir e fechar o hardware de áudio à toa (~300 ms).
 */
export async function conseguirMicrofone(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false;
  try {
    if (typeof window !== 'undefined' && window.localStorage.getItem('donaleda:microfone-ok') === '1') {
      return true;
    }
  } catch {
    // Segue pro permissions.query / getUserMedia.
  }
  try {
    if (navigator.permissions?.query) {
      const estado = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (estado.state === 'granted') return true;
      if (estado.state === 'denied') return false;
    }
  } catch {
    // WebView/Safari sem permissions.query: pede via getUserMedia.
  }
  try {
    const som = await navigator.mediaDevices.getUserMedia({ audio: true });
    som.getTracks().forEach((faixa) => faixa.stop());
    try {
      window.localStorage.setItem('donaleda:microfone-ok', '1');
    } catch {
      // Ignora em aba anônima cheia.
    }
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

/** O servidor recusou a conversa: os minutos de conversa de hoje acabaram. */
export class LimiteDoDiaAcabou extends Error {
  constructor() {
    super('os minutos de conversa de hoje acabaram');
  }
}

/**
 * Acorda as Lambdas críticas em iad1 (/api/invite-agent e /api/mcp) assim que o
 * aparelho abre o app, evitando que o 1º toque em Ligar/Atender enfrente cold start.
 */
export function aquecerServidorDaLigacao(): void {
  if (typeof window === 'undefined') return;
  void fetch('/api/invite-agent', { method: 'GET', cache: 'no-store' }).catch(() => undefined);
  void fetch('/api/mcp', { method: 'GET', cache: 'no-store' }).catch(() => undefined);
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
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pedido),
  };

  for (let tentativa = 1; tentativa <= 2; tentativa += 1) {
    let resposta: Response;
    try {
      resposta = await fetchDoAparelho(rota, init);
    } catch (erro) {
      if (tentativa === 1) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
      throw erro;
    }

    if (resposta.status === 409) {
      const corpo = (await resposta.json().catch(() => ({}))) as { error?: string };
      if (corpo.error === 'limite_do_dia') throw new LimiteDoDiaAcabou();
    }
    if (resposta.ok) {
      return (await resposta.json()) as InicioDaConversa;
    }
    // Cold start ou falha transitória 5xx na 1ª tentativa: tenta 1 vez de novo sem mostrar erro pro idoso.
    if (tentativa === 1 && resposta.status >= 500) {
      await new Promise((r) => setTimeout(r, 350));
      continue;
    }
    throw new Error('a assistente não entrou');
  }

  throw new Error('a assistente não entrou');
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
  aoSairDaPagina = false,
) {
  await avisarServidor(
    {
      tipo: 'fim',
      conversaId,
      ...(falas && falas.length > 0 ? { falas } : {}),
    },
    { aoSairDaPagina },
  );
  // No modo direto não tem assistente da Agora na sala pra mandar embora.
  if (agentId) await pararAssistente(agentId);
}
