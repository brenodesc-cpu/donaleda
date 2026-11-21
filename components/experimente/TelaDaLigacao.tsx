'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PhoneOff } from 'lucide-react';
import { BotaoGrande } from '@/components/BotaoGrande';
import { PalcoDaAssistente } from '@/components/PalcoDaAssistente';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import { TEXTO_DO_ESTADO, type EstadoDoRosto } from '@/lib/conversation';

/**
 * O relógio da demonstração: conta o teto a partir de quando a Dona Leda entra
 * na linha e desliga sozinho no fim. Se ela nunca entrar, desliga do mesmo jeito,
 * pouco depois do teto, pra ligação nenhuma passar do que foi reservado.
 */
export function useRelogioDaDemonstracao(teto: number, naLinha: boolean, aoAcabar: () => void): number {
  const [restam, setRestam] = useState(teto);
  const acabar = useRef(aoAcabar);
  useEffect(() => {
    acabar.current = aoAcabar;
  }, [aoAcabar]);

  useEffect(() => {
    const limite = window.setTimeout(() => acabar.current(), (teto + 20) * 1000);
    return () => window.clearTimeout(limite);
  }, [teto]);

  useEffect(() => {
    if (!naLinha) return;
    const comecou = Date.now();
    const relogio = window.setInterval(() => {
      const faltam = Math.max(0, teto - Math.floor((Date.now() - comecou) / 1000));
      setRestam(faltam);
      if (faltam === 0) {
        window.clearInterval(relogio);
        acabar.current();
      }
    }, 500);
    return () => window.clearInterval(relogio);
  }, [naLinha, teto]);

  return restam;
}

function emMinutos(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface TelaDaLigacaoProps {
  estado: EstadoDoRosto;
  nivel: number;
  legenda: string;
  restam: number;
  somPreso: boolean;
  onSoltarSom: () => void;
  onDesligar: () => void;
  /** O som da ligação, que não aparece na tela. */
  children?: ReactNode;
}

/** A ligação da demonstração, com a mesma cara da ligação do aparelho do idoso e o tempo que falta. */
export function TelaDaLigacao({
  estado,
  nivel,
  legenda,
  restam,
  somPreso,
  onSoltarSom,
  onDesligar,
  children,
}: TelaDaLigacaoProps) {
  return (
    <section
      aria-label={`Ligação com a ${NOME_DA_ASSISTENTE}`}
      className="flex w-full flex-1 flex-col items-center justify-between gap-4"
    >
      <p className="text-lg font-medium text-muted-foreground" aria-live="off">
        Demonstração · falta {emMinutos(restam)}
      </p>

      <PalcoDaAssistente comVideo={undefined} estado={estado} nivel={nivel} />

      <div className="flex w-full flex-col items-center gap-2">
        <p role="status" className="text-xl font-medium text-muted-foreground">
          {estado === 'ligando' ? 'Só um instante...' : TEXTO_DO_ESTADO[estado]}
        </p>
        <p
          aria-live="polite"
          className="min-h-28 w-full max-w-2xl text-balance text-center text-2xl font-medium leading-snug sm:text-3xl"
        >
          {legenda}
        </p>
      </div>

      {somPreso ? (
        <BotaoGrande onClick={onSoltarSom}>Toque aqui pra ouvir a {NOME_DA_ASSISTENTE}</BotaoGrande>
      ) : null}

      <BotaoGrande tom={somPreso ? 'discreto' : 'encerrar'} onClick={onDesligar}>
        <PhoneOff aria-hidden className="h-7 w-7 shrink-0" />
        Desligar
      </BotaoGrande>

      {children}
    </section>
  );
}
