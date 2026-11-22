// O aparelho do idoso pergunta aqui, a cada 2 segundos, se a assistente está
// ligando. É também por aqui que ele conta que atendeu ou que tocou em "Agora não".

import { NextResponse } from 'next/server';
import { avancarChamadas, chamadaTocando, responderChamada, situacaoDaChamada } from '@/lib/chamadas';
import { mudarBase, mudarBaseQuando, registrarEscalonamento } from '@/lib/dados';
import { depois } from '@/lib/familiaNaLigacao';
import { exigirAparelho } from '@/lib/sessao';
import {
  dispararConviteDeChamada,
  dispararEscalonamentoEmMassa,
  notificarFamiliaPorPush,
} from '@/lib/sinalizacaoChamada';
import type { RespostaDaChamada } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;
  const agora = new Date();
  const res = await mudarBaseQuando(aparelho.valor, (base) => {
    const antesId = chamadaTocando(base)?.id ?? null;
    const { mudou, escalarChamada } = avancarChamadas(base, agora);
    const depoisChamada = chamadaTocando(base);
    const novaChamada = depoisChamada && depoisChamada.id !== antesId ? depoisChamada : null;
    return {
      gravar: mudou,
      resultado: {
        situacao: situacaoDaChamada(base, agora),
        novaChamada,
        aparelhosPush: novaChamada ? base.aparelhosPush : undefined,
        escalarChamada,
        baseSnapshot: escalarChamada ? structuredClone(base) : null,
      },
    };
  });
  if (res.novaChamada) {
    const nova = res.novaChamada;
    const aparelhos = res.aparelhosPush;
    depois(() => dispararConviteDeChamada(aparelho.valor, aparelhos, nova));
  }
  if (res.escalarChamada && res.baseSnapshot) {
    const esc = await dispararEscalonamentoEmMassa(
      aparelho.valor,
      res.baseSnapshot,
      res.escalarChamada,
      agora,
    );
    await mudarBase(aparelho.valor, (b) => registrarEscalonamento(b, esc));
  }
  return NextResponse.json(res.situacao, { headers: { 'Cache-Control': 'no-store' } });
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

  const res = await mudarBase(aparelho.valor, (base) => {
    const antes = base.alertas.length;
    const chamada = responderChamada(base, resposta.chamadaId, resposta.acao);
    const novoAlerta = base.alertas.length > antes ? base.alertas[base.alertas.length - 1] : null;
    return {
      chamada,
      novoAlerta,
      pushSnapshot:
        novoAlerta && (base.aparelhosFamiliaPush?.length ?? 0) > 0 ? structuredClone(base) : null,
    };
  });
  if (!res.chamada) return NextResponse.json({ ok: false }, { status: 404 });
  if (res.novoAlerta && res.pushSnapshot) {
    const alerta = res.novoAlerta;
    const baseSnap = res.pushSnapshot;
    depois(() =>
      notificarFamiliaPorPush(baseSnap, {
        alertaId: alerta.id,
        titulo: `Status: ${baseSnap.idoso.tratamento}`,
        mensagem: alerta.texto,
        gravidade: alerta.gravidade,
        tipo: alerta.tipo,
      }),
    );
  }
  return NextResponse.json({ ok: true, chamada: res.chamada });
}
