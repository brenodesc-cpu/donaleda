// Entrar, criar conta e sair, pelo login do Supabase no navegador.
// Toda função devolve a mensagem de erro em português simples, ou null quando deu certo.

import { clienteDoNavegador } from '@/lib/supabase/navegador';

const CHAVE_DO_IDOSO = 'donaleda:idoso-escolhido';

interface ErroDoLogin {
  message?: string;
  status?: number;
  code?: string;
}

function traduzir(erro: ErroDoLogin | null | undefined): string {
  const texto = `${erro?.code ?? ''} ${erro?.message ?? ''}`.toLowerCase();
  if (texto.includes('invalid login') || texto.includes('invalid_credentials')) {
    return 'E-mail ou senha errados.';
  }
  if (texto.includes('already registered') || texto.includes('user_already_exists')) {
    return 'Esse e-mail já tem conta. Toque em "Entrar".';
  }
  if (texto.includes('password') && (texto.includes('at least') || texto.includes('weak'))) {
    return 'A senha precisa de pelo menos 6 letras ou números.';
  }
  if (texto.includes('email') && texto.includes('invalid')) {
    return 'Confira o e-mail. Parece que falta alguma coisa.';
  }
  if (texto.includes('rate limit') || texto.includes('too many')) {
    return 'Foram muitas tentativas seguidas. Espere um minuto e tente de novo.';
  }
  if (texto.includes('fetch') || texto.includes('network')) {
    return 'Sem conexão com a internet. Tente de novo.';
  }
  return 'Não deu certo agora. Tente de novo.';
}

export async function entrar(email: string, senha: string): Promise<string | null> {
  try {
    const { error } = await clienteDoNavegador().auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    return error ? traduzir(error) : null;
  } catch (erro) {
    return traduzir(erro as ErroDoLogin);
  }
}

export async function criarConta(
  nome: string,
  email: string,
  senha: string,
): Promise<string | null> {
  try {
    const supabase = clienteDoNavegador();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { data: { nome: nome.trim() } },
    });
    if (error) return traduzir(error);
    // A confirmação por e-mail está desligada, então a sessão já vem. Se não vier, entra.
    if (!data.session) return entrar(email, senha);
    return null;
  } catch (erro) {
    return traduzir(erro as ErroDoLogin);
  }
}

export async function sair(): Promise<void> {
  try {
    await clienteDoNavegador().auth.signOut();
  } catch {
    // Mesmo sem internet a pessoa sai: o cookie some na próxima abertura.
  }
  esquecerIdosoEscolhido();
}

export async function jaEntrou(): Promise<boolean> {
  try {
    const { data } = await clienteDoNavegador().auth.getSession();
    return Boolean(data.session);
  } catch {
    return false;
  }
}

export function lerIdosoEscolhido(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_DO_IDOSO);
  } catch {
    return null;
  }
}

export function guardarIdosoEscolhido(id: string): void {
  try {
    window.localStorage.setItem(CHAVE_DO_IDOSO, id);
  } catch {
    // Sem armazenamento, o painel abre no primeiro idoso da lista.
  }
}

function esquecerIdosoEscolhido(): void {
  try {
    window.localStorage.removeItem(CHAVE_DO_IDOSO);
  } catch {
    // Nada a fazer.
  }
}
