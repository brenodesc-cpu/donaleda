import { describe, expect, it } from 'vitest';
import {
  arrumarHorarios,
  ligacaoSemFala,
  avancarChamadas,
  chamadaTocando,
  pedirChamadaDaFamilia,
  responderChamada,
  situacaoDaChamada,
} from '@/lib/chamadas';
import { abrirConversa, fecharConversa, montarPainel } from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import { montarSaudacao } from '@/lib/persona';

// Brasília está 3 horas atrás do UTC: 12:00Z é 09:00 em Brasília.
const as = (hora: string) => new Date(`2026-11-21T${hora}:00.000Z`);
const NOVE_EM_PONTO = as('12:00');
const depois = (base: Date, segundos: number) => new Date(base.getTime() + segundos * 1000);

describe('a assistente liga na hora marcada', () => {
  it('toca às 9h e não toca antes nem muito depois', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    avancarChamadas(base, as('11:59'));
    expect(chamadaTocando(base)).toBeNull();

    avancarChamadas(base, NOVE_EM_PONTO);
    const chamada = chamadaTocando(base);
    expect(chamada?.motivo).toBe('horario');
    expect(chamada?.horario).toBe('09:00');
    expect(chamada?.tentativa).toBe(1);

    const outra = baseDeExemplo(NOVE_EM_PONTO);
    avancarChamadas(outra, as('12:25'));
    expect(chamadaTocando(outra)).toBeNull();
  });

  it('não liga duas vezes pra mesma hora depois de atendida', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    avancarChamadas(base, NOVE_EM_PONTO);
    const chamada = chamadaTocando(base)!;
    responderChamada(base, chamada.id, 'atender', depois(NOVE_EM_PONTO, 8));
    const conversa = abrirConversa(base, depois(NOVE_EM_PONTO, 9));
    fecharConversa(base, conversa.id, depois(NOVE_EM_PONTO, 300));

    avancarChamadas(base, depois(NOVE_EM_PONTO, 400));
    expect(chamadaTocando(base)).toBeNull();
    expect(base.alertas).toHaveLength(0);
  });

  it('sem resposta, tenta 3 vezes (a cada 3 minutos) e então escala urgente pra rede de apoio', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    avancarChamadas(base, NOVE_EM_PONTO);

    // 1ª tentativa expira sem alerta ainda
    const r1 = avancarChamadas(base, depois(NOVE_EM_PONTO, 46));
    expect(r1.escalarChamada).toBeUndefined();
    expect(chamadaTocando(base)).toBeNull();
    expect(base.chamadas[0].estado).toBe('perdida');
    expect(base.alertas).toHaveLength(0);

    avancarChamadas(base, depois(NOVE_EM_PONTO, 120));
    expect(chamadaTocando(base)).toBeNull();

    // 2ª tentativa após 3 min
    const t2 = 46 + 181;
    avancarChamadas(base, depois(NOVE_EM_PONTO, t2));
    expect(chamadaTocando(base)?.tentativa).toBe(2);

    const r2 = avancarChamadas(base, depois(NOVE_EM_PONTO, t2 + 46));
    expect(r2.escalarChamada).toBeUndefined();
    expect(chamadaTocando(base)).toBeNull();
    expect(base.alertas).toHaveLength(0);

    // 3ª tentativa após mais 3 min
    const t3 = t2 + 46 + 181;
    avancarChamadas(base, depois(NOVE_EM_PONTO, t3));
    expect(chamadaTocando(base)?.tentativa).toBe(3);

    // Ao falhar a 3ª tentativa: alerta urgente + sinal de escalonamento em massa
    const r3 = avancarChamadas(base, depois(NOVE_EM_PONTO, t3 + 46));
    expect(chamadaTocando(base)).toBeNull();
    expect(r3.escalarChamada?.tentativa).toBe(3);
    expect(base.alertas).toHaveLength(1);
    expect(base.alertas[0].tipo).toBe('ligacao');
    expect(base.alertas[0].gravidade).toBe('urgente');
    expect(base.alertas[0].texto).toContain('09:00');
    expect(base.alertas[0].texto).toContain('3 tentativas');

    // Não existe quarta tentativa.
    avancarChamadas(base, depois(NOVE_EM_PONTO, t3 + 46 + 200));
    expect(base.chamadas).toHaveLength(3);
  });

  it('não toca no meio de uma conversa nem logo depois de uma', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    // O idoso ligou pra assistente às 8h40.
    const conversa = abrirConversa(base, as('11:40'));
    conversa.falasDoIdoso = 3;
    avancarChamadas(base, NOVE_EM_PONTO);
    expect(chamadaTocando(base)).toBeNull();

    fecharConversa(base, conversa.id, as('12:05'));
    avancarChamadas(base, as('12:06'));
    expect(chamadaTocando(base)).toBeNull();
  });
});

describe('a família pede uma ligação', () => {
  it('faz o aparelho tocar na hora, uma ligação por vez', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    const pedido = as('17:30');
    const chamada = pedirChamadaDaFamilia(base, pedido);
    expect(chamada?.motivo).toBe('familia');
    expect(montarPainel(base, pedido).chamadaTocando?.id).toBe(chamada?.id);
    expect(pedirChamadaDaFamilia(base, depois(pedido, 5))).toBeNull();
  });

  it('não liga por cima de uma conversa em andamento', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    abrirConversa(base, as('17:00'));
    expect(pedirChamadaDaFamilia(base, as('17:05'))).toBeNull();
  });

  it('ligação não atendida avisa a família com a hora do pedido', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    const pedido = as('17:30');
    pedirChamadaDaFamilia(base, pedido);
    avancarChamadas(base, depois(pedido, 50));
    expect(base.alertas[0].tipo).toBe('ligacao');
    expect(base.alertas[0].texto).toContain('14:30');
  });

  it('"Agora não" também chega na família', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    const pedido = as('17:30');
    const chamada = pedirChamadaDaFamilia(base, pedido)!;
    responderChamada(base, chamada.id, 'recusar', depois(pedido, 6));
    expect(base.chamadas[0].estado).toBe('recusada');
    expect(base.alertas[0].texto).toContain('Agora não');
  });
});

describe('o que o aparelho do idoso recebe', () => {
  it('diz a próxima hora e se atende sozinho', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    expect(situacaoDaChamada(base, as('15:00')).proximaLigacao).toBe('19:00');
    expect(situacaoDaChamada(base, as('23:30')).proximaLigacao).toBe('09:00');
    expect(situacaoDaChamada(base, NOVE_EM_PONTO).atenderSozinhoEm).toBeNull();
    base.idoso.atenderSozinho = true;
    expect(situacaoDaChamada(base, NOVE_EM_PONTO).atenderSozinhoEm).toBe(10);
  });

  it('arruma as horas que a família manda', () => {
    expect(arrumarHorarios(['19:00', '09:00', '9h', '25:00', '09:00'])).toEqual(['09:00', '19:00']);
    expect(arrumarHorarios('09:00')).toEqual([]);
  });
});

describe('a saudação muda conforme quem começou a ligação', () => {
  const base = baseDeExemplo(NOVE_EM_PONTO);
  base.idoso.primeiraConversaFeita = true;

  it('hora marcada: diz que ligou pra saber como a pessoa está', () => {
    expect(montarSaudacao(base, NOVE_EM_PONTO, 'horario')).toContain('Liguei pra saber');
  });

  it('pedido da família: diz quem pediu', () => {
    expect(montarSaudacao(base, NOVE_EM_PONTO, 'familia')).toContain('A sua filha Marina pediu pra eu ligar');
  });

  it('o idoso ligou: agradece o chamado', () => {
    expect(montarSaudacao(base, NOVE_EM_PONTO, 'idoso')).toContain('me chamou');
  });

  it('sempre se apresenta como assistente virtual', () => {
    for (const origem of ['horario', 'familia', 'idoso'] as const) {
      expect(montarSaudacao(base, NOVE_EM_PONTO, origem)).toContain('assistente virtual');
    }
  });
});

describe('ligação que atende sozinha sem ninguém falar (verificador, 21/11)', () => {
  const atendeSozinhaECala = (base: ReturnType<typeof baseDeExemplo>, quando: Date) => {
    avancarChamadas(base, quando);
    const chamada = chamadaTocando(base)!;
    responderChamada(base, chamada.id, 'atender', depois(quando, 10));
    const conversa = abrirConversa(base, depois(quando, 11), chamada.id);
    fecharConversa(base, conversa.id, depois(quando, 130));
    ligacaoSemFala(base, conversa.id, depois(quando, 130));
    return chamada;
  };

  it('conta como não atendida e a segunda tentativa acontece em 3 minutos', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    const primeira = atendeSozinhaECala(base, NOVE_EM_PONTO);
    expect(primeira.estado).toBe('perdida');
    avancarChamadas(base, depois(NOVE_EM_PONTO, 130 + 181));
    const segunda = chamadaTocando(base);
    expect(segunda?.tentativa).toBe(2);
  });

  it('depois da terceira sem fala, a família recebe o aviso urgente de não atendeu', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    atendeSozinhaECala(base, NOVE_EM_PONTO);
    atendeSozinhaECala(base, depois(NOVE_EM_PONTO, 130 + 181));
    atendeSozinhaECala(base, depois(NOVE_EM_PONTO, (130 + 181) * 2));
    expect(base.alertas.some((a) => a.tipo === 'ligacao' && a.gravidade === 'urgente')).toBe(true);
  });

  it('o painel não diz que ele conversou hoje', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    atendeSozinhaECala(base, NOVE_EM_PONTO);
    expect(montarPainel(base, depois(NOVE_EM_PONTO, 140)).conversouHoje).toBe(false);
  });

  it('com o idoso falando, continua atendida e conta como conversa', () => {
    const base = baseDeExemplo(NOVE_EM_PONTO);
    avancarChamadas(base, NOVE_EM_PONTO);
    const chamada = chamadaTocando(base)!;
    responderChamada(base, chamada.id, 'atender', depois(NOVE_EM_PONTO, 5));
    const conversa = abrirConversa(base, depois(NOVE_EM_PONTO, 6), chamada.id);
    conversa.falasDoIdoso = 4;
    fecharConversa(base, conversa.id, depois(NOVE_EM_PONTO, 300));
    ligacaoSemFala(base, conversa.id, depois(NOVE_EM_PONTO, 300));
    expect(chamada.estado).toBe('atendida');
    expect(montarPainel(base, depois(NOVE_EM_PONTO, 310)).conversouHoje).toBe(true);
  });
});

describe('a Dona Leda não conseguiu entrar na ligação', () => {
  it('a ligação atendida vira "não conseguiu entrar", a família é avisada e a segunda tentativa vem', async () => {
    const { assistenteNaoEntrou, avancarChamadas, pedirChamadaDaFamilia, responderChamada } = await import('@/lib/chamadas');
    const agora = new Date('2026-11-21T18:00:00.000Z');
    const base = baseDeExemplo(agora, 'id');
    base.idoso.horariosDeLigacao = ['15:00'];
    avancarChamadas(base, agora);
    const chamada = base.chamadas.at(-1)!;
    responderChamada(base, chamada.id, 'atender', new Date(agora.getTime() + 5000));
    assistenteNaoEntrou(base, chamada.id, new Date(agora.getTime() + 8000));
    expect(chamada.estado).toBe('falhou');
    expect(base.alertas.at(-1)?.texto).toContain('não conseguiu entrar na ligação das 15:00');
    expect(montarPainel(base, new Date(agora.getTime() + 9000)).conversouHoje).toBe(false);
    avancarChamadas(base, new Date(agora.getTime() + 4 * 60_000));
    expect(base.chamadas.at(-1)?.tentativa).toBe(2);
    expect(pedirChamadaDaFamilia).toBeDefined();
  });

  it('quando o idoso chamou e ela não entrou, o aviso diz que ele chamou', async () => {
    const { assistenteNaoEntrou } = await import('@/lib/chamadas');
    const agora = new Date('2026-11-21T18:00:00.000Z');
    const base = baseDeExemplo(agora, 'id');
    assistenteNaoEntrou(base, undefined, agora);
    expect(base.alertas.at(-1)?.texto).toContain('Dona Helena chamou às 15:00, mas a Dona Leda não conseguiu entrar');
  });
});
