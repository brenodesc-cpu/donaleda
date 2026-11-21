'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PainelDaFamilia } from '@/lib/tipos';
import { arrumarHorarios } from './formatos';
import {
  buscarPainel,
  deuCerto,
  enviarAcao,
  type AcaoComIdoso,
  type PerfilDoIdoso,
} from './api';

const INTERVALO_MS = 2000;

/** Como está o pedido de "Ligar agora" feito neste painel. */
export type PedidoDeLigacao = 'parado' | 'pedindo' | 'falhou';

function pareceUmPainel(dado: unknown): dado is PainelDaFamilia {
  if (!dado || typeof dado !== 'object') return false;
  const p = dado as Partial<PainelDaFamilia>;
  return (
    !!p.idoso &&
    !!p.hoje &&
    Array.isArray(p.alertas) &&
    Array.isArray(p.semana) &&
    Array.isArray(p.lembrancas)
  );
}

/** Campo que faltar na resposta vira vazio, pra tela nunca quebrar. */
function completar(dado: PainelDaFamilia): PainelDaFamilia {
  const { idoso } = dado;
  return {
    ...dado,
    chamadaTocando: dado.chamadaTocando ?? null,
    chamadas: Array.isArray(dado.chamadas) ? dado.chamadas : [],
    idoso: {
      ...idoso,
      remedios: Array.isArray(idoso.remedios) ? idoso.remedios : [],
      horariosDeLigacao: Array.isArray(idoso.horariosDeLigacao) ? idoso.horariosDeLigacao : [],
      atenderSozinho: idoso.atenderSozinho === true,
    },
  };
}

/**
 * Busca o painel do idoso escolhido a cada 2 segundos e guarda o último dado
 * bom, pra tela nunca piscar nem esvaziar quando uma busca falha. As mudanças
 * feitas aqui aparecem na hora e se acertam com o servidor na busca seguinte.
 */
export function usePainel(idosoId: string | null) {
  const router = useRouter();
  const [bruto, setBruto] = useState<PainelDaFamilia | null>(null);
  const [semConexao, setSemConexao] = useState(false);
  const [vistosAqui, setVistosAqui] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [horariosAqui, setHorariosAqui] = useState<string[] | null>(null);
  const [atenderSozinhoAqui, setAtenderSozinhoAqui] = useState<boolean | null>(null);
  const [pedidoDeLigacao, setPedidoDeLigacao] = useState<PedidoDeLigacao>('parado');

  const buscarAgora = useRef<() => Promise<void>>(async () => {});
  const versaoDosHorarios = useRef(0);
  const versaoDoAtender = useRef(0);

  useEffect(() => {
    setBruto(null);
    if (!idosoId) return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;

    const buscar = async () => {
      const { status, dado } = await buscarPainel(idosoId);
      if (!vivo) return;
      if (status === 401) {
        router.replace('/entrar');
        return;
      }
      if (deuCerto(status) && pareceUmPainel(dado)) {
        setBruto(completar(dado));
        setSemConexao(false);
      } else {
        setSemConexao(true);
      }
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
  }, [idosoId, router]);

  /** Manda a ação do idoso escolhido e devolve o status. Zero: nem chegou. */
  const mandar = useCallback(
    async (acao: AcaoComIdoso): Promise<number> => {
      const { status } = await enviarAcao(acao);
      if (status === 401) router.replace('/entrar');
      if (status === 0) setSemConexao(true);
      return status;
    },
    [router],
  );

  const marcarVisto = useCallback(
    async (alertaId: string) => {
      if (!idosoId) return;
      setVistosAqui((antes) => new Set(antes).add(alertaId));
      if (deuCerto(await mandar({ acao: 'visto', alertaId, idosoId }))) return;
      setVistosAqui((antes) => {
        const depois = new Set(antes);
        depois.delete(alertaId);
        return depois;
      });
    },
    [idosoId, mandar],
  );

  const ligar = useCallback(async () => {
    if (!idosoId) return;
    setPedidoDeLigacao('pedindo');
    const status = await mandar({ acao: 'ligar', idosoId });
    // 409: já está tocando ou em ligação, então não é falha.
    if (!deuCerto(status) && status !== 409) {
      setPedidoDeLigacao('falhou');
      return;
    }
    await buscarAgora.current();
    setPedidoDeLigacao('parado');
  }, [idosoId, mandar]);

  const trocarHorarios = useCallback(
    async (horarios: string[]) => {
      if (!idosoId) return;
      const lista = arrumarHorarios(horarios);
      const versao = (versaoDosHorarios.current += 1);
      setHorariosAqui(lista);
      if (deuCerto(await mandar({ acao: 'horarios', horarios: lista, idosoId }))) {
        await buscarAgora.current();
      }
      if (versao === versaoDosHorarios.current) setHorariosAqui(null);
    },
    [idosoId, mandar],
  );

  const trocarAtenderSozinho = useCallback(
    async (ligado: boolean) => {
      if (!idosoId) return;
      const versao = (versaoDoAtender.current += 1);
      setAtenderSozinhoAqui(ligado);
      if (deuCerto(await mandar({ acao: 'atender_sozinho', ligado, idosoId }))) {
        await buscarAgora.current();
      }
      if (versao === versaoDoAtender.current) setAtenderSozinhoAqui(null);
    },
    [idosoId, mandar],
  );

  /** Grava o que mudou no cadastro. Devolve true quando o servidor guardou. */
  const salvarPerfil = useCallback(
    async (perfil: PerfilDoIdoso): Promise<boolean> => {
      if (!idosoId) return false;
      const guardou = deuCerto(await mandar({ acao: 'perfil', idosoId, ...perfil }));
      if (guardou) await buscarAgora.current();
      return guardou;
    },
    [idosoId, mandar],
  );

  const painel = useMemo<PainelDaFamilia | null>(() => {
    if (!bruto) return null;
    return {
      ...bruto,
      idoso: {
        ...bruto.idoso,
        horariosDeLigacao: horariosAqui ?? bruto.idoso.horariosDeLigacao,
        atenderSozinho: atenderSozinhoAqui ?? bruto.idoso.atenderSozinho,
      },
      alertas:
        vistosAqui.size === 0
          ? bruto.alertas
          : bruto.alertas.map((alerta) =>
              vistosAqui.has(alerta.id) ? { ...alerta, visto: true } : alerta,
            ),
    };
  }, [bruto, vistosAqui, horariosAqui, atenderSozinhoAqui]);

  return {
    painel,
    semConexao,
    marcarVisto,
    pedidoDeLigacao,
    ligar,
    trocarHorarios,
    trocarAtenderSozinho,
    salvarPerfil,
  };
}
