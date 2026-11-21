import type { RTMClient } from 'agora-rtm';

// Contratos do projeto-base da Agora, usados pelas rotas de token, início e fim.
export interface AgoraTokenData {
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
}

export interface ClientStartRequest {
  requester_id: string;
  channel_name: string;
  /** Vem quando a conversa nasce de uma ligação que a assistente fez e o idoso atendeu. */
  chamada_id?: string;
}

export interface StopConversationRequest {
  agent_id: string;
}

export interface AgentResponse {
  agent_id: string;
  create_ts: number;
  state: string;
}

export interface AgoraRenewalTokens {
  rtcToken: string;
  rtmToken: string;
}

// Tela do idoso.

/** Por que a ligação não deu certo, em termos que viram texto simples na tela. */
export type MotivoDaFalha = 'microfone' | 'conexao';

/** Tudo que a tela precisa pra entrar na conversa e avisar o servidor depois. */
export interface DadosDaLigacao {
  token: string;
  uid: string;
  channel: string;
  agentId: string;
  conversaId: string;
  /** true quando um avatar em vídeo entra na ligação junto com a voz. */
  avatar: boolean;
}

export interface PropsDaConversa {
  dados: DadosDaLigacao;
  rtmClient: RTMClient;
  onRenovarTokens: (uid: string) => Promise<AgoraRenewalTokens>;
  onEncerrar: () => void;
  onFalha: (motivo: MotivoDaFalha) => void;
}
