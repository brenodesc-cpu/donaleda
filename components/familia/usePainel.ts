'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AcaoDaFamilia, PainelDaFamilia } from '@/lib/tipos';
import { arrumarHorarios } from './formatos';

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

/** Servidor mais antigo não manda os campos das ligações: aqui eles viram vazio. */
function completar(dado: PainelDaFamilia): PainelDaFamilia {
  const { idoso } = dado;
  return {
    ...dado,
    chamadaTocando: dado.chamadaTocando ?? null,
    chamadas: Array.isArray(dado.chamadas) ? dado.chamadas : [],
    idoso: {
      ...idoso,
      horariosDeLigacao: Array.isArray(idoso.horariosDeLigacao)
        ? idoso.horariosDeLigacao
        : [],
      atenderSozinho: idoso.atenderSozinho === true,
    },
  };
}

/** Manda uma ação e devolve o status da resposta. Zero quer dizer que nem chegou. */
async function enviar(acao: AcaoDaFamilia): Promise<number> {
  try {
    const resposta = await fetch('/api/familia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acao),
    });
    return resposta.status;
  } catch {
    return 0;
  }
}

const deuCerto = (status: number) => status >= 200 && status < 300;

/**
 * Busca o painel a cada 2 segundos e guarda o último dado bom, pra tela nunca
 * piscar nem esvaziar quando uma busca falha. As mudanças feitas aqui aparecem
 * na hora e se acertam com o servidor na busca seguinte.
 */
export function usePainel() {
  const [bruto, setBruto] = useState<PainelDaFamilia | null>(null);
  const [semConexao, setSemConexao] = useState(false);
  // Avisos marcados como vistos aqui, antes de o servidor confirmar.
  const [vistosAqui, setVistosAqui] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  // O que a família acabou de mudar e o servidor ainda não devolveu.
  const [horariosAqui, setHorariosAqui] = useState<string[] | null>(null);
  const [atenderSozinhoAqui, setAtenderSozinhoAqui] = useState<boolean | null>(null);
  const [pedidoDeLigacao, setPedidoDeLigacao] = useState<PedidoDeLigacao>('parado');

  const buscarAgora = useRef<() => Promise<void>>(async () => {});
  // Só o último pedido de cada tipo pode desfazer a mudança local.
  const versaoDosHorarios = useRef(0);
  const versaoDoAtender = useRef(0);

  useEffect(() => {
    let vivo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;

    const buscar = async () => {
      try {
        const resposta = await fetch('/api/familia', { cache: 'no-store' });
        if (!resposta.ok) throw new Error(`status ${resposta.status}`);
        const dado: unknown = await resposta.json();
        if (!pareceUmPainel(dado)) throw new Error('resposta fora do contrato');
        if (!vivo) return;
        setBruto(completar(dado));
        setSemConexao(false);
      } catch {
        if (vivo) setSemConexao(true);
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
  }, []);

  const marcarVisto = useCallback(async (alertaId: string) => {
    setVistosAqui((antes) => new Set(antes).add(alertaId));
    const status = await enviar({ acao: 'visto', alertaId });
    if (deuCerto(status)) return;
    // Não gravou: o aviso volta a aparecer como não visto.
    setVistosAqui((antes) => {
      const depois = new Set(antes);
      depois.delete(alertaId);
      return depois;
    });
    setSemConexao(true);
  }, []);

  const ligar = useCallback(async () => {
    setPedidoDeLigacao('pedindo');
    const status = await enviar({ acao: 'ligar' });
    if (!deuCerto(status)) {
      setPedidoDeLigacao('falhou');
      return;
    }
    // Busca na hora pra o botão já mostrar que está tocando.
    await buscarAgora.current();
    setPedidoDeLigacao('parado');
  }, []);

  const trocarHorarios = useCallback(async (horarios: string[]) => {
    const lista = arrumarHorarios(horarios);
    const versao = (versaoDosHorarios.current += 1);
    setHorariosAqui(lista);
    const status = await enviar({ acao: 'horarios', horarios: lista });
    if (deuCerto(status)) await buscarAgora.current();
    else if (status === 0) setSemConexao(true);
    // Gravou: o servidor já devolveu a lista nova. Falhou: volta a lista antiga.
    if (versao === versaoDosHorarios.current) setHorariosAqui(null);
  }, []);

  const trocarAtenderSozinho = useCallback(async (ligado: boolean) => {
    const versao = (versaoDoAtender.current += 1);
    setAtenderSozinhoAqui(ligado);
    const status = await enviar({ acao: 'atender_sozinho', ligado });
    if (deuCerto(status)) await buscarAgora.current();
    else if (status === 0) setSemConexao(true);
    if (versao === versaoDoAtender.current) setAtenderSozinhoAqui(null);
  }, []);

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
  };
}
