import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SEGUNDOS_POR_LIGACAO,
  baseDaDemonstracao,
  conferirPasseDaFicha,
  fichaDaDemonstracao,
  leituraSimplesDasFalas,
  limitesDaDemonstracao,
  passeDaFicha,
  podeReservar,
  respostaDaAcaoDeDemonstracao,
  saudacaoDaDemonstracao,
} from '@/lib/demonstracao';
import { FERRAMENTAS } from '@/lib/ferramentas';
import { montarInstrucoes } from '@/lib/persona';
import { reservarLigacao, zerarReservasNaMemoria } from '@/lib/reservaDaDemonstracao';

// A demonstração pública em /experimente: a pessoa de exemplo, as travas de custo,
// o passe da ficha do fim e a ficha montada sem banco.

const AGORA = new Date('2026-11-22T15:00:00.000Z'); // domingo, 12h em Brasília

beforeAll(() => {
  process.env.LIA_CHAVE_DAS_FERRAMENTAS = 'segredo-de-teste';
  process.env.LIA_DADOS = 'memoria';
});

beforeEach(() => {
  zerarReservasNaMemoria();
  delete process.env.LIA_DEMO_DESLIGADA;
  delete process.env.LIA_DEMO_MINUTOS_POR_DIA;
  delete process.env.LIA_DEMO_LIGACOES_POR_VISITANTE;
});

describe('travas da demonstração', () => {
  it('começa em 60 minutos por dia, 3 ligações por pessoa e liga', () => {
    const limites = limitesDaDemonstracao({});
    expect(limites).toMatchObject({ desligada: false, minutosPorDia: 60, ligacoesPorVisitante: 3, video: null });
    expect(limitesDaDemonstracao({ LIA_DEMO_DESLIGADA: '1' }).desligada).toBe(true);
    expect(limitesDaDemonstracao({ LIA_DEMO_MINUTOS_POR_DIA: '10' }).minutosPorDia).toBe(10);
    expect(limitesDaDemonstracao({ LIA_DEMO_VIDEO: 'javascript:alert(1)' }).video).toBeNull();
    expect(limitesDaDemonstracao({ LIA_DEMO_VIDEO: 'https://youtu.be/abc123' }).video).toBe('https://youtu.be/abc123');
  });

  it('recusa quando a próxima ligação passaria do total do dia', () => {
    const limites = limitesDaDemonstracao({});
    const livre = { segundosHoje: 0, doVisitante: 0, daRede: 0 };
    expect(podeReservar(livre, limites)).toBeNull();
    expect(podeReservar({ ...livre, segundosHoje: 60 * 60 - SEGUNDOS_POR_LIGACAO }, limites)).toBeNull();
    expect(podeReservar({ ...livre, segundosHoje: 60 * 60 - SEGUNDOS_POR_LIGACAO + 1 }, limites)).toBe('cheia');
    expect(podeReservar({ ...livre, doVisitante: 3 }, limites)).toBe('visitante');
    expect(podeReservar({ ...livre, daRede: 20 }, limites)).toBe('rede');
    expect(podeReservar(livre, { ...limites, desligada: true })).toBe('desligada');
  });

  it('60 minutos dão 30 ligações de dois minutos, e a 31ª encontra a demonstração cheia', async () => {
    process.env.LIA_DEMO_LIGACOES_POR_VISITANTE = '50';
    process.env.LIA_DEMO_LIGACOES_POR_REDE = '500';
    for (let i = 0; i < 30; i += 1) {
      expect(await reservarLigacao(`visitante-${i % 10}`, `rede-${i}`, AGORA)).toEqual({ ok: true });
    }
    expect(await reservarLigacao('visitante-novo', 'rede-nova', AGORA)).toEqual({ ok: false, motivo: 'cheia' });
    // O dia seguinte começa zerado.
    const amanha = new Date(AGORA.getTime() + 24 * 60 * 60 * 1000);
    expect(await reservarLigacao('visitante-novo', 'rede-nova', amanha)).toEqual({ ok: true });
    delete process.env.LIA_DEMO_LIGACOES_POR_REDE;
  });

  it('a mesma pessoa liga 3 vezes por dia, e o botão de desligar fecha tudo', async () => {
    for (let i = 0; i < 3; i += 1) expect((await reservarLigacao('jurado', 'evento', AGORA)).ok).toBe(true);
    expect(await reservarLigacao('jurado', 'evento', AGORA)).toEqual({ ok: false, motivo: 'visitante' });
    expect((await reservarLigacao('outro-jurado', 'evento', AGORA)).ok).toBe(true);
    process.env.LIA_DEMO_DESLIGADA = '1';
    expect(await reservarLigacao('mais-um', 'outra-rede', AGORA)).toEqual({ ok: false, motivo: 'desligada' });
  });
});

describe('a ligação da demonstração', () => {
  it('a primeira fala diz que é assistente virtual, que é demonstração e que nada fica guardado', () => {
    const saudacao = saudacaoDaDemonstracao(AGORA);
    expect(saudacao).toMatch(/assistente virtual/);
    expect(saudacao).toMatch(/demonstração de dois minutos/);
    expect(saudacao).toMatch(/nada do que você disser fica guardado/);
    expect(saudacao).toMatch(/\?$/);
  });

  it('usa as instruções de sempre, sem a apresentação de quem guarda lembranças', () => {
    const base = baseDaDemonstracao();
    expect(base.idoso.tratamento).toBe('você');
    expect(base.lembrancas).toHaveLength(0);
    const instrucoes = montarInstrucoes(base, AGORA, true);
    expect(instrucoes).toMatch(/assistente virtual/);
    expect(instrucoes).not.toMatch(/# Primeira conversa/);
    expect(instrucoes).toMatch(/remédio da pressão/);
  });

  it('toda ação responde como a de verdade, sem falhar', () => {
    for (const ferramenta of FERRAMENTAS) {
      expect(respostaDaAcaoDeDemonstracao(ferramenta.name)).not.toMatch(/Não consegui/);
    }
    expect(respostaDaAcaoDeDemonstracao('avisar_familia')).toBe('A família foi avisada.');
  });
});

describe('a ficha do fim', () => {
  it('só sai com o passe assinado, dentro do prazo', () => {
    const passe = passeDaFicha(AGORA, 'agente-1')!;
    expect(conferirPasseDaFicha(passe, new Date(AGORA.getTime() + 3 * 60_000))).toEqual({
      inicio: AGORA,
      agentId: 'agente-1',
    });
    expect(conferirPasseDaFicha(passe.replace('agente-1', 'agente-2'), AGORA)).toBeNull();
    expect(conferirPasseDaFicha(passe, new Date(AGORA.getTime() + 20 * 60_000))).toBeNull();
    expect(conferirPasseDaFicha('qualquer coisa', AGORA)).toBeNull();
    expect(conferirPasseDaFicha(passeDaFicha(AGORA, '')!, AGORA)?.agentId).toBe('');
  });

  it('mostra a queda, o remédio e o resumo que a família veria, montados sem banco', () => {
    const falas = [
      { quem: 'assistente' as const, texto: 'Como você dormiu essa noite?' },
      { quem: 'idoso' as const, texto: 'Dormi mal. E hoje de manhã eu caí no banheiro.' },
      { quem: 'idoso' as const, texto: 'Não tomei o remédio da pressão.' },
    ];
    const painel = fichaDaDemonstracao(
      falas,
      {
        bemEstar: { sono: 'mal', remedio: 'nao_tomou' },
        resumo: 'Contou que caiu no banheiro de manhã e que não tomou o remédio da pressão.',
      },
      AGORA,
      new Date(AGORA.getTime() + 2 * 60_000),
    );
    const tipos = painel.alertas.map((a) => a.tipo).sort();
    expect(tipos).toContain('emergencia');
    expect(tipos).toContain('remedio');
    expect(painel.hoje.sono).toBe('mal');
    expect(painel.hoje.remedio).toBe('nao_tomou');
    expect(painel.ultimaConversa?.resumo).toMatch(/caiu no banheiro/);
    expect(painel.idoso.familiar).toEqual({ nome: 'Marina', parentesco: 'filha' });
  });

  it('conversa sem nada de risco não cria aviso', () => {
    const painel = fichaDaDemonstracao(
      [{ quem: 'idoso', texto: 'Dormi bem e almocei arroz com feijão.' }],
      { bemEstar: { sono: 'bem', alimentacao: 'comeu_bem' } },
      AGORA,
    );
    expect(painel.alertas).toHaveLength(0);
    expect(painel.hoje.alimentacao).toBe('comeu_bem');
  });

  it('sem chamar o Google, as falas dão o sono, a comida, o remédio e o humor', () => {
    const falas = [
      { quem: 'idoso' as const, texto: 'Dormi mal essa noite, acordei várias vezes.' },
      { quem: 'idoso' as const, texto: 'Não, eu esqueci de tomar o remédio da pressão hoje.' },
      { quem: 'idoso' as const, texto: 'Almocei pouco. Só uma sopa.' },
    ];
    expect(leituraSimplesDasFalas(falas)).toEqual({ sono: 'mal', alimentacao: 'comeu_pouco', remedio: 'nao_tomou' });
    expect(leituraSimplesDasFalas([{ quem: 'idoso', texto: 'Dormi bem e já tomei o remédio.' }])).toEqual({
      sono: 'bem',
      remedio: 'tomou',
    });
    expect(leituraSimplesDasFalas([{ quem: 'idoso', texto: 'Hoje eu estou meio triste.' }])).toEqual({ humor: 'triste' });
    expect(leituraSimplesDasFalas([{ quem: 'idoso', texto: 'Ando me sentindo muito sozinha.' }]).humor).toBe('sozinho');
    expect(leituraSimplesDasFalas([{ quem: 'idoso', texto: 'Estou bem, graças a Deus.' }]).humor).toBe('bem');
    // O que a Dona Leda fala não conta.
    expect(leituraSimplesDasFalas([{ quem: 'assistente', texto: 'Você não tomou o remédio?' }])).toEqual({});
    const painel = fichaDaDemonstracao(falas, {}, AGORA);
    expect(painel.hoje.remedio).toBe('nao_tomou');
    expect(painel.alertas.map((a) => a.tipo)).toContain('remedio');
    // O que o Google leu vale mais.
    const lida = fichaDaDemonstracao(falas, { bemEstar: { sono: 'mais_ou_menos' } }, AGORA);
    expect(lida.hoje.sono).toBe('mais_ou_menos');
    expect(lida.hoje.alimentacao).toBe('comeu_pouco');
  });

  it('o fim da ligação não chama o Google: a cota do resumo fica pros idosos de verdade', async () => {
    const { POST } = await import('@/app/api/experimente/fim/route');
    const chamadas = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', chamadas);
    // Com a chave presente, a leitura do Google chamaria fetch se a rota usasse ela.
    process.env.LIA_GEMINI_KEY = 'chave-de-teste';
    try {
      const resposta = await POST(
        new Request('http://localhost/api/experimente/fim', {
          method: 'POST',
          body: JSON.stringify({
            passe: passeDaFicha(new Date(), ''),
            falas: [{ quem: 'idoso', texto: 'Eu caí no banheiro e não tomei o remédio.' }],
          }),
        }),
      );
      const corpo = await resposta.json();
      expect(corpo.ok).toBe(true);
      expect(corpo.painel.alertas.map((a: { tipo: string }) => a.tipo)).toEqual(expect.arrayContaining(['emergencia', 'remedio']));
      expect(chamadas).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      delete process.env.LIA_GEMINI_KEY;
    }
  });
});
