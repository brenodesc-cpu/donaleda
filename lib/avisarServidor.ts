import { fetchDoAparelho } from '@/lib/aparelho';
import type { EventoDaConversa } from '@/lib/tipos';

/** Manda um evento da conversa pro servidor. Nunca lança erro: a conversa segue mesmo sem ele. */
export function avisarServidor(evento: EventoDaConversa): Promise<void> {
  return fetchDoAparelho('/api/conversa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evento),
    // keepalive deixa o aviso sair mesmo se a pessoa fechar a aba logo depois.
    keepalive: true,
  })
    .then(() => undefined)
    .catch(() => undefined);
}
