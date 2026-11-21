// A tela do idoso avisa aqui o que acontece na conversa: cada fala dele e o fim.
// A fala passa pelas regras fixas de segurança e é descartada. Só fica guardada
// quando uma regra dispara, dentro do alerta que vai pra família.

import { NextResponse } from 'next/server';
import { criarAlerta, fecharConversa, mudarBase } from '@/lib/dados';
import { avaliarFala } from '@/lib/regras';
import type { Alerta, EventoDaConversa, RespostaDoEvento } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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
    const conversa = await mudarBase((base) => fecharConversa(base, evento.conversaId));
    return NextResponse.json({ ok: Boolean(conversa) } satisfies RespostaDoEvento, {
      status: conversa ? 200 : 404,
    });
  }

  if (evento.tipo === 'fala') {
    const fala = typeof evento.texto === 'string' ? evento.texto.slice(0, 2000) : '';
    const regra = avaliarFala(fala);
    const resultado = await mudarBase((base) => {
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
