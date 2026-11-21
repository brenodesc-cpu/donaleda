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

// Expressões comuns que têm a palavra mas não são emergência.
const FALSO_ALARME =
  /\bcai (na risada|no sono|na gargalhada)|caiu a ficha|caiu a (luz|energia|internet|ligacao|chuva)|cair a (noite|tarde)|morr(i|endo) de (rir|saudade|vergonha|fome|sono|calor|frio)\b/;

const EMERGENCIA =
  /\b(eu cai|cai (no|na|da|do|de)|levei um tombo|tomei um tombo|sofri uma queda|escorreguei|desmaiei|desmaio|dor no peito|aperto no peito|falta de ar|nao consigo respirar|nao estou conseguindo respirar|estou sangrando|muito sangue|socorro|chama(r)? (uma |a )?ambulancia|nao consigo (me )?levantar|rosto (esta )?torto|boca torta|nao sinto (o|a|meu|minha) (braco|perna|lado))\b/;

const VONTADE_DE_MORRER =
  /\b(quero morrer|queria morrer|nao quero mais viver|vontade de morrer|me matar|acabar com (a minha|minha) vida|melhor se eu morresse|nao aguento mais viver)\b/;

const PEDIDO_DE_DINHEIRO =
  /\b(pix|senha|codigo|numero do cartao|cartao de credito|dados do cartao|transferencia|transferir|deposito|depositar|boleto|emprestimo|consignado|dinheiro|cpf|rg|dados do banco|conta do banco|numero da conta|golpe)\b/;

const ALGUEM_PEDIU =
  /\b(pediu|pediram|pedindo|ligou|ligaram|ligacao|telefonou|telefonaram|mandou|mandaram|mensagem|whatsapp|zap|moco do banco|moca do banco|gerente|um homem|uma mulher|numero estranho|falaram|disseram|falou que (era|e) (do|da)|disse que (era|e) (meu|minha|do|da)|cai num golpe|cai em golpe)\b/;

// Golpe do falso sequestro: vale sozinho, porque quem liga não precisa pedir dinheiro na mesma frase.
const SEQUESTRO = /\b(sequestr\w*)\b/;

// Quando a pessoa conta que já passou o dinheiro ou o dado, a família precisa agir agora.
const JA_PASSOU =
  /\b(ja (fiz|mandei|passei|transferi|depositei|paguei|dei)|fiz (o|um) pix|passei a senha|passei o codigo|mandei o dinheiro|transferi)\b/;

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

  if (EMERGENCIA.test(texto) && !FALSO_ALARME.test(texto)) {
    return {
      tipo: 'emergencia',
      gravidade: 'urgente',
      texto: `Pode ser uma emergência: "${citar(fala)}". Ligue agora e, se precisar, chame o SAMU no 192.`,
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
