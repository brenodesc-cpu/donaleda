// Os idosos que a família logada acompanha, e o cadastro de um novo.
// POST com NovoIdoso cria a ficha em branco; POST com { exemplo: true } cria a
// dona Helena com dias de exemplo marcados, pra demonstração.

import { NextResponse } from 'next/server';
import { arrumarHorarios } from '@/lib/chamadas';
import { criarFicha } from '@/lib/dados';
import { baseDeExemplo, baseNova } from '@/lib/exemplo';
import { exigirFamilia } from '@/lib/sessao';
import { clienteDoServidor } from '@/lib/supabase/servidor';
import type { IdosoDaFamilia, NovoIdoso } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

interface LinhaDeMembro {
  papel: 'responsavel' | 'familiar';
  idosos: { id: string; nome: string; criado_em: string } | null;
}

export async function GET() {
  const conferida = await exigirFamilia();
  if (!conferida.ok) return conferida.resposta;
  const banco = clienteDoServidor();

  const { data, error } = await banco
    .from('membros')
    .select('papel, idosos(id, nome, criado_em)')
    .eq('user_id', conferida.valor.userId)
    .order('criado_em', { ascending: true });
  if (error) return NextResponse.json({ ok: false, erro: 'banco' }, { status: 500 });

  const linhas = ((data ?? []) as unknown as LinhaDeMembro[]).filter((l) => l.idosos);
  const ids = linhas.map((l) => l.idosos!.id);

  const [fichas, aparelhos] = await Promise.all([
    ids.length
      ? banco.from('fichas').select('idoso_id, base->idoso->>tratamento').in('idoso_id', ids)
      : Promise.resolve({ data: [] }),
    ids.length
      ? banco.from('aparelhos').select('idoso_id').in('idoso_id', ids)
      : Promise.resolve({ data: [] }),
  ]);

  const tratamentos = new Map(
    ((fichas.data ?? []) as { idoso_id: string; tratamento: string | null }[]).map((f) => [
      f.idoso_id,
      f.tratamento,
    ]),
  );
  const contagem = new Map<string, number>();
  for (const a of (aparelhos.data ?? []) as { idoso_id: string }[]) {
    contagem.set(a.idoso_id, (contagem.get(a.idoso_id) ?? 0) + 1);
  }

  const lista: IdosoDaFamilia[] = linhas.map((l) => ({
    id: l.idosos!.id,
    nome: l.idosos!.nome,
    tratamento: tratamentos.get(l.idosos!.id) ?? l.idosos!.nome,
    aparelhos: contagem.get(l.idosos!.id) ?? 0,
    papel: l.papel,
  }));
  return NextResponse.json(lista, { headers: { 'Cache-Control': 'no-store' } });
}

function texto(valor: unknown, limite: number): string {
  return typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ').slice(0, limite) : '';
}

/** Confere e limpa o cadastro. Devolve null quando falta o essencial. */
function novoValido(corpo: Record<string, unknown>): NovoIdoso | null {
  const nome = texto(corpo.nome, 120);
  if (!nome) return null;
  const familiar = (corpo.familiar ?? {}) as Record<string, unknown>;
  const idade = Number(corpo.idade);
  const remedios = Array.isArray(corpo.remedios) ? corpo.remedios : [];
  return {
    nome,
    tratamento: texto(corpo.tratamento, 60) || nome,
    idade: Number.isFinite(idade) && idade > 0 && idade < 130 ? Math.round(idade) : 75,
    familiar: {
      nome: texto(familiar.nome, 80) || 'a família',
      parentesco: texto(familiar.parentesco, 40) || 'família',
    },
    remedios: remedios
      .map((r) => ({
        nome: texto((r as Record<string, unknown>)?.nome, 80),
        horario: texto((r as Record<string, unknown>)?.horario, 20),
      }))
      .filter((r) => r.nome)
      .slice(0, 12),
    horariosDeLigacao: arrumarHorarios(corpo.horariosDeLigacao).length
      ? arrumarHorarios(corpo.horariosDeLigacao)
      : ['09:00', '19:00'],
  };
}

export async function POST(request: Request) {
  const conferida = await exigirFamilia();
  if (!conferida.ok) return conferida.resposta;
  const { userId } = conferida.valor;

  let corpo: Record<string, unknown>;
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, erro: 'json' }, { status: 400 });
  }

  const exemplo = corpo?.exemplo === true;
  const novo = exemplo ? null : novoValido(corpo ?? {});
  if (!exemplo && !novo) {
    return NextResponse.json({ ok: false, erro: 'falta_nome' }, { status: 400 });
  }

  const banco = clienteDoServidor();
  const nome = exemplo ? 'Helena' : novo!.nome;
  const { data: idoso, error } = await banco
    .from('idosos')
    .insert({ nome, criado_por: userId })
    .select('id')
    .single();
  if (error || !idoso) return NextResponse.json({ ok: false, erro: 'banco' }, { status: 500 });
  const id = idoso.id as string;

  const membro = await banco
    .from('membros')
    .insert({ idoso_id: id, user_id: userId, papel: 'responsavel' });
  if (membro.error) {
    await banco.from('idosos').delete().eq('id', id);
    return NextResponse.json({ ok: false, erro: 'banco' }, { status: 500 });
  }

  try {
    await criarFicha(id, exemplo ? baseDeExemplo(new Date(), id) : baseNova(id, novo!));
  } catch {
    await banco.from('idosos').delete().eq('id', id);
    return NextResponse.json({ ok: false, erro: 'banco' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
