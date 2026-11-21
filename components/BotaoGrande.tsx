import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BotaoGrandeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 'principal' chama a assistente; 'atender' é o verde da ligação recebida;
   * 'encerrar' é o vermelho que desliga; 'discreto' é a segunda opção da tela.
   */
  tom?: 'principal' | 'atender' | 'encerrar' | 'discreto';
}

const TONS: Record<NonNullable<BotaoGrandeProps['tom']>, string> = {
  principal: 'bg-primary text-primary-foreground hover:bg-primary/90',
  atender: 'bg-success text-white hover:bg-success/90',
  encerrar: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  discreto:
    'border-2 border-muted-foreground bg-card text-foreground shadow-none hover:bg-secondary',
};

/** Os botões da tela do idoso: altos, largos e com letra grande. */
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
        'flex min-h-20 w-full max-w-md items-center justify-center gap-3 rounded-2xl px-6 py-4',
        'font-titulo text-2xl font-semibold shadow-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        TONS[tom],
        className,
      )}
      {...resto}
    />
  );
}
