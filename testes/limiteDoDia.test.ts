import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { avancarChamadas, chamadaTocando, pedirChamadaDaFamilia, situacaoDaChamada } from '@/lib/chamadas';
import { montarPainel } from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import {
  conversaDeHojeMs,
  limiteDoDia,
  podeComecarConversa,
  tetoDaConversaMs,
} from '@/lib/limiteDoDia';
import { frasesDoLimite } from '@/components/familia/Ligacoes';
import { avancarTeto, RELOGIOS_ZERADOS } from '@/lib/teto';
import type { Base } from '@/lib/tipos';

/** Roda o relógio do teto segundo a segundo, com gente falando, e diz quando avisa e quando encerra. */
function momentosDoTeto(tetoMs: number): { aviso: number | null; encerra: number | null } {
  let relogios = RELOGIOS_ZERADOS;
  let aviso: number | null = null;
  for (let t = 1000; t <= tetoMs + 60_000; t += 1000) {
    const falando = t < tetoMs; // depois do teto, um respiro de silêncio deixa encerrar
    const r = avancarTeto(
      relogios,
      { legendaMudou: falando, volumeDoIdoso: 0, assistenteFalando: false },
      1000,
      { tetoMs, semFalaMs: 0 },
    );
    relogios = r.relogios;
    if (r.avisarFim && aviso === null) aviso = t;
    if (r.encerrar) return { aviso, encerra: t };
  }
  return { aviso, encerra: null };
}

// Brasília está 3 horas atrás do UTC: 12:00Z é 09:00 em Brasília.
const as = (hora: string) => new Date(`2026-11-21T${hora}:00.000Z`);
const DEZ_MIN = 10 * 60_000;

/** Uma idosa com duas ligações por dia (9h e 18h) e as conversas de hoje que vierem. */
function idosaCom(conversas: { inicio: string; minutos: number }[]): Base {
  const base = baseDeExemplo(as('11:00'));
  base.conversas = conversas.map((c, i) => {
    const inicio = as(c.inicio);
    return {
      id: `conversa-${i}`,
      inicio: inicio.toISOString(),
      fim: new Date(inicio.getTime() + c.minutos * 60_000).toISOString(),
      falasDoIdoso: 5,
    };
  });
  base.idoso.horariosDeLigacao = ['09:00', '18:00'];
  return base;
}

describe('limite de 10 minutos de conversa por dia', () => {
  it('soma as conversas de hoje e ignora as de ontem', () => {
    const base = idosaCom([
      { inicio: '12:00', minutos: 5 },
      { inicio: '14:00', minutos: 3 },
    ]);
    base.conversas.push({
      id: 'ontem',
      inicio: '2026-11-20T12:00:00.000Z',
      fim: '2026-11-20T12:30:00.000Z',
      falasDoIdoso: 9,
    });
    expect(conversaDeHojeMs(base, as('20:00'))).toBe(8 * 60_000);
    expect(limiteDoDia(base, as('20:00'))).toMatchObject({ usadoMin: 8, acabou: false });
  });

  it('acaba quando não sobra tempo pra despedida gentil (menos de 2 minutos)', () => {
    expect(limiteDoDia(idosaCom([{ inicio: '12:00', minutos: 8.5 }]), as('20:00')).acabou).toBe(true);
    expect(limiteDoDia(idosaCom([{ inicio: '12:00', minutos: 8 }]), as('20:00')).acabou).toBe(false);
  });

  it('o encerramento gentil do teto cabe em toda ligação que começa', () => {
    // Pior caso: sobram exatamente 2 minutos. O sinal de despedir vem 90 s antes do fim.
    const base = idosaCom([{ inicio: '12:00', minutos: 8 }]);
    expect(podeComecarConversa(base, 'horario', as('21:00'))).toBe(true);
    const tetoMs = tetoDaConversaMs(base, 'horario', DEZ_MIN, as('21:00'));
    expect(tetoMs).toBe(2 * 60_000);
    const quando = momentosDoTeto(tetoMs);
    expect(quando.aviso).toBe(30_000);
    expect(quando.encerra).toBeGreaterThanOrEqual(tetoMs);
  });

  it('o Ligar agora da família leva o teto inteiro, com a despedida aos 8 min 30 s', () => {
    const base = idosaCom([{ inicio: '12:00', minutos: 10 }]);
    const tetoMs = tetoDaConversaMs(base, 'familia', DEZ_MIN, as('21:00'));
    expect(momentosDoTeto(tetoMs).aviso).toBe(8.5 * 60_000);
  });

  it('a ligação das 18h não toca quando os 10 minutos de hoje acabaram', () => {
    const base = idosaCom([{ inicio: '12:00', minutos: 10 }]);
    avancarChamadas(base, as('21:00'));
    expect(chamadaTocando(base)).toBeNull();

    const comSobra = idosaCom([{ inicio: '12:00', minutos: 4 }]);
    avancarChamadas(comSobra, as('21:00'));
    expect(chamadaTocando(comSobra)?.horario).toBe('18:00');
  });

  it('a família ainda consegue ligar agora, pra uma urgência', () => {
    const base = idosaCom([{ inicio: '12:00', minutos: 10 }]);
    expect(podeComecarConversa(base, 'familia', as('20:00'))).toBe(true);
    expect(pedirChamadaDaFamilia(base, as('20:00'))?.motivo).toBe('familia');
    expect(tetoDaConversaMs(base, 'familia', DEZ_MIN, as('20:00'))).toBe(DEZ_MIN);
  });

  it('o idoso não começa conversa nova depois do limite', () => {
    const base = idosaCom([{ inicio: '12:00', minutos: 10 }]);
    expect(podeComecarConversa(base, 'idoso', as('20:00'))).toBe(false);
    expect(podeComecarConversa(base, 'horario', as('20:00'))).toBe(false);
  });

  it('a segunda ligação do dia leva só o que sobra', () => {
    const base = idosaCom([{ inicio: '12:00', minutos: 6 }]);
    expect(tetoDaConversaMs(base, 'horario', DEZ_MIN, as('21:00'))).toBe(4 * 60_000);
    expect(tetoDaConversaMs(base, 'idoso', DEZ_MIN, as('21:00'))).toBe(4 * 60_000);
  });

  it('conversa aberta conta até agora, no máximo 15 minutos', () => {
    const base = idosaCom([]);
    base.conversas.push({ id: 'aberta', inicio: as('12:00').toISOString(), falasDoIdoso: 2 });
    expect(conversaDeHojeMs(base, as('12:04'))).toBe(4 * 60_000);
    expect(conversaDeHojeMs(base, as('15:00'))).toBe(15 * 60_000);
  });

  it('a tela do idoso fica sabendo e a próxima ligação passa pra amanhã', () => {
    const base = idosaCom([{ inicio: '12:00', minutos: 10 }]);
    const situacao = situacaoDaChamada(base, as('14:00'));
    expect(situacao.limiteDoDia?.acabou).toBe(true);
    expect(situacao.proximaLigacao).toBe('09:00');
    expect(situacao.proximaEAmanha).toBe(true);

    const cedo = situacaoDaChamada(idosaCom([]), as('14:00'));
    expect(cedo.proximaLigacao).toBe('18:00');
    expect(cedo.proximaEAmanha).toBe(false);
  });

  it('o painel da família mostra os minutos de hoje e diz quando acabaram', () => {
    const usado = montarPainel(idosaCom([{ inicio: '12:00', minutos: 6 }]), as('14:00'));
    expect(frasesDoLimite(usado.limiteDoDia)).toBe('Hoje: 6 de 10 minutos de conversa.');
    expect(frasesDoLimite(montarPainel(idosaCom([]), as('14:00')).limiteDoDia)).toBeNull();
    const acabou = montarPainel(idosaCom([{ inicio: '12:00', minutos: 10 }]), as('14:00'));
    expect(frasesDoLimite(acabou.limiteDoDia)).toContain('acabaram');
    expect(frasesDoLimite(acabou.limiteDoDia)).toContain('urgência');
  });

  it('as conversas inventadas dos dados de exemplo não gastam minutos', () => {
    const base = idosaCom([]);
    base.conversas.push({ id: 'ex-hoje', inicio: as('12:00').toISOString(), fim: as('12:11').toISOString(), falasDoIdoso: 9 });
    expect(limiteDoDia(base, as('14:00')).acabou).toBe(false);
  });

  it('toda rota que abre conversa confere o limite do dia antes', () => {
    // Trava contra a volta: o modo direto nasceu abrindo conversa sem a conferência.
    const rotas: string[] = [];
    const andar = (pasta: string) => {
      for (const nome of readdirSync(pasta)) {
        const caminho = join(pasta, nome);
        if (statSync(caminho).isDirectory()) andar(caminho);
        else if (nome === 'route.ts') rotas.push(caminho);
      }
    };
    andar(join(__dirname, '..', 'app', 'api'));
    const abrem = rotas.filter((r) => readFileSync(r, 'utf8').includes('abrirConversa('));
    expect(abrem.length).toBeGreaterThanOrEqual(2);
    for (const rota of abrem) {
      expect(readFileSync(rota, 'utf8'), rota).toContain('podeComecarConversa(');
    }
  });
});
