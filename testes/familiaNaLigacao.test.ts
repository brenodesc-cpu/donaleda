import { beforeAll, describe, expect, it } from 'vitest';
import { ehDaFamilia, PRIMEIRO_UID_DA_FAMILIA } from '@/lib/agora';
import {
  abrirConvite,
  conviteAberto,
  conversaAoVivo,
  fraseDaEntrada,
  fraseDoConvite,
  fraseSemEntrada,
  PRAZO_DO_CONVITE_MS,
  registrarEntrada,
  vencerConvite,
} from '@/lib/convite';
import { abrirConversa, fecharConversa, montarPainel } from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import { entradaDaFamilia } from '@/lib/familiaNaLigacao';
import type { Base } from '@/lib/tipos';

// A filha entra na ligação (desenho aprovado pelo Breno em 21/11).

const AGORA = new Date('2026-11-21T18:00:00.000Z');
const depois = (ms: number) => new Date(AGORA.getTime() + ms);
const SALA = { canal: 'sala-1', agenteId: 'agente-1', modo: 'tres' as const };

function comLigacao(): Base {
  const base = baseDeExemplo(AGORA, 'id');
  abrirConversa(base, AGORA, undefined, SALA);
  return base;
}

beforeAll(() => {
  process.env.NEXT_PUBLIC_AGORA_APP_ID = 'fedcba9876543210fedcba9876543210';
  process.env.NEXT_AGORA_APP_CERTIFICATE = '0123456789abcdef0123456789abcdef';
});

describe('quando o convite abre', () => {
  it('abre com a ligação aberta, uma vez só, e aparece no painel', () => {
    const base = comLigacao();
    expect(montarPainel(base, AGORA).convite).toBeNull();
    expect(abrirConvite(base, 'urgente', 'emergencia', AGORA)).not.toBeNull();
    expect(abrirConvite(base, 'urgente', 'emergencia', AGORA)).toBeNull();
    expect(montarPainel(base, AGORA).convite).toMatchObject({ motivo: 'urgente', entrou: false });
  });

  it('sem ligação aberta não abre', () => {
    const base = baseDeExemplo(AGORA, 'id');
    expect(abrirConvite(base, 'urgente', 'emergencia', AGORA)).toBeNull();
    abrirConversa(base, AGORA); // ligação antiga, sem a sala guardada
    expect(abrirConvite(base, 'urgente', 'emergencia', AGORA)).toBeNull();
  });

  it('ligação aberta há mais de duas horas não conta', () => {
    expect(conversaAoVivo(comLigacao(), depois(3 * 3600_000))).toBeNull();
  });
});

describe('a entrada da família', () => {
  it('sem convite, a entrada é recusada', () => {
    expect(registrarEntrada(comLigacao(), AGORA)).toBeNull();
  });

  it('com convite, a primeira entrada anuncia e a segunda só pega outra chave', () => {
    const base = comLigacao();
    abrirConvite(base, 'urgente', 'emergencia', AGORA);
    expect(registrarEntrada(base, depois(10_000))?.primeira).toBe(true);
    expect(registrarEntrada(base, depois(20_000))?.primeira).toBe(false);
    expect(montarPainel(base, depois(20_000)).convite?.entrou).toBe(true);
  });

  it('ligação encerrada fecha o convite e recusa a entrada', () => {
    const base = comLigacao();
    const conversa = abrirConvite(base, 'urgente', 'emergencia', AGORA)!;
    fecharConversa(base, conversa.id, depois(5000));
    expect(conviteAberto(base, depois(6000))).toBeNull();
    expect(registrarEntrada(base, depois(6000))).toBeNull();
    expect(montarPainel(base, depois(6000)).convite).toBeNull();
  });

  it('a chave da família tem um número que o aparelho reconhece e é da sala certa', () => {
    const entrada = entradaDaFamilia('sala-1');
    expect(entrada.canal).toBe('sala-1');
    expect(Number(entrada.uid)).toBeGreaterThanOrEqual(PRIMEIRO_UID_DA_FAMILIA);
    expect(ehDaFamilia(entrada.uid)).toBe(true);
    expect(ehDaFamilia('123456')).toBe(false);
    expect(entrada.token.length).toBeGreaterThan(50);
  });
});

describe('o prazo de 90 segundos', () => {
  it('a frase de não entrar toca uma vez só, depois do prazo', () => {
    const base = comLigacao();
    const conversa = abrirConvite(base, 'urgente', 'emergencia', AGORA)!;
    expect(vencerConvite(base, conversa.id, depois(PRAZO_DO_CONVITE_MS - 5000))).toBeNull();
    expect(vencerConvite(base, conversa.id, depois(PRAZO_DO_CONVITE_MS + 1000))).not.toBeNull();
    expect(vencerConvite(base, conversa.id, depois(PRAZO_DO_CONVITE_MS + 6000))).toBeNull();
    // O botão continua valendo depois do prazo.
    expect(registrarEntrada(base, depois(PRAZO_DO_CONVITE_MS + 30_000))?.primeira).toBe(true);
  });

  it('se a família entrou, o prazo não toca a frase', () => {
    const base = comLigacao();
    const conversa = abrirConvite(base, 'urgente', 'emergencia', AGORA)!;
    registrarEntrada(base, depois(30_000));
    expect(vencerConvite(base, conversa.id, depois(PRAZO_DO_CONVITE_MS + 1000))).toBeNull();
  });
});

describe('as frases fixas', () => {
  const base = baseDeExemplo(AGORA, 'id');
  const frases = [
    fraseDoConvite(base),
    fraseDoConvite(base, 'emergencia'),
    fraseDoConvite(base, 'golpe'),
    fraseDoConvite(base, 'humor'),
    fraseDaEntrada(base),
    fraseSemEntrada(base, 'emergencia'),
    fraseSemEntrada(base, 'golpe'),
  ];

  it('dizem o que o desenho combinou', () => {
    expect(frases[0]).toBe('Dona Helena, eu avisei a Marina. Se ela puder agora, ela entra aqui na ligação com a gente. Enquanto isso, eu fico com a senhora.');
    expect(frases[4]).toBe('Dona Helena, a Marina entrou na ligação. Vou deixar vocês conversarem.');
    expect(frases[5]).toBe('A Marina não conseguiu entrar agora. O aviso ficou com ela, e ela vê assim que pegar o celular. Se a senhora precisar de ajuda agora, liga pro um nove dois.');
    expect(frases[6]).toContain('Não passa nenhum dado pra ninguém antes de falar com ela.');
  });

  it('na urgência, a frase do convite já leva a orientação de segurança', () => {
    expect(frases[1]).toBe('Dona Helena, eu avisei a Marina. Se a senhora precisar de ajuda agora, liga pro um nove dois. Se ela puder agora, ela entra aqui na ligação com a gente. Enquanto isso, eu fico com a senhora.');
    expect(frases[2]).toContain('Não passa nenhum dado nem dinheiro pra ninguém.');
    expect(frases[3]).toContain('o CVV atende de graça no um oito oito');
    expect(frases[0]).not.toMatch(/um nove dois/);
  });

  it.each([0, 1, 2, 3, 4, 5, 6])('nenhuma promete socorro nem diz que alguém está vindo (%i)', (i) => {
    expect(frases[i]).not.toMatch(/a caminho|vindo|chegando|chamei o socorro|socorro est/i);
  });
});
