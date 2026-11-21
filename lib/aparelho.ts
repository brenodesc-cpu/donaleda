// O aparelho do idoso não tem login. Ele recebe um token uma vez, quando a
// família digita o código de 6 números, e manda esse token em todo pedido.
// O token fica no localStorage e, dentro do app, também nas Preferences do
// Capacitor, que o sistema não apaga quando falta espaço.

import { CABECALHO_DO_APARELHO, type AparelhoPareado } from './tipos';

const CHAVE = 'donaleda:aparelho';

/** Evento disparado na janela quando o servidor recusa o token e o aparelho é esquecido. */
export const EVENTO_APARELHO_ESQUECIDO = 'donaleda:aparelho-esquecido';

export type AparelhoGuardado = AparelhoPareado;

function pareceAparelho(dado: unknown): dado is AparelhoGuardado {
  if (!dado || typeof dado !== 'object') return false;
  const a = dado as Partial<AparelhoGuardado>;
  return typeof a.token === 'string' && a.token.length > 0 && typeof a.idosoId === 'string';
}

function lerLocal(): AparelhoGuardado | null {
  if (typeof window === 'undefined') return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const dado: unknown = JSON.parse(bruto);
    return pareceAparelho(dado) ? dado : null;
  } catch {
    return null;
  }
}

function gravarLocal(aparelho: AparelhoGuardado | null) {
  if (typeof window === 'undefined') return;
  try {
    if (aparelho) window.localStorage.setItem(CHAVE, JSON.stringify(aparelho));
    else window.localStorage.removeItem(CHAVE);
  } catch {
    // Navegador sem localStorage (aba anônima cheia): o app segue com as Preferences.
  }
}

// O plugin do Capacitor responde a qualquer nome, até "then". Devolvido solto de uma
// função async, o JavaScript o trata como promessa, chama Preferences.then(), o plugin
// recusa e a promessa nunca termina: a primeira tela do app ficava parada no disco.
// Por isso ele volta embrulhado num objeto.
async function preferencias(): Promise<{ plugin: typeof import('@capacitor/preferences').Preferences } | null> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return null;
    const { Preferences } = await import('@capacitor/preferences');
    return { plugin: Preferences };
  } catch {
    return null;
  }
}

/** O aparelho guardado, lido na hora. No primeiro instante do app pode vir null; use `carregarAparelho`. */
export function tokenDoAparelho(): string | null {
  return lerLocal()?.token ?? null;
}

export function aparelhoGuardado(): AparelhoGuardado | null {
  return lerLocal();
}

/** Lê o aparelho, recuperando das Preferences do app se o localStorage tiver sido limpo. */
export async function carregarAparelho(): Promise<AparelhoGuardado | null> {
  const local = lerLocal();
  if (local) return local;
  const prefs = await preferencias();
  if (!prefs) return null;
  try {
    const { value } = await prefs.plugin.get({ key: CHAVE });
    if (!value) return null;
    const dado: unknown = JSON.parse(value);
    if (!pareceAparelho(dado)) return null;
    gravarLocal(dado);
    return dado;
  } catch {
    return null;
  }
}

export async function guardarAparelho(aparelho: AparelhoPareado): Promise<void> {
  gravarLocal(aparelho);
  const prefs = await preferencias();
  await prefs?.plugin.set({ key: CHAVE, value: JSON.stringify(aparelho) }).catch(() => undefined);
}

export async function esquecerAparelho(): Promise<void> {
  gravarLocal(null);
  const prefs = await preferencias();
  await prefs?.plugin.remove({ key: CHAVE }).catch(() => undefined);
}

/**
 * `fetch` do aparelho: põe o cabeçalho com o token. Se o servidor responder 401,
 * o token não vale mais (a família desligou o aparelho): ele é esquecido e a
 * tela volta pra escolha entre família e idoso.
 */
/**
 * Modo da conversa pedido pelo endereço (?modo=gemini, ?modo=tres ou ?modo=direto),
 * guardado no aparelho. Serve pra comparar os modos; sem pedido, o servidor escolhe.
 * O direto só existe por este pedido: nele o aparelho fala com o Gemini sem o motor
 * de conversa da Agora (ver lib/direto.ts). ?modo=auto volta ao padrão.
 */
export function modoPedido(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const doEndereco = new URLSearchParams(window.location.search).get('modo');
    if (doEndereco === 'gemini' || doEndereco === 'tres' || doEndereco === 'direto') {
      window.localStorage.setItem('donaleda-modo', doEndereco);
      return doEndereco;
    }
    if (doEndereco === 'auto') window.localStorage.removeItem('donaleda-modo');
    return window.localStorage.getItem('donaleda-modo');
  } catch {
    return null;
  }
}

export async function fetchDoAparelho(url: string, init: RequestInit = {}): Promise<Response> {
  const token = tokenDoAparelho();
  const cabecalhos = new Headers(init.headers);
  if (token) cabecalhos.set(CABECALHO_DO_APARELHO, token);
  const modo = modoPedido();
  if (modo) cabecalhos.set('x-donaleda-modo', modo);
  const resposta = await fetch(url, { ...init, headers: cabecalhos });
  if (resposta.status === 401 && token) {
    await esquecerAparelho();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(EVENTO_APARELHO_ESQUECIDO));
    }
  }
  return resposta;
}
