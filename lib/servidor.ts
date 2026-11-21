// Configuração que só o servidor enxerga: chaves da Agora, endereço público e
// a chave que protege as ações da assistente.

import { createHash, timingSafeEqual } from 'node:crypto';

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
 * Chave que a Agora manda junto de cada ação. Sai do certificado do app, então
 * não é mais uma coisa pra configurar, e quem não tem o certificado não escreve na ficha.
 */
export function chaveDasFerramentas(): string | null {
  const propria = process.env.LIA_CHAVE_DAS_FERRAMENTAS?.trim();
  if (propria) return propria;
  const certificado = process.env.NEXT_AGORA_APP_CERTIFICATE;
  if (!certificado) return null;
  return createHash('sha256').update(`lia-ferramentas:${certificado}`).digest('hex').slice(0, 40);
}

export function chaveConfere(recebida: string | null | undefined): boolean {
  const certa = chaveDasFerramentas();
  if (!certa || !recebida) return false;
  const a = Buffer.from(recebida);
  const b = Buffer.from(certa);
  return a.length === b.length && timingSafeEqual(a, b);
}
