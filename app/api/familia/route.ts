// O painel da família lê tudo daqui e manda as ações dele por aqui: marcar aviso
// como visto, pedir uma ligação agora e trocar as horas das ligações.
// A conversa inteira não existe no servidor, então não tem como sair por aqui.

import { NextResponse } from 'next/server';
import { arrumarHorarios, avancarChamadas, pedirChamadaDaFamilia } from '@/lib/chamadas';
import { montarPainel, mudarBase, mudarBaseQuando } from '@/lib/dados';
import type { AcaoDaFamilia } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

export async function GET() {
  const agora = new Date();
  const painel = await mudarBaseQuando((base) => {
    const { mudou } = avancarChamadas(base, agora);
    return { gravar: mudou, resultado: montarPainel(base, agora) };
  });
  return NextResponse.json(painel, { headers: { 'Cache-Control': 'no-store' } });
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

  if (acao?.acao === 'ligar') {
    const chamada = await mudarBase((base) => pedirChamadaDaFamilia(base));
    // 409: já está tocando ou os dois já estão conversando.
    if (!chamada) return NextResponse.json({ ok: false }, { status: 409 });
    return NextResponse.json({ ok: true, chamada });
  }

  if (acao?.acao === 'horarios') {
    const horarios = arrumarHorarios(acao.horarios);
    await mudarBase((base) => {
      base.idoso.horariosDeLigacao = horarios;
    });
    return NextResponse.json({ ok: true, horarios });
  }

  if (acao?.acao === 'atender_sozinho' && typeof acao.ligado === 'boolean') {
    await mudarBase((base) => {
      base.idoso.atenderSozinho = acao.ligado;
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
