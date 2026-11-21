import type { Metadata } from 'next';
import Link from 'next/link';
import { ColunaDaDirecao } from '@/components/marca/ColunaDaDirecao';
import { DIRECOES, MARCA_ATIVA, infoDaDirecao } from '@/components/marca/direcoes';

export const metadata: Metadata = {
  title: 'A marca da Dona Leda',
};

export default function PaginaDaMarca() {
  const ativa = infoDaDirecao(MARCA_ATIVA);
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="max-w-3xl">
        <p className="text-base font-semibold text-muted-foreground">Escolhida pelo time em 21/11</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">A marca da Dona Leda</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          A aplicada no app é a {ativa.nome}, com o disco do telefone antigo. As outras três
          ficam aqui pra comparação. Todas passam no contraste pra quem enxerga menos (7 pra 1
          no texto principal, 4,5 pra 1 no resto). Pra trocar, mude uma linha em{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-base">components/marca/direcoes.ts</code>.
        </p>
        <p className="mt-3 text-base">
          <Link href="/" className="font-semibold text-primary underline underline-offset-4">
            Voltar pro app
          </Link>
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
        {DIRECOES.map((direcao) => (
          <ColunaDaDirecao key={direcao.id} direcao={direcao} />
        ))}
      </div>
    </main>
  );
}
