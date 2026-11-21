import { describe, expect, it } from 'vitest';
import { montarPainel } from '@/lib/dados';
import { residencialDeExemplo } from '@/lib/exemplo';

// O residencial de exemplo da demonstração: oito moradores com o estado de hoje que a tela mostra.

const AGORA = new Date('2026-11-22T15:00:00.000Z'); // domingo, 12h em Brasília
const painel = (nome: string, agora = AGORA) => {
  const m = residencialDeExemplo(agora).find((x) => x.nome === nome)!;
  return montarPainel(m.ficha(`id-${nome}`), agora);
};

describe('residencial de exemplo', () => {
  it('tem oito moradores, com a dona Helena em quinto', () => {
    const nomes = residencialDeExemplo(AGORA).map((m) => m.nome);
    expect(nomes).toEqual(['Jorge', 'Cida', 'Osvaldo', 'Lurdes', 'Helena', 'Neide', 'Antônio', 'Zilda']);
  });

  it('seu Jorge conversou às 9h05 e tem aviso urgente de queda não visto', () => {
    const p = painel('Jorge');
    expect(p.conversouHoje).toBe(true);
    expect(p.ultimaConversa?.minutos).toBe(6);
    expect(new Date(p.ultimaConversa!.inicio).toISOString()).toBe('2026-11-22T12:05:00.000Z');
    expect(p.alertas[0]).toMatchObject({ tipo: 'emergencia', gravidade: 'urgente', visto: false });
    expect(p.hoje.dor).toBe(7);
  });

  it('dona Cida tem aviso urgente de golpe', () => {
    expect(painel('Cida').alertas[0]).toMatchObject({ tipo: 'golpe', gravidade: 'urgente' });
  });

  it('seu Osvaldo não conversou hoje e tem as duas ligações das 9h perdidas', () => {
    const p = painel('Osvaldo');
    expect(p.conversouHoje).toBe(false);
    expect(p.chamadas.filter((c) => c.estado === 'perdida')).toHaveLength(2);
    expect(p.alertas[0]).toMatchObject({ tipo: 'ligacao', gravidade: 'atencao' });
    expect(p.ultimaConversa).not.toBeNull();
  });

  it('dona Zilda tem ligação marcada pra próxima hora e ainda não conversou', () => {
    const p = painel('Zilda');
    expect(p.conversouHoje).toBe(false);
    expect(p.idoso.horariosDeLigacao).toEqual(['13:00']);
    expect(p.alertas).toHaveLength(0);
  });

  it('seis dias antes de hoje, pra semana não vir vazia', () => {
    expect(painel('Neide').semana.filter((d) => d.sono)).toHaveLength(7);
  });

  it('criado antes das 9h, a conversa de hoje fica um pouco antes de agora', () => {
    const cedo = new Date('2026-11-22T10:00:00.000Z'); // 7h em Brasília
    const p = painel('Jorge', cedo);
    expect(new Date(p.ultimaConversa!.inicio).getTime()).toBeLessThan(cedo.getTime());
    expect(p.conversouHoje).toBe(true);
  });
});
