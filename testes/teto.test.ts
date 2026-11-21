import { describe, expect, it } from 'vitest';
import { avancarTeto, RELOGIOS_ZERADOS, type LeituraDoTeto, type RelogiosDoTeto } from '@/lib/teto';

// A ligação encerra sozinha com 10 minutos ou com 2 minutos sem o idoso falar,
// e nunca porque a legenda falhou enquanto ele conversava.

const LIMITES = { tetoMs: 10 * 60_000, semFalaMs: 2 * 60_000 };
const QUIETO: LeituraDoTeto = { legendaMudou: false, volumeDoIdoso: 0, assistenteFalando: false };

function rodar(leitura: (ms: number) => LeituraDoTeto, ateMs: number, passo = 250) {
  let relogios: RelogiosDoTeto = RELOGIOS_ZERADOS;
  for (let ms = passo; ms <= ateMs; ms += passo) {
    const r = avancarTeto(relogios, leitura(ms), passo, LIMITES);
    relogios = r.relogios;
    if (r.encerrar) return { encerrar: r.encerrar, em: ms };
  }
  return { encerrar: null, em: ateMs };
}

describe('teto da ligação', () => {
  it('encerra com 2 minutos de silêncio total', () => {
    expect(rodar(() => QUIETO, 5 * 60_000)).toEqual({ encerrar: 'sem_fala', em: 2 * 60_000 });
  });

  it('não encerra quando a legenda não chega mas o microfone capta o idoso falando', () => {
    const falandoSemLegenda = (ms: number): LeituraDoTeto => ({
      ...QUIETO,
      volumeDoIdoso: ms % 20_000 < 5_000 ? 0.3 : 0,
    });
    expect(rodar(falandoSemLegenda, 9 * 60_000).encerrar).toBeNull();
  });

  it('pausa o relógio do silêncio enquanto a assistente fala', () => {
    // A assistente fala 90 s seguidos e o idoso fica quieto: ainda não são 2 minutos de silêncio dele.
    const historia = (ms: number): LeituraDoTeto => ({ ...QUIETO, assistenteFalando: ms <= 90_000 });
    expect(rodar(historia, 4 * 60_000)).toEqual({ encerrar: 'sem_fala', em: 90_000 + 2 * 60_000 });
  });

  it('no teto, espera um respiro de 2 segundos pra não cortar a frase de ninguém', () => {
    // O idoso fala até 10min05s e para.
    const conversa = (ms: number): LeituraDoTeto => ({ ...QUIETO, legendaMudou: ms <= 605_000 && ms % 1_000 === 0 });
    const r = rodar(conversa, 12 * 60_000);
    expect(r.encerrar).toBe('teto');
    expect(r.em).toBeGreaterThan(605_000);
    expect(r.em).toBeLessThanOrEqual(608_000);
  });

  it('com o corte por silêncio desligado, só o teto de 10 minutos encerra', () => {
    let relogios: RelogiosDoTeto = RELOGIOS_ZERADOS;
    let encerrar: string | null = null;
    let em = 0;
    for (let ms = 250; ms <= 12 * 60_000 && !encerrar; ms += 250) {
      const r = avancarTeto(relogios, QUIETO, 250, { tetoMs: 10 * 60_000, semFalaMs: 0 });
      relogios = r.relogios;
      encerrar = r.encerrar;
      em = ms;
    }
    expect(encerrar).toBe('teto');
    expect(em).toBe(10 * 60_000);
  });

  it('no teto, encerra de qualquer jeito 30 segundos depois', () => {
    const semParar = (): LeituraDoTeto => ({ ...QUIETO, volumeDoIdoso: 0.5 });
    expect(rodar(semParar, 12 * 60_000)).toEqual({ encerrar: 'teto', em: 10 * 60_000 + 30_000 });
  });

  it('dispara avisarFim uma única vez 90 segundos antes do teto de 10 minutos', () => {
    let relogios: RelogiosDoTeto = RELOGIOS_ZERADOS;
    const avisosEm: number[] = [];
    const falando: LeituraDoTeto = { ...QUIETO, volumeDoIdoso: 0.4 };
    for (let ms = 250; ms <= 9 * 60_000; ms += 250) {
      const r = avancarTeto(relogios, falando, 250, { tetoMs: 10 * 60_000, semFalaMs: 0 });
      relogios = r.relogios;
      if (r.avisarFim) avisosEm.push(ms);
    }
    expect(avisosEm).toEqual([8 * 60_000 + 30_000]);
  });
});
