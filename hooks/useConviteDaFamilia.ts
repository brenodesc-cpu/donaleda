'use client';

import { useEffect, useState } from 'react';
import { fetchDoAparelho } from '@/lib/aparelho';
import type { EventoDaConversa, RespostaDoEvento } from '@/lib/tipos';

export interface EstadoDoConvite {
  conviteAberto: boolean;
  familiaEntrou: boolean;
}

/**
 * Durante a ligação o aparelho pergunta ao servidor, a cada 3 segundos, se há convite
 * aberto ou se alguém da família entrou. Além de vencer o prazo de 90 s no servidor,
 * devolve o estado pro aparelho pausar o teto de tempo e segurar a sala na transição.
 */
export function useConviteDaFamilia(conversaId: string, ativo: boolean): EstadoDoConvite {
  const [estado, setEstado] = useState<EstadoDoConvite>({
    conviteAberto: false,
    familiaEntrou: false,
  });

  useEffect(() => {
    if (!ativo || !conversaId) return;
    let vivo = true;
    const perguntar = async () => {
      try {
        const evento: EventoDaConversa = { tipo: 'convite', conversaId };
        const res = await fetchDoAparelho('/api/conversa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(evento),
        });
        if (!vivo || !res.ok) return;
        const dado = (await res.json()) as RespostaDoEvento;
        setEstado((anterior) => {
          const proxAberto = Boolean(dado.conviteAberto);
          const proxEntrou = Boolean(dado.familiaEntrou);
          if (anterior.conviteAberto === proxAberto && anterior.familiaEntrou === proxEntrou) {
            return anterior;
          }
          return { conviteAberto: proxAberto, familiaEntrou: proxEntrou };
        });
      } catch {
        // Segue no próximo ciclo.
      }
    };
    const relogio = setInterval(() => void perguntar(), 3000);
    return () => {
      vivo = false;
      clearInterval(relogio);
    };
  }, [conversaId, ativo]);

  return estado;
}
