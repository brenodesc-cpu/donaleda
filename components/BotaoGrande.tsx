import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BotaoGrandeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 'principal' chama a conversa; 'encerrar' é o vermelho que desliga. */
  tom?: 'principal' | 'encerrar';
}

const TONS: Record<NonNullable<BotaoGrandeProps['tom']>, string> = {
  principal: 'bg-primary text-primary-foreground hover:bg-primary/90',
  encerrar: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
};

/** O único botão de cada tela do idoso: alto, largo e com letra grande. */
export function BotaoGrande({
  tom = 'principal',
  className,
  type = 'button',
  ...resto
}: BotaoGrandeProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex min-h-20 w-full max-w-md items-center justify-center rounded-2xl px-6 py-4',
        'text-2xl font-semibold shadow-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        TONS[tom],
        className,
      )}
      {...resto}
    />
  );
}
