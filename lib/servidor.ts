// Configuração que só o servidor enxerga: chaves da Agora, endereço público e
// a chave que protege as ações da assistente.

import { createHmac, timingSafeEqual } from 'node:crypto';

export function exigirVariavel(nome: string): string {
  const valor = process.env[nome];
  if (!valor) throw new Error(`Falta a variável de ambiente ${nome}`);
  return valor;
}

/**
 * Endereço público deste servidor (https://...). A Agora precisa dele pra chamar
 * as ações em /api/mcp. Sem ele a conversa funciona, mas a assistente não anota nada.
 */
export function urlPublica(): string | null {
  const direta = process.env.LIA_URL_PUBLICA?.trim().replace(/\/+$/, '');
  if (direta) return direta;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : null;
}

/**
 * Chave que a Agora manda junto de cada ação, uma por idoso: um HMAC do id do idoso
 * com o certificado do app. Quem não tem o certificado não escreve em ficha nenhuma,
 * e a chave de um idoso não abre a ficha de outro.
 */
export function chaveDasFerramentas(idosoId: string): string | null {
  const segredo =
    process.env.LIA_CHAVE_DAS_FERRAMENTAS?.trim() || process.env.NEXT_AGORA_APP_CERTIFICATE;
  if (!segredo || !idosoId) return null;
  return createHmac('sha256', `donaleda-ferramentas:${segredo}`)
    .update(idosoId)
    .digest('hex')
    .slice(0, 40);
}

export function chaveConfere(
  idosoId: string | null | undefined,
  recebida: string | null | undefined,
): boolean {
  if (!idosoId || !recebida) return false;
  const certa = chaveDasFerramentas(idosoId);
  if (!certa) return false;
  const a = Buffer.from(recebida);
  const b = Buffer.from(certa);
  return a.length === b.length && timingSafeEqual(a, b);
}
