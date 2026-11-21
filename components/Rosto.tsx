'use client';

import { useEffect, useState } from 'react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { EstadoDoRosto } from '@/lib/conversation';
import { cn } from '@/lib/utils';
import { MARCA_ATIVA, type Direcao } from '@/components/marca/direcoes';
import {
  DesenhoGema,
  DesenhoJardim,
  DesenhoRadio,
  DesenhoVaranda,
} from '@/components/marca/DesenhosDoRosto';
import type { PartesDoRosto } from '@/components/marca/partesDoRosto';

interface RostoProps {
  estado: EstadoDoRosto;
  /** Volume da voz da assistente, de 0 a 1. Abre a boca enquanto ela fala. */
  nivel: number;
  className?: string;
  /** Direção da marca. Sem ela, vale a direção ativa do app. */
  estilo?: Direcao;
}

const DESCRICAO: Record<EstadoDoRosto, string> = {
  parada: 'sorrindo',
  ligando: 'ligando',
  ouvindo: 'ouvindo você',
  pensando: 'pensando',
  falando: 'falando',
};

const DESENHOS: Record<Direcao, (props: { partes: PartesDoRosto }) => React.JSX.Element> = {
  gema: DesenhoGema,
  varanda: DesenhoVaranda,
  radio: DesenhoRadio,
  jardim: DesenhoJardim,
};

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

/**
 * O rosto da Dona Leda. É um personagem desenhado, de propósito: ninguém
 * deve achar que está falando com uma pessoa.
 */
export function Rosto({ estado, nivel, className, estilo = MARCA_ATIVA }: RostoProps) {
  const poucoMovimento = usePoucoMovimento();
  // A fala costuma ficar entre 0,1 e 0,5 de volume; o ganho faz a boca abrir de verdade.
  const abertura = Math.min(1, Math.max(0, nivel) * 2.2);
  const pensando = estado === 'pensando';
  const partes: PartesDoRosto = {
    estado,
    abertura,
    olharX: pensando ? 4 : 0,
    olharY: pensando ? -5 : 0,
    piscar: !poucoMovimento,
    pulsar: !poucoMovimento && (estado === 'ouvindo' || estado === 'ligando'),
  };
  const Desenho = DESENHOS[estilo];

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={`${NOME_DA_ASSISTENTE}, ${DESCRICAO[estado]}`}
      className={cn('h-56 w-56 sm:h-72 sm:w-72', className)}
    >
      <Desenho partes={partes} />
    </svg>
  );
}
