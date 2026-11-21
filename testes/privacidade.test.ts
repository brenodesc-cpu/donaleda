import { describe, expect, it } from 'vitest';
import { abrirConversa, fecharConversa, montarPainel } from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import { montarInstrucoes, montarSaudacao } from '@/lib/persona';
import { VERSAO_DO_AVISO_DE_PRIVACIDADE } from '@/lib/privacidade';
import { frasesDoAvisoDePrivacidade } from '@/components/familia/Lembrancas';

const AGORA = new Date('2026-11-21T19:30:00.000Z'); // 16h30 em Brasília

function novaIdosa() {
  const base = baseDeExemplo(AGORA, 'id');
  base.idoso.primeiraConversaFeita = false;
  delete base.idoso.avisoDePrivacidade;
  return base;
}

describe('aviso de privacidade da primeira ligação', () => {
  it('vai na saudação fixa da primeira ligação, que não depende da IA', () => {
    const saudacao = montarSaudacao(novaIdosa(), AGORA);
    expect(saudacao).toContain('assistente virtual');
    expect(saudacao).toContain('Eu guardo o que a senhora me contar');
    expect(saudacao).toContain('recebe um resumo');
    expect(saudacao).toContain('é só pedir que eu esqueço');
    expect(saudacao.trim().endsWith('Como a senhora está hoje?')).toBe(true);
  });

  it('sai da instrução, porque a saudação fixa já fala', () => {
    expect(montarInstrucoes(novaIdosa(), AGORA, true)).not.toContain('# Primeira conversa');
  });

  it('não se repete depois da primeira conversa', () => {
    const base = novaIdosa();
    base.idoso.primeiraConversaFeita = true;
    expect(montarSaudacao(base, AGORA)).not.toContain('Eu guardo');
  });

  it('a ficha grava a data quando a primeira conversa termina com o idoso tendo falado', () => {
    const base = novaIdosa();
    const conversa = abrirConversa(base, AGORA);
    conversa.falasDoIdoso = 3;
    fecharConversa(base, conversa.id, new Date(AGORA.getTime() + 5 * 60_000));
    expect(base.idoso.avisoDePrivacidade).toEqual({ dadoEm: conversa.inicio, versao: VERSAO_DO_AVISO_DE_PRIVACIDADE });

    // A data é a da primeira vez: as próximas conversas não mudam.
    const outra = abrirConversa(base, new Date(AGORA.getTime() + 86_400_000));
    outra.falasDoIdoso = 2;
    fecharConversa(base, outra.id, new Date(AGORA.getTime() + 86_700_000));
    expect(base.idoso.avisoDePrivacidade?.dadoEm).toBe(conversa.inicio);
  });

  it('ligação em que o idoso não falou não conta como aviso dado', () => {
    const base = novaIdosa();
    const conversa = abrirConversa(base, AGORA);
    fecharConversa(base, conversa.id, AGORA);
    expect(base.idoso.avisoDePrivacidade).toBeUndefined();
    expect(montarSaudacao(base, AGORA)).toContain('Eu guardo');
  });

  it('o painel da família mostra quando o aviso foi dado', () => {
    const base = novaIdosa();
    const conversa = abrirConversa(base, AGORA);
    conversa.falasDoIdoso = 1;
    fecharConversa(base, conversa.id, AGORA);
    const painel = montarPainel(base, AGORA);
    expect(painel.idoso.avisoDePrivacidade?.dadoEm).toBe(conversa.inicio);
    expect(frasesDoAvisoDePrivacidade(conversa.inicio, 'Dona Leda', 'dona Helena')).toBe(
      'Na primeira ligação em 21/11, a Dona Leda avisou dona Helena que guarda o que for contado nas conversas, que a família recebe um resumo e que é só pedir pra esquecer alguma coisa.',
    );
  });
});
