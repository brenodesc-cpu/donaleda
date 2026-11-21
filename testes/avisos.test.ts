import { describe, expect, it } from 'vitest';
import { avisoAberto, linhaDoAviso, marcarAvisoVisto, registrarDesfecho, tempoEntre } from '@/lib/avisos';
import { montarPainel } from '@/lib/dados';
import type { Alerta, Base } from '@/lib/tipos';

// O aviso guarda quem viu, quando e o que a pessoa fez. Mexe na ficha, então a regra tem prova.

const CRIADO = '2026-11-21T20:00:00.000Z';
const aviso = (extra: Partial<Alerta> = {}): Alerta => ({
  id: 'a1',
  tipo: 'emergencia',
  gravidade: 'urgente',
  texto: 'Disse que caiu no banheiro.',
  criadoEm: CRIADO,
  origem: 'regra',
  visto: false,
  ...extra,
});
const depois = (min: number) => new Date(new Date(CRIADO).getTime() + min * 60_000);

describe('aviso com quem viu e como terminou', () => {
  it('aviso que ninguém viu diz há quanto tempo está assim', () => {
    expect(linhaDoAviso(aviso(), depois(12).toISOString())).toBe('Ninguém viu ainda, há 12 min.');
    expect(avisoAberto(aviso())).toBe(true);
  });

  it('"Já vi" guarda quem viu primeiro e a hora, e o aviso espera o que a pessoa fez', () => {
    const a = aviso();
    marcarAvisoVisto(a, 'Marina', depois(4));
    marcarAvisoVisto(a, 'Pedro', depois(9));
    expect(a).toMatchObject({ visto: true, vistoPor: 'Marina', vistoEm: depois(4).toISOString() });
    expect(avisoAberto(a)).toBe(true);
    expect(linhaDoAviso(a, depois(10).toISOString())).toBe('Marina viu em 4 min.');
  });

  it('a resposta fecha o aviso e entra na linha, com a nota', () => {
    const a = aviso();
    marcarAvisoVisto(a, 'Marina', depois(4));
    registrarDesfecho(a, 'liguei', '  Estava só assustada.  ', 'Marina', depois(6));
    expect(avisoAberto(a)).toBe(false);
    expect(a.desfecho).toMatchObject({ resposta: 'liguei', nota: 'Estava só assustada.', por: 'Marina' });
    expect(linhaDoAviso(a, depois(20).toISOString())).toBe('Marina viu em 4 min. Ligou, está tudo bem: Estava só assustada.');
  });

  it('quando outra pessoa responde, a linha diz quem fez', () => {
    const a = aviso();
    marcarAvisoVisto(a, 'Ana', depois(3));
    registrarDesfecho(a, 'fui_la', '', 'Carla', depois(8));
    expect(linhaDoAviso(a, depois(9).toISOString())).toBe('Ana viu em 3 min. Carla foi até lá.');
  });

  it('"Vou ver mais tarde" deixa o aviso aberto', () => {
    const a = aviso();
    registrarDesfecho(a, 'depois', undefined, 'Marina', depois(2));
    expect(a.vistoPor).toBe('Marina');
    expect(avisoAberto(a)).toBe(true);
  });

  it('aviso visto antes de existir o desfecho continua fechado', () => {
    expect(avisoAberto(aviso({ visto: true }))).toBe(false);
    expect(linhaDoAviso(aviso({ visto: true }), depois(5).toISOString())).toBeNull();
  });

  it('nota longa é cortada e nome vazio vira "Alguém da família"', () => {
    const a = aviso();
    registrarDesfecho(a, 'chamei_ajuda', 'x'.repeat(300), '   ', depois(1));
    expect(a.desfecho?.nota).toHaveLength(140);
    expect(a.desfecho?.por).toBe('Alguém da família');
  });

  it('conta o tempo em minutos, horas e dias', () => {
    expect(tempoEntre(CRIADO, depois(0.2).toISOString())).toBe('menos de 1 min');
    expect(tempoEntre(CRIADO, depois(80).toISOString())).toBe('1h20');
    expect(tempoEntre(CRIADO, depois(60 * 50).toISOString())).toBe('2 dias');
  });

  it('o painel põe primeiro o aviso visto que ainda espera resposta', () => {
    const fechado = aviso({ id: 'fechado', criadoEm: depois(30).toISOString() });
    registrarDesfecho(fechado, 'liguei', '', 'Marina', depois(31));
    const esperando = aviso({ id: 'esperando' });
    marcarAvisoVisto(esperando, 'Marina', depois(2));
    const base = { idoso: { id: 'x', nome: 'Helena', tratamento: 'dona Helena', idade: 78, familiar: { nome: 'Marina', parentesco: 'filha' }, remedios: [], primeiraConversaFeita: true, horariosDeLigacao: [], atenderSozinho: false }, dias: [], lembrancas: [], alertas: [fechado, esperando], conversas: [], chamadas: [] } as Base;
    expect(montarPainel(base, depois(40)).alertas.map((a) => a.id)).toEqual(['esperando', 'fechado']);
  });
});
