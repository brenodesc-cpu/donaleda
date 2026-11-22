// O que a família na ligação pede à Agora: a chave da sala pra quem é da família,
// as frases fixas faladas pela Dona Leda e a saída dela da sala. As regras do
// convite (quando abre, prazo, entrada) ficam em convite.ts.

import { randomInt } from 'node:crypto';
import { generateConvoAIToken } from 'agora-agents';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { after } from 'next/server';
import { DEFAULT_AGENT_UID, PRIMEIRO_UID_DA_FAMILIA } from './agora';
import type { Conversa, EntradaNaLigacao } from './tipos';

/** A chave da família vale 15 minutos, o bastante pra conversa da urgência. */
const QUINZE_MINUTOS = 15 * 60;

/** O token de quem é da família, pra entrar na sala com voz e vídeo. */
export function entradaDaFamilia(canal: string): EntradaNaLigacao {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim() ?? '';
  const certificado = process.env.NEXT_AGORA_APP_CERTIFICATE?.trim() ?? '';
  if (!appId || !certificado) throw new Error('Faltam as chaves da Agora');
  const uid = String(PRIMEIRO_UID_DA_FAMILIA + randomInt(1, 99_999));
  const expira = Math.floor(Date.now() / 1000) + QUINZE_MINUTOS;
  const token = RtcTokenBuilder.buildTokenWithUid(appId, certificado, canal, uid, RtcRole.PUBLISHER, expira, expira);
  return { appId, canal, uid, token };
}

// As ligações do Gemini Live ficam no endereço de prévia da Agora; as de três peças, no normal.
// O SDK não deixa trocar o endereço do cliente, então o pedido vai direto (testado em 21/11).
const ENDERECO_NORMAL = 'https://api.agora.io/api/conversational-ai-agent';
const ENDERECO_DO_GEMINI = 'https://partner.ai.agora.io/preview/api/conversational-ai-agent';

async function pedirAgora(conversa: Conversa, rota: 'speak' | 'leave', corpo?: Record<string, unknown>): Promise<boolean> {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
  const certificado = process.env.NEXT_AGORA_APP_CERTIFICATE?.trim();
  // Nas provas (ficha na memória) nada vai pra Agora.
  if (process.env.LIA_DADOS === 'memoria') return false;
  if (!appId || !certificado || !conversa.canal || !conversa.agenteId) return false;
  const token = generateConvoAIToken({ appId, appCertificate: certificado, channelName: conversa.canal, uid: DEFAULT_AGENT_UID });
  const gemini = conversa.modo === 'gemini';
  try {
    const resposta = await fetch(
      `${gemini ? ENDERECO_DO_GEMINI : ENDERECO_NORMAL}/v2/projects/${encodeURIComponent(appId)}/agents/${encodeURIComponent(conversa.agenteId)}/${rota}`,
      {
        method: 'POST',
        headers: {
          Authorization: `agora token=${token}`,
          'Content-Type': 'application/json',
          ...(gemini ? { 'agora-feature': 'gemini-live' } : {}),
        },
        body: JSON.stringify(corpo ?? {}),
      },
    );
    if (!resposta.ok) console.error(`A Agora recusou o ${rota}:`, resposta.status, await resposta.text());
    return resposta.ok;
  } catch (erro) {
    console.error(`Não consegui pedir ${rota} à Agora:`, erro);
    return false;
  }
}

/**
 * A Dona Leda fala uma frase fixa, sem passar pela IA. APPEND espera ela terminar o
 * que está dizendo (a instrução do 192 numa queda); INTERRUPT corta pra falar já.
 */
export function falar(conversa: Conversa, texto: string, prioridade: 'APPEND' | 'INTERRUPT'): Promise<boolean> {
  return pedirAgora(conversa, 'speak', { text: texto, priority: prioridade, interruptable: false });
}

/** Tira a Dona Leda da sala. A ligação continua entre quem ficou. */
export async function tirarAssistente(conversa: Conversa): Promise<boolean> {
  // Num teste de 21/11 a Agora respondeu erro 500 uma vez e tirou assim mesmo; tenta de novo por garantia.
  if (await pedirAgora(conversa, 'leave')) return true;
  await new Promise((r) => setTimeout(r, 1500));
  return pedirAgora(conversa, 'leave');
}

/** Roda depois de responder ao pedido. Fora de um pedido (provas), roda na hora. */
export function depois(tarefa: () => Promise<unknown>): void {
  try {
    after(tarefa);
  } catch {
    void tarefa();
  }
}
