'use client';

import { useEffect, useState } from 'react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { EstadoDoRosto } from '@/lib/conversation';
import { cn } from '@/lib/utils';

interface RostoProps {
  estado: EstadoDoRosto;
  /** Volume da voz da assistente, de 0 a 1. Abre a boca enquanto ela fala. */
  nivel: number;
  className?: string;
}

const DESCRICAO: Record<EstadoDoRosto, string> = {
  parada: 'sorrindo',
  ligando: 'ligando',
  ouvindo: 'ouvindo você',
  pensando: 'pensando',
  falando: 'falando',
};

const OLHO_ALTURA = 13;

/** true quando o aparelho pede menos movimento na tela. */
function usePoucoMovimento(): boolean {
  const [pouco, setPouco] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    const atualizar = () => setPouco(consulta.matches);
    atualizar();
    consulta.addEventListener('change', atualizar);
    return () => consulta.removeEventListener('change', atualizar);
  }, []);
  return pouco;
}

function Olho({ cx, cy, piscar }: { cx: number; cy: number; piscar: boolean }) {
  return (
    <ellipse cx={cx} cy={cy} rx={10} ry={OLHO_ALTURA} className="fill-foreground">
      {piscar && (
        <animate
          attributeName="ry"
          values={`${OLHO_ALTURA};${OLHO_ALTURA};1.5;${OLHO_ALTURA};${OLHO_ALTURA}`}
          keyTimes="0;0.46;0.5;0.54;1"
          dur="5s"
          repeatCount="indefinite"
        />
      )}
    </ellipse>
  );
}

function Boca({ estado, abertura }: { estado: EstadoDoRosto; abertura: number }) {
  if (estado === 'falando') {
    return (
      <ellipse
        cx={120}
        cy={156}
        rx={20 - abertura * 3}
        ry={4 + abertura * 17}
        className="fill-foreground"
      />
    );
  }
  const desenho =
    estado === 'pensando'
      ? 'M 106 158 L 134 158'
      : estado === 'parada'
        ? 'M 92 148 Q 120 178 148 148'
        : 'M 98 150 Q 120 170 142 150';
  return (
    <path
      d={desenho}
      className="fill-none stroke-foreground"
      strokeWidth={7}
      strokeLinecap="round"
    />
  );
}

/**
 * O rosto da assistente. É um personagem desenhado, de propósito: ninguém
 * deve achar que está falando com uma pessoa.
 */
export function Rosto({ estado, nivel, className }: RostoProps) {
  const poucoMovimento = usePoucoMovimento();
  // A fala costuma ficar entre 0,1 e 0,5 de volume; o ganho faz a boca abrir de verdade.
  const abertura = Math.min(1, Math.max(0, nivel) * 2.2);
  const pensando = estado === 'pensando';
  const olhoX = pensando ? 4 : 0;
  const olhoY = pensando ? -7 : 0;
  const pulsar =
    !poucoMovimento && (estado === 'ouvindo' || estado === 'ligando');
  const raioDoHalo = estado === 'falando' ? 108 + abertura * 10 : 110;

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={`${NOME_DA_ASSISTENTE}, ${DESCRICAO[estado]}`}
      className={cn('h-56 w-56 sm:h-72 sm:w-72', className)}
    >
      <circle
        cx={120}
        cy={120}
        r={raioDoHalo}
        className={cn('fill-primary/15', pulsar && 'animate-pulse')}
      />
      {/* Fone de ouvido: lembra que ela é uma assistente. */}
      <path
        d="M 34 124 A 86 86 0 0 1 206 124"
        className="fill-none stroke-primary"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <rect x={20} y={104} width={26} height={48} rx={12} className="fill-primary" />
      <rect x={194} y={104} width={26} height={48} rx={12} className="fill-primary" />
      <circle
        cx={120}
        cy={124}
        r={84}
        className="fill-card stroke-primary"
        strokeWidth={6}
      />
      <circle cx={72} cy={142} r={12} className="fill-accent/35" />
      <circle cx={168} cy={142} r={12} className="fill-accent/35" />
      <Olho cx={90 + olhoX} cy={112 + olhoY} piscar={!poucoMovimento} />
      <Olho cx={150 + olhoX} cy={112 + olhoY} piscar={!poucoMovimento} />
      <Boca estado={estado} abertura={abertura} />
    </svg>
  );
}
