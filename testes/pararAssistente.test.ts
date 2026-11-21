import { afterEach, describe, expect, it, vi } from 'vitest';
import { pararAssistente } from '@/lib/pararAssistente';

// A Dona Leda do Gemini mora no endereço de teste da Agora; a de três peças, no normal.
// O pedido de parar vai pros dois, e basta um aceitar.

const APP = 'a'.repeat(32);
const CERT = 'b'.repeat(32);
const TESTE = 'partner.ai.agora.io/preview';
const pedidos: { url: string; recurso: string | null }[] = [];

function agoraResponde(normal: number, teste: number) {
  vi.stubGlobal('fetch', async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada);
    const recurso = new Headers(init?.headers ?? (entrada instanceof Request ? entrada.headers : undefined)).get('agora-feature');
    pedidos.push({ url, recurso });
    const status = url.includes(TESTE) ? teste : normal;
    const corpo = status === 404 ? { detail: 'The session was not found', reason: 'TaskNotFound' } : status >= 400 ? { detail: 'erro', reason: 'Erro' } : {};
    return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  pedidos.length = 0;
});

describe('tirar a Dona Leda da sala', () => {
  it('a do Gemini sai pelo endereço de teste, mesmo com o normal dizendo que não achou', async () => {
    agoraResponde(404, 200);
    expect(await pararAssistente(APP, CERT, 'AGENTE1')).toBe('parou');
    const doTeste = pedidos.find((p) => p.url.includes(TESTE));
    expect(doTeste?.url).toContain('/agents/AGENTE1/leave');
    expect(doTeste?.recurso).toBe('gemini-live');
    expect(pedidos.some((p) => !p.url.includes(TESTE) && p.url.endsWith('/agents/AGENTE1/leave'))).toBe(true);
  });

  it('a de três peças sai pelo endereço normal', async () => {
    agoraResponde(200, 404);
    expect(await pararAssistente(APP, CERT, 'AGENTE2')).toBe('parou');
  });

  it('se nenhum dos dois acha, ela já tinha saído', async () => {
    agoraResponde(404, 404);
    expect(await pararAssistente(APP, CERT, 'AGENTE3')).toBe('ja_tinha_saido');
  });

  it('erro de verdade não passa por "já tinha saído"', async () => {
    agoraResponde(500, 404);
    await expect(pararAssistente(APP, CERT, 'AGENTE4')).rejects.toBeTruthy();
  });
});
