import { beforeAll, describe, expect, it } from 'vitest';

// A ficha com versão: duas mudanças ao mesmo tempo não se apagam.

let dados: typeof import('@/lib/dados');

beforeAll(async () => {
  process.env.LIA_DADOS = 'memoria';
  dados = await import('@/lib/dados');
  const { baseDeExemplo } = await import('@/lib/exemplo');
  await dados.criarFicha('a', baseDeExemplo(new Date(), 'a'));
  await dados.criarFicha('b', baseDeExemplo(new Date(), 'b'));
});

describe('ficha por idoso', () => {
  it('dez mudanças ao mesmo tempo ficam todas gravadas', async () => {
    const antes = (await dados.lerBase('a')).lembrancas.length;
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        dados.mudarBase('a', (base) => dados.guardarLembranca(base, `Lembrança ${i}`, 'historia')),
      ),
    );
    expect((await dados.lerBase('a')).lembrancas.length).toBe(antes + 10);
  });

  it('a mudança de um idoso não aparece no outro', async () => {
    await dados.mudarBase('a', (base) => dados.guardarLembranca(base, 'Só do A', 'gosto'));
    const b = await dados.lerBase('b');
    expect(b.lembrancas.some((l) => l.texto === 'Só do A')).toBe(false);
    expect(b.idoso.id).toBe('b');
  });

  it('idoso sem ficha dá erro claro', async () => {
    await expect(dados.lerBase('nao-existe')).rejects.toBeInstanceOf(dados.FichaNaoEncontrada);
  });

  it('sem precisar gravar, a versão não sobe', async () => {
    const r = await dados.mudarBaseQuando('a', () => ({ gravar: false, resultado: 42 }));
    expect(r).toBe(42);
  });
});
