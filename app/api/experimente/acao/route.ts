// As ações da demonstração no modo direto: o Gemini pede a ação ao aparelho do
// visitante e o aparelho repassa pra cá. Responde a mesma frase da ação de
// verdade e não anota nada.

import { NextResponse } from 'next/server';
import { respostaDaAcaoDeDemonstracao } from '@/lib/demonstracao';
import type { PedidoDeAcao, RespostaDaAcao } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const pedido = (await request.json().catch(() => null)) as Partial<PedidoDeAcao> | null;
  const nome = typeof pedido?.nome === 'string' ? pedido.nome : '';
  return NextResponse.json({ ok: true, texto: respostaDaAcaoDeDemonstracao(nome) } satisfies RespostaDaAcao);
}
