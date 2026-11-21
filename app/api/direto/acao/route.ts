// As ações da assistente no modo direto. No motor da Agora quem chama as ações é
// a nuvem dela, por /api/mcp. Aqui o Gemini pede a ação ao aparelho, e o aparelho
// repassa pra cá com o token dele: a ação só mexe na ficha do idoso daquele
// aparelho, e a família que desliga o aparelho corta as ações junto.

import { NextResponse } from 'next/server';
import { FerramentaDesconhecida, executarFerramenta } from '@/lib/ferramentas';
import { exigirAparelho } from '@/lib/sessao';
import type { PedidoDeAcao, RespostaDaAcao } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;
  const idosoId = aparelho.valor;

  let pedido: PedidoDeAcao;
  try {
    pedido = (await request.json()) as PedidoDeAcao;
  } catch {
    return NextResponse.json({ ok: false, texto: 'Pedido inválido.' } satisfies RespostaDaAcao, { status: 400 });
  }
  const nome = typeof pedido?.nome === 'string' ? pedido.nome : '';

  try {
    const texto = await executarFerramenta(idosoId, nome, pedido.argumentos);
    return NextResponse.json({ ok: true, texto } satisfies RespostaDaAcao);
  } catch (erro) {
    if (erro instanceof FerramentaDesconhecida) {
      return NextResponse.json({ ok: false, texto: erro.message } satisfies RespostaDaAcao, { status: 400 });
    }
    console.error('[direto] a ação falhou:', nome, erro);
    // A mesma frase de /api/mcp: a conversa segue mesmo quando a anotação falha.
    return NextResponse.json({
      ok: false,
      texto: 'Não consegui anotar agora. Siga a conversa normalmente.',
    } satisfies RespostaDaAcao);
  }
}
