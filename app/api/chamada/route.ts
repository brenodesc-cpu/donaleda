// O aparelho do idoso pergunta aqui, a cada 2 segundos, se a assistente está
// ligando. É também por aqui que ele conta que atendeu ou que tocou em "Agora não".

import { NextResponse } from 'next/server';
import { avancarChamadas, responderChamada, situacaoDaChamada } from '@/lib/chamadas';
import { mudarBase, mudarBaseQuando } from '@/lib/dados';
import { exigirAparelho } from '@/lib/sessao';
import type { RespostaDaChamada } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;
  const agora = new Date();
  const situacao = await mudarBaseQuando(aparelho.valor, (base) => {
    const { mudou } = avancarChamadas(base, agora);
    return { gravar: mudou, resultado: situacaoDaChamada(base, agora) };
  });
  return NextResponse.json(situacao, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;

  let resposta: RespostaDaChamada;
  try {
    resposta = (await request.json()) as RespostaDaChamada;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const acaoValida = resposta?.acao === 'atender' || resposta?.acao === 'recusar';
  if (!acaoValida || typeof resposta.chamadaId !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const chamada = await mudarBase(aparelho.valor, (base) =>
    responderChamada(base, resposta.chamadaId, resposta.acao),
  );
  if (!chamada) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, chamada });
}
