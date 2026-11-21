// O texto da landing page. As quatro frases da narrativa vêm de
// conhecimento/proposta-de-valor.md ("A narrativa aprovada") e entram como estão lá.
// O resto sai da mesma base. A página só afirma o que o produto faz hoje,
// e todo número leva a fonte (conhecimento/landing.md).

export const DESTINO_DO_BOTAO = '/entrar';
export const TEXTO_DO_BOTAO = 'Criar a conta da família';
export const EMAIL_DE_CONTATO = 'suporte@virte.com.br';

// --- Fale conosco ---

/**
 * O número do WhatsApp que recebe o "Fale conosco", com 55 e o DDD (por exemplo,
 * 5511999999999). Ele é o celular de uma pessoa e o repositório é público, então
 * fica fora do código: vem da variável NEXT_PUBLIC_WHATSAPP_DE_CONTATO, gravada no
 * `.env.local` e nas variáveis da Vercel. Sem a variável, os botões de contato
 * abrem um e-mail pro endereço de cima.
 */
export const WHATSAPP_DE_CONTATO: string = process.env.NEXT_PUBLIC_WHATSAPP_DE_CONTATO?.trim() ?? '';

export const TEXTO_DO_CONTATO = 'Fale conosco';
export const MENSAGEM_DO_CONTATO = 'Olá! Quero conhecer a Dona Leda.';
export const MENSAGEM_DO_RESIDENCIAL = 'Olá! Quero conhecer a Dona Leda pro meu residencial.';

/** Só os dígitos do número, do jeito que o endereço do WhatsApp pede. */
function soDigitos(numero: string): string {
  return numero.replace(/\D/g, '');
}

/**
 * Monta o endereço do botão de contato: a conversa no WhatsApp com a mensagem
 * pronta ou, sem número, o e-mail já com a mensagem. O número pode vir com
 * espaço, parêntese, traço ou sinal de mais.
 */
export function montarLinkDeContato(numero: string, mensagem: string): string {
  const digitos = soDigitos(numero);
  if (digitos) return `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`;
  return `mailto:${EMAIL_DE_CONTATO}?subject=${encodeURIComponent('Dona Leda')}&body=${encodeURIComponent(mensagem)}`;
}

/** true quando o contato já sai pelo WhatsApp, false enquanto ele ainda abre o e-mail. */
export function contatoPeloWhatsApp(): boolean {
  return soDigitos(WHATSAPP_DE_CONTATO).length > 0;
}

/** O endereço do botão de contato da landing, com o número que estiver gravado acima. */
export function linkDeContato(mensagem: string): string {
  return montarLinkDeContato(WHATSAPP_DE_CONTATO, mensagem);
}

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

// --- A conversa ---

/** A frase que a Dona Leda usa na primeira ligação (lib/persona.ts), com a pessoa de exemplo. */
export const SAUDACAO_DE_EXEMPLO =
  'Bom dia, dona Helena! Aqui é a Dona Leda, a assistente virtual que a sua filha Marina contratou pra conversar com a senhora todo dia. Como a senhora está hoje?';

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
} as const;

export type Fonte = (typeof FONTES)[keyof typeof FONTES];

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

// --- Pra residenciais ---

// O que o residencial leva hoje, tirado de conhecimento/proposta-de-valor.md
// ("O que o residencial compra" e "O que muda no produto"). Só entra o que já existe:
// uma conta acompanha vários moradores, e a tela "Todos os moradores" mostra a casa
// inteira. O que ainda falta (o acesso da família de cada morador e as perguntas
// ajustadas à casa) aparece como parte do piloto.

/** A frase do topo, pra quem chega de um residencial. */
export const FRASE_DO_RESIDENCIAL =
  'No residencial sênior, a Dona Leda liga pra cada morador todo dia, e a casa vê todos numa tela só.';

export const RESIDENCIAIS = {
  titulo: 'Pra residenciais sênior',
  texto: 'Cada morador recebe uma ligação por dia, e a casa acompanha todos na mesma tela.',
  legendaDaTela: 'A tela "Todos os moradores", com oito moradores de exemplo.',
  itens: [
    {
      titulo: 'Uma conversa por dia pra cada morador',
      texto: 'Ela liga na hora que a casa marcar, conversa e lembra do que o morador contou nos outros dias.',
    },
    {
      titulo: 'A casa inteira numa tela só',
      texto:
        'A tela separa quem tem aviso novo, quem ainda não conversou hoje e quem conversou sem aviso. Cada morador abre a ficha do dia, a semana e o resumo da conversa.',
    },
    {
      titulo: 'Notícia pra família todo dia',
      texto:
        'Com a ficha e o resumo, a casa tem o que contar à família de cada morador, sem depender de a equipe ter tempo de ligar.',
    },
  ],
  piloto:
    'No piloto entram o acesso da família de cada morador só ao dela e as perguntas ajustadas à rotina da casa.',
  nota: 'O remédio continua com a equipe da casa. A ficha informa a equipe e fica longe de diagnóstico.',
} as const;

// --- Pra família ---

export const FAMILIA = {
  titulo: 'Pra quem tem pai ou mãe morando sozinho',
  texto:
    'A família usa do mesmo jeito: você cria a conta, cadastra a pessoa e deixa o aparelho dela pronto. A Dona Leda liga nos horários que você marcar, e o painel mostra o dia, a semana e os avisos.',
} as const;

// --- Perguntas frequentes ---

export const PERGUNTAS = [
  {
    pergunta: 'Como um residencial começa?',
    resposta:
      'Falando com o time. O começo é um piloto com alguns moradores: a conta da casa é montada junto com a equipe, com os moradores cadastrados e os horários das ligações combinados.',
  },
  {
    pergunta: 'Quem ajuda o morador na primeira ligação?',
    resposta:
      'Alguém da equipe deixa o celular ou o tablet pronto uma vez e fica ao lado na primeira ligação. Depois o morador só atende. O aparelho precisa de internet.',
  },
  {
    pergunta: 'O que a equipe vê?',
    resposta:
      'A tela "Todos os moradores" mostra quem tem aviso novo, quem ainda não conversou hoje e quem conversou sem aviso. Cada morador abre a ficha do dia, a semana e os avisos dele, e dá pra pedir uma ligação na hora.',
  },
  {
    pergunta: 'A família do morador acompanha?',
    resposta:
      'Hoje quem acompanha é a conta da casa, que tem a notícia do dia pra passar à família. O acesso de cada família só ao seu morador entra no piloto.',
  },
  {
    pergunta: 'A Dona Leda é uma pessoa?',
    resposta:
      'A Dona Leda é uma assistente virtual, um programa de computador, e ela diz isso em toda ligação. O rosto que aparece na tela é um desenho.',
  },
  {
    pergunta: 'E se ninguém atender?',
    resposta:
      'A Dona Leda tenta de novo três minutos depois. Se a pessoa não atender nas duas tentativas, o aviso aparece pra quem acompanha.',
  },
  {
    pergunta: 'A conversa fica gravada?',
    resposta:
      'A conversa inteira não é guardada. Ficam a ficha do dia, as lembranças, os avisos e um resumo curto. A fala só fica registrada dentro de um aviso de segurança, e quem cadastrou a pessoa apaga tudo em Ajustes.',
  },
  {
    pergunta: 'Ela substitui o médico ou o socorro?',
    resposta:
      'A Dona Leda cuida do dia a dia perguntando, lembrando e avisando. Ela não dá diagnóstico, não muda remédio e não é serviço de emergência: numa urgência, orienta ligar pro SAMU no 192 e avisa quem acompanha.',
  },
  {
    pergunta: 'Ela pede dinheiro ou senha?',
    resposta:
      'Nunca. E quando a pessoa conta que alguém pediu dinheiro, senha ou código por telefone, quem acompanha recebe um aviso de que pode ser golpe.',
  },
  {
    pergunta: 'Quanto custa?',
    resposta:
      'O valor por morador ainda está sendo definido. A referência é ficar em menos de um décimo do preço de um cuidador, que hoje custa de R$ 2.800 a 4.500 por mês (Cidesp, maio de 2026).',
  },
] as const;

export const NOTA_DO_RODAPE =
  'A Dona Leda é um protótipo feito no hackathon UNMUTE by Agora, em 21 e 22 de novembro de 2026.';
