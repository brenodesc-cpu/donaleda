import { describe, expect, it } from 'vitest';
import { linhaDaConversa, podeLigarDeNovo, proximaLigacao } from '@/components/familia/casa/frases';
import { contarCasa, ordenarMoradores } from '@/components/familia/casa/ordem';
import { montarPainel } from '@/lib/dados';
import { residencialDeExemplo } from '@/lib/exemplo';

// A tela "Todos os moradores" com o residencial de exemplo: quem aparece primeiro e os números do topo.

const AGORA = new Date('2026-11-22T15:00:00.000Z'); // domingo, 12h em Brasília

function casaDeExemplo(agora = AGORA) {
  return residencialDeExemplo(agora).map((m) => ({
    id: `id-${m.nome}`,
    painel: montarPainel(m.ficha(`id-${m.nome}`), agora),
  }));
}

describe('tela de todos os moradores', () => {
  it('põe os avisos urgentes primeiro e quem está bem por último', () => {
    const ordem = ordenarMoradores(casaDeExemplo()).map((m) => [m.painel.idoso.nome, m.situacao]);
    expect(ordem.slice(0, 2).map(([, s]) => s)).toEqual(['urgente', 'urgente']);
    expect(ordem.slice(0, 2).map(([n]) => n).sort()).toEqual(['Cida', 'Jorge']);
    expect(ordem.slice(2, 4).map(([n]) => n).sort()).toEqual(['Lurdes', 'Osvaldo']);
    expect(ordem.at(-1)?.[1]).toBe('conversou');
  });

  it('conta os avisos novos e quem conversou hoje', () => {
    const conta = contarCasa(ordenarMoradores(casaDeExemplo()));
    expect(conta.moradores).toBe(8);
    expect(conta.urgentes).toBe(2);
    expect(conta.avisosNovos).toBeGreaterThanOrEqual(4);
    expect(conta.conversaram + conta.conversandoAgora + conta.aindaNao).toBe(8);
    expect(conta.aindaNao).toBeGreaterThanOrEqual(2);
  });

  it('o aviso marcado como visto tira o morador do topo', () => {
    const casa = casaDeExemplo();
    const jorge = casa.find((m) => m.painel.idoso.nome === 'Jorge')!;
    jorge.painel = {
      ...jorge.painel,
      alertas: jorge.painel.alertas.map((a) => ({ ...a, visto: true })),
    };
    const ordem = ordenarMoradores(casa);
    const dele = ordem.find((m) => m.id === jorge.id)!;
    expect(dele.situacao).toBe('conversou');
    expect(dele.avisosNovos).toHaveLength(0);
    expect(contarCasa(ordem).urgentes).toBe(1);
  });
});

describe('frase da conversa de hoje no cartão', () => {
  it('diz a próxima ligação de hoje ou a de amanhã', () => {
    expect(proximaLigacao(['09:00', '19:00'], '15:40')).toEqual({ hora: '19:00', amanha: false });
    expect(proximaLigacao(['09:00'], '15:40')).toEqual({ hora: '09:00', amanha: true });
    expect(proximaLigacao([], '15:40')).toBeNull();
  });

  it('quem não atendeu hoje aparece com a hora perdida e pode receber ligação de novo', () => {
    const osvaldo = casaDeExemplo().find((m) => m.painel.idoso.nome === 'Osvaldo')!.painel;
    expect(linhaDaConversa(osvaldo, AGORA.toISOString())).toMatchObject({ tom: 'atencao' });
    expect(linhaDaConversa(osvaldo, AGORA.toISOString()).texto).toMatch(/^Não atendeu às 9h\./);
    expect(podeLigarDeNovo(osvaldo)).toBe(true);
    const jorge = casaDeExemplo().find((m) => m.painel.idoso.nome === 'Jorge')!.painel;
    expect(linhaDaConversa(jorge, AGORA.toISOString()).texto).toBe('Conversou às 9h05, por 6 minutos');
    expect(podeLigarDeNovo(jorge)).toBe(false);
  });
});
