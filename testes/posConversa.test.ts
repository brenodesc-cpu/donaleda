import { describe, expect, it } from 'vitest';
import { abrirConversa } from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import { extrairFalasDaSessao, type ItemDoTranscript } from '@/lib/conversation';
import {
  aplicarExtracaoNaBase,
  limparFalasDaSessao,
  validarExtracao,
} from '@/lib/posConversa';

const AGORA = new Date('2026-11-21T19:30:00.000Z'); // 16h30 Brasília

describe('pós-processamento automático da conversa', () => {
  it('consolida as falas da sessão por turno sem duplicar parciais', () => {
    const transcript = [
      { turn_id: 1, uid: '123456', text: 'Boa tarde, Seu Luiz!', _time: 1 },
      { turn_id: 2, uid: '0', text: 'Tô com', _time: 2 },
      { turn_id: 2, uid: '0', text: 'Tô com hipoglicemia agora', _time: 3 },
    ] as unknown as ItemDoTranscript[];

    expect(extrairFalasDaSessao(transcript, '123456')).toEqual([
      { quem: 'assistente', texto: 'Boa tarde, Seu Luiz!' },
      { quem: 'idoso', texto: 'Tô com hipoglicemia agora' },
    ]);
  });

  it('preenche ficha do dia, guarda lembranças, gera resumo e dispara alerta fixo sem salvar transcrição', () => {
    const base = baseDeExemplo(AGORA, 'id');
    const conversa = abrirConversa(base, AGORA);

    const falas = limparFalasDaSessao([
      { quem: 'assistente', texto: 'Como o senhor está hoje?' },
      { quem: 'idoso', texto: 'Tô com hipoglicemia agora e dormi mal.' },
    ]);
    const extracao = validarExtracao({
      bemEstar: {
        sono: 'mal',
        observacao: 'Relatou hipoglicemia durante a conversa.',
      },
      lembrancas: [
        {
          texto: 'Gosta de ouvir rádio de manhã cedo.',
          categoria: 'rotina',
        },
        {
          texto: 'A senha do banco é 123456.',
          categoria: 'historia',
        },
      ],
      resumo: 'Seu Luiz contou que dormiu mal e relatou estar com hipoglicemia.',
    });

    const { aplicouAlgo } = aplicarExtracaoNaBase(base, conversa.id, falas, extracao, AGORA);
    expect(aplicouAlgo).toBe(true);

    const hoje = base.dias.find((d) => d.data === '2026-11-21');
    expect(hoje?.sono).toBe('mal');
    expect(hoje?.observacoes).toContain('Relatou hipoglicemia durante a conversa.');
    expect(conversa.falasDoIdoso).toBe(1);
    expect(conversa.resumo).toContain('hipoglicemia');
    // Lembrança válida guardada, senha recusada por motivoDeRecusa.
    expect(base.lembrancas.some((l) => l.texto.includes('rádio de manhã cedo'))).toBe(true);
    expect(base.lembrancas.some((l) => l.texto.includes('123456'))).toBe(false);
    // Regra fixa de segurança disparou alerta urgente de hipoglicemia.
    expect(
      base.alertas.some((a) => a.tipo === 'emergencia' && a.gravidade === 'urgente'),
    ).toBe(true);
  });

  it('não sobrescreve resumo já gravado pelo MCP e filtra segredos no resumo novo', () => {
    const base = baseDeExemplo(AGORA, 'id');
    const conversa = abrirConversa(base, AGORA);
    conversa.resumo = 'Resumo original gravado pelo MCP.';

    aplicarExtracaoNaBase(
      base,
      conversa.id,
      [{ quem: 'idoso', texto: 'Dormi bem.' }],
      { resumo: 'Outro resumo que não deve sobrescrever.' },
      AGORA,
    );
    expect(conversa.resumo).toBe('Resumo original gravado pelo MCP.');

    // Em outra conversa sem resumo, segredo ("aluguel" reservado na baseDeExemplo) é cortado.
    const conversa2 = abrirConversa(base, AGORA);
    aplicarExtracaoNaBase(
      base,
      conversa2.id,
      [{ quem: 'idoso', texto: 'Estou preocupada com o aluguel.' }],
      {
        resumo:
          'Conversou sobre o dia e dormiu bem. Contou que está preocupada com o aluguel atrasado.',
      },
      AGORA,
    );
    expect(conversa2.resumo).not.toMatch(/aluguel/i);
    expect(conversa2.resumo).toContain('Conversou sobre o dia');
  });
});
