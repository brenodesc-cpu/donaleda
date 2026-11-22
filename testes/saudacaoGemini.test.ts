import { afterEach, describe, expect, it, vi } from 'vitest';
import { limparFalasDaSessao } from '@/lib/posConversa';
import { AVISO_DE_ATENDIMENTO, cumprimentarAoEntrar, ehAvisoInterno } from '@/lib/saudacaoGemini';

// A Dona Leda do Gemini não fala sozinha quando a ligação abre (medido em 21/11).
// O servidor espera ela entrar na sala e pede a saudação, a não ser que ela já tenha falado.

const APP = 'a'.repeat(32);
const CERT = 'b'.repeat(32);
const RAPIDO = { esperaMs: 300, passoMs: 10, folgaMs: 0 };
const pedidos: { url: string; metodo: string; recurso: string | null; corpo: string }[] = [];

function agora(estados: string[], historico: unknown[] = []) {
  let i = 0;
  vi.stubGlobal('fetch', async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada);
    pedidos.push({ url, metodo: init?.method ?? 'GET', recurso: new Headers(init?.headers).get('agora-feature'), corpo: String(init?.body ?? '') });
    const json = (corpo: unknown) => new Response(JSON.stringify(corpo), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (url.endsWith('/history')) return json({ contents: historico });
    if (url.endsWith('/think')) return json({});
    return json({ status: estados[Math.min(i++, estados.length - 1)] });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  pedidos.length = 0;
});

describe('a Dona Leda do Gemini cumprimenta quando a ligação abre', () => {
  it('espera ela entrar na sala e pede a saudação pelo endereço do Gemini', async () => {
    agora(['STARTING', 'RUNNING']);
    expect(await cumprimentarAoEntrar(APP, CERT, 'AGENTE1', 'canal-1', RAPIDO)).toBe('cumprimentou');
    const pedido = pedidos.find((p) => p.url.endsWith('/agents/AGENTE1/think'));
    expect(pedido?.url).toContain('partner.ai.agora.io/preview');
    expect(pedido?.metodo).toBe('POST');
    expect(pedido?.recurso).toBe('gemini-live');
    expect(JSON.parse(pedido!.corpo).text).toBe(AVISO_DE_ATENDIMENTO);
  });

  it('se ela já falou, não pede de novo', async () => {
    agora(['RUNNING'], [{ role: 'user', content: 'alô' }, { role: 'assistant', content: 'Boa noite, dona Helena!' }]);
    expect(await cumprimentarAoEntrar(APP, CERT, 'AGENTE2', 'canal-2', RAPIDO)).toBe('ja_falou');
    expect(pedidos.some((p) => p.url.endsWith('/think'))).toBe(false);
  });

  it('se ela não entrou, não pede', async () => {
    agora(['STOPPED']);
    expect(await cumprimentarAoEntrar(APP, CERT, 'AGENTE3', 'canal-3', RAPIDO)).toBe('nao_entrou');
    expect(pedidos.some((p) => p.url.endsWith('/think'))).toBe(false);
  });
});

describe('o aviso interno não vira fala do idoso', () => {
  it('reconhece o aviso', () => {
    expect(ehAvisoInterno(AVISO_DE_ATENDIMENTO)).toBe(true);
    expect(ehAvisoInterno('Alô, Dona Leda?')).toBe(false);
  });

  it('a leitura do fim da ligação descarta o aviso e mantém o resto', () => {
    const falas = limparFalasDaSessao([
      { quem: 'idoso', texto: AVISO_DE_ATENDIMENTO },
      { quem: 'assistente', texto: 'Boa noite, dona Helena!' },
      { quem: 'idoso', texto: 'Boa noite, minha filha.' },
    ]);
    expect(falas).toEqual([
      { quem: 'assistente', texto: 'Boa noite, dona Helena!' },
      { quem: 'idoso', texto: 'Boa noite, minha filha.' },
    ]);
  });
});
