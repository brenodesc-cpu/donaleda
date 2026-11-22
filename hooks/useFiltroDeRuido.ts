'use client';

// Filtro de barulho da Agora (AI Noise Suppression) no microfone do aparelho do
// idoso. Tira TV, rua e conversa de fundo antes de o áudio sair do celular, nos
// dois modos da conversa. Se o aparelho não aguentar o filtro, o microfone segue
// sem ele, sem a pessoa perceber nada. NEXT_PUBLIC_LIA_FILTRO_DE_RUIDO=0 desliga.

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import AgoraRTC, { type IMicrophoneAudioTrack } from 'agora-rtc-react';
import type { AIDenoiserExtension, IAIDenoiserProcessor } from 'agora-extension-ai-denoiser';

// Em celulares (app nativo Capacitor, Safari iOS e Chrome Android), o hardware/SO já aplica
// AEC + NS + AGC nativos em C++/DSP. Rodar o denoiser em WASM/AudioWorklet no mobile adiciona
// latência e pode cortar ou abafar vozes baixas (principalmente no iOS Safari). Por isso fica
// ligado no desktop e desligado no mobile por padrão (forçável com NEXT_PUBLIC_LIA_FILTRO_DE_RUIDO=1).
const FORCADO = process.env.NEXT_PUBLIC_LIA_FILTRO_DE_RUIDO;

function ehCelularOuTablet(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function deveLigarFiltro(): boolean {
  if (FORCADO === '1') return true;
  if (FORCADO === '0') return false;
  return !ehCelularOuTablet();
}

// A extensão é registrada uma vez por página; registrar de novo dá erro.
let extensao: AIDenoiserExtension | null = null;
let indisponivel = false;

async function pegarExtensao(): Promise<AIDenoiserExtension | null> {
  if (extensao || indisponivel) return extensao;
  try {
    const { AIDenoiserExtension: Extensao } = await import('agora-extension-ai-denoiser');
    const nova = new Extensao({ assetsPath: '/agora-filtro', fetchOptions: { cache: 'force-cache' } });
    if (!nova.checkCompatibility()) {
      indisponivel = true;
      return null;
    }
    AgoraRTC.registerExtensions([nova]);
    extensao = nova;
    return nova;
  } catch (erro) {
    console.warn('Filtro de barulho indisponível:', erro);
    indisponivel = true;
    return null;
  }
}

export function useFiltroDeRuido(faixa: IMicrophoneAudioTrack | null) {
  useEffect(() => {
    if (!deveLigarFiltro() || !faixa) return;
    let processador: IAIDenoiserProcessor | null = null;
    let cancelado = false;

    const voltarSemFiltro = () => {
      try {
        processador?.unpipe();
        faixa.unpipe();
        faixa.pipe(faixa.processorDestination);
      } catch {
        // O microfone já foi fechado.
      }
    };

    void (async () => {
      const ext = await pegarExtensao();
      if (!ext || cancelado) return;
      try {
        processador = ext.createProcessor();
        processador.on('pipeerror', voltarSemFiltro);
        faixa.pipe(processador).pipe(faixa.processorDestination);
        // NSNG tira barulho e vozes de fundo; SOFT preserva a voz baixa de quem tem mais idade.
        await processador.setMode('NSNG');
        await processador.setLevel('SOFT');
        await processador.enable();
      } catch (erro) {
        console.warn('Filtro de barulho não ligou:', erro);
        voltarSemFiltro();
      }
    })();

    return () => {
      cancelado = true;
      if (processador) {
        voltarSemFiltro();
        void processador.destroy?.();
      }
    };
  }, [faixa]);
}
