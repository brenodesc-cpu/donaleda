'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDoAparelho } from '@/lib/aparelho';
import type {
  Chamada,
  RespostaDaChamada,
  SituacaoDaChamada,
} from '@/lib/tipos';

const INTERVALO_MS = 2000;
/** Depois de tantas buscas seguidas sem resposta, a chamada que estava tocando some da tela. */
const FALHAS_ATE_DESISTIR = 3;

function pareceSituacao(dado: unknown): dado is SituacaoDaChamada {
  if (!dado || typeof dado !== 'object') return false;
  const s = dado as Partial<SituacaoDaChamada>;
  return Array.isArray(s.horariosDeLigacao) && 'chamada' in s;
}

/**
 * Pergunta ao servidor, a cada 2 segundos, se a assistente está ligando agora.
 * Só pergunta enquanto `ativo` (aparelho pronto e fora de uma ligação).
 * A última situação boa fica guardada, pra tela não piscar numa busca que falha.
 */
export function useChamada(ativo: boolean) {
  const [situacao, setSituacao] = useState<SituacaoDaChamada | null>(null);
  // Chamadas que este aparelho já atendeu ou recusou: não tocam de novo.
  const [respondidas, setRespondidas] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;
    let falhas = 0;

    const buscar = async () => {
      try {
        const resposta = await fetchDoAparelho('/api/chamada', { cache: 'no-store' });
        if (!resposta.ok) throw new Error(`status ${resposta.status}`);
        const dado: unknown = await resposta.json();
        if (!pareceSituacao(dado)) throw new Error('resposta fora do contrato');
        falhas = 0;
        if (vivo) setSituacao(dado);
      } catch {
        falhas += 1;
        if (vivo && falhas >= FALHAS_ATE_DESISTIR) {
          setSituacao((antes) => (antes ? { ...antes, chamada: null } : antes));
        }
      } finally {
        if (vivo) espera = setTimeout(buscar, INTERVALO_MS);
      }
    };

    void buscar();
    return () => {
      vivo = false;
      if (espera) clearTimeout(espera);
    };
  }, [ativo]);

  const chamada = useMemo<Chamada | null>(() => {
    const atual = situacao?.chamada;
    if (!ativo || !atual || atual.estado !== 'tocando') return null;
    return respondidas.has(atual.id) ? null : atual;
  }, [ativo, situacao, respondidas]);

  const responder = useCallback(
    (acao: RespostaDaChamada['acao'], chamadaId: string) => {
      setRespondidas((antes) => new Set(antes).add(chamadaId));
      const resposta: RespostaDaChamada = { acao, chamadaId };
      void fetchDoAparelho('/api/chamada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resposta),
        keepalive: true,
      }).catch(() => undefined);
    },
    [],
  );

  return { situacao, chamada, responder };
}
