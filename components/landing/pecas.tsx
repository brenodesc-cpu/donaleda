// Peças que as três direções da landing dividem: o botão, a fonte de um número,
// as perguntas frequentes, o rodapé e a faixa de escolha entre as direções.

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DESTINO_DO_BOTAO,
  NOTA_DO_RODAPE,
  PERGUNTAS,
  TEXTO_DO_BOTAO,
  type Fonte,
} from './conteudo';

/** Prende as últimas palavras da frase na mesma linha, pra nenhuma sobrar sozinha embaixo. */
export function SemViuva({ texto, palavras = 3 }: { texto: string; palavras?: number }) {
  const partes = texto.split(' ');
  if (partes.length <= palavras) return <>{texto}</>;
  return (
    <>
      {partes.slice(0, -palavras).join(' ')}{' '}
      <span className="whitespace-nowrap">{partes.slice(-palavras).join(' ')}</span>
    </>
  );
}

const NOMES_DAS_DIRECOES = ['Carta', 'Produto em cena', 'Conta e prova'] as const;

/**
 * Faixa do topo enquanto o Breno escolhe a direção: diz qual é esta e leva às outras.
 * Sai da página quando uma direção for escolhida.
 */
export function FaixaDeEscolha({ atual }: { atual: 1 | 2 | 3 }) {
  return (
    <nav
      aria-label="Direções da landing page"
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-[#1F1308] px-4 py-2 text-sm text-[#FFF8E8]"
    >
      <span>
        Direção {atual} de 3: {NOMES_DAS_DIRECOES[atual - 1]}
      </span>
      <span className="flex items-center gap-1">
        {[1, 2, 3].map((n) => (
          <Link
            key={n}
            href={`/landing/${n}`}
            aria-current={n === atual ? 'page' : undefined}
            className={cn(
              'flex h-8 min-w-8 items-center justify-center rounded-full px-2 font-semibold',
              n === atual ? 'bg-[#F7B90F] text-[#33200F]' : 'underline hover:bg-white/10',
            )}
          >
            {n}
          </Link>
        ))}
        <Link href="/landing" className="ml-2 flex h-8 items-center underline hover:no-underline">
          Ver as três
        </Link>
      </span>
    </nav>
  );
}

interface BotaoPrincipalProps {
  /** `cafe` no fundo claro ou amarelo, `casca` no fundo escuro. */
  tom?: 'cafe' | 'casca';
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export function BotaoPrincipal({
  tom = 'cafe',
  href = DESTINO_DO_BOTAO,
  className,
  children = TEXTO_DO_BOTAO,
}: BotaoPrincipalProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex min-h-14 items-center justify-center rounded-2xl px-7 py-3 text-center',
        'font-titulo text-xl font-bold leading-tight transition-[background-color,transform] duration-150 active:scale-[0.98]',
        tom === 'cafe'
          ? 'bg-primary text-primary-foreground hover:bg-[#4A2F17]'
          : 'bg-background text-foreground hover:bg-white',
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** A fonte de um número, com link quando a base tem o endereço. */
export function FonteDoNumero({ fonte, className }: { fonte: Fonte; className?: string }) {
  if (!fonte.url) return <span className={className}>{fonte.nome}</span>;
  return (
    <a href={fonte.url} target="_blank" rel="noreferrer" className={cn('underline hover:no-underline', className)}>
      {fonte.nome}
    </a>
  );
}

interface PerguntasProps {
  /** `claro` no fundo Casca, `escuro` no fundo Café. */
  tom?: 'claro' | 'escuro';
  className?: string;
}

export function Perguntas({ tom = 'claro', className }: PerguntasProps) {
  const escuro = tom === 'escuro';
  return (
    <div className={cn('flex flex-col', className)}>
      {PERGUNTAS.map(({ pergunta, resposta }) => (
        <details
          key={pergunta}
          className={cn('border-b', escuro ? 'border-[#FFF8E8]/25' : 'border-foreground/20')}
        >
          <summary className="flex items-center justify-between gap-4 py-5 font-titulo text-xl font-bold leading-snug sm:text-2xl">
            {pergunta}
            <Plus aria-hidden className="sinal h-6 w-6 shrink-0" strokeWidth={2.5} />
          </summary>
          <p
            className={cn(
              'max-w-[62ch] pb-6 text-lg leading-relaxed sm:text-xl sm:leading-relaxed',
              escuro ? 'text-[#F3E3C3]' : 'text-muted-foreground',
            )}
          >
            {resposta}
          </p>
        </details>
      ))}
    </div>
  );
}

export function Rodape({ tom = 'claro', className }: { tom?: 'claro' | 'escuro'; className?: string }) {
  const escuro = tom === 'escuro';
  return (
    <footer
      className={cn(
        'flex flex-col gap-3 text-base leading-relaxed',
        escuro ? 'text-[#F3E3C3]' : 'text-muted-foreground',
        className,
      )}
    >
      <p>{NOTA_DO_RODAPE}</p>
      <p className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/privacidade" className="underline hover:no-underline">
          Privacidade
        </Link>
        <Link href="/entrar" className="underline hover:no-underline">
          Entrar
        </Link>
      </p>
    </footer>
  );
}
