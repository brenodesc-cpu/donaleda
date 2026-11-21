// A lista das telas que a página /telas mostra, na ordem do menu.
// Cada tela é o componente de verdade do app, com dados de exemplo (lib/exemplo.ts).

export type GrupoDeTela = 'idoso' | 'cuida' | 'residencial';

export interface TelaDaLista {
  /** Vai no endereço: /telas/ver/<id>. */
  id: string;
  grupo: GrupoDeTela;
  nome: string;
  /** Uma linha: o que a tela faz. */
  oQueFaz: string;
  /** Tela pensada pra computador: a moldura abre larga. */
  larga?: boolean;
}

export const GRUPOS: { id: GrupoDeTela; nome: string }[] = [
  { id: 'idoso', nome: 'Idoso' },
  { id: 'cuida', nome: 'Quem cuida' },
  { id: 'residencial', nome: 'Residencial' },
];

export const TELAS: TelaDaLista[] = [
  {
    id: 'boas-vindas',
    grupo: 'idoso',
    nome: 'Primeira abertura no aplicativo',
    oQueFaz: 'Pergunta se quem está com o aparelho é da família ou é quem vai receber as ligações.',
  },
  {
    id: 'ligar-o-aparelho',
    grupo: 'idoso',
    nome: 'Ligar o aparelho',
    oQueFaz: 'O aparelho recebe o código de 6 números que a família gerou.',
  },
  {
    id: 'deixar-pronto',
    grupo: 'idoso',
    nome: 'Deixar pronto',
    oQueFaz: 'Um toque libera o microfone, uma vez só.',
  },
  {
    id: 'microfone-negado',
    grupo: 'idoso',
    nome: 'Microfone negado',
    oQueFaz: 'Aparece quando o aparelho não deixou usar o microfone e explica o que fazer.',
  },
  {
    id: 'espera',
    grupo: 'idoso',
    nome: 'Espera',
    oQueFaz: 'O aparelho fica nesta tela até a Dona Leda ligar. A pessoa também pode ligar pra ela.',
  },
  {
    id: 'minutos-de-hoje-acabaram',
    grupo: 'idoso',
    nome: 'Minutos de hoje acabados',
    oQueFaz: 'Depois dos 10 minutos de conversa do dia, a tela diz que a conversa de hoje acabou e quando ela liga de novo.',
  },
  {
    id: 'tocando',
    grupo: 'idoso',
    nome: 'Tocando',
    oQueFaz: 'A Dona Leda está ligando e a pessoa só atende.',
  },
  {
    id: 'tocando-atende-sozinha',
    grupo: 'idoso',
    nome: 'Tocando, com atender sozinho',
    oQueFaz: 'Com o atender sozinho ligado, a ligação atende depois da contagem.',
  },
  {
    id: 'ligando',
    grupo: 'idoso',
    nome: 'Ligando',
    oQueFaz: 'O instante entre atender e a conversa começar.',
  },
  {
    id: 'conversa',
    grupo: 'idoso',
    nome: 'Conversa',
    oQueFaz: 'A ligação com a Dona Leda. Aqui é uma imagem da conversa: a de verdade só abre numa ligação.',
  },
  {
    id: 'falha',
    grupo: 'idoso',
    nome: 'Ligação que não deu certo',
    oQueFaz: 'Avisa que a ligação falhou e oferece tentar de novo.',
  },
  {
    id: 'falha-do-microfone',
    grupo: 'idoso',
    nome: 'Falha do microfone',
    oQueFaz: 'Avisa que não conseguiu usar o microfone durante a ligação.',
  },
  {
    id: 'entrar',
    grupo: 'cuida',
    nome: 'Entrar',
    oQueFaz: 'A família entra na conta. A aba de criar conta fica na mesma tela.',
  },
  {
    id: 'cadastrar',
    grupo: 'cuida',
    nome: 'Cadastrar a pessoa',
    oQueFaz: 'A família conta quem a Dona Leda vai acompanhar e pode ver um exemplo antes.',
  },
  {
    id: 'codigo',
    grupo: 'cuida',
    nome: 'Ligar o aparelho com o código',
    oQueFaz: 'Gera o código de 6 números que entra no aparelho da pessoa.',
  },
  {
    id: 'painel',
    grupo: 'cuida',
    nome: 'Painel',
    oQueFaz: 'As ligações, o dia de hoje, a semana e as lembranças da dona Helena, a pessoa de exemplo.',
  },
  {
    id: 'painel-com-aviso',
    grupo: 'cuida',
    nome: 'Painel com aviso urgente',
    oQueFaz: 'O painel no dia em que o seu Jorge, morador de exemplo, contou que caiu.',
  },
  {
    id: 'painel-memoria-e-minutos',
    grupo: 'cuida',
    nome: 'Painel com os minutos acabados e uma dedução',
    oQueFaz: 'Os 10 minutos de hoje já usados, o que a Dona Leda entendeu sem ninguém confirmar e quando a dona Helena ouviu o aviso de privacidade.',
  },
  {
    id: 'ajustes',
    grupo: 'cuida',
    nome: 'Ajustes',
    oQueFaz: 'Horários das ligações, atender sozinho, dados da pessoa e apagar tudo.',
  },
  {
    id: 'casa',
    grupo: 'residencial',
    nome: 'Todos os moradores',
    oQueFaz: 'Os oito moradores de exemplo numa tela só, em três colunas pela situação de hoje.',
    larga: true,
  },
];

export function telaDaLista(id: string): TelaDaLista | undefined {
  return TELAS.find((tela) => tela.id === id);
}

/** A tela de antes e a de depois, dando a volta na lista. */
export function vizinhas(id: string): { anterior: TelaDaLista; proxima: TelaDaLista } {
  const i = Math.max(
    0,
    TELAS.findIndex((tela) => tela.id === id),
  );
  return {
    anterior: TELAS[(i - 1 + TELAS.length) % TELAS.length],
    proxima: TELAS[(i + 1) % TELAS.length],
  };
}
