'use client';

import Link from 'next/link';
import { HeartHandshake, Smartphone } from 'lucide-react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import { cn } from '@/lib/utils';
import { Rosto } from './Rosto';

const BOTAO =
  'flex min-h-24 w-full max-w-md items-center gap-4 rounded-2xl px-6 py-5 text-left font-titulo text-2xl font-semibold shadow-md transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]';

/** A primeira abertura do app num aparelho novo: quem está com ele na mão. */
export function BoasVindas() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 bg-background px-6 py-10">
      <div className="flex flex-col items-center gap-6 text-center">
        <Rosto
          estado="parada"
          nivel={0}
          className="sm:[@media(max-height:820px)]:h-40 sm:[@media(max-height:820px)]:w-40"
        />
        <h1 className="max-w-md text-balance text-3xl font-semibold sm:text-4xl">
          Oi! Eu sou a {NOME_DA_ASSISTENTE}, uma assistente virtual.
        </h1>
        <p className="max-w-md text-balance text-xl text-muted-foreground">
          Eu ligo todo dia pra conversar e conto pra família como foi.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <Link
          href="/entrar"
          className={cn(BOTAO, 'bg-primary text-primary-foreground hover:bg-primary/90')}
        >
          <HeartHandshake aria-hidden className="h-9 w-9 shrink-0" />
          <span>
            Sou da família
            <span className="block font-sans text-lg font-normal opacity-90">
              Quero acompanhar quem eu cuido
            </span>
          </span>
        </Link>
        <Link
          href="/parear"
          className={cn(
            BOTAO,
            'border-2 border-border bg-card text-foreground hover:bg-secondary',
          )}
        >
          <Smartphone aria-hidden className="h-9 w-9 shrink-0" />
          <span>
            Este aparelho vai receber as ligações
            <span className="block font-sans text-lg font-normal text-muted-foreground">
              Vou digitar o código que a família mandou
            </span>
          </span>
        </Link>
      </div>
    </main>
  );
}
