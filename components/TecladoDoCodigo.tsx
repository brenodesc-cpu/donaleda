'use client';

import { useEffect } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TAMANHO_DO_CODIGO = 6;

interface TecladoDoCodigoProps {
  codigo: string;
  onMudar: (codigo: string) => void;
  desligado?: boolean;
}

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'apagar'] as const;

const TECLA =
  'flex h-20 items-center justify-center rounded-2xl text-4xl font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring active:scale-[0.97] disabled:opacity-50 sm:h-24';

/** Seis casas grandes e um teclado de telefone. Também aceita o teclado do computador. */
export function TecladoDoCodigo({ codigo, onMudar, desligado = false }: TecladoDoCodigoProps) {
  useEffect(() => {
    if (desligado) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (/^[0-9]$/.test(evento.key) && codigo.length < TAMANHO_DO_CODIGO) {
        onMudar(codigo + evento.key);
      } else if (evento.key === 'Backspace') {
        onMudar(codigo.slice(0, -1));
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [codigo, onMudar, desligado]);

  const casas = Array.from({ length: TAMANHO_DO_CODIGO }, (_, i) => ({
    id: `casa-${i}`,
    numero: codigo[i] ?? '',
    atual: i === codigo.length,
  }));

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <div
        className="flex w-full justify-center gap-2 sm:gap-3"
        role="status"
        aria-label={`Código digitado: ${codigo.split('').join(' ') || 'nenhum número'}`}
      >
        {casas.map((casa) => (
          <span
            key={casa.id}
            aria-hidden
            className={cn(
              'flex h-16 w-12 items-center justify-center rounded-xl border-2 bg-card text-4xl font-semibold sm:h-20 sm:w-14',
              casa.atual && !desligado ? 'border-primary' : 'border-border',
            )}
          >
            {casa.numero}
          </span>
        ))}
      </div>

      <div className="grid w-full grid-cols-3 gap-3">
        {TECLAS.map((tecla) => {
          if (tecla === '') return <span key="vazio" aria-hidden />;
          if (tecla === 'apagar') {
            return (
              <button
                key={tecla}
                type="button"
                disabled={desligado || codigo.length === 0}
                onClick={() => onMudar(codigo.slice(0, -1))}
                className={cn(TECLA, 'bg-secondary text-foreground hover:bg-secondary/80')}
                aria-label="Apagar o último número"
              >
                <Delete aria-hidden className="h-9 w-9" />
              </button>
            );
          }
          return (
            <button
              key={tecla}
              type="button"
              disabled={desligado || codigo.length >= TAMANHO_DO_CODIGO}
              onClick={() => onMudar(codigo + tecla)}
              className={cn(TECLA, 'border-2 border-border bg-card text-foreground hover:bg-secondary')}
            >
              {tecla}
            </button>
          );
        })}
      </div>
    </div>
  );
}
