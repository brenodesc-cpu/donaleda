// O texto da landing page. As quatro frases da narrativa vêm de
// conhecimento/proposta-de-valor.md ("A narrativa aprovada") e entram como estão lá.
// O resto sai da mesma base. A página só afirma o que o produto faz hoje,
// e todo número leva a fonte (conhecimento/landing.md).

export const DESTINO_DO_BOTAO = '/entrar';
export const TEXTO_DO_BOTAO = 'Criar a conta da família';
export const EMAIL_DE_CONTATO = 'suporte@virte.com.br';

// --- A narrativa aprovada ---

export const SONHO = [
  'Ninguém deveria passar os últimos anos da vida parado e sozinho em casa.',
  'O nosso sonho é que todo brasileiro envelheça ativo até o fim.',
] as const;

export const DEFINICAO =
  'A Dona Leda é a camada de cuidado de quem envelhece: uma amiga que traz companhia e apoia com necessidades do dia a dia, como segurança, saúde, comunicação e rotina.';

export const DINHEIRO = [
  'A aposentadoria da maioria dos brasileiros não paga um cuidador.',
  'A Dona Leda leva esse cuidado de todo dia por menos de um décimo do preço.',
] as const;

export const ASSINATURA = 'Dona Leda: longevidade com qualidade de vida.';

// --- Como funciona ---

export const PASSOS = [
  {
    titulo: 'A Dona Leda liga na hora marcada',
    texto:
      'O celular ou o tablet toca como uma chamada de vídeo comum. A família escolhe os horários e também pode pedir uma ligação na hora.',
  },
  {
    titulo: 'Seu pai ou sua mãe só atende',
    texto:
      'Um toque no botão verde e a conversa começa. Ela pergunta do sono, da comida, do remédio e da dor, e lembra do que ouviu nos outros dias.',
  },
  {
    titulo: 'Você vê o resumo do dia e os avisos',
    texto:
      'Depois da ligação, o painel da família mostra como foi o dia, a semana e um resumo curto da conversa. Se algo sai do normal, o aviso aparece ali.',
  },
] as const;

/** A frase que a Dona Leda usa na primeira ligação (lib/persona.ts), com a pessoa de exemplo. */
export const SAUDACAO_DE_EXEMPLO =
  'Bom dia, dona Helena! Aqui é a Dona Leda, a assistente virtual que a sua filha Marina contratou pra conversar com a senhora todo dia. Como a senhora está hoje?';

export const NOTA_DO_EXEMPLO =
  'Dona Helena e Marina são pessoas de exemplo. A frase é a que a Dona Leda usa na primeira ligação.';

// --- A camada de cuidado, com o que ela faz hoje ---

export const CAMADA = [
  {
    nome: 'Companhia',
    hoje: 'Liga todo dia na hora marcada, ou quando a família pede, e conversa lembrando do que a pessoa contou antes: o neto, a consulta, o joelho.',
  },
  {
    nome: 'Segurança',
    hoje: 'Avisa a família quando a pessoa fala em queda, dor no peito ou num pedido de dinheiro ou senha, e quando ela não atende. A Dona Leda nunca pede dinheiro.',
  },
  {
    nome: 'Saúde',
    hoje: 'Pergunta do sono, da comida, do remédio e da dor, anota, e avisa a família de dor forte ou de remédio não tomado.',
  },
  {
    nome: 'Comunicação',
    hoje: 'A família vê o dia, a semana, os avisos e o resumo da conversa no painel, e pode mandar ela ligar na hora. A pessoa também liga pra Dona Leda quando quiser.',
  },
  {
    nome: 'Rotina',
    hoje: 'Liga nos horários que a família marcou.',
  },
] as const;

// --- O dinheiro: a conta do cuidador ---

export const FONTES = {
  inss: {
    nome: 'INSS, em reportagem do jornal O Povo, 2026',
    url: 'https://www.opovo.com.br/trends/teto-do-inss-chega-a-r-8-475-em-2026-mas-a-maioria-dos-aposentados-esta-muito-longe-desse-valor/',
  },
  caged: {
    nome: 'Caged, pelo site Salário',
    url: 'https://www.salario.com.br/profissao/cuidador-de-idosos-cbo-516210',
  },
  cidesp: {
    nome: 'Cidesp, maio de 2026',
    url: 'https://cidesp.com.br/conteudo/tabela-de-preco-de-cuidador-de-idoso-2026-guia-completo',
  },
  tecnosenior: {
    nome: 'Tecnosenior, preço lido em 21/11/2026',
    url: 'https://tecnosenior.com/solucoes/vidafone-fixo/',
  },
  setor: { nome: 'preço do setor, levantado pelo time em 21/11/2026', url: null },
  projecoes: { nome: 'IBGE, Projeções da População, 2024', url: null },
  pnad: { nome: 'IBGE, PNAD Contínua 2025', url: null },
} as const;

export type Fonte = (typeof FONTES)[keyof typeof FONTES];

/** As linhas da conta de um mês, da menor pra maior. */
export const CONTA = [
  {
    oQue: 'Aposentadoria de um salário mínimo',
    detalhe: 'É o que recebem 62,5% dos beneficiários do INSS',
    valor: 'R$ 1.621',
    numero: 1621,
    fonte: FONTES.inss,
  },
  {
    oQue: 'Cuidador com carteira, pelo piso',
    detalhe: 'Só o salário, sem 13º, férias e encargos',
    valor: 'R$ 1.760,44',
    numero: 1760.44,
    fonte: FONTES.caged,
  },
  {
    oQue: 'Cuidador de 12 horas por dia',
    detalhe: 'Pela tabela de preço de 2026',
    valor: 'R$ 2.800 a 4.500',
    numero: 4500,
    fonte: FONTES.cidesp,
  },
] as const;

/** O que a família usa hoje, quanto custa e o que falta em cada saída. */
export const SAIDAS_DE_HOJE = [
  {
    oQue: 'Ligar ela mesma',
    custo: 'Tempo',
    falta: 'Não acontece todo dia',
    fonte: null,
  },
  {
    oQue: 'Botão de emergência',
    custo: 'R$ 189 a 249 por mês',
    falta: 'Só serve depois que algo deu errado',
    fonte: FONTES.tecnosenior,
  },
  {
    oQue: 'Cuidador',
    custo: 'R$ 2.800 a 4.500 por mês',
    falta: 'Caro pra quem ainda vive sozinho e bem',
    fonte: FONTES.cidesp,
  },
  {
    oQue: 'Residencial',
    custo: 'R$ 6 mil a 11 mil por mês',
    falta: 'É pra quando a autonomia acabou',
    fonte: FONTES.setor,
  },
] as const;

export const ONDE_ELA_ENTRA =
  'A Dona Leda entra no espaço entre a família ligar quando dá e contratar um cuidador: a pessoa ainda mora sozinha e precisa de cuidado todo dia.';

/** Os números do país, cada um com a fonte. */
export const PAIS = [
  {
    numero: '36 milhões',
    oQue: 'de brasileiros têm 60 anos ou mais',
    fonte: FONTES.projecoes,
  },
  {
    numero: '6 milhões',
    oQue: 'é mais ou menos quantos deles moram sozinhos',
    fonte: FONTES.pnad,
  },
  {
    numero: '2029',
    oQue: 'é o ano em que o país passa a ter mais idosos que crianças',
    fonte: FONTES.projecoes,
  },
] as const;

// --- Confiança ---

export const CONFIANCA = [
  {
    titulo: 'Ela sempre diz que é assistente virtual',
    texto:
      'Em toda ligação ela se apresenta como assistente virtual. O rosto é um desenho, e ela nunca finge ser parente, médica ou banco.',
  },
  {
    titulo: 'A conversa inteira não fica guardada',
    texto:
      'Ficam a ficha do dia, as lembranças que ajudam a puxar assunto, os avisos e um resumo curto. A fala só fica registrada dentro de um aviso de segurança, e a família apaga tudo quando quiser.',
  },
  {
    titulo: 'Queda e golpe avisam a família por regra fixa',
    texto:
      'Quando a pessoa fala em queda, dor no peito ou num pedido de dinheiro ou senha, o aviso sai por uma regra escrita no programa. Ele nunca depende só de a inteligência artificial decidir avisar.',
  },
  {
    titulo: 'Ela não substitui médico',
    texto:
      'A Dona Leda não dá diagnóstico e não muda remédio. Em emergência, ela orienta ligar pro SAMU no 192 e avisa a família.',
  },
] as const;

export const SEMPRE = [
  'Diz que é assistente virtual, em toda ligação.',
  'Avisa a família de queda, dor no peito e pedido de dinheiro ou senha, por regra fixa.',
  'Avisa quando a pessoa não atende, depois de duas tentativas.',
  'Orienta ligar pro SAMU no 192 em emergência.',
] as const;

export const NUNCA = [
  'Guarda a conversa inteira.',
  'Pede dinheiro, senha ou código.',
  'Dá diagnóstico ou muda remédio.',
  'Finge ser parente, médica ou banco.',
] as const;

// --- Pra residenciais ---

export const RESIDENCIAIS = {
  titulo: 'Pra residenciais sênior',
  texto:
    'O residencial oferece a Dona Leda aos moradores como um serviço a mais. O remédio já é cuidado pela equipe da casa, então ela entra como companhia de todo dia e como notícia pra família que mora longe.',
  botao: 'Falar com o time',
} as const;

// --- Perguntas frequentes ---

export const PERGUNTAS = [
  {
    pergunta: 'A Dona Leda é uma pessoa?',
    resposta:
      'A Dona Leda é uma assistente virtual, um programa de computador, e ela diz isso em toda ligação. O rosto que aparece na tela é um desenho.',
  },
  {
    pergunta: 'Meu pai ou minha mãe precisa saber mexer no celular?',
    resposta:
      'Só precisa atender. Você cria a conta, cadastra a pessoa e manda um link pelo WhatsApp pro celular ou tablet dela, que fica pronto sem digitar nada. O aparelho precisa de internet.',
  },
  {
    pergunta: 'E se ninguém atender?',
    resposta:
      'A Dona Leda tenta de novo três minutos depois. Se a pessoa não atender nas duas tentativas, o aviso aparece no painel da família.',
  },
  {
    pergunta: 'A conversa fica gravada?',
    resposta:
      'A conversa inteira não é guardada. Ficam a ficha do dia, as lembranças, os avisos e um resumo curto. A fala só fica registrada dentro de um aviso de segurança, e quem cadastrou a pessoa apaga tudo em Ajustes.',
  },
  {
    pergunta: 'Ela substitui o médico ou o socorro?',
    resposta:
      'A Dona Leda cuida do dia a dia perguntando, lembrando e avisando. Ela não dá diagnóstico, não muda remédio e não é serviço de emergência: numa urgência, orienta ligar pro SAMU no 192 e avisa a família.',
  },
  {
    pergunta: 'Ela pede dinheiro ou senha?',
    resposta:
      'Nunca. E quando a pessoa conta que alguém pediu dinheiro, senha ou código por telefone, a família recebe um aviso de que pode ser golpe.',
  },
  {
    pergunta: 'Quanto custa?',
    resposta:
      'Menos de um décimo do preço de um cuidador, que hoje custa de R$ 2.800 a 4.500 por mês (Cidesp, maio de 2026). O valor dos planos ainda está sendo definido.',
  },
] as const;

export const NOTA_DO_RODAPE =
  'A Dona Leda é um protótipo feito no hackathon UNMUTE by Agora, em 21 e 22 de novembro de 2026.';
