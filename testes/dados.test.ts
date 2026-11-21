import { describe, expect, it } from 'vitest';
import {
  abrirConversa,
  aplicarBemEstar,
  criarAlerta,
  fecharConversa,
  guardarLembranca,
  montarPainel,
  oQueFaltaSaber,
} from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import { montarInstrucoes, montarSaudacao } from '@/lib/persona';

// 21/11/2026 às 10h de Brasília.
const AGORA = new Date('2026-11-21T13:00:00.000Z');

describe('ficha do dia', () => {
  it('junta respostas de momentos diferentes no mesmo dia', () => {
    const base = baseDeExemplo(AGORA);
    aplicarBemEstar(base, { sono: 'bem' }, AGORA);
    const { dia } = aplicarBemEstar(base, { alimentacao: 'comeu_pouco', dor: 4, ondeDoi: 'no joelho' }, AGORA);
    expect(dia.data).toBe('2026-11-21');
    expect(dia.sono).toBe('bem');
    expect(dia.alimentacao).toBe('comeu_pouco');
    expect(dia.dor).toBe(4);
    expect(oQueFaltaSaber(dia)).toEqual(['se tomou o remédio', 'como está se sentindo']);
  });

  it('usa a data de Brasília, e não a do servidor', () => {
    const base = baseDeExemplo(AGORA);
    // 01h de 22/11 em UTC ainda é 22h de 21/11 em Brasília.
    const { dia } = aplicarBemEstar(base, { sono: 'mal' }, new Date('2026-11-22T01:00:00.000Z'));
    expect(dia.data).toBe('2026-11-21');
  });

  it('remédio não tomado avisa a família, uma vez só no dia', () => {
    const base = baseDeExemplo(AGORA);
    const primeira = aplicarBemEstar(base, { remedio: 'nao_tomou' }, AGORA);
    aplicarBemEstar(base, { remedio: 'nao_tomou' }, new Date(AGORA.getTime() + 5 * 60_000));
    expect(primeira.alertas).toHaveLength(1);
    expect(base.alertas.filter((a) => a.tipo === 'remedio')).toHaveLength(1);
  });

  it('remédio tomado não gera aviso', () => {
    const base = baseDeExemplo(AGORA);
    expect(aplicarBemEstar(base, { remedio: 'tomou' }, AGORA).alertas).toHaveLength(0);
  });

  it('dor de 7 pra cima avisa a família e a nota fica entre 0 e 10', () => {
    const base = baseDeExemplo(AGORA);
    const { dia, alertas } = aplicarBemEstar(base, { dor: 14, ondeDoi: 'nas costas' }, AGORA);
    expect(dia.dor).toBe(10);
    expect(alertas[0]?.tipo).toBe('saude');
  });
});

describe('painel da família', () => {
  it('traz sete dias terminando hoje, com o dia vazio quando não houve conversa', () => {
    const painel = montarPainel(baseDeExemplo(AGORA), AGORA);
    expect(painel.semana).toHaveLength(7);
    expect(painel.semana[6].data).toBe('2026-11-21');
    expect(painel.semana[0].data).toBe('2026-11-15');
    expect(painel.hoje.sono).toBeUndefined();
    expect(painel.conversouHoje).toBe(false);
    expect(painel.ultimaConversa).toBeNull();
  });

  it('mostra a conversa em andamento e depois a duração', () => {
    const base = baseDeExemplo(AGORA);
    const conversa = abrirConversa(base, AGORA);
    expect(montarPainel(base, AGORA).ultimaConversa?.emAndamento).toBe(true);
    conversa.falasDoIdoso = 3;
    fecharConversa(base, conversa.id, new Date(AGORA.getTime() + 6 * 60_000));
    const painel = montarPainel(base, new Date(AGORA.getTime() + 7 * 60_000));
    expect(painel.ultimaConversa?.minutos).toBe(6);
    expect(painel.conversouHoje).toBe(true);
    expect(base.idoso.primeiraConversaFeita).toBe(true);
  });

  it('põe os avisos não vistos na frente', () => {
    const base = baseDeExemplo(AGORA);
    const visto = criarAlerta(base, { tipo: 'saude', gravidade: 'atencao', texto: 'A', origem: 'assistente' }, AGORA);
    visto.visto = true;
    criarAlerta(base, { tipo: 'golpe', gravidade: 'atencao', texto: 'B', origem: 'assistente' }, AGORA);
    expect(montarPainel(base, AGORA).alertas.map((a) => a.texto)).toEqual(['B', 'A']);
  });

  it('não guarda a mesma lembrança duas vezes', () => {
    const base = baseDeExemplo(AGORA);
    const antes = base.lembrancas.length;
    guardarLembranca(base, 'Gosta de bolo de fubá.', 'gosto', AGORA);
    guardarLembranca(base, 'gosta de bolo de fubá.', 'gosto', AGORA);
    expect(base.lembrancas).toHaveLength(antes + 1);
  });
});

describe('o que a assistente fala', () => {
  it('na primeira conversa se apresenta como assistente virtual e diz quem pediu', () => {
    const saudacao = montarSaudacao(baseDeExemplo(AGORA), AGORA);
    expect(saudacao).toContain('Bom dia, dona Helena');
    expect(saudacao).toContain(
      'Aqui é a Dona Leda, a assistente virtual que a sua filha Marina contratou pra conversar com a senhora todo dia.',
    );
  });

  it('nas outras conversas continua dizendo que é assistente virtual', () => {
    const base = baseDeExemplo(AGORA);
    base.idoso.primeiraConversaFeita = true;
    expect(montarSaudacao(base, AGORA)).toContain('assistente virtual');
  });

  it('as instruções levam a data certa, os limites e o que falta saber', () => {
    const base = baseDeExemplo(AGORA);
    aplicarBemEstar(base, { sono: 'bem' }, AGORA);
    const instrucoes = montarInstrucoes(base, AGORA, true);
    expect(instrucoes).toContain('21 de novembro de 2026');
    expect(instrucoes).toContain('um nove dois');
    expect(instrucoes).toContain('nunca pede dinheiro');
    expect(instrucoes).toContain('Hoje você já sabe: dormiu bem.');
    expect(instrucoes).toContain('registrar_bem_estar');
    expect(instrucoes).not.toContain('como dormiu, se comeu, se tomou o remédio, se sente dor, como está se sentindo.');
  });

  it('sem as ações, não promete avisar a família', () => {
    const instrucoes = montarInstrucoes(baseDeExemplo(AGORA), AGORA, false);
    expect(instrucoes).not.toContain('registrar_bem_estar');
    expect(instrucoes).toContain('Não prometa avisar a família');
  });
});

describe('quem contratou, com o artigo certo', () => {
  it('acerta o feminino e o masculino do parentesco', async () => {
    const { quemContratou } = await import('@/lib/persona');
    expect(quemContratou({ nome: 'Marina', parentesco: 'filha' })).toBe('a sua filha Marina');
    expect(quemContratou({ nome: 'Paulo', parentesco: 'filho' })).toBe('o seu filho Paulo');
    expect(quemContratou({ nome: 'Rosa', parentesco: 'mãe' })).toBe('a sua mãe Rosa');
    expect(quemContratou({ nome: 'Ana', parentesco: 'cuidadora' })).toBe('a sua cuidadora Ana');
  });
});
