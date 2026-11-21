'use client';

import { useCallback, useEffect, useState } from 'react';
import { destravarSom } from './somDoAparelho';

export type EstadoDoAparelho = 'conferindo' | 'precisa' | 'pronto';

/**
 * Diz se este aparelho já pode receber ligações, ou seja, se o microfone já foi
 * liberado neste navegador. Quando não foi, `preparar` pede o microfone e
 * destrava o som. É o filho quem faz isso, uma vez, no dia em que deixa o
 * aparelho com o idoso.
 */
export function useAparelhoPronto() {
  const [estado, setEstado] = useState<EstadoDoAparelho>('conferindo');
  const [negado, setNegado] = useState(false);

  useEffect(() => {
    let vivo = true;
    let permissao: PermissionStatus | null = null;
    const ler = () => {
      if (vivo && permissao) {
        setEstado(permissao.state === 'granted' ? 'pronto' : 'precisa');
      }
    };

    (async () => {
      try {
        if (!navigator.permissions?.query) throw new Error('sem consulta');
        permissao = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        ler();
        permissao.addEventListener('change', ler);
      } catch {
        // Navegador que não responde à consulta é tratado como não liberado.
        if (vivo) setEstado('precisa');
      }
    })();

    return () => {
      vivo = false;
      permissao?.removeEventListener('change', ler);
    };
  }, []);

  // Qualquer toque na página libera o som do toque de chamada, mesmo quando o
  // microfone já estava liberado de outro dia.
  useEffect(() => {
    const aoTocar = () => void destravarSom();
    window.addEventListener('pointerdown', aoTocar);
    return () => window.removeEventListener('pointerdown', aoTocar);
  }, []);

  const preparar = useCallback(async () => {
    setNegado(false);
    // Precisa acontecer dentro do toque, antes de qualquer espera.
    void destravarSom();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('sem microfone');
      const som = await navigator.mediaDevices.getUserMedia({ audio: true });
      som.getTracks().forEach((faixa) => faixa.stop());
      setEstado('pronto');
    } catch {
      setNegado(true);
    }
  }, []);

  return { estado, negado, preparar };
}
