'use client';

import type { ReactNode } from 'react';
import type { IdosoDaFamilia } from '@/lib/tipos';
import { AvisoSemConexao } from './Apoio';
import { BarraDoTopo, type TelaDaFamilia } from './BarraDoTopo';

interface MolduraProps {
  idosos: IdosoDaFamilia[] | null;
  idoso: IdosoDaFamilia | null;
  onEscolher: (id: string) => void;
  ativa: TelaDaFamilia;
  semConexao?: boolean;
  children: ReactNode;
}

/** A coluna central das telas da família, com a barra do topo. */
export function Moldura({ idosos, idoso, onEscolher, ativa, semConexao, children }: MolduraProps) {
  return (
    <main className="min-h-dvh bg-background text-base text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 md:py-8">
        <BarraDoTopo idosos={idosos} idoso={idoso} onEscolher={onEscolher} ativa={ativa} />
        {semConexao ? <AvisoSemConexao /> : null}
        {children}
      </div>
    </main>
  );
}

/** Um cartão com título, usado nas telas de cadastro e ajustes. */
export function Cartao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-xl font-semibold text-foreground">{titulo}</h2>
      {children}
    </section>
  );
}
