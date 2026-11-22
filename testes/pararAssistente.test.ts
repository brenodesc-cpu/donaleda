import { afterEach, describe, expect, it, vi } from 'vitest';
import { avisarFimDaLigacao, INSTRUCAO_DE_DESPEDIDA, pararAssistente } from '@/lib/pararAssistente';

// A Dona Leda do Gemini mora no endereço de teste da Agora; a de três peças, no normal.
// O pedido de parar vai pros dois, e basta um aceitar.

const APP = 'a'.repeat(32);
const CERT = 'b'.repeat(32);
const TESTE = 'partner.ai.agora.io/preview';
const pedidos: { url: string; recurso: string | null; corpo: string }[] = [];

function agoraResponde(normal: number, teste: number) {
  vi.stubGlobal('fetch', async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada);
    const recurso = new Headers(init?.headers ?? (entrada instanceof Request ? entrada.headers : undefined)).get('agora-feature');
    pedidos.push({ url, recurso, corpo: typeof init?.body === 'string' ? init.body : '' });
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

describe('o aviso de fim da ligação', () => {
  it('vai pros dois endereços, e o do Gemini leva o cabeçalho certo', async () => {
    agoraResponde(404, 200);
    expect(await avisarFimDaLigacao(APP, CERT, 'AGENTE5', 'canal-1')).toBe('avisou');
    const doTeste = pedidos.find((p) => p.url.includes(TESTE));
    expect(doTeste?.url).toContain('/agents/AGENTE5/think');
    expect(doTeste?.recurso).toBe('gemini-live');
    expect(pedidos.some((p) => !p.url.includes(TESTE) && p.url.endsWith('/agents/AGENTE5/think'))).toBe(true);
  });

  it('manda cuidar primeiro de queda, golpe, mal-estar e tristeza forte', () => {
    expect(INSTRUCAO_DE_DESPEDIDA).toMatch(/mal-estar, queda, golpe ou tristeza forte, ignore este aviso/);
  });

  it('se nenhum endereço aceita, fica em silêncio e não fala despedida nenhuma', async () => {
    agoraResponde(500, 500);
    expect(await avisarFimDaLigacao(APP, CERT, 'AGENTE6')).toBe('ignorado');
    expect(pedidos.some((p) => p.url.includes('/speak'))).toBe(false);
  });

  it('se ela já saiu dos dois, diz que já tinha saído', async () => {
    agoraResponde(404, 404);
    expect(await avisarFimDaLigacao(APP, CERT, 'AGENTE7')).toBe('ja_tinha_saido');
  });
});
