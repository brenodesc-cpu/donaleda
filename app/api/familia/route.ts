// O painel da família lê tudo daqui. Devolve o resumo, os avisos e a semana.
// A conversa inteira não existe no servidor, então não tem como sair por aqui.

import { NextResponse } from 'next/server';
import { lerBase, montarPainel, mudarBase } from '@/lib/dados';
import type { AcaoDaFamilia } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = await lerBase();
  return NextResponse.json(montarPainel(base), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: Request) {
  let acao: AcaoDaFamilia;
  try {
    acao = (await request.json()) as AcaoDaFamilia;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (acao?.acao === 'visto' && typeof acao.alertaId === 'string') {
    const achou = await mudarBase((base) => {
      const alerta = base.alertas.find((a) => a.id === acao.alertaId);
      if (alerta) alerta.visto = true;
      return Boolean(alerta);
    });
    return NextResponse.json({ ok: achou }, { status: achou ? 200 : 404 });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
