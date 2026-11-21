'use client';

import { useCallback, useEffect, useState } from 'react';
import { destravarSom } from './somDoAparelho';

export type EstadoDoAparelho = 'conferindo' | 'precisa' | 'pronto';

const CHAVE_MIC_OK = 'donaleda:microfone-ok';

function jaLiberouAntes(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CHAVE_MIC_OK) === '1';
  } catch {
    return false;
  }
}

function marcarLiberado(ok: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (ok) window.localStorage.setItem(CHAVE_MIC_OK, '1');
    else window.localStorage.removeItem(CHAVE_MIC_OK);
  } catch {
    // Sem localStorage.
  }
}

/**
 * Diz se este aparelho já pode receber ligações, ou seja, se o microfone já foi
 * liberado neste navegador. Quando não foi, `preparar` pede o microfone e
 * destrava o som. No Android WebView, `permissions.query` costuma responder
 * `prompt` ou falhar mesmo após concedido; por isso guardamos a confirmação local
 * para o aparelho já voltar pronto pra receber ligações da família.
 */
export function useAparelhoPronto() {
  const [estado, setEstado] = useState<EstadoDoAparelho>('conferindo');
  const [negado, setNegado] = useState(false);

  useEffect(() => {
    let vivo = true;
    let permissao: PermissionStatus | null = null;
    const ler = () => {
      if (!vivo || !permissao) return;
      if (permissao.state === 'granted') {
        marcarLiberado(true);
        setNegado(false);
        setEstado('pronto');
      } else if (permissao.state === 'denied') {
        marcarLiberado(false);
        setNegado(true);
        setEstado('precisa');
      } else {
        // Android WebView frequentemente reporta 'prompt' mesmo depois de já liberado.
        setEstado(jaLiberouAntes() ? 'pronto' : 'precisa');
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
        // WebView sem permissions.query: usa a confirmação gravada no aparelho.
        if (vivo) setEstado(jaLiberouAntes() ? 'pronto' : 'precisa');
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
      marcarLiberado(true);
      setEstado('pronto');
    } catch {
      marcarLiberado(false);
      setNegado(true);
    }
  }, []);

  return { estado, negado, preparar };
}
