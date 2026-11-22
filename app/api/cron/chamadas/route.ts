// Agendador das ligações de hora marcada (horário de Brasília).
// Pode ser chamado a cada minuto por um Cron (Vercel Pro, GitHub Actions ou cron-job.org)
// com cabeçalho `Authorization: Bearer <CRON_SECRET>`. Quando chega a hora marcada de um
// idoso, cria a chamada e dispara o convite via Agora Signaling + Push (FCM / APNs VoIP)
// mesmo que o app esteja fechado.

import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { avancarChamadas, chamadaTocando } from '@/lib/chamadas';
import { listarFichas, mudarBase, mudarBaseQuando, registrarEscalonamento } from '@/lib/dados';
import {
  dispararConviteDeChamada,
  dispararEscalonamentoEmMassa,
} from '@/lib/sinalizacaoChamada';

export const dynamic = 'force-dynamic';

function autorizado(request: Request): boolean {
  const segredo = process.env.CRON_SECRET?.trim();
  if (!segredo) return false;
  const header = request.headers.get('authorization')?.trim() ?? '';
  const esperado = `Bearer ${segredo}`;
  const a = Buffer.from(header);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ ok: false, erro: 'nao_autorizado' }, { status: 401 });
  }

  const agora = new Date();
  const fichas = await listarFichas();
  let verificadas = 0;
  let disparadas = 0;
  let escaladas = 0;

  for (const idosoId of fichas) {
    try {
      const resultado = await mudarBaseQuando(idosoId, (base) => {
        const antesId = chamadaTocando(base)?.id ?? null;
        const { mudou, escalarChamada } = avancarChamadas(base, agora);
        const depois = chamadaTocando(base);
        const nova = depois && depois.id !== antesId ? depois : null;
        return {
          gravar: mudou,
          resultado: {
            nova,
            escalarChamada,
            baseSnapshot: escalarChamada ? structuredClone(base) : null,
            aparelhosPush: base.aparelhosPush,
          },
        };
      });
      verificadas += 1;

      if (resultado.nova) {
        await dispararConviteDeChamada(idosoId, resultado.aparelhosPush, resultado.nova);
        disparadas += 1;
      }

      if (resultado.escalarChamada && resultado.baseSnapshot) {
        const esc = await dispararEscalonamentoEmMassa(
          idosoId,
          resultado.baseSnapshot,
          resultado.escalarChamada,
          agora,
        );
        await mudarBase(idosoId, (b) => registrarEscalonamento(b, esc));
        escaladas += 1;
      }
    } catch {
      // Falha em uma ficha não impede o agendamento dos demais idosos.
    }
  }

  return NextResponse.json(
    { ok: true, verificadas, disparadas, escaladas, em: agora.toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
