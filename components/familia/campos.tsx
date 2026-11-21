'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

export const CLASSE_DA_CAIXA =
  'min-h-12 w-full rounded-lg border border-border bg-background px-3 text-lg text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring';

export const CLASSE_DO_BOTAO_PRINCIPAL =
  'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

export const CLASSE_DO_BOTAO_SECUNDARIO =
  'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-lg font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  rotulo: string;
  ajuda?: ReactNode;
}

/** Uma caixa de texto com o nome em cima e a ajuda embaixo. */
export function Campo({ id, rotulo, ajuda, className, ...resto }: CampoProps) {
  const idDaAjuda = ajuda ? `${id}-ajuda` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-base font-medium text-foreground">
        {rotulo}
      </label>
      <input
        id={id}
        aria-describedby={idDaAjuda}
        className={`${CLASSE_DA_CAIXA} ${className ?? ''}`}
        {...resto}
      />
      {ajuda ? (
        <p id={idDaAjuda} className="text-base text-muted-foreground">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}

/** Mensagem de erro de formulário, lida em voz alta por leitor de tela. */
export function Erro({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-base text-destructive">
      {texto}
    </p>
  );
}

/** Confirmação curta depois de salvar. */
export function Salvo({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p role="status" className="rounded-lg bg-success-soft px-4 py-3 text-base text-success">
      {texto}
    </p>
  );
}
