// O aparelho do idoso troca o código de 6 números, que a família gerou no painel,
// por um token que ele guarda pra sempre. O banco guarda só o hash do token.

import { NextResponse } from 'next/server';
import { lerBase } from '@/lib/dados';
import { hashDoToken, novoTokenDeAparelho } from '@/lib/sessao';
import { clienteDoServidor } from '@/lib/supabase/servidor';
import type { AparelhoPareado } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

// Freio contra quem tenta adivinhar código: 10 tentativas por minuto por endereço.
const global = globalThis as typeof globalThis & {
  __tentativasDePareamento?: Map<string, { inicio: number; vezes: number }>;
};
const tentativas = (global.__tentativasDePareamento ??= new Map());

function passouDoLimite(request: Request): boolean {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local';
  const agora = Date.now();
  const atual = tentativas.get(ip);
  if (!atual || agora - atual.inicio > 60_000) {
    tentativas.set(ip, { inicio: agora, vezes: 1 });
    return false;
  }
  atual.vezes += 1;
  return atual.vezes > 10;
}

export async function POST(request: Request) {
  if (passouDoLimite(request)) {
    return NextResponse.json({ ok: false, erro: 'muitas_tentativas' }, { status: 429 });
  }

  let corpo: { codigo?: unknown; nome?: unknown };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ ok: false, erro: 'json' }, { status: 400 });
  }
  const codigo = typeof corpo.codigo === 'string' ? corpo.codigo.replace(/\D/g, '') : '';
  if (codigo.length !== 6) {
    return NextResponse.json({ ok: false, erro: 'codigo_invalido' }, { status: 400 });
  }

  const banco = clienteDoServidor();
  const { data: idosoId, error } = await banco.rpc('usar_codigo', { p_codigo: codigo });
  if (error) return NextResponse.json({ ok: false, erro: 'banco' }, { status: 500 });
  if (!idosoId) {
    return NextResponse.json({ ok: false, erro: 'codigo_invalido' }, { status: 404 });
  }

  const token = novoTokenDeAparelho();
  const nome =
    typeof corpo.nome === 'string' && corpo.nome.trim() ? corpo.nome.trim().slice(0, 60) : null;
  const inserido = await banco
    .from('aparelhos')
    .insert({ idoso_id: idosoId, token_hash: hashDoToken(token), nome });
  if (inserido.error) return NextResponse.json({ ok: false, erro: 'banco' }, { status: 500 });

  const base = await lerBase(idosoId as string);
  return NextResponse.json({
    token,
    idosoId: idosoId as string,
    tratamento: base.idoso.tratamento,
  } satisfies AparelhoPareado);
}
