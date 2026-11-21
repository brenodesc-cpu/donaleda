// A família entra na ligação em que o idoso está, na hora de um aviso urgente.
// O servidor dá a ela um token da mesma sala da Agora e avisa a assistente, que
// conta ao idoso que a pessoa entrou e passa a falar só se for chamada.

import { randomInt } from 'node:crypto';
import { AgoraClient, Area, generateConvoAIToken } from 'agora-agents';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { DEFAULT_AGENT_UID, PRIMEIRO_UID_DA_FAMILIA } from './agora';
import { NOME_DA_ASSISTENTE } from './assistente';
import type { Base, Conversa, EntradaNaLigacao } from './tipos';

const UMA_HORA = 3600;

/** O token de quem é da família, pra entrar na sala com voz e vídeo. */
export function entradaDaFamilia(canal: string): EntradaNaLigacao {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? '';
  const certificado = process.env.NEXT_AGORA_APP_CERTIFICATE?.trim() ?? '';
  if (!appId || !certificado) throw new Error('Faltam as chaves da Agora');
  const uid = String(PRIMEIRO_UID_DA_FAMILIA + randomInt(1, 99_999));
  const expira = Math.floor(Date.now() / 1000) + UMA_HORA;
  const token = RtcTokenBuilder.buildTokenWithUid(appId, certificado, canal, uid, RtcRole.PUBLISHER, expira, expira);
  return { appId, canal, uid, token };
}

/** O que a assistente recebe quando a família entra. Vai como fala, pelos dois jeitos de voz. */
export function recadoDaEntrada(base: Base): string {
  const { familiar, tratamento } = base.idoso;
  return (
    `[Aviso do sistema, não é fala de ${tratamento}] ${familiar.nome} acabou de entrar nesta ligação ` +
    `e agora ouve e vê ${tratamento}. Diga numa frase curta e calma que ${familiar.nome} entrou na ligação. ` +
    `Depois fique em silêncio e deixe os dois conversarem. Só volte a falar se chamarem você pelo nome, ${NOME_DA_ASSISTENTE}.`
  );
}

/** Manda o recado pra assistente da ligação. Falha aqui não impede a família de entrar. */
export async function avisarAssistente(conversa: Conversa, recado: string): Promise<boolean> {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
  const certificado = process.env.NEXT_AGORA_APP_CERTIFICATE?.trim();
  if (!appId || !certificado || !conversa.canal || !conversa.agenteId) return false;
  const client = new AgoraClient({ area: Area.US, appId, appCertificate: certificado });
  const token = generateConvoAIToken({ appId, appCertificate: certificado, channelName: conversa.canal, uid: DEFAULT_AGENT_UID });
  try {
    // O SDK não traz o tipo do pedido de "pensar" pela raiz, por isso o acesso direto.
    await (client as unknown as {
      agentManagement: { agentThink: (pedido: Record<string, unknown>, opcoes: { headers: Record<string, string> }) => Promise<unknown> };
    }).agentManagement.agentThink(
      {
        appid: appId,
        agentId: conversa.agenteId,
        text: recado,
        on_listening_action: 'interrupt',
        on_thinking_action: 'interrupt',
        on_speaking_action: 'interrupt',
      },
      { headers: { Authorization: `agora token=${token}` } },
    );
    return true;
  } catch (erro) {
    console.error('Não consegui avisar a assistente que a família entrou:', erro);
    return false;
  }
}
