'use client';

import { Phone } from 'lucide-react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import { useContagem } from '@/hooks/useContagem';
import { useToque } from '@/hooks/useToque';
import { BotaoGrande } from './BotaoGrande';
import { Rosto } from './Rosto';

interface ChamadaTocandoProps {
  /** Segundos até atender sozinha, ou null quando o idoso precisa tocar em Atender. */
  atenderSozinhoEm: number | null;
  onAtender: () => void;
  onRecusar: () => void;
}

/**
 * A assistente está ligando: tela cheia, como a de uma chamada de vídeo do
 * celular. O toque e a vibração duram enquanto esta tela estiver aberta.
 */
export function ChamadaTocando({
  atenderSozinhoEm,
  onAtender,
  onRecusar,
}: ChamadaTocandoProps) {
  useToque(true);
  const resta = useContagem(atenderSozinhoEm, onAtender);

  return (
    <section
      aria-label={`${NOME_DA_ASSISTENTE} está ligando`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between gap-6 overflow-y-auto bg-background px-6 py-10"
    >
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-5">
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            className="absolute h-48 w-48 rounded-full bg-accent/40 motion-safe:animate-ping sm:h-64 sm:w-64"
          />
          <Rosto estado="ligando" nivel={0} className="relative" />
        </div>
        <h1
          role="alert"
          className="text-balance text-center text-4xl font-semibold sm:text-5xl"
        >
          {NOME_DA_ASSISTENTE} está ligando
        </h1>
        <p className="text-center text-2xl text-muted-foreground">
          Sua assistente virtual
        </p>
        {resta !== null ? (
          <p className="text-center text-2xl font-medium">
            Atendendo em {resta}...
          </p>
        ) : null}
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        <BotaoGrande
          tom="atender"
          className="min-h-28 gap-4 text-4xl"
          onClick={onAtender}
        >
          <Phone aria-hidden className="h-10 w-10 shrink-0" />
          Atender
        </BotaoGrande>
        <BotaoGrande
          tom="discreto"
          className="text-xl"
          onClick={onRecusar}
        >
          Agora não
        </BotaoGrande>
      </div>
    </section>
  );
}
