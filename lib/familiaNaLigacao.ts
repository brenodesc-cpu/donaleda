// A família entra na ligação em que o idoso está, na hora de um aviso urgente.
// O servidor dá a ela um token da mesma sala da Agora e avisa a assistente, que
// conta ao idoso que a pessoa entrou e passa a falar só se for chamada.

import { randomInt } from 'node:crypto';
import { generateConvoAIToken } from 'agora-agents';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { DEFAULT_AGENT_UID, PRIMEIRO_UID_DA_FAMILIA } from './agora';
import { NOME_DA_ASSISTENTE } from './assistente';
import { quemContratou } from './persona';
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

/** A frase que a assistente diz ao idoso quando a família entra. */
export function fraseDaEntrada(base: Base): string {
  const { familiar, tratamento } = base.idoso;
  return `${tratamento[0].toUpperCase()}${tratamento.slice(1)}, ${quemContratou(familiar)} entrou na ligação.`;
}

/** O que a assistente recebe quando a família entra. Vai como fala, pelos dois jeitos de voz. */
export function recadoDaEntrada(base: Base): string {
  const { familiar, tratamento } = base.idoso;
  return (
    `[Aviso do sistema, não é fala de ${tratamento}] ${familiar.nome} acabou de entrar nesta ligação ` +
    `e agora ouve e vê ${tratamento}. Diga só esta frase, com calma: "${fraseDaEntrada(base)}" ` +
    `Depois fique em silêncio e deixe os dois conversarem. Só volte a falar se chamarem você pelo nome, ${NOME_DA_ASSISTENTE}.`
  );
}

/** No Gemini a frase vai falada direto, e o recado só pede silêncio, pra ela não repetir. */
export function recadoDeSilencio(base: Base): string {
  const { familiar, tratamento } = base.idoso;
  return (
    `[Aviso do sistema, não é fala de ${tratamento}] ${familiar.nome} entrou nesta ligação e você já contou isso. ` +
    `Não responda a este aviso. Fique em silêncio e deixe os dois conversarem. Só volte a falar se chamarem você pelo nome, ${NOME_DA_ASSISTENTE}.`
  );
}

// As ligações do Gemini Live ficam no endereço de prévia da Agora; as de três peças, no normal.
// O SDK não deixa trocar o endereço do cliente, então o pedido vai direto.
const ENDERECO_NORMAL = 'https://api.agora.io/api/conversational-ai-agent';
const ENDERECO_DO_GEMINI = 'https://partner.ai.agora.io/preview/api/conversational-ai-agent';

/** Manda o recado pra assistente da ligação. Falha aqui não impede a família de entrar. */
export async function avisarAssistente(conversa: Conversa, base: Base): Promise<boolean> {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
  const certificado = process.env.NEXT_AGORA_APP_CERTIFICATE?.trim();
  if (!appId || !certificado || !conversa.canal || !conversa.agenteId) return false;
  const token = generateConvoAIToken({ appId, appCertificate: certificado, channelName: conversa.canal, uid: DEFAULT_AGENT_UID });
  const gemini = conversa.modo === 'gemini';
  const pedir = async (rota: 'speak' | 'think', corpo: Record<string, unknown>) => {
    const resposta = await fetch(
      `${gemini ? ENDERECO_DO_GEMINI : ENDERECO_NORMAL}/v2/projects/${encodeURIComponent(appId)}/agents/${encodeURIComponent(conversa.agenteId!)}/${rota}`,
      {
        method: 'POST',
        headers: {
          Authorization: `agora token=${token}`,
          'Content-Type': 'application/json',
          ...(gemini ? { 'agora-feature': 'gemini-live' } : {}),
        },
        body: JSON.stringify(corpo),
      },
    );
    if (!resposta.ok) console.error(`A Agora recusou o ${rota} da família:`, resposta.status, await resposta.text());
    return resposta.ok;
  };
  const interromper = { on_listening_action: 'interrupt', on_thinking_action: 'interrupt', on_speaking_action: 'interrupt' };
  try {
    if (!gemini) return await pedir('think', { text: recadoDaEntrada(base), ...interromper });
    // O Gemini recebe o recado e fica calado sem anunciar; a frase vai falada pela própria Agora.
    const falou = await pedir('speak', { text: fraseDaEntrada(base), priority: 'INTERRUPT', interruptable: false });
    await pedir('think', { text: recadoDeSilencio(base), on_listening_action: 'inject', on_thinking_action: 'append', on_speaking_action: 'append' });
    return falou;
  } catch (erro) {
    console.error('Não consegui avisar a assistente que a família entrou:', erro);
    return false;
  }
}
