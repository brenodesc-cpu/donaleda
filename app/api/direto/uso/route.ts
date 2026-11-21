// A conta de tokens de uma ligação do modo direto. A voz vai do aparelho direto
// pro Google, então quem soma os tokens é o aparelho, e ele manda a conta pra cá
// uma vez, no fim da ligação. Ela fica guardada junto da conversa, com o custo
// em dólares e o custo por minuto, que é o número que prova a operação.

import { NextResponse } from 'next/server';
import { mudarBase } from '@/lib/dados';
import { custoEmDolar, custoPorMinuto, limparSegundos, limparUso } from '@/lib/direto';
import { exigirAparelho } from '@/lib/sessao';
import type { PedidoDeUso, RespostaDoEvento, UsoDaConversa } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;
  const idosoId = aparelho.valor;

  let pedido: PedidoDeUso;
  try {
    pedido = (await request.json()) as PedidoDeUso;
  } catch {
    return NextResponse.json({ ok: false } satisfies RespostaDoEvento, { status: 400 });
  }

  const uso = limparUso(pedido?.uso);
  const segundos = limparSegundos(pedido?.segundos);
  if (!uso || segundos === null || typeof pedido.conversaId !== 'string') {
    return NextResponse.json({ ok: false } satisfies RespostaDoEvento, { status: 400 });
  }

  const conta: UsoDaConversa = {
    ...uso,
    segundos,
    dolares: Number(custoEmDolar(uso).toFixed(6)),
    dolaresPorMinuto: (() => {
      const porMinuto = custoPorMinuto(uso, segundos);
      return porMinuto === null ? null : Number(porMinuto.toFixed(6));
    })(),
    modelo: process.env.LIA_MODELO_GEMINI?.trim() || 'models/gemini-3.8-live',
  };

  const conversa = await mudarBase(idosoId, (base) => {
    const achada = base.conversas.find((c) => c.id === pedido.conversaId);
    if (!achada) return null;
    achada.uso = conta;
    return achada;
  });
  if (conversa) console.log('[direto] conta da ligação', pedido.conversaId, JSON.stringify(conta));

  return NextResponse.json({ ok: Boolean(conversa) } satisfies RespostaDoEvento, {
    status: conversa ? 200 : 404,
  });
}
