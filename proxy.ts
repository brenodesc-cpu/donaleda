// Renova o cookie de login da família a cada pedido, como o Supabase pede no Next.
// Não bloqueia nada: quem decide se a pessoa pode ver é cada rota /api.

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return resposta;

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return resposta;
}

export const config = {
  // Só onde a família navega. O aparelho do idoso e a Agora não têm login.
  matcher: ['/familia/:path*', '/entrar/:path*', '/api/familia/:path*', '/api/idosos/:path*'],
};
