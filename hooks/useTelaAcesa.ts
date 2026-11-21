'use client';

import { useEffect } from 'react';

/**
 * Mantém a tela do aparelho acesa enquanto ele espera ou atende uma ligação.
 * O navegador solta essa trava quando a aba vai pro fundo, então o pedido é
 * refeito toda vez que a pessoa volta pra aba.
 */
export function useTelaAcesa(ativo: boolean): void {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return;
    let vivo = true;
    let trava: WakeLockSentinel | null = null;

    const pedir = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const nova = await navigator.wakeLock.request('screen');
        if (!vivo) {
          void nova.release().catch(() => undefined);
          return;
        }
        trava = nova;
      } catch {
        // Bateria fraca ou navegador que nega: a tela segue a regra do aparelho.
      }
    };

    void pedir();
    document.addEventListener('visibilitychange', pedir);
    return () => {
      vivo = false;
      document.removeEventListener('visibilitychange', pedir);
      void trava?.release().catch(() => undefined);
    };
  }, [ativo]);
}
