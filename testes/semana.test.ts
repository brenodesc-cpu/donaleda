import { describe, expect, it } from 'vitest';
import { contarSemana, fraseDaSemana } from '@/lib/semanaAtiva';
import type { Dia } from '@/lib/tipos';

const dia = (data: string, saiu?: boolean, falou?: boolean): Dia => ({
  data,
  observacoes: [],
  ...(typeof saiu === 'boolean' ? { saiuDeCasa: saiu } : {}),
  ...(typeof falou === 'boolean' ? { falouComAlguem: falou } : {}),
});

describe('o número do sonho: quantos dias saiu de casa e conversou', () => {
  it('soma a semana e diz em palavras', () => {
    const semana = [
      dia('2026-11-15', true, true),
      dia('2026-11-16', true, true),
      dia('2026-11-17', false, false),
      dia('2026-11-18', false, true),
      dia('2026-11-19', true, true),
      dia('2026-11-20', true, true),
      dia('2026-11-21', false, true),
    ];
    const conta = contarSemana(semana);
    expect(conta).toEqual({ dias: 7, saiu: 4, conversou: 6, semResposta: 0 });
    expect(fraseDaSemana(conta)).toBe('Nos últimos 7 dias, saiu de casa em 4 e conversou com alguém em 6.');
  });

  it('avisa os dias sem resposta, que não contam como não ter saído', () => {
    const conta = contarSemana([dia('2026-11-20', true, true), dia('2026-11-21'), dia('2026-11-19')]);
    expect(conta.semResposta).toBe(2);
    expect(fraseDaSemana(conta)).toBe('Nos últimos 3 dias, saiu de casa em 1 e conversou com alguém em 1. Em 2 dias não houve resposta.');
  });

  it('sem nenhuma resposta, não inventa número', () => {
    expect(fraseDaSemana(contarSemana([dia('2026-11-20'), dia('2026-11-21')]))).toBe('');
    expect(fraseDaSemana(contarSemana([]))).toBe('');
  });

  it('um dia só fica no singular', () => {
    expect(fraseDaSemana(contarSemana([dia('2026-11-21', true, false)]))).toBe('No último dia, saiu de casa em 1 e conversou com alguém em 0.');
  });
});
