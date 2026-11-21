'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AcaoDaFamilia, PainelDaFamilia } from '@/lib/tipos';

const INTERVALO_MS = 2000;

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

/**
 * Busca o painel a cada 2 segundos e guarda o último dado bom, pra tela nunca
 * piscar nem esvaziar quando uma busca falha.
 */
export function usePainel() {
  const [bruto, setBruto] = useState<PainelDaFamilia | null>(null);
  const [semConexao, setSemConexao] = useState(false);
  // Avisos marcados como vistos aqui, antes de o servidor confirmar.
  const [vistosAqui, setVistosAqui] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

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
        setBruto(dado);
        setSemConexao(false);
      } catch {
        if (vivo) setSemConexao(true);
      } finally {
        if (vivo) espera = setTimeout(buscar, INTERVALO_MS);
      }
    };

    void buscar();
    return () => {
      vivo = false;
      if (espera) clearTimeout(espera);
    };
  }, []);

  const marcarVisto = useCallback(async (alertaId: string) => {
    setVistosAqui((antes) => new Set(antes).add(alertaId));
    try {
      const acao: AcaoDaFamilia = { acao: 'visto', alertaId };
      const resposta = await fetch('/api/familia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acao),
      });
      if (!resposta.ok) throw new Error(`status ${resposta.status}`);
    } catch {
      // Não gravou: o aviso volta a aparecer como não visto.
      setVistosAqui((antes) => {
        const depois = new Set(antes);
        depois.delete(alertaId);
        return depois;
      });
      setSemConexao(true);
    }
  }, []);

  const painel = useMemo<PainelDaFamilia | null>(() => {
    if (!bruto) return null;
    if (vistosAqui.size === 0) return bruto;
    return {
      ...bruto,
      alertas: bruto.alertas.map((alerta) =>
        vistosAqui.has(alerta.id) ? { ...alerta, visto: true } : alerta,
      ),
    };
  }, [bruto, vistosAqui]);

  return { painel, semConexao, marcarVisto };
}
