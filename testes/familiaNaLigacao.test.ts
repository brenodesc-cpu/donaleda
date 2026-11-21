import { beforeAll, describe, expect, it } from 'vitest';
import { ehDaFamilia, PRIMEIRO_UID_DA_FAMILIA } from '@/lib/agora';
import { abrirConversa, conversaAoVivo, fecharConversa, montarPainel } from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import { entradaDaFamilia, recadoDaEntrada } from '@/lib/familiaNaLigacao';

// A família entra na ligação na hora de um aviso urgente.

const AGORA = new Date('2026-11-21T18:00:00.000Z');

beforeAll(() => {
  process.env.NEXT_PUBLIC_AGORA_APP_ID = 'fedcba9876543210fedcba9876543210';
  process.env.NEXT_AGORA_APP_CERTIFICATE = '0123456789abcdef0123456789abcdef';
});

describe('família na ligação', () => {
  it('o painel mostra a ligação ao vivo só com a sala guardada e a conversa aberta', () => {
    const base = baseDeExemplo(AGORA, 'id');
    expect(montarPainel(base, AGORA).ligacaoAoVivo).toBeNull();
    const conversa = abrirConversa(base, AGORA, undefined, { canal: 'sala-1', agenteId: 'agente-1' });
    expect(montarPainel(base, AGORA).ligacaoAoVivo).toEqual({ conversaId: conversa.id, inicio: conversa.inicio });
    fecharConversa(base, conversa.id, AGORA);
    expect(montarPainel(base, AGORA).ligacaoAoVivo).toBeNull();
  });

  it('conversa sem sala (ligação antiga) não oferece entrada', () => {
    const base = baseDeExemplo(AGORA, 'id');
    abrirConversa(base, AGORA);
    expect(conversaAoVivo(base, AGORA)).toBeNull();
  });

  it('conversa aberta há mais de duas horas não conta como ao vivo', () => {
    const base = baseDeExemplo(AGORA, 'id');
    abrirConversa(base, AGORA, undefined, { canal: 'sala-1', agenteId: 'agente-1' });
    expect(conversaAoVivo(base, new Date(AGORA.getTime() + 3 * 3600_000))).toBeNull();
  });

  it('a entrada da família vem com um uid que o aparelho reconhece como família', () => {
    const entrada = entradaDaFamilia('sala-1');
    expect(entrada.canal).toBe('sala-1');
    expect(Number(entrada.uid)).toBeGreaterThanOrEqual(PRIMEIRO_UID_DA_FAMILIA);
    expect(ehDaFamilia(entrada.uid)).toBe(true);
    expect(ehDaFamilia('123456')).toBe(false);
    expect(entrada.token.length).toBeGreaterThan(50);
  });

  it('o recado manda a assistente contar que a filha entrou e falar só se chamada', () => {
    const recado = recadoDaEntrada(baseDeExemplo(AGORA, 'id'));
    expect(recado).toContain('Marina acabou de entrar nesta ligação');
    expect(recado).toContain('Só volte a falar se chamarem você pelo nome');
  });
});
