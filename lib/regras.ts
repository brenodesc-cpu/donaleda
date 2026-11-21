// Regras fixas de segurança. Rodam em cima de cada fala do idoso, sem IA,
// pra que um aviso de queda ou de golpe nunca dependa de o modelo decidir avisar.
// O texto da fala só é guardado quando uma regra dispara, dentro do alerta.

import type { Gravidade, TipoDeAlerta } from './tipos';

export interface AlertaDeRegra {
  tipo: TipoDeAlerta;
  gravidade: Gravidade;
  texto: string;
}

/** Tira acento e põe em minúscula, pra regra não depender de como a fala foi escrita. */
export function semAcento(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// Expressões comuns que têm a palavra mas não são emergência. Elas saem da fala antes
// da conferência, pra "caí na risada" não esconder um "caí no banheiro" na mesma frase.
const FALSO_ALARME =
  /\bcai (na risada|no sono|na gargalhada)|caiu a ficha|caiu a (luz|energia|internet|ligacao|chuva)|cair a (noite|tarde)|morr(i|endo) de (rir|saudade|vergonha|fome|sono|calor|frio)\b|\b(peito|coracao)( \w+){0,2} apertad[oa] de (saudade|tristeza|preocupacao|emocao|alegria)\b|\bpeito do pe\b|\bcai (num|no|em|nesse|nessa) (golpe|conto)\b/g;

const EMERGENCIA = new RegExp(
  [
    // queda
    'eu cai', 'cai (no|na|da|do|de)', '(levei|tomei|tive|sofri) (um tombo|uma queda)', 'escorreguei',
    'bati (a|com a) cabeca', '(estou|to|tou|caid[ao]|deitad[ao]|jogad[ao]|estirad[ao])( aqui)? no chao',
    'nao consigo (me )?levantar', 'nao consigo sair do chao',
    // desmaio, peito, respiração, sangue
    'desmaiei', 'desmaio', 'dor( \\w+){0,2} no peito', '(aperto|pressao|peso) no peito',
    'peito( \\w+){0,2} (apertado|doendo|pesado|queimando)', 'falta de ar', 'nao (consigo|estou conseguindo|to conseguindo) respirar',
    'estou sangrando', 'muito sangue', 'socorro', 'chama(r)? (uma |a )?ambulancia',
    // sinais de derrame
    '(rosto|boca)( \\w+){0,2} tort[oa]', 'nao sinto (o|a|meu|minha) (braco|perna|lado)',
    '(braco|perna|lado)( (direito|esquerdo|direita|esquerda))?( \\w+){0,2} (fraco|fraca|mole|sem forca|paralisad[oa])',
    '(perna|braco|mao|corpo)( \\w+){0,2} nao (obedece|mexe|responde)', 'nao consigo mexer (o|a|meu|minha) (braco|perna|lado|mao)',
    'fala( \\w+){0,2} (enrolando|enrolada|arrastada)', 'falando( \\w+)? enrolad[oa]', 'lingua enrolando',
  ]
    .map((p) => `\\b${p}\\b`)
    .join('|'),
);

const VONTADE_DE_MORRER =
  /\b(quero morrer|queria morrer|nao quero mais viver|vontade de morrer|me matar|acabar com (a minha|minha) vida|melhor se eu morresse|nao aguento mais viver|(dormir|deitar) e nao acordar|nao (quero|queria) (mais )?acordar|melhor nao acordar|nao acordar mais|melhor sem mim|(sou|virei) um (peso|fardo|estorvo)|deus (podia|pode|devia|deveria) me levar|(pedir|peco|pedindo) (pra|a) deus (pra )?me levar)\b/;

// Remédio tomado a mais: a palavra do remédio precisa estar na fala, pra "tomei banho duas vezes" não contar.
const DOSE_A_MAIS =
  /\b(tomei|tomou|bebi)( \w+){0,5} (duas vezes|2 vezes|tres vezes|em dobro|dobrado|a mais|duas doses|dose dupla|dois comprimidos|o dobro)\b|\btomei (o )?remedio (errado|trocado)\b|\btomei (remedio|comprimidos?|gotas) demais\b/;
const FALA_DE_REMEDIO = /\b(remedio|comprimido|capsula|dose|gotas?|pilula|insulina|medicamento)\b/;

const PEDIDO_DE_DINHEIRO = new RegExp(
  [
    'pix', 'senha', 'codigo', 'cartao(?! (de natal|de aniversario|postal|do sus|de vacina|de visita))', 'transferencia', 'transferir', 'deposito', 'depositar', 'boleto',
    'emprestimo', 'consignado', 'cpf', 'rg', 'dados do banco', 'conta do banco', 'numero da conta', 'golpe',
    'motoboy', 'conta segura', 'economias', '(seis|6|quatro|4) digitos', 'numero que chegou',
    '(leia|ler|lesse)( \\w+){0,2} pra (ele|ela|eles)', '(falar|fale|passar|passe|ditar|dite) (o numero|o codigo|os numeros)',
    // "dinheiro" sozinho não basta: "minha filha ligou e vai me dar dinheiro pro mercado" é conversa normal.
    '(pediu|pedindo|pediram|pede|precisa|precisando|quer|queria|querem|mandar|mande|manda|depositar|transferir|passar|emprestar|arrumar|juntar|levar)( \\w+){0,3} dinheiro',
    'dinheiro (emprestado|urgente|agora)',
  ]
    .map((p) => `\\b${p}\\b`)
    .join('|'),
);

const ALGUEM_PEDIU = new RegExp(
  [
    'pediu', 'pediram', 'pedindo', 'ligou', 'ligaram', 'ligacao', 'telefonou', 'telefonaram', 'mandou', 'mandaram',
    'mensagem', 'whatsapp', 'zap', 'gerente', 'um homem', 'uma mulher', 'numero estranho', 'falaram', 'disseram',
    '(rapaz|moco|moca|homem|mulher|senhor|senhora|funcionari[oa]|atendente) d[oa] (banco|operadora|inss|aposentadoria|cartao|receita|correio|caixa)',
    'operadora',
    'quer que eu', 'querem que eu', 'banco central', 'comunicado', 'orient(e|a|ar|ou)',
    '(falou|disse|dizendo|falando) que (era|e) (do|da|de|meu|minha)', 'cai (num|em|no) golpe',
  ]
    .map((p) => `\\b${p}\\b`)
    .join('|'),
);

// Golpe do falso sequestro: vale sozinho, porque quem liga não precisa pedir dinheiro na mesma frase.
const SEQUESTRO = /\b(sequestr\w*)\b/;

// Quando a pessoa conta que já passou o dinheiro ou o dado, a família precisa agir agora.
const JA_PASSOU =
  /\b(ja (fiz|mandei|passei|transferi|depositei|paguei|dei|entreguei|li|falei)|fiz (o|um) pix|(eu|e) (passei|dei|entreguei|falei|li)|passei (a|o|os|as|meu|minha)|li (o|a) (numero|codigo)|entreguei (o|a|meu|minha)|mandei o dinheiro|transferi)\b/;

function citar(fala: string): string {
  const limpa = fala.trim().replace(/\s+/g, ' ');
  return limpa.length > 160 ? `${limpa.slice(0, 157)}...` : limpa;
}

/** Devolve o alerta que a fala dispara, ou null. Só o caso mais grave por fala. */
export function avaliarFala(fala: string): AlertaDeRegra | null {
  const texto = semAcento(fala);
  if (!texto.trim()) return null;

  if (VONTADE_DE_MORRER.test(texto)) {
    return {
      tipo: 'humor',
      gravidade: 'urgente',
      texto: `Falou em não querer mais viver: "${citar(fala)}". Ligue agora pra saber como está. O CVV atende no 188.`,
    };
  }

  if (EMERGENCIA.test(texto.replace(FALSO_ALARME, ' '))) {
    return {
      tipo: 'emergencia',
      gravidade: 'urgente',
      texto: `Pode ser uma emergência: "${citar(fala)}". Ligue agora e, se precisar, chame o SAMU no 192.`,
    };
  }

  if (DOSE_A_MAIS.test(texto) && FALA_DE_REMEDIO.test(texto)) {
    return {
      tipo: 'remedio',
      gravidade: 'urgente',
      texto: `Pode ter tomado remédio a mais: "${citar(fala)}". Ligue agora e, se ela estiver tonta ou passando mal, chame o SAMU no 192.`,
    };
  }

  if (SEQUESTRO.test(texto)) {
    return {
      tipo: 'golpe',
      gravidade: 'urgente',
      texto: `Falou de sequestro: "${citar(fala)}". Quase sempre é golpe. Ligue agora pra ela e pra pessoa citada, e não passe dinheiro.`,
    };
  }

  if (PEDIDO_DE_DINHEIRO.test(texto) && ALGUEM_PEDIU.test(texto)) {
    const passou = JA_PASSOU.test(texto);
    return {
      tipo: 'golpe',
      gravidade: passou ? 'urgente' : 'atencao',
      texto: passou
        ? `Contou que já passou dinheiro ou dado a alguém: "${citar(fala)}". Pode ser golpe. Ligue agora e, se for o caso, avise o banco.`
        : `Contou de um pedido de dinheiro ou de senha: "${citar(fala)}". Pode ser golpe.`,
    };
  }

  return null;
}
