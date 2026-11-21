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

// --- O dinheiro: a conta do cuidador ---

export const FONTES = {
  inss: {
    nome: 'INSS, em reportagem do jornal O Povo, 2026',
    url: 'https://www.opovo.com.br/trends/teto-do-inss-chega-a-r-8-475-em-2026-mas-a-maioria-dos-aposentados-esta-muito-longe-desse-valor/',
  },
  cidesp: {
    nome: 'Cidesp, maio de 2026',
    url: 'https://cidesp.com.br/conteudo/tabela-de-preco-de-cuidador-de-idoso-2026-guia-completo',
  },
} as const;

export type Fonte = (typeof FONTES)[keyof typeof FONTES];

// --- Confiança ---

export const CONFIANCA = [
  'Ela sempre diz que é assistente virtual',
  'A conversa inteira não fica guardada',
  'Queda e golpe avisam a família por regra fixa',
  'Ela não substitui médico',
] as const;

// --- Pra casas de repouso parceiras ---

// Tirado de conhecimento/proposta-de-valor.md ("Quem paga e quem indica"): a família
// contrata, e a casa indica. O convite pra família liberar a casa a acompanhar o idoso
// ainda não existe no código, então aparece como parte da fase de teste.
export const CASAS = {
  titulo: 'Pra casas de repouso parceiras',
  texto:
    'A casa indica a Dona Leda às famílias que ainda não querem levar o pai ou a mãe, e acompanha quem indicou na tela abaixo. O convite pra família liberar esse acompanhamento entra na fase de teste.',
  legendaDaTela: 'Tela "Todos os moradores", com pessoas de exemplo.',
} as const;

// --- Perguntas frequentes ---

export const PERGUNTAS = [
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
      'A Dona Leda liga no horário combinado, pergunta como a pessoa está e avisa a família. Quem age é a família. Ela não dá diagnóstico, não muda remédio e não é serviço de emergência: numa urgência, orienta ligar pro SAMU no 192.',
  },
  {
    pergunta: 'Ela pede dinheiro ou senha?',
    resposta:
      'Nunca. E quando a pessoa conta que alguém pediu dinheiro, senha ou código por telefone, a família recebe um aviso de que pode ser golpe.',
  },
  {
    pergunta: 'Quanto custa?',
    resposta:
      'O plano da família custa R$ 129,90 por mês, com até 10 minutos de conversa por dia, depois de sete dias de teste grátis. É menos de um décimo do preço de um cuidador. A cobrança ainda não começou: a Dona Leda está em fase de teste.',
  },
  {
    pergunta: 'Como uma casa de repouso vira parceira?',
    resposta:
      'Falando com o time. A parceria está em fase de teste: a casa indica a Dona Leda às famílias que a procuram, e cada família contrata pela própria conta.',
  },
] as const;

export const NOTA_DO_RODAPE =
  'A Dona Leda é um protótipo feito no hackathon UNMUTE by Agora, em 21 e 22 de novembro de 2026.';
