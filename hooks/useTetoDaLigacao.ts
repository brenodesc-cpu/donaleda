'use client';

import { useEffect, useRef } from 'react';
import type { IMicrophoneAudioTrack } from 'agora-rtc-react';
import type { ItemDoTranscript } from '@/lib/conversation';
import { avancarTeto, RELOGIOS_ZERADOS, type RelogiosDoTeto } from '@/lib/teto';

// A ligação tem teto. Sem ele, um idoso que larga o aparelho com a ligação aberta
// (ou a ligação que atendeu sozinha com ele longe) deixa a assistente na sala até a
// permissão vencer, em 1 hora, e a Agora cobra cada minuto. A conversa combinada é
// de 3 a 10 minutos, então 10 minutos é o máximo. O corte por silêncio (2 minutos
// sem o idoso falar) existe, mas só liga pela variável. A conta fica em lib/teto.ts.

function minutos(variavel: string | undefined, padrao: number): number {
  const pedido = Number(variavel);
  return Number.isFinite(pedido) && pedido >= 1 && pedido <= 60 ? pedido : padrao;
}

export const TETO_DA_LIGACAO_MS = minutos(process.env.NEXT_PUBLIC_LIA_TETO_MIN, 10) * 60_000;

/** O teto que vale: o do servidor (o que sobra do dia) quando vem e é menor que o normal. */
export function tetoDaLigacao(tetoDoServidorMs?: number): number {
  return typeof tetoDoServidorMs === 'number' && tetoDoServidorMs > 0
    ? Math.min(TETO_DA_LIGACAO_MS, tetoDoServidorMs)
    : TETO_DA_LIGACAO_MS;
}
// O corte por silêncio fica desligado até o teste com gente falando (21/11, 17h):
// sem prova de que o microfone e a legenda chegam no celular, ele poderia derrubar
// uma conversa de verdade. NEXT_PUBLIC_LIA_TETO_SEM_FALA_MIN=2 liga com 2 minutos.
export const TETO_SEM_FALA_MS = process.env.NEXT_PUBLIC_LIA_TETO_SEM_FALA_MIN
  ? minutos(process.env.NEXT_PUBLIC_LIA_TETO_SEM_FALA_MIN, 2) * 60_000
  : 0;
const PASSO_MS = 250;

/** Um retrato do que o idoso já falou: muda sempre que ele fala algo novo. */
export function marcaDaFalaDoIdoso(transcript: ItemDoTranscript[], uidDaAssistente: string): string {
  return transcript
    .filter((item) => String(item.uid) !== uidDaAssistente)
    .map((item) => `${item.turn_id}:${String(item.text ?? '').length}`)
    .join('|');
}

/**
 * Encerra a ligação sozinha quando ela passa do teto (esperando um respiro pra não
 * cortar ninguém no meio da frase) ou quando o idoso fica 2 minutos sem falar.
 * Os relógios só começam quando a assistente está na linha.
 */
export function useTetoDaLigacao(
  transcript: ItemDoTranscript[],
  uidDaAssistente: string,
  assistenteNaLinha: boolean,
  assistenteFalando: boolean,
  microfone: IMicrophoneAudioTrack | null,
  onEncerrar: () => void,
  /** Teto desta ligação vindo do servidor (o que sobra dos minutos de hoje). */
  tetoDoServidorMs?: number,
): void {
  // O relógio lê sempre o valor mais novo destas coisas, sem recomeçar a cada render.
  const encerrar = useRef(onEncerrar);
  const falando = useRef(assistenteFalando);
  const mic = useRef(microfone);
  const marca = marcaDaFalaDoIdoso(transcript, uidDaAssistente);
  const marcaAtual = useRef(marca);
  useEffect(() => {
    encerrar.current = onEncerrar;
    falando.current = assistenteFalando;
    mic.current = microfone;
    marcaAtual.current = marca;
  }, [onEncerrar, assistenteFalando, microfone, marca]);

  useEffect(() => {
    if (!assistenteNaLinha) return;
    let relogios: RelogiosDoTeto = RELOGIOS_ZERADOS;
    let marcaVista = marcaAtual.current;
    let encerrou = false;

    const passo = setInterval(() => {
      if (encerrou) return;
      let volume = 0;
      try {
        volume = mic.current?.getVolumeLevel() ?? 0;
      } catch {
        volume = 0;
      }
      const legendaMudou = marcaAtual.current !== marcaVista;
      marcaVista = marcaAtual.current;
      const resultado = avancarTeto(
        relogios,
        { legendaMudou, volumeDoIdoso: volume, assistenteFalando: falando.current },
        PASSO_MS,
        { tetoMs: tetoDaLigacao(tetoDoServidorMs), semFalaMs: TETO_SEM_FALA_MS },
      );
      relogios = resultado.relogios;
      if (resultado.encerrar) {
        encerrou = true;
        encerrar.current();
      }
    }, PASSO_MS);

    return () => clearInterval(passo);
  }, [assistenteNaLinha, tetoDoServidorMs]);
}
