// As direções de marca da Dona Leda. A ativa vale pro app inteiro.
// A Gema é a que o time escolheu em 21/11/2026; as outras três ficam pra comparação em /marca.
// Pra trocar de direção, mude MARCA_ATIVA aqui. Se a fonte da nova direção for
// outra, troque também qual fonte tem `preload: true` em app/layout.tsx.

export type Direcao = 'gema' | 'varanda' | 'radio' | 'jardim';

export const MARCA_ATIVA: Direcao = 'gema';

export interface InfoDaDirecao {
  id: Direcao;
  nome: string;
  /** Uma linha: o que é. */
  resumo: string;
  /** Uma linha: por que escolher esta. */
  motivo: string;
  fonte: string;
  /** Frase pra mostrar a fonte em tamanho grande. */
  amostraDeTexto: string;
}

export const DIRECOES: InfoDaDirecao[] = [
  {
    id: 'gema',
    nome: 'Gema',
    resumo: 'Amarelo de gema e marrom de café, com o disco do telefone antigo no lugar do rosto.',
    motivo:
      'Foi a escolhida pelo time: quem tem mais de 70 anos discou a vida inteira num telefone de disco, e o botão de atender fica sendo o único verde da tela.',
    fonte: 'Gabarito no título e Atkinson Hyperlegible Next no texto',
    amostraDeTexto: 'Bom dia, dona Helena! Dormiu bem?',
  },
  {
    id: 'varanda',
    nome: 'Varanda',
    resumo: 'Terracota, creme e mostarda, com traço de desenho à mão. Cara de casa de vó.',
    motivo:
      'Tem cara de casa e de companhia, longe do azul e do verde de clínica que todo app de saúde usa.',
    fonte: 'Atkinson Hyperlegible Next',
    amostraDeTexto: 'Bom dia, dona Helena! Dormiu bem?',
  },
  {
    id: 'radio',
    nome: 'Rádio',
    resumo: 'Preto e amarelo de letreiro, formas grossas e cantos retos. Cara de rádio de pilha.',
    motivo:
      'É a mais fácil de ler de longe: contraste de 18 pra 1 no texto e botões que ninguém confunde.',
    fonte: 'Lexend',
    amostraDeTexto: 'Bom dia, dona Helena! Dormiu bem?',
  },
  {
    id: 'jardim',
    nome: 'Jardim',
    resumo: 'Verde de folha, coral e formas redondas, sem contorno. Cara de quintal com plantas.',
    motivo:
      'É a mais calma: transmite cuidado sem alarme, bom pro filho que abre o painel preocupado.',
    fonte: 'Nunito',
    amostraDeTexto: 'Bom dia, dona Helena! Dormiu bem?',
  },
];

export function infoDaDirecao(id: Direcao): InfoDaDirecao {
  return DIRECOES.find((d) => d.id === id) ?? DIRECOES[0];
}
