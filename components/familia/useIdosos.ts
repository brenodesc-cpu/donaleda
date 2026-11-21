'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IdosoDaFamilia } from '@/lib/tipos';
import { buscarIdosos, deuCerto } from './api';
import { guardarIdosoEscolhido, lerIdosoEscolhido } from './conta';

interface Opcoes {
  /** Quando a família ainda não cadastrou ninguém, vai pro cadastro. */
  exigirIdoso?: boolean;
}

/**
 * Os idosos que a família logada acompanha e qual deles está na tela.
 * Sem login leva pra /entrar. O escolhido vem do endereço (?idoso=), depois do
 * que ficou guardado no aparelho, depois do primeiro da lista.
 */
export function useIdosos({ exigirIdoso = true }: Opcoes = {}) {
  const router = useRouter();
  const [idosos, setIdosos] = useState<IdosoDaFamilia[] | null>(null);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [semConexao, setSemConexao] = useState(false);

  const recarregar = useCallback(async () => {
    const { status, dado } = await buscarIdosos();
    if (status === 401) {
      router.replace('/entrar');
      return;
    }
    if (!deuCerto(status) || !Array.isArray(dado)) {
      setSemConexao(true);
      return;
    }
    setSemConexao(false);
    setIdosos(dado);
    if (dado.length === 0 && exigirIdoso) {
      router.replace('/familia/novo');
      return;
    }
    setEscolhido((atual) => {
      const ids = dado.map((idoso) => idoso.id);
      if (atual && ids.includes(atual)) return atual;
      const daUrl = new URLSearchParams(window.location.search).get('idoso');
      const opcoes = [daUrl, lerIdosoEscolhido()];
      return opcoes.find((id): id is string => !!id && ids.includes(id)) ?? ids[0] ?? null;
    });
  }, [router, exigirIdoso]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  useEffect(() => {
    if (escolhido) guardarIdosoEscolhido(escolhido);
  }, [escolhido]);

  const escolher = useCallback((id: string) => {
    setEscolhido(id);
    const url = new URL(window.location.href);
    url.searchParams.set('idoso', id);
    window.history.replaceState(null, '', url.toString());
  }, []);

  const idoso = idosos?.find((item) => item.id === escolhido) ?? null;

  return { idosos, idoso, escolher, recarregar, semConexao };
}
