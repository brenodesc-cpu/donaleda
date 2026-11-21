import { beforeAll, describe, expect, it } from 'vitest';
import type { Base } from '@/lib/tipos';

// Outra pessoa atendeu a ligação (pedido aprovado pelo Breno em 21/11): a assistente
// marca a conversa, a família recebe um aviso só, e nada do que essa pessoa disser
// entra na ficha, nas lembranças ou no resumo da idosa.

const AGORA = new Date('2026-11-21T22:15:00.000Z'); // 19h15 em Brasília

let dados: typeof import('@/lib/dados');
let ferramentas: typeof import('@/lib/ferramentas');
let chamadas: typeof import('@/lib/chamadas');
let posConversa: typeof import('@/lib/posConversa');
let baseDeExemplo: typeof import('@/lib/exemplo').baseDeExemplo;

beforeAll(async () => {
  process.env.LIA_DADOS = 'memoria';
  dados = await import('@/lib/dados');
  ferramentas = await import('@/lib/ferramentas');
  chamadas = await import('@/lib/chamadas');
  posConversa = await import('@/lib/posConversa');
  ({ baseDeExemplo } = await import('@/lib/exemplo'));
});

let contador = 0;
async function fichaComConversaAberta(): Promise<{ id: string; conversaId: string }> {
  const id = `outra-pessoa-${(contador += 1)}`;
  await dados.criarFicha(id, baseDeExemplo(AGORA, id));
  const conversa = await dados.mudarBase(id, (b) => dados.abrirConversa(b, AGORA));
  return { id, conversaId: conversa.id };
}

const ler = (id: string): Promise<Base> => dados.lerBase(id);
const hoje = (b: Base) => b.dias.find((d) => d.data === '2026-11-21');

describe('outra pessoa atendeu a ligação', () => {
  it('a ação existe pra assistente chamar', () => {
    expect(ferramentas.FERRAMENTAS.map((f) => f.name)).toContain('outra_pessoa_atendeu');
  });

  it('marca a conversa e manda um aviso só, com a hora da ligação', async () => {
    const { id, conversaId } = await fichaComConversaAberta();
    const antes = (await ler(id)).alertas.length;
    await ferramentas.executarFerramenta(id, 'outra_pessoa_atendeu', {}, AGORA);
    await ferramentas.executarFerramenta(id, 'outra_pessoa_atendeu', {}, AGORA);
    const base = await ler(id);
    expect(base.conversas.find((c) => c.id === conversaId)?.outraPessoa).toBe(true);
    const novos = base.alertas.slice(antes);
    expect(novos).toHaveLength(1);
    expect(novos[0].texto).toContain('Outra pessoa atendeu a ligação das 19:15');
    expect(novos[0].tipo).toBe('ligacao');
  });

  it('o que essa pessoa disser não entra na ficha, nas lembranças nem no resumo', async () => {
    const { id, conversaId } = await fichaComConversaAberta();
    await ferramentas.executarFerramenta(id, 'outra_pessoa_atendeu', {}, AGORA);
    const antes = await ler(id);
    const diaAntes = JSON.stringify(hoje(antes) ?? null);
    const lembrancasAntes = antes.lembrancas.length;

    await ferramentas.executarFerramenta(id, 'registrar_bem_estar', { sono: 'bem', remedio: 'tomou' }, AGORA);
    await ferramentas.executarFerramenta(id, 'guardar_lembranca', { texto: 'O vizinho Carlos atendeu.', categoria: 'pessoa' }, AGORA);
    await ferramentas.executarFerramenta(id, 'resumir_conversa', { resumo: 'Ela dormiu bem e tomou o remédio.' }, AGORA);
    const busca = await ferramentas.executarFerramenta(id, 'buscar_lembranca', { pergunta: 'consulta' }, AGORA);

    const depois = await ler(id);
    expect(JSON.stringify(hoje(depois) ?? null)).toBe(diaAntes);
    expect(depois.lembrancas).toHaveLength(lembrancasAntes);
    expect(depois.conversas.find((c) => c.id === conversaId)?.resumo).toBeUndefined();
    expect(busca).not.toMatch(/cardiolog|renato/i);
  });

  it('o aviso pra família continua funcionando nessa ligação', async () => {
    const { id } = await fichaComConversaAberta();
    await ferramentas.executarFerramenta(id, 'outra_pessoa_atendeu', {}, AGORA);
    const antes = (await ler(id)).alertas.length;
    await ferramentas.executarFerramenta(
      id,
      'avisar_familia',
      { tipo: 'emergencia', gravidade: 'urgente', mensagem: 'O vizinho contou que a dona Helena caiu.' },
      AGORA,
    );
    expect((await ler(id)).alertas.length).toBe(antes + 1);
  });

  it('a ligação não conta como conversa da idosa no painel', async () => {
    const { id, conversaId } = await fichaComConversaAberta();
    await ferramentas.executarFerramenta(id, 'outra_pessoa_atendeu', {}, AGORA);
    const fim = new Date(AGORA.getTime() + 3 * 60_000);
    await dados.mudarBase(id, (b) => {
      const c = b.conversas.find((x) => x.id === conversaId)!;
      c.falasDoIdoso = 4;
      dados.fecharConversa(b, conversaId, fim);
    });
    const base = await ler(id);
    const painel = dados.montarPainel(base, fim);
    expect(painel.conversouHoje).toBe(false);
    expect(painel.ultimaConversa?.inicio).not.toBe(base.conversas.find((c) => c.id === conversaId)?.inicio);
  });

  it('a primeira conversa da idosa continua por fazer', async () => {
    const id = `outra-pessoa-primeira-${(contador += 1)}`;
    const base = baseDeExemplo(AGORA, id);
    base.idoso.primeiraConversaFeita = false;
    await dados.criarFicha(id, base);
    const conversa = await dados.mudarBase(id, (b) => dados.abrirConversa(b, AGORA));
    await ferramentas.executarFerramenta(id, 'outra_pessoa_atendeu', {}, AGORA);
    await dados.mudarBase(id, (b) => {
      b.conversas.find((x) => x.id === conversa.id)!.falasDoIdoso = 3;
      dados.fecharConversa(b, conversa.id, AGORA);
    });
    expect((await ler(id)).idoso.primeiraConversaFeita).toBe(false);
  });

  it('a ligação marcada vale como não atendida, pra ela ligar de novo', () => {
    const base = baseDeExemplo(AGORA, 'outra-pessoa-chamada');
    const chamada = { id: 'ch-1', motivo: 'horario', horario: '19:15', pedidaEm: AGORA.toISOString(), estado: 'atendida', tentativa: 1 };
    (base.chamadas as unknown[]).push(chamada);
    const conversa = dados.abrirConversa(base, AGORA, 'ch-1');
    conversa.falasDoIdoso = 5;
    conversa.outraPessoa = true;
    expect(chamadas.ligacaoSemFala(base, conversa.id, AGORA)).toBe(true);
  });

  it('a leitura da conversa depois do fim não preenche a ficha com as respostas de quem atendeu', () => {
    const base = baseDeExemplo(AGORA, 'outra-pessoa-extracao');
    const conversa = dados.abrirConversa(base, AGORA);
    conversa.outraPessoa = true;
    const diaAntes = JSON.stringify(hoje(base) ?? null);
    const lembrancasAntes = base.lembrancas.length;
    posConversa.aplicarExtracaoNaBase(
      base,
      conversa.id,
      [{ quem: 'idoso', texto: 'Ela dormiu bem e tomou o remédio.' }],
      { bemEstar: { sono: 'bem', remedio: 'tomou' }, lembrancas: [{ texto: 'O vizinho Carlos atendeu.', categoria: 'pessoa' }], resumo: 'Dormiu bem.' },
      AGORA,
    );
    expect(JSON.stringify(hoje(base) ?? null)).toBe(diaAntes);
    expect(base.lembrancas).toHaveLength(lembrancasAntes);
    expect(conversa.resumo).toBeUndefined();
  });

  it('a regra fixa de queda continua valendo pra fala de quem atendeu', () => {
    const base = baseDeExemplo(AGORA, 'outra-pessoa-regra');
    const conversa = dados.abrirConversa(base, AGORA);
    conversa.outraPessoa = true;
    const antes = base.alertas.length;
    posConversa.aplicarExtracaoNaBase(base, conversa.id, [{ quem: 'idoso', texto: 'Ela tá dizendo que sente uma dor no peito forte.' }], {}, AGORA);
    expect(base.alertas.slice(antes).some((a) => a.tipo === 'emergencia')).toBe(true);
  });
});
