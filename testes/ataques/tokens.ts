// Conta os tokens das instruções da Dona Leda com a ficha da dona Helena de exemplo,
// pela contagem oficial do Google. O Gemini cobra esse texto de novo a cada fala.
//
//   pnpm tsx testes/ataques/tokens.ts

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { baseDeExemplo } from '@/lib/exemplo';
import { montarInstrucoes } from '@/lib/persona';

const RAIZ = resolve(__dirname, '..', '..');
if (existsSync(join(RAIZ, '.env.local'))) process.loadEnvFile(join(RAIZ, '.env.local'));

async function contar(texto: string): Promise<number | null> {
  const chave = process.env.LIA_GEMINI_KEY?.trim();
  if (!chave) return null;
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:countTokens', {
    method: 'POST',
    headers: { 'x-goog-api-key': chave, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: texto }] }] }),
  });
  if (!r.ok) return null;
  return ((await r.json()) as { totalTokens?: number }).totalTokens ?? null;
}

async function main() {
  const agora = new Date();
  for (const primeira of [false, true]) {
    const base = baseDeExemplo(agora, 'contagem');
    base.idoso = { ...base.idoso, primeiraConversaFeita: !primeira };
    for (const comAcoes of [true, false]) {
      const texto = montarInstrucoes(base, agora, comAcoes);
      const tokens = await contar(texto);
      console.log(
        `${primeira ? 'primeira conversa' : 'conversa comum   '} ${comAcoes ? 'com ações' : 'sem ações'}: ${tokens ?? '?'} tokens, ${texto.length} letras, ${texto.split(/\s+/).length} palavras`,
      );
    }
  }
}

void main();
