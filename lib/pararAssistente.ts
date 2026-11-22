// Tira a Dona Leda da sala da Agora quando a ligação acaba.
//
// A Dona Leda do Gemini mora no endereço de teste da Agora (partner.ai.agora.io,
// com o cabeçalho agora-feature), e a de três peças mora no endereço normal.
// O stopAgent do pacote só pede no endereço normal e trata o "não achei" como
// sucesso, então a Dona Leda do Gemini ficava sozinha na sala até o limite de
// espera e cada ligação gastava até 2 minutos a mais do motor (achado de 21/11).
// Aqui o pedido vai pros dois endereços ao mesmo tempo, e basta um aceitar.

import { AgoraClient, Area, createPreviewRoute, generateConvoAIToken, PreviewFeatures } from 'agora-agents';

export type ResultadoDaParada = 'parou' | 'ja_tinha_saido';

/** "Não achei" (404) ou "já está saindo": a Dona Leda não está mais naquele endereço. */
export function jaSaiu(erro: unknown): boolean {
  if (!erro || typeof erro !== 'object') return false;
  const e = erro as { statusCode?: number; body?: { detail?: string; reason?: string }; message?: string };
  if (e.statusCode === 404) return true;
  const motivo = e.body?.reason?.toLowerCase();
  const detalhe = (e.body?.detail ?? e.message ?? '').toLowerCase();
  return motivo === 'invalidrequest' && detalhe.includes('already in the process of shutting down');
}

export async function pararAssistente(appId: string, appCertificate: string, agentId: string): Promise<ResultadoDaParada> {
  const cliente = new AgoraClient({ area: Area.US, appId, appCertificate });
  const token = generateConvoAIToken({ appId, appCertificate, channelName: 'stop', uid: 0 });
  const opcoes = { headers: { Authorization: `agora token=${token}` } };
  const enderecos = [cliente.agents, createPreviewRoute(cliente, [PreviewFeatures.GeminiLive]).agents];
  const respostas = await Promise.allSettled(enderecos.map((a) => a.stop({ appid: appId, agentId }, opcoes)));
  if (respostas.some((r) => r.status === 'fulfilled')) return 'parou';
  const erros = respostas.map((r) => (r as PromiseRejectedResult).reason);
  const outro = erros.find((e) => !jaSaiu(e));
  if (outro) throw outro;
  return 'ja_tinha_saido';
}

// ---------- O aviso de fim da ligação (encerramento gentil aos 8m30s) ----------

/** O que a Dona Leda recebe quando falta um minuto pro limite da ligação. */
export const INSTRUCAO_DE_DESPEDIDA =
  '[Aviso interno de tempo: falta cerca de um minuto pro limite desta ligação. Se a pessoa estiver contando mal-estar, queda, golpe ou tristeza forte, ignore este aviso e cuide disso primeiro. Fora disso, não interrompa a pessoa de forma brusca; na sua próxima resposta, valide com carinho o que ela acabou de contar, reforce qualquer combinado importante e encaminhe a despedida com naturalidade, dizendo quando vocês conversam de novo.]';

export type ResultadoDoAviso = 'avisou' | 'ja_tinha_saido' | 'ignorado';

/**
 * Manda o aviso de fim pros dois endereços da Agora, como o pedido de parar.
 * Se nenhum aceitar, fica em silêncio: uma frase de despedida falada em voz alta
 * poderia cair no meio de uma queda ou de um golpe (revisão de 21/11).
 */
export async function avisarFimDaLigacao(
  appId: string,
  appCertificate: string,
  agentId: string,
  canal = 'stop',
): Promise<ResultadoDoAviso> {
  const cliente = new AgoraClient({ area: Area.US, appId, appCertificate });
  const token = generateConvoAIToken({ appId, appCertificate, channelName: canal || 'stop', uid: 0 });
  const opcoes = { headers: { Authorization: `agora token=${token}` } };
  const enderecos = [cliente.agentManagement, createPreviewRoute(cliente, [PreviewFeatures.GeminiLive]).agentManagement];
  const respostas = await Promise.allSettled(
    enderecos.map((a) =>
      a.agentThink(
        {
          appid: appId,
          agentId,
          text: INSTRUCAO_DE_DESPEDIDA,
          on_listening_action: 'append',
          on_thinking_action: 'append',
          on_speaking_action: 'append',
          interruptable: true,
        },
        opcoes,
      ),
    ),
  );
  if (respostas.some((r) => r.status === 'fulfilled')) return 'avisou';
  const erros = respostas.map((r) => (r as PromiseRejectedResult).reason);
  return erros.every(jaSaiu) ? 'ja_tinha_saido' : 'ignorado';
}
