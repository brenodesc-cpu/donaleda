// As ações da Dona Leda na demonstração pública, no mesmo protocolo de /api/mcp
// (JSON-RPC por "streamable HTTP"), chamadas pela nuvem da Agora. Elas respondem
// com a mesma frase da ação de verdade e não anotam nada: a ficha do fim sai das
// falas, em memória (app/api/experimente/fim).

import { NextResponse } from 'next/server';
import { chaveDaDemonstracaoConfere, respostaDaAcaoDeDemonstracao } from '@/lib/demonstracao';
import { FERRAMENTAS } from '@/lib/ferramentas';

export const dynamic = 'force-dynamic';

const VERSOES = ['2025-06-18', '2025-03-26', '2024-11-05'];

interface Pedido {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function chaveRecebida(request: Request): string | null {
  const cabecalho = request.headers.get('authorization');
  if (cabecalho?.toLowerCase().startsWith('bearer ')) return cabecalho.slice(7).trim();
  return new URL(request.url).searchParams.get('chave');
}

function atender(pedido: Pedido): Record<string, unknown> | null {
  const { id = null, method, params = {} } = pedido;
  if (method === 'initialize') {
    const pedida = typeof params.protocolVersion === 'string' ? params.protocolVersion : '';
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: VERSOES.includes(pedida) ? pedida : VERSOES[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'donaleda', version: '0.2.0' },
      },
    };
  }
  if (pedido.id === undefined) return null;
  if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
  if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: FERRAMENTAS } };
  if (method === 'tools/call') {
    const nome = typeof params.name === 'string' ? params.name : '';
    return {
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: respostaDaAcaoDeDemonstracao(nome) }], isError: false },
    };
  }
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Método desconhecido: ${method}` } };
}

export async function POST(request: Request) {
  if (!chaveDaDemonstracaoConfere(chaveRecebida(request))) {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Chave inválida' } },
      { status: 401 },
    );
  }
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } },
      { status: 400 },
    );
  }
  const emLote = Array.isArray(corpo);
  const respostas = ((emLote ? corpo : [corpo]) as Pedido[])
    .map((pedido) => atender(pedido ?? {}))
    .filter((r): r is Record<string, unknown> => r !== null);
  if (respostas.length === 0) return new Response(null, { status: 202 });

  const dados = emLote ? respostas : respostas[0];
  const aceita = request.headers.get('accept') ?? '';
  if (!aceita.includes('application/json') && aceita.includes('text/event-stream')) {
    return new Response(`event: message\ndata: ${JSON.stringify(dados)}\n\n`, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' },
    });
  }
  return NextResponse.json(dados, { headers: { 'Cache-Control': 'no-store' } });
}

export function GET() {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
}
