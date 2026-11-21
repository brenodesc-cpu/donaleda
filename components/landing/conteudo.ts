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
export const MENSAGEM_DA_CASA = 'Olá! Quero indicar a Dona Leda às famílias.';

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

// As casas de repouso parceiras, tirado de conhecimento/proposta-de-valor.md
// ("Quem paga e quem indica"): a família contrata, e a casa indica. Só entra o que já
// existe. O convite pra família liberar a casa a acompanhar o idoso ainda não existe
// no código, então aparece como parte da fase de teste.
export const CASAS = {
  titulo: 'Pra casas de repouso parceiras',
  texto:
    'Toda semana chegam à casa famílias que ainda não querem levar o pai ou a mãe. A casa parceira indica a Dona Leda a elas, e o idoso continua na casa dele, com uma ligação combinada todo dia.',
  legendaDaTela: 'A tela "Todos os moradores", com oito pessoas de exemplo.',
  itens: [
    {
      titulo: 'A casa indica',
      texto: 'A família que procura a casa conhece a Dona Leda ali e contrata direto, pela própria conta.',
    },
    {
      titulo: 'A casa acompanha quem indicou',
      texto:
        'A tela "Todos os moradores" mostra num lugar só quem tem aviso novo, quem ainda não conversou hoje e quem conversou sem aviso. O convite pra família liberar esse acompanhamento entra na fase de teste.',
    },
    {
      titulo: 'Serve aos moradores lúcidos',
      texto:
        'A mesma conta acompanha os moradores da casa que usam celular e atendem a chamada de vídeo. O remédio continua com a equipe.',
    },
  ],
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
      'A Dona Leda liga no horário combinado, pergunta como a pessoa está e avisa a família. Quem age é a família. Ela não dá diagnóstico, não muda remédio e não é serviço de emergência: numa urgência, orienta ligar pro SAMU no 192 e avisa a família.',
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
  {
    pergunta: 'Como uma casa de repouso vira parceira?',
    resposta:
      'Falando com o time. A parceria está em fase de teste: a casa indica a Dona Leda às famílias que a procuram, e cada família contrata pela própria conta.',
  },
  {
    pergunta: 'O que a casa parceira acompanha?',
    resposta:
      'Na tela "Todos os moradores", a casa vê num lugar só as pessoas que acompanha, com os avisos e a ficha do dia de cada uma. O convite pra família liberar esse acompanhamento entra na fase de teste.',
  },
  {
    pergunta: 'A casa pode usar com os próprios moradores?',
    resposta:
      'Pode, com os moradores lúcidos. Alguém da equipe deixa o aparelho pronto uma vez e fica ao lado na primeira ligação. O remédio continua com a equipe da casa.',
  },
] as const;

export const NOTA_DO_RODAPE =
  'A Dona Leda é um protótipo feito no hackathon UNMUTE by Agora, em 21 e 22 de novembro de 2026.';
