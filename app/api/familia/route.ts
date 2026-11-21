// O painel da família lê tudo daqui e manda as ações dele por aqui: marcar aviso
// como visto, pedir uma ligação agora, trocar as horas das ligações, gerar o
// código do aparelho e mudar o perfil. Tudo por idoso, só pra quem acompanha ele.
// A conversa inteira não existe no servidor, então não tem como sair por aqui.

import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { arrumarHorarios, avancarChamadas, pedirChamadaDaFamilia } from '@/lib/chamadas';
import { montarPainel, mudarBase, mudarBaseQuando } from '@/lib/dados';
import { exigirIdosoDaFamilia } from '@/lib/sessao';
import { clienteDoServidor } from '@/lib/supabase/servidor';
import type { AcaoDaFamilia, CodigoDoAparelho } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

const TRINTA_MINUTOS = 30 * 60 * 1000;

export async function GET(request: Request) {
  const pedido = new URL(request.url).searchParams.get('idoso');
  const conferido = await exigirIdosoDaFamilia(pedido);
  if (!conferido.ok) return conferido.resposta;

  const agora = new Date();
  const painel = await mudarBaseQuando(conferido.valor.idosoId, (base) => {
    const { mudou } = avancarChamadas(base, agora);
    return { gravar: mudou, resultado: montarPainel(base, agora) };
  });
  return NextResponse.json(painel, { headers: { 'Cache-Control': 'no-store' } });
}

function texto(valor: unknown, limite: number): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpo = valor.trim().replace(/\s+/g, ' ');
  return limpo ? limpo.slice(0, limite) : undefined;
}

function remediosValidos(valor: unknown): { nome: string; horario: string }[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  return valor
    .map((r) => ({ nome: texto(r?.nome, 80), horario: texto(r?.horario, 20) ?? '' }))
    .filter((r): r is { nome: string; horario: string } => Boolean(r.nome))
    .slice(0, 12);
}

async function gerarCodigo(idosoId: string, userId: string): Promise<CodigoDoAparelho | null> {
  const banco = clienteDoServidor();
  // Um código ativo por idoso: o novo substitui o anterior.
  await banco.from('codigos').delete().eq('idoso_id', idosoId).is('usado_em', null);
  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
    // Código igual que já venceu ou foi usado sai da frente.
    await banco
      .from('codigos')
      .delete()
      .eq('codigo', codigo)
      .or(`usado_em.not.is.null,expira_em.lt.${new Date().toISOString()}`);
    const expiraEm = new Date(Date.now() + TRINTA_MINUTOS).toISOString();
    const { error } = await banco
      .from('codigos')
      .insert({ codigo, idoso_id: idosoId, criado_por: userId, expira_em: expiraEm });
    if (!error) return { codigo, expiraEm };
    if (error.code !== '23505') return null;
  }
  return null;
}

export async function POST(request: Request) {
  let acao: AcaoDaFamilia;
  try {
    acao = (await request.json()) as AcaoDaFamilia;
  } catch {
    return NextResponse.json({ ok: false, erro: 'json' }, { status: 400 });
  }
  if (!acao || typeof acao !== 'object') {
    return NextResponse.json({ ok: false, erro: 'acao' }, { status: 400 });
  }

  const conferido = await exigirIdosoDaFamilia(
    typeof acao.idosoId === 'string' ? acao.idosoId : null,
  );
  if (!conferido.ok) return conferido.resposta;
  const { idosoId, familia } = conferido.valor;

  if (acao.acao === 'visto' && typeof acao.alertaId === 'string') {
    const achou = await mudarBase(idosoId, (base) => {
      const alerta = base.alertas.find((a) => a.id === acao.alertaId);
      if (alerta) alerta.visto = true;
      return Boolean(alerta);
    });
    return NextResponse.json({ ok: achou }, { status: achou ? 200 : 404 });
  }

  if (acao.acao === 'ligar') {
    const chamada = await mudarBase(idosoId, (base) => pedirChamadaDaFamilia(base));
    // 409: já está tocando ou os dois já estão conversando.
    if (!chamada) return NextResponse.json({ ok: false, erro: 'ocupado' }, { status: 409 });
    return NextResponse.json({ ok: true, chamada });
  }

  if (acao.acao === 'horarios') {
    const horarios = arrumarHorarios(acao.horarios);
    await mudarBase(idosoId, (base) => {
      base.idoso.horariosDeLigacao = horarios;
    });
    return NextResponse.json({ ok: true, horarios });
  }

  if (acao.acao === 'atender_sozinho' && typeof acao.ligado === 'boolean') {
    await mudarBase(idosoId, (base) => {
      base.idoso.atenderSozinho = acao.ligado;
    });
    return NextResponse.json({ ok: true });
  }

  if (acao.acao === 'gerar_codigo') {
    const codigo = await gerarCodigo(idosoId, familia.userId);
    if (!codigo) return NextResponse.json({ ok: false, erro: 'codigo' }, { status: 500 });
    return NextResponse.json({ ok: true, ...codigo });
  }

  if (acao.acao === 'perfil') {
    const nome = texto(acao.nome, 120);
    const tratamento = texto(acao.tratamento, 60);
    const idade = typeof acao.idade === 'number' && acao.idade > 0 && acao.idade < 130 ? Math.round(acao.idade) : undefined;
    const remedios = remediosValidos(acao.remedios);
    const familiarNome = texto(acao.familiar?.nome, 80);
    const familiarParentesco = texto(acao.familiar?.parentesco, 40);
    const idoso = await mudarBase(idosoId, (base) => {
      if (nome) base.idoso.nome = nome;
      if (tratamento) base.idoso.tratamento = tratamento;
      if (idade) base.idoso.idade = idade;
      if (remedios) base.idoso.remedios = remedios;
      if (familiarNome && familiarParentesco) {
        base.idoso.familiar = { nome: familiarNome, parentesco: familiarParentesco };
      }
      return base.idoso;
    });
    if (nome) await clienteDoServidor().from('idosos').update({ nome }).eq('id', idosoId);
    return NextResponse.json({ ok: true, idoso });
  }

  return NextResponse.json({ ok: false, erro: 'acao' }, { status: 400 });
}
