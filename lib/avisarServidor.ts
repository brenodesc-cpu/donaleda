import { fetchDoAparelho } from '@/lib/aparelho';
import type { EventoDaConversa } from '@/lib/tipos';

/**
 * Manda um evento da conversa pro servidor com 1 retry automático em falha de rede/5xx.
 * Usa `keepalive: true` apenas quando `aoSairDaPagina` é true (no iOS Safari / Android,
 * keepalive tem limite de 64 KB e falha mais facilmente em respostas longas como extração pós-conversa).
 */
export async function avisarServidor(
  evento: EventoDaConversa,
  opcoes?: { aoSairDaPagina?: boolean },
): Promise<void> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evento),
    ...(opcoes?.aoSairDaPagina ? { keepalive: true } : {}),
  };

  const tentativas = opcoes?.aoSairDaPagina ? 1 : 2;
  for (let i = 1; i <= tentativas; i += 1) {
    try {
      const res = await fetchDoAparelho('/api/conversa', init);
      if (res.ok || res.status < 500) return;
    } catch {
      // Tenta de novo abaixo se ainda restar tentativa.
    }
    if (i < tentativas) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
}
