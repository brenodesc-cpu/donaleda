// Endereço das ações da assistente, no protocolo MCP (transporte "streamable HTTP").
// Quem chama é a nuvem da Agora, no meio da conversa, quando o modelo decide agir.
// O endereço leva o idoso (?idoso=) e a chave dele (?chave=, HMAC do id).
// Implementação direta de JSON-RPC, sem estado entre chamadas.

import { NextResponse } from 'next/server';
import { FERRAMENTAS, FerramentaDesconhecida, executarFerramenta } from '@/lib/ferramentas';
import { chaveConfere } from '@/lib/servidor';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';

const VERSOES = ['2025-06-18', '2025-03-26', '2024-11-05'];

interface Pedido {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

type Resposta =
  | { jsonrpc: '2.0'; id: string | number | null; result: unknown }
  | { jsonrpc: '2.0'; id: string | number | null; error: { code: number; message: string } };

function chaveRecebida(request: Request): string | null {
  const cabecalho = request.headers.get('authorization');
  if (cabecalho?.toLowerCase().startsWith('bearer ')) return cabecalho.slice(7).trim();
  return new URL(request.url).searchParams.get('chave');
}

async function atender(idosoId: string, pedido: Pedido): Promise<Resposta | null> {
  const { id = null, method, params = {} } = pedido;
  // Notificação (sem id) não tem resposta.
  const ehNotificacao = pedido.id === undefined;

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

  if (ehNotificacao) return null;

  if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: FERRAMENTAS } };
  }

  if (method === 'tools/call') {
    const nome = typeof params.name === 'string' ? params.name : '';
    try {
      const texto = await executarFerramenta(idosoId, nome, params.arguments);
      return {
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: texto }], isError: false },
      };
    } catch (erro) {
      if (erro instanceof FerramentaDesconhecida) {
        return { jsonrpc: '2.0', id, error: { code: -32602, message: erro.message } };
      }
      console.error('[mcp] a ação falhou:', nome, erro);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: 'Não consegui anotar agora. Siga a conversa normalmente.' }],
          isError: true,
        },
      };
    }
  }

  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Método desconhecido: ${method}` } };
}

export async function POST(request: Request) {
  const idosoId = new URL(request.url).searchParams.get('idoso');
  if (!chaveConfere(idosoId, chaveRecebida(request)) || !idosoId) {
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
  const pedidos = (emLote ? corpo : [corpo]) as Pedido[];
  const respostas: Resposta[] = [];
  for (const pedido of pedidos) {
    const resposta = await atender(idosoId, pedido ?? {});
    if (resposta) respostas.push(resposta);
  }

  if (respostas.length === 0) return new Response(null, { status: 202 });

  const dados = emLote ? respostas : respostas[0];
  const aceita = request.headers.get('accept') ?? '';
  // Cliente que só aceita fluxo de eventos recebe a mesma resposta nesse formato.
  if (!aceita.includes('application/json') && aceita.includes('text/event-stream')) {
    return new Response(`event: message\ndata: ${JSON.stringify(dados)}\n\n`, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' },
    });
  }
  return NextResponse.json(dados, { headers: { 'Cache-Control': 'no-store' } });
}

// Este servidor não abre fluxo por GET nem guarda sessão.
export function GET() {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
}

export function DELETE() {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
}
