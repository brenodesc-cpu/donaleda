// O passe temporário que abre a conversa do modo direto. O aparelho não pode
// carregar a chave do Google (LIA_GEMINI_KEY), então o servidor troca ela por um
// passe de uso único: abre uma conversa só, tem dois minutos pra começar e vence
// em meia hora. É o mesmo pedido que o Virte faz em produção.

/** Uso único, trinta minutos de vida e dois pra conexão começar. */
const MINUTOS_DE_VIDA = 30;
const MINUTOS_PRA_CONECTAR = 2;
const ESPERA_ENTRE_BATIDAS_MS = 400;

/** Recusas em que o problema é do Google e costuma passar sozinho. O limite de uso (429) fica de fora. */
const ENGASGO_PASSAGEIRO = new Set([500, 502, 503, 504]);

export type Passe =
  | { ok: true; token: string }
  | { ok: false; status: number; detalhe: string };

export async function pedirPasseDoGemini(
  chave: string,
  opcoes: {
    fetchImpl?: typeof fetch;
    esperar?: (ms: number) => Promise<void>;
    agora?: () => number;
  } = {},
): Promise<Passe> {
  const chamar = opcoes.fetchImpl ?? fetch;
  const esperar =
    opcoes.esperar ?? ((ms: number) => new Promise<void>((ok) => setTimeout(ok, ms)));
  const agora = opcoes.agora ?? (() => Date.now());

  let ultima: Passe = { ok: false, status: 0, detalhe: 'sem resposta do Google' };

  for (let batida = 0; batida < 2; batida += 1) {
    if (batida > 0) await esperar(ESPERA_ENTRE_BATIDAS_MS);
    try {
      const resposta = await chamar('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
        method: 'POST',
        headers: { 'x-goog-api-key': chave, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uses: 1,
          expireTime: new Date(agora() + MINUTOS_DE_VIDA * 60_000).toISOString(),
          newSessionExpireTime: new Date(agora() + MINUTOS_PRA_CONECTAR * 60_000).toISOString(),
        }),
      });

      if (resposta.ok) {
        const corpo = (await resposta.json()) as { name?: string };
        if (corpo.name) return { ok: true, token: corpo.name };
        return { ok: false, status: resposta.status, detalhe: 'o Google respondeu sem o passe' };
      }

      const corpo = await resposta.text();
      ultima = { ok: false, status: resposta.status, detalhe: corpo.slice(0, 300) };
      if (!ENGASGO_PASSAGEIRO.has(resposta.status)) return ultima;
    } catch (erro) {
      ultima = { ok: false, status: 0, detalhe: String(erro).slice(0, 300) };
    }
  }

  return ultima;
}
