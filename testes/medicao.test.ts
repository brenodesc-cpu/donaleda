import { describe, expect, it } from 'vitest';
import type { ItemDoTranscript } from '@/lib/conversation';
import { limparTempos, linhaDaMedicao, resumirMedicao, somarMedida, type Medicao } from '@/lib/medicao';
import { marcaDaFalaDoIdoso } from '@/hooks/useTetoDaLigacao';

// O tempo de resposta vem da Agora a cada fala e vira um resumo por conversa.
// O teto da ligação depende de saber quando o idoso falou de novo.

describe('tempo de resposta medido pela Agora', () => {
  it('soma as medidas de cada peça e tira a média e o pior caso', () => {
    let medicao: Medicao = {};
    medicao = somarMedida(medicao, { type: 'llm', name: 'ttfb', value: 800 });
    medicao = somarMedida(medicao, { type: 'llm', name: 'ttfb', value: 1200 });
    medicao = somarMedida(medicao, { type: 'tts', name: 'ttfb', value: 300 });
    expect(resumirMedicao(medicao)).toEqual({
      'llm.ttfb': { n: 2, mediaMs: 1000, piorMs: 1200 },
      'tts.ttfb': { n: 1, mediaMs: 300, piorMs: 300 },
    });
    expect(linhaDaMedicao(medicao)).toBe('llm.ttfb 1000 ms (2) · tts.ttfb 300 ms (1)');
  });

  it('deixa de fora valor negativo, infinito, maior que 2 minutos e nome estranho', () => {
    let medicao: Medicao = {};
    medicao = somarMedida(medicao, { type: 'llm', name: 'ttfb', value: -5 });
    medicao = somarMedida(medicao, { type: 'llm', name: 'ttfb', value: Number.POSITIVE_INFINITY });
    medicao = somarMedida(medicao, { type: 'llm', name: 'ttfb', value: 130_000 });
    medicao = somarMedida(medicao, { type: 'llm', name: '<script>', value: 10 });
    expect(medicao).toEqual({});
  });

  it('guarda no máximo 12 medidas diferentes', () => {
    let medicao: Medicao = {};
    for (let i = 0; i < 20; i++) medicao = somarMedida(medicao, { type: 'llm', name: `m${i}`, value: 10 });
    expect(Object.keys(medicao)).toHaveLength(12);
  });

  it('o servidor aceita só o formato esperado', () => {
    expect(limparTempos({ 'mllm.ttfb': { n: 3, mediaMs: 640.4, piorMs: 900 } })).toEqual({
      'mllm.ttfb': { n: 3, mediaMs: 640, piorMs: 900 },
    });
    expect(limparTempos(null)).toBeNull();
    expect(limparTempos([1, 2])).toBeNull();
    expect(limparTempos({ 'llm.ttfb': { n: 0, mediaMs: 1, piorMs: 1 } })).toBeNull();
    expect(limparTempos({ 'llm.ttfb': { n: 1, mediaMs: -1, piorMs: 1 } })).toBeNull();
    expect(limparTempos({ 'NOME RUIM': { n: 1, mediaMs: 1, piorMs: 1 } })).toBeNull();
  });
});

describe('teto da ligação', () => {
  const ASSISTENTE = '123456';
  const item = (turno: number, texto: string, uid = '0'): ItemDoTranscript =>
    ({ turn_id: turno, uid, text: texto, _time: 0 }) as unknown as ItemDoTranscript;

  it('a marca muda quando o idoso fala algo novo ou a fala dele cresce', () => {
    const antes = marcaDaFalaDoIdoso([item(1, 'Eu')], ASSISTENTE);
    const cresceu = marcaDaFalaDoIdoso([item(1, 'Eu caí')], ASSISTENTE);
    const nova = marcaDaFalaDoIdoso([item(1, 'Eu caí'), item(2, 'Sim')], ASSISTENTE);
    expect(cresceu).not.toBe(antes);
    expect(nova).not.toBe(cresceu);
  });

  it('a marca não muda quando só a assistente fala', () => {
    const antes = marcaDaFalaDoIdoso([item(1, 'Dormi bem')], ASSISTENTE);
    const depois = marcaDaFalaDoIdoso([item(1, 'Dormi bem'), item(2, 'A senhora ainda está aí?', ASSISTENTE)], ASSISTENTE);
    expect(depois).toBe(antes);
  });
});

describe('medidas estranhas e o tempo inteiro da resposta', () => {
  it('deixa de fora valor vazio, nulo ou em texto', () => {
    let medicao: Medicao = {};
    for (const value of [null, undefined, '', '800'] as unknown[]) {
      medicao = somarMedida(medicao, { type: 'llm', name: 'ttfb', value: value as number });
    }
    expect(medicao).toEqual({});
  });

  it('guarda o tempo inteiro de cada resposta como turno.e2e', () => {
    const medicao = somarMedida({}, { type: 'turno', name: 'e2e', value: 1450 });
    expect(resumirMedicao(medicao)).toEqual({ 'turno.e2e': { n: 1, mediaMs: 1450, piorMs: 1450 } });
  });

  it('o servidor recusa média maior que o pior caso', () => {
    expect(limparTempos({ 'turno.e2e': { n: 2, mediaMs: 900, piorMs: 800 } })).toBeNull();
  });
});
