import { describe, expect, it } from 'vitest';
import { abrirConversa, montarPainel } from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import { blocoDeLembrancas, buscar, guardar, linha, mudar } from '@/lib/memoria';
import { aplicarExtracaoNaBase } from '@/lib/posConversa';
import { quemContou } from '@/components/familia/ItemDaLembranca';
import type { Base } from '@/lib/tipos';

const AGORA = new Date('2026-11-21T19:30:00.000Z'); // 16h30 em Brasília

/** O pós-conversa tira da conversa que a vizinha Zefa tem a chave. */
function comDeducao(): { base: Base; numero: number } {
  const base = baseDeExemplo(AGORA, 'id');
  base.lembrancas = [];
  const conversa = abrirConversa(base, AGORA);
  aplicarExtracaoNaBase(
    base,
    conversa.id,
    [{ quem: 'idoso', texto: 'A Zefa ficou com a chave daqui de casa.' }],
    { lembrancas: [{ texto: 'A vizinha Zefa tem a chave da casa.', categoria: 'pessoa', sobre: 'Zefa' }] },
    AGORA,
  );
  return { base, numero: base.lembrancas[0].numero };
}

describe('de onde veio cada lembrança', () => {
  it('o que o pós-conversa tira da conversa entra como dedução', () => {
    const { base } = comDeducao();
    expect(base.lembrancas).toHaveLength(1);
    expect(base.lembrancas[0].origem).toBe('deduzida');
  });

  it('a instrução da ligação avisa que é dedução e manda confirmar antes', () => {
    const { base } = comDeducao();
    const texto = linha(base.lembrancas[0], 'Marina');
    expect(texto).toContain('ninguém confirmou');
    expect(texto).toContain('pergunte antes de dar como certo');
    expect(blocoDeLembrancas(base, AGORA)).toContain('ninguém confirmou');
  });

  it('a busca no meio da conversa também traz a marca de dedução', () => {
    const { base } = comDeducao();
    const achada = buscar(base, 'quem tem a chave da minha casa')[0];
    expect(linha(achada, 'Marina')).toContain('ninguém confirmou');
  });

  it('vira fato quando a pessoa conta o mesmo na ligação', () => {
    const { base } = comDeducao();
    const r = guardar(base, { texto: 'A vizinha Zefa tem a chave da casa.', categoria: 'pessoa', origem: 'conversa' }, AGORA);
    expect(r.ok && r.jaExistia).toBe(true);
    expect(base.lembrancas[0].origem).toBe('conversa');
  });

  it('vira fato quando a família toca em Está certo', () => {
    const { base, numero } = comDeducao();
    const r = mudar(base, { numero }, { acao: 'corrigir', por: 'familia' }, AGORA);
    expect(r.ok).toBe(true);
    expect(base.lembrancas[0].origem).toBe('familia');
    expect(base.lembrancas[0].texto).toBe('A vizinha Zefa tem a chave da casa.');
  });

  it('vira fato quando a pessoa confirma ou corrige por voz', () => {
    const { base, numero } = comDeducao();
    mudar(base, { numero }, { acao: 'corrigir', texto: 'A vizinha Zefa e a filha dela têm a chave.', por: 'conversa' }, AGORA);
    expect(base.lembrancas[0].origem).toBe('conversa');
  });

  it('dedução repetida pelo pós-conversa não apaga o que a pessoa contou', () => {
    const base = baseDeExemplo(AGORA, 'id');
    base.lembrancas = [];
    guardar(base, { texto: 'A vizinha Zefa tem a chave da casa.', categoria: 'pessoa', origem: 'conversa' }, AGORA);
    guardar(base, { texto: 'A vizinha Zefa tem a chave da casa.', categoria: 'pessoa', origem: 'deduzida' }, AGORA);
    expect(base.lembrancas).toHaveLength(1);
    expect(base.lembrancas[0].origem).toBe('conversa');
  });

  it('o painel da família recebe a origem e mostra a dedução com o aviso', () => {
    const { base } = comDeducao();
    const painel = montarPainel(base, AGORA);
    const deduzida = painel.lembrancas.find((l) => l.origem === 'deduzida');
    expect(deduzida).toBeDefined();
    expect(quemContou(deduzida!, 'Dona Helena')).toBe('A Dona Leda entendeu da conversa de 21/11. Ninguém confirmou ainda.');
  });

  it('esquecer a dedução apaga de vez', () => {
    const { base, numero } = comDeducao();
    mudar(base, { numero }, { acao: 'esquecer' }, AGORA);
    expect(base.lembrancas).toHaveLength(0);
  });
});
