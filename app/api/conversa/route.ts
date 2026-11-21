// A tela do idoso avisa aqui o que acontece na conversa: cada fala dele e o fim.
// A fala passa pelas regras fixas de segurança e é descartada. Só fica guardada
// quando uma regra dispara, dentro do alerta que vai pra família.

import { NextResponse } from 'next/server';
import { ligacaoSemFala } from '@/lib/chamadas';
import { criarAlerta, fecharConversa, lerBase, mudarBase } from '@/lib/dados';
import { limparTempos } from '@/lib/medicao';
import {
  aplicarExtracaoNaBase,
  extrairConhecimentoComIA,
  limparFalasDaSessao,
} from '@/lib/posConversa';
import { avaliarFala } from '@/lib/regras';
import { exigirAparelho } from '@/lib/sessao';
import type { Alerta, EventoDaConversa, RespostaDoEvento } from '@/lib/tipos';
import { ehAvisoInterno } from '@/lib/saudacaoGemini';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;
  const idosoId = aparelho.valor;

  let evento: EventoDaConversa;
  try {
    evento = (await request.json()) as EventoDaConversa;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!evento || typeof evento.conversaId !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (evento.tipo === 'fim') {
    const falas = limparFalasDaSessao(evento.falas);
    let extracao = {};
    if (falas.some((f) => f.quem === 'idoso')) {
      try {
        const atual = await lerBase(idosoId);
        // Quando outra pessoa atendeu, nada dela entra na ficha: a leitura por IA nem roda.
        const outraPessoa = atual.conversas.find((c) => c.id === evento.conversaId)?.outraPessoa;
        if (!outraPessoa) extracao = await extrairConhecimentoComIA(atual.idoso.tratamento, falas);
      } catch {
        extracao = {};
      }
    }

    const conversa = await mudarBase(idosoId, (base) => {
      if (falas.length > 0) {
        aplicarExtracaoNaBase(base, evento.conversaId, falas, extracao);
      }
      const fechada = fecharConversa(base, evento.conversaId);
      if (fechada) ligacaoSemFala(base, evento.conversaId);
      return fechada;
    });
    return NextResponse.json({ ok: Boolean(conversa) } satisfies RespostaDoEvento, {
      status: conversa ? 200 : 404,
    });
  }

  // O tempo de resposta medido pela Agora chega uma vez, no fim da ligação.
  if (evento.tipo === 'tempos') {
    const tempos = limparTempos(evento.tempos);
    if (!tempos) return NextResponse.json({ ok: false }, { status: 400 });
    const conversa = await mudarBase(idosoId, (base) => {
      const achada = base.conversas.find((c) => c.id === evento.conversaId);
      if (!achada) return null;
      achada.tempos = tempos;
      return achada;
    });
    return NextResponse.json({ ok: Boolean(conversa) } satisfies RespostaDoEvento, {
      status: conversa ? 200 : 404,
    });
  }

  if (evento.tipo === 'fala') {
    const fala = typeof evento.texto === 'string' ? evento.texto.slice(0, 2000) : '';
    // O aviso interno que pede a saudação no Gemini não é fala do idoso.
    if (ehAvisoInterno(fala)) return NextResponse.json({ ok: true } satisfies RespostaDoEvento);
    const regra = avaliarFala(fala);
    const resultado = await mudarBase(idosoId, (base) => {
      const conversa = base.conversas.find((c) => c.id === evento.conversaId);
      if (!conversa) return null;
      conversa.falasDoIdoso += 1;
      const alerta: Alerta | undefined = regra
        ? criarAlerta(base, { ...regra, origem: 'regra' })
        : undefined;
      return { alerta };
    });
    if (!resultado) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, alerta: resultado.alerta } satisfies RespostaDoEvento);
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
