'use client';

import { useEffect } from 'react';
import { fetchDoAparelho } from '@/lib/aparelho';
import type { EventoDaConversa } from '@/lib/tipos';

/**
 * Durante a ligação o aparelho pergunta ao servidor, a cada 5 segundos, se alguém da
 * família entrou. É essa pergunta que faz o prazo do convite vencer: a Vercel não
 * tem relógio rodando, então a frase de "não conseguiu entrar" sai daqui.
 */
export function useConviteDaFamilia(conversaId: string, ativo: boolean): void {
  useEffect(() => {
    if (!ativo || !conversaId) return;
    const perguntar = () => {
      const evento: EventoDaConversa = { tipo: 'convite', conversaId };
      void fetchDoAparelho('/api/conversa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evento),
      }).catch(() => undefined);
    };
    const relogio = setInterval(perguntar, 5000);
    return () => clearInterval(relogio);
  }, [conversaId, ativo]);
}
