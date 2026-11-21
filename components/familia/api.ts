// Os pedidos do lado da família ao servidor. Todo pedido vai com o cookie da
// sessão; 401 quer dizer que a pessoa precisa entrar de novo.

import type {
  AcaoDaFamilia,
  CodigoDoAparelho,
  Idoso,
  IdosoDaFamilia,
  NovoIdoso,
  PainelDaFamilia,
} from '@/lib/tipos';

/** O que a família pode mudar no cadastro do idoso pelo painel. */
export interface PerfilDoIdoso {
  tratamento?: string;
  remedios?: Idoso['remedios'];
  familiar?: Idoso['familiar'];
}

/** Toda ação do painel leva o idoso a que ela se refere. */
export type AcaoComIdoso = (
  | AcaoDaFamilia
  | { acao: 'gerar_codigo' }
  | ({ acao: 'perfil' } & PerfilDoIdoso)
) & { idosoId: string };

export interface Resultado<T> {
  /** Zero quando o pedido nem chegou no servidor. */
  status: number;
  dado: T | null;
}

export const deuCerto = (status: number) => status >= 200 && status < 300;

async function pedir<T>(url: string, init?: RequestInit): Promise<Resultado<T>> {
  try {
    const resposta = await fetch(url, { cache: 'no-store', ...init });
    let dado: T | null = null;
    try {
      dado = (await resposta.json()) as T;
    } catch {
      dado = null;
    }
    return { status: resposta.status, dado };
  } catch {
    return { status: 0, dado: null };
  }
}

function postar(corpo: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  };
}

export const buscarIdosos = () => pedir<IdosoDaFamilia[]>('/api/idosos');

export const criarIdoso = (novo: NovoIdoso | { exemplo: true }) =>
  pedir<{ id: string }>('/api/idosos', postar(novo));

export const apagarIdoso = (idosoId: string) =>
  pedir<{ ok: boolean }>(`/api/idosos?id=${encodeURIComponent(idosoId)}`, { method: 'DELETE' });

export const buscarPainel = (idosoId: string) =>
  pedir<PainelDaFamilia>(`/api/familia?idoso=${encodeURIComponent(idosoId)}`);

export const enviarAcao = (acao: AcaoComIdoso) => pedir<unknown>('/api/familia', postar(acao));

export const gerarCodigo = (idosoId: string) =>
  pedir<CodigoDoAparelho>('/api/familia', postar({ acao: 'gerar_codigo', idosoId }));

/** Endereço de uma tela da família mantendo o idoso escolhido. */
export function enderecoCom(caminho: string, idosoId: string | null | undefined): string {
  return idosoId ? `${caminho}?idoso=${encodeURIComponent(idosoId)}` : caminho;
}
