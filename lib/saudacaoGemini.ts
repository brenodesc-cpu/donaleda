// Faz a Dona Leda do Gemini falar primeiro quando a ligação abre.
//
// A saudação vai na configuração da Agora, mas a Dona Leda do Gemini (que mora no
// endereço de teste da Agora) não fala sozinha ao entrar na sala: fica muda até a
// pessoa dizer alguma coisa. Medido em 21/11 no site, três vezes, e era por isso
// que ligações de teste acabavam sem ninguém falar. Aqui o servidor espera ela
// entrar e manda um aviso interno pra ela cumprimentar. Se ela já falou, não manda.

import { generateConvoAIToken } from 'agora-agents';

const ENDERECO_DO_GEMINI = 'https://partner.ai.agora.io/preview/api/conversational-ai-agent';

export const AVISO_DE_ATENDIMENTO =
  '[Aviso interno: a pessoa acabou de atender a ligação e ainda não disse nada. Comece você agora: cumprimente com a saudação combinada pra esta ligação, do jeito de sempre, e espere a pessoa responder.]';

/** O aviso interno nunca é fala do idoso, mesmo se a Agora devolver ele como se fosse. */
export function ehAvisoInterno(texto: string): boolean {
  return texto.trim().startsWith('[Aviso interno');
}

export type ResultadoDaSaudacao = 'cumprimentou' | 'ja_falou' | 'nao_entrou' | 'falhou';

interface Opcoes {
  /** Quanto tempo esperar ela entrar na sala. */
  esperaMs?: number;
  passoMs?: number;
  /** Folga depois de ela entrar, pro aparelho já estar ouvindo. */
  folgaMs?: number;
}

const dormir = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export async function cumprimentarAoEntrar(
  appId: string,
  appCertificate: string,
  agentId: string,
  canal: string,
  { esperaMs = 8000, passoMs = 500, folgaMs = 1200 }: Opcoes = {},
): Promise<ResultadoDaSaudacao> {
  const cabecalhos = () => ({
    Authorization: `agora token=${generateConvoAIToken({ appId, appCertificate, channelName: canal, uid: 0 })}`,
    'Content-Type': 'application/json',
    'agora-feature': 'gemini-live',
  });
  const endereco = `${ENDERECO_DO_GEMINI}/v2/projects/${appId}/agents/${agentId}`;

  let entrou = false;
  for (let gasto = 0; gasto < esperaMs && !entrou; gasto += passoMs) {
    try {
      const resposta = await fetch(endereco, { headers: cabecalhos() });
      if (resposta.ok) {
        const { status } = (await resposta.json()) as { status?: string };
        if (status === 'RUNNING') entrou = true;
        else if (status === 'STOPPED' || status === 'FAILED') return 'nao_entrou';
      }
    } catch {
      // Tenta de novo no próximo passo.
    }
    if (!entrou) await dormir(passoMs);
  }
  await dormir(folgaMs);

  try {
    const historico = await fetch(`${endereco}/history`, { headers: cabecalhos() });
    if (historico.ok) {
      const { contents = [] } = (await historico.json()) as { contents?: { role?: string; content?: unknown }[] };
      const jaFalou = contents.some((c) => c.role === 'assistant' && typeof c.content === 'string' && c.content.trim());
      if (jaFalou) return 'ja_falou';
    }
  } catch {
    // Sem o histórico, cumprimenta assim mesmo: silêncio é pior que saudação dobrada.
  }

  try {
    const resposta = await fetch(`${endereco}/think`, {
      method: 'POST',
      headers: cabecalhos(),
      body: JSON.stringify({
        text: AVISO_DE_ATENDIMENTO,
        on_listening_action: 'append',
        on_thinking_action: 'append',
        on_speaking_action: 'append',
      }),
    });
    return resposta.ok ? 'cumprimentou' : 'falhou';
  } catch {
    return 'falhou';
  }
}
