// O "Fale conosco" da landing: com número, abre o WhatsApp com a mensagem pronta;
// sem número, abre o e-mail. Um endereço errado aqui é contato perdido.

import { describe, expect, it } from 'vitest';
import {
  EMAIL_DE_CONTATO,
  MENSAGEM_DO_CONTATO,
  MENSAGEM_DO_RESIDENCIAL,
  montarLinkDeContato,
} from '@/components/landing/conteudo';

// Número de mentira, só pra conferir o formato do endereço.
const NUMERO_DE_TESTE = '5500000000000';

describe('link do Fale conosco', () => {
  it('abre o WhatsApp com a mensagem pronta quando tem número', () => {
    expect(montarLinkDeContato(NUMERO_DE_TESTE, MENSAGEM_DO_CONTATO)).toBe(
      'https://wa.me/5500000000000?text=Ol%C3%A1!%20Quero%20conhecer%20a%20Dona%20Leda.',
    );
  });

  it('aceita o número escrito com sinal de mais, espaço, parêntese e traço', () => {
    expect(montarLinkDeContato('+55 (00) 00000-0000', MENSAGEM_DO_CONTATO)).toBe(
      montarLinkDeContato(NUMERO_DE_TESTE, MENSAGEM_DO_CONTATO),
    );
  });

  it('leva a mensagem do residencial inteira, com acento', () => {
    const endereco = montarLinkDeContato(NUMERO_DE_TESTE, MENSAGEM_DO_RESIDENCIAL);
    expect(decodeURIComponent(endereco.split('?text=')[1])).toBe(MENSAGEM_DO_RESIDENCIAL);
  });

  it('abre o e-mail, com a mensagem no corpo, enquanto não tem número', () => {
    const endereco = montarLinkDeContato('', MENSAGEM_DO_CONTATO);
    expect(endereco.startsWith(`mailto:${EMAIL_DE_CONTATO}?subject=`)).toBe(true);
    expect(decodeURIComponent(endereco.split('&body=')[1])).toBe(MENSAGEM_DO_CONTATO);
  });

  it('trata número só com espaço ou traço como vazio', () => {
    expect(montarLinkDeContato(' - ', MENSAGEM_DO_CONTATO).startsWith('mailto:')).toBe(true);
  });
});
