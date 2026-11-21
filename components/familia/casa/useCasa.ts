'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IdosoDaFamilia, PainelDaFamilia } from '@/lib/tipos';
import { buscarPainel, deuCerto, enviarAcao } from '../api';
import { completar, pareceUmPainel, type PedidoDeLigacao } from '../usePainel';
import { contarCasa, ordenarMoradores } from './ordem';

const INTERVALO_MS = 5000;

/**
 * Os painéis de todos os moradores da conta, buscados juntos a cada 5 segundos.
 * Guarda o último dado bom de cada um, pra tela nunca esvaziar quando uma busca falha.
 * Paliativo combinado com a conversa do servidor: uma busca por morador. Pra casa de
 * 30 ou mais, o definitivo é um GET /api/casa com o resumo de todos numa chamada só.
 */
export function useCasa(idosos: IdosoDaFamilia[] | null) {
  const router = useRouter();
  const [paineis, setPaineis] = useState<Record<string, PainelDaFamilia>>({});
  const [semConexao, setSemConexao] = useState(false);
  const [vistosAqui, setVistosAqui] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [pedidos, setPedidos] = useState<Record<string, PedidoDeLigacao>>({});
  const buscarAgora = useRef<() => Promise<void>>(async () => {});

  const ids = useMemo(() => (idosos ?? []).map((i) => i.id), [idosos]);
  const chave = ids.join(',');

  useEffect(() => {
    if (ids.length === 0) return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;

    const buscar = async () => {
      const respostas = await Promise.all(ids.map(async (id) => [id, await buscarPainel(id)] as const));
      if (!vivo) return;
      if (respostas.some(([, r]) => r.status === 401)) {
        router.replace('/entrar');
        return;
      }
      const bons: Record<string, PainelDaFamilia> = {};
      let falhou = false;
      for (const [id, { status, dado }] of respostas) {
        if (deuCerto(status) && pareceUmPainel(dado)) bons[id] = completar(dado);
        else falhou = true;
      }
      setPaineis((antes) => {
        const depois: Record<string, PainelDaFamilia> = {};
        for (const id of ids) {
          const painel = bons[id] ?? antes[id];
          if (painel) depois[id] = painel;
        }
        return depois;
      });
      setSemConexao(falhou);
    };

    const ciclo = async () => {
      await buscar();
      if (vivo) espera = setTimeout(ciclo, INTERVALO_MS);
    };

    buscarAgora.current = buscar;
    void ciclo();
    return () => {
      vivo = false;
      if (espera) clearTimeout(espera);
    };
    // `chave` muda quando a lista de moradores muda; `ids` sai dela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, router]);

  /** "Já vi" no cartão marca todos os avisos novos daquele morador. */
  const marcarVistos = useCallback(
    async (idosoId: string, alertaIds: string[]) => {
      setVistosAqui((antes) => new Set([...antes, ...alertaIds]));
      const respostas = await Promise.all(
        alertaIds.map((alertaId) => enviarAcao({ acao: 'visto', alertaId, idosoId })),
      );
      if (respostas.some(({ status }) => status === 401)) router.replace('/entrar');
      if (respostas.some(({ status }) => status === 0)) setSemConexao(true);
      const falharam = alertaIds.filter((_, i) => !deuCerto(respostas[i].status));
      if (falharam.length === 0) return;
      setVistosAqui((antes) => {
        const depois = new Set(antes);
        for (const id of falharam) depois.delete(id);
        return depois;
      });
    },
    [router],
  );

  const ligar = useCallback(
    async (idosoId: string) => {
      setPedidos((antes) => ({ ...antes, [idosoId]: 'pedindo' }));
      const { status } = await enviarAcao({ acao: 'ligar', idosoId });
      if (status === 401) router.replace('/entrar');
      // 409: já está tocando ou em ligação, então não é falha.
      const falhou = !deuCerto(status) && status !== 409;
      if (!falhou) await buscarAgora.current();
      setPedidos((antes) => ({ ...antes, [idosoId]: falhou ? 'falhou' : 'parado' }));
    },
    [router],
  );

  const moradores = useMemo(() => {
    const lista = ids
      .filter((id) => paineis[id])
      .map((id) => {
        const painel = paineis[id];
        return {
          id,
          painel:
            vistosAqui.size === 0
              ? painel
              : {
                  ...painel,
                  alertas: painel.alertas.map((a) => (vistosAqui.has(a.id) ? { ...a, visto: true } : a)),
                },
        };
      });
    return ordenarMoradores(lista);
  }, [ids, paineis, vistosAqui]);

  const carregando = ids.length > 0 && moradores.length === 0;
  const conta = useMemo(() => contarCasa(moradores), [moradores]);

  return { moradores, conta, carregando, semConexao, marcarVistos, ligar, pedidos };
}
