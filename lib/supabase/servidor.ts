// Clientes do Supabase do lado do servidor.
// - clienteDoServidor: chave secreta, passa por cima da RLS. Só rotas /api usam.
// - clienteDaSessao: chave pública com o cookie de login da família, pra saber quem é.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function variavel(nome: string): string {
  const valor = process.env[nome]?.trim();
  if (!valor) throw new Error(`Falta a variável de ambiente ${nome}`);
  return valor;
}

const global = globalThis as typeof globalThis & { __supabaseDoServidor?: SupabaseClient };

export function clienteDoServidor(): SupabaseClient {
  if (!global.__supabaseDoServidor) {
    global.__supabaseDoServidor = createClient(
      variavel('NEXT_PUBLIC_SUPABASE_URL'),
      variavel('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return global.__supabaseDoServidor;
}

export async function clienteDaSessao(): Promise<SupabaseClient> {
  const loja = await cookies();
  return createServerClient(
    variavel('NEXT_PUBLIC_SUPABASE_URL'),
    variavel('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll: () => loja.getAll(),
        setAll: (lista) => {
          try {
            for (const { name, value, options } of lista) loja.set(name, value, options);
          } catch {
            // Chamado de um componente de servidor, que não grava cookie. O proxy renova.
          }
        },
      },
    },
  );
}
