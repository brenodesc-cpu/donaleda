// Quem está pedindo: a família logada (cookie do Supabase) ou o aparelho do idoso
// (token no cabeçalho). Cada rota /api começa por aqui.

import { createHash, randomBytes } from 'node:crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { CABECALHO_DO_APARELHO } from './tipos';
import { clienteDaSessao, clienteDoServidor } from './supabase/servidor';

export interface Familia {
  userId: string;
  email: string | null;
  /** O nome dado no cadastro da conta, quando houver. */
  nome: string | null;
}

export type Papel = 'responsavel' | 'familiar';

/** Resultado de uma conferência: ou o que a rota precisa, ou a resposta de erro pronta. */
export type Conferido<T> = { ok: true; valor: T } | { ok: false; resposta: NextResponse };

function erro(status: number, motivo: string): { ok: false; resposta: NextResponse } {
  return { ok: false, resposta: NextResponse.json({ ok: false, erro: motivo }, { status }) };
}

export async function familiaLogada(): Promise<Familia | null> {
  try {
    // O app nativo (ou um teste) pode mandar o token de acesso no cabeçalho.
    // No navegador vale o cookie do Supabase.
    const autorizacao = (await headers()).get('authorization');
    const token = autorizacao?.toLowerCase().startsWith('bearer ')
      ? autorizacao.slice(7).trim()
      : null;
    const { data } = token
      ? await clienteDoServidor().auth.getUser(token)
      : await (await clienteDaSessao()).auth.getUser();
    if (!data.user) return null;
    const nome = data.user.user_metadata?.nome;
    return {
      userId: data.user.id,
      email: data.user.email ?? null,
      nome: typeof nome === 'string' && nome.trim() ? nome.trim() : null,
    };
  } catch {
    return null;
  }
}

export async function exigirFamilia(): Promise<Conferido<Familia>> {
  const familia = await familiaLogada();
  return familia ? { ok: true, valor: familia } : erro(401, 'sem_login');
}

/**
 * Confere que a família logada acompanha este idoso. Sem idosoId, usa o primeiro
 * que ela cadastrou ou recebeu. Sem nenhum, responde 404 com `sem_idoso`.
 */
export async function exigirIdosoDaFamilia(
  idosoId?: string | null,
): Promise<Conferido<{ familia: Familia; idosoId: string; papel: Papel }>> {
  const conferida = await exigirFamilia();
  if (!conferida.ok) return conferida;
  const familia = conferida.valor;

  let consulta = clienteDoServidor()
    .from('membros')
    .select('idoso_id, papel')
    .eq('user_id', familia.userId)
    .order('criado_em', { ascending: true })
    .limit(1);
  if (idosoId) consulta = consulta.eq('idoso_id', idosoId);

  const { data, error } = await consulta;
  if (error) return erro(500, 'banco');
  const membro = data?.[0];
  if (!membro) return idosoId ? erro(403, 'sem_acesso') : erro(404, 'sem_idoso');
  return {
    ok: true,
    valor: { familia, idosoId: membro.idoso_id as string, papel: membro.papel as Papel },
  };
}

export function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function novoTokenDeAparelho(): string {
  return randomBytes(32).toString('base64url');
}

/** O idoso deste aparelho, pelo token do cabeçalho, ou null. */
export async function idosoDoAparelho(request: Request): Promise<string | null> {
  const token = request.headers.get(CABECALHO_DO_APARELHO)?.trim();
  if (!token || token.length < 20 || token.length > 200) return null;

  const banco = clienteDoServidor();
  const { data, error } = await banco
    .from('aparelhos')
    .select('id, idoso_id, visto_em')
    .eq('token_hash', hashDoToken(token))
    .maybeSingle();
  if (error || !data) return null;

  // "Visto agora" no máximo uma vez por minuto, porque o aparelho pergunta a cada 2 segundos.
  const visto = data.visto_em ? new Date(data.visto_em as string).getTime() : 0;
  if (Date.now() - visto > 60_000) {
    await banco.from('aparelhos').update({ visto_em: new Date().toISOString() }).eq('id', data.id);
  }
  return data.idoso_id as string;
}

export async function exigirAparelho(request: Request): Promise<Conferido<string>> {
  const idosoId = await idosoDoAparelho(request);
  return idosoId ? { ok: true, valor: idosoId } : erro(401, 'aparelho_nao_pareado');
}
