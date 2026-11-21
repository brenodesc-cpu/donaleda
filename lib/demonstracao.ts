// A demonstração pública em /experimente: o jurado abre pelo QR Code, toca no
// botão e a Dona Leda liga pra ele por até dois minutos. Tudo aqui é conta pura:
// a pessoa de exemplo, a saudação, as respostas das ações e as travas de custo.
// Nada do que o visitante diz é gravado. A ficha do fim é montada em memória e
// devolvida pra tela, sem passar pelo banco.

import { aplicarExtracaoNaBase, type ExtracaoDaConversa } from './posConversa';
import { abrirConversa, fecharConversa, montarPainel } from './dados';
import { NOME_DA_ASSISTENTE, horaEmBrasilia } from './assistente';
import { baseNova } from './exemplo';
import { semAcento } from './regras';
import { chaveConfere, chaveDasFerramentas } from './servidor';
import type { Base, FalaDaSessao, PainelDaFamilia } from './tipos';

/** O id da pessoa de exemplo. Não existe no banco e não aparece em painel nenhum. */
export const ID_DA_DEMONSTRACAO = 'demonstracao-publica';

/** Teto de cada ligação, em segundos. A tela desliga sozinha aqui. */
export const SEGUNDOS_POR_LIGACAO = 120;

/** O passe da sala da Agora e o da assistente vencem pouco depois do teto, pra ninguém esticar a ligação. */
export const SEGUNDOS_DO_PASSE_DA_SALA = SEGUNDOS_POR_LIGACAO + 30;
export const SEGUNDOS_DO_PASSE_DA_ASSISTENTE = SEGUNDOS_POR_LIGACAO + 50;

/** Quanto tempo depois da ligação o visitante ainda pode pedir a ficha do fim. */
export const MINUTOS_PRA_PEDIR_A_FICHA = 10;

export interface LimitesDaDemonstracao {
  /** LIA_DEMO_DESLIGADA=1 fecha a página na hora. */
  desligada: boolean;
  /** Minutos por dia somando todos os visitantes. LIA_DEMO_MINUTOS_POR_DIA, 60 por padrão. */
  minutosPorDia: number;
  /** Ligações por visitante por dia. LIA_DEMO_LIGACOES_POR_VISITANTE, 3 por padrão. */
  ligacoesPorVisitante: number;
  /** Ligações por dia saindo da mesma rede (o Wi-Fi do evento é um só). LIA_DEMO_LIGACOES_POR_REDE, 20 por padrão. */
  ligacoesPorRede: number;
  /** Endereço do vídeo mostrado quando a demonstração está cheia. LIA_DEMO_VIDEO. */
  video: string | null;
}

function inteiro(valor: string | undefined, padrao: number, minimo: number, maximo: number): number {
  const lido = Number(valor);
  return Number.isFinite(lido) && lido >= minimo && lido <= maximo ? Math.floor(lido) : padrao;
}

export function limitesDaDemonstracao(env: Record<string, string | undefined> = process.env): LimitesDaDemonstracao {
  const video = env.LIA_DEMO_VIDEO?.trim();
  return {
    desligada: env.LIA_DEMO_DESLIGADA?.trim() === '1',
    minutosPorDia: inteiro(env.LIA_DEMO_MINUTOS_POR_DIA, 60, 0, 1000),
    ligacoesPorVisitante: inteiro(env.LIA_DEMO_LIGACOES_POR_VISITANTE, 3, 1, 50),
    ligacoesPorRede: inteiro(env.LIA_DEMO_LIGACOES_POR_REDE, 20, 1, 500),
    video: video && /^https:\/\//.test(video) ? video : null,
  };
}

/** Por que a demonstração não liga agora, em palavras que viram texto na tela. */
export type RecusaDaDemonstracao = 'desligada' | 'cheia' | 'visitante' | 'rede';

/** A conta da reserva, separada do banco pra poder ser provada. */
export function podeReservar(
  usado: { segundosHoje: number; doVisitante: number; daRede: number },
  limites: LimitesDaDemonstracao,
): RecusaDaDemonstracao | null {
  if (limites.desligada) return 'desligada';
  if (usado.segundosHoje + SEGUNDOS_POR_LIGACAO > limites.minutosPorDia * 60) return 'cheia';
  if (usado.doVisitante >= limites.ligacoesPorVisitante) return 'visitante';
  if (usado.daRede >= limites.ligacoesPorRede) return 'rede';
  return null;
}

/**
 * A pessoa de exemplo: quem atende é "você", acompanhado pela filha Marina, com
 * um remédio da manhã pra Dona Leda perguntar. Nasce a cada ligação, só em memória.
 * Já conversou antes, pra ela não fazer a apresentação de quem guarda lembranças.
 */
export function baseDaDemonstracao(): Base {
  const base = baseNova(ID_DA_DEMONSTRACAO, {
    nome: 'visitante da demonstração',
    tratamento: 'você',
    idade: 72,
    familiar: { nome: 'Marina', parentesco: 'filha' },
    remedios: [{ nome: 'remédio da pressão', horario: '08:00' }],
    horariosDeLigacao: [],
  });
  base.idoso.primeiraConversaFeita = true;
  return base;
}

function cumprimento(agora: Date): string {
  const hora = horaEmBrasilia(agora);
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * A primeira fala da ligação. É ela que diz que é uma demonstração: as instruções
 * são as mesmas da ligação de verdade, sem nenhuma linha a mais.
 */
export function saudacaoDaDemonstracao(agora: Date = new Date()): string {
  return `${cumprimento(agora)}! Aqui é a ${NOME_DA_ASSISTENTE}, assistente virtual. Esta é uma demonstração de dois minutos, e nada do que você disser fica guardado. Vou conversar com você como converso todo dia com quem eu acompanho. Como você dormiu essa noite?`;
}

/**
 * O que a ação responde pro modelo na demonstração. Ela não grava nada: a ficha
 * do fim sai das falas, pelo mesmo caminho que a ligação de verdade usa quando a
 * ação falha. A resposta é a mesma frase da ação de verdade, pra conversa seguir igual.
 */
export function respostaDaAcaoDeDemonstracao(nome: string): string {
  switch (nome) {
    case 'registrar_bem_estar':
      return 'Anotado.';
    case 'guardar_lembranca':
      return 'Guardada.';
    case 'mudar_lembranca':
      return 'Pronto.';
    case 'buscar_lembranca':
      return 'Não achei nada sobre isso na ficha. Diga que não sabe e ofereça guardar.';
    case 'avisar_familia':
      return 'A família foi avisada.';
    case 'resumir_conversa':
      return 'Resumo guardado.';
    default:
      return 'Não consegui anotar agora. Siga a conversa normalmente.';
  }
}

/** A chave das ações da demonstração em /api/experimente/mcp. Não abre ficha nenhuma. */
export function chaveDaDemonstracao(): string | null {
  return chaveDasFerramentas(ID_DA_DEMONSTRACAO);
}

export function chaveDaDemonstracaoConfere(recebida: string | null | undefined): boolean {
  return chaveConfere(ID_DA_DEMONSTRACAO, recebida);
}

/**
 * O passe que a tela guarda pra pedir a ficha no fim: a hora em que a ligação
 * começou e a assistente da Agora que entrou, assinados pelo servidor. Sem ele
 * ninguém pede ficha nem manda parar a assistente de outra ligação.
 */
export function passeDaFicha(inicio: Date, agentId: string): string | null {
  const conteudo = `${inicio.getTime()}.${agentId}`;
  const assinatura = chaveDasFerramentas(`${ID_DA_DEMONSTRACAO}:${conteudo}`);
  return assinatura ? `${conteudo}.${assinatura}` : null;
}

export function conferirPasseDaFicha(
  passe: unknown,
  agora: Date = new Date(),
): { inicio: Date; agentId: string } | null {
  if (typeof passe !== 'string' || passe.length > 300) return null;
  const partes = passe.split('.');
  if (partes.length !== 3) return null;
  const [quando, agentId, assinatura] = partes;
  if (!chaveConfere(`${ID_DA_DEMONSTRACAO}:${quando}.${agentId}`, assinatura)) return null;
  const inicio = new Date(Number(quando));
  const passou = agora.getTime() - inicio.getTime();
  if (!Number.isFinite(passou) || passou < 0) return null;
  if (passou > (SEGUNDOS_POR_LIGACAO + MINUTOS_PRA_PEDIR_A_FICHA * 60) * 1000) return null;
  return { inicio, agentId };
}

const REMEDIO_NAO = /\b(nao tomei|esqueci de tomar|nao tomo|ainda nao tomei|fiquei sem)\b[^.?!]*\bremedio|\bremedio\b[^.?!]*\b(nao tomei|esqueci|acabou)\b/;
const REMEDIO_SIM = /\b(ja )?tomei (o |os |meu |meus |o meu |os meus )?remedio/;
const SONO_MAL = /\b(dormi (mal|pessimo|muito pouco|pouco)|nao (consegui )?dormi|insonia|acordei (varias|muitas) vezes|passei a noite acordad)/;
const SONO_BEM = /\b(dormi (bem|otimo|muito bem|feito um anjo))\b/;
const SONO_MEIO = /\bdormi mais ou menos\b/;
const COMEU_NADA = /\b(nao (comi|almocei|jantei|tomei cafe)|fiquei sem comer)\b/;
const COMEU_POUCO = /\b(comi pouco|almocei pouco|jantei pouco|quase nao comi|sem fome|so (uma )?(sopa|fruta|bolacha))\b/;
const COMEU_BEM = /\b(comi bem|almocei bem|jantei bem|comi muito bem)\b/;

/**
 * Uma leitura simples do sono, da comida e do remédio nas falas do visitante.
 * Vale só quando a leitura do Google não respondeu (a cota do modelo leve acabou
 * em 21/11), pra cena do fim não sair vazia. O que o Google leu tem preferência.
 */
export function leituraSimplesDasFalas(falas: FalaDaSessao[]): NonNullable<ExtracaoDaConversa['bemEstar']> {
  const texto = falas
    .filter((f) => f.quem === 'idoso')
    .map((f) => semAcento(f.texto))
    .join('. ');
  const bemEstar: NonNullable<ExtracaoDaConversa['bemEstar']> = {};
  if (SONO_MAL.test(texto)) bemEstar.sono = 'mal';
  else if (SONO_MEIO.test(texto)) bemEstar.sono = 'mais_ou_menos';
  else if (SONO_BEM.test(texto)) bemEstar.sono = 'bem';
  if (COMEU_NADA.test(texto)) bemEstar.alimentacao = 'nao_comeu';
  else if (COMEU_POUCO.test(texto)) bemEstar.alimentacao = 'comeu_pouco';
  else if (COMEU_BEM.test(texto)) bemEstar.alimentacao = 'comeu_bem';
  if (REMEDIO_NAO.test(texto)) bemEstar.remedio = 'nao_tomou';
  else if (REMEDIO_SIM.test(texto)) bemEstar.remedio = 'tomou';
  return bemEstar;
}

/**
 * O que a família veria depois da ligação: a ficha do dia, o aviso e o resumo,
 * montados em memória a partir das falas e da leitura do fim da conversa.
 */
export function fichaDaDemonstracao(
  falas: FalaDaSessao[],
  extracao: ExtracaoDaConversa,
  inicio: Date,
  fim: Date = new Date(),
): PainelDaFamilia {
  const base = baseDaDemonstracao();
  const conversa = abrirConversa(base, inicio);
  const bemEstar = { ...leituraSimplesDasFalas(falas) };
  for (const [campo, valor] of Object.entries(extracao.bemEstar ?? {})) {
    if (valor !== undefined) (bemEstar as Record<string, unknown>)[campo] = valor;
  }
  const completa = Object.keys(bemEstar).length > 0 ? { ...extracao, bemEstar } : extracao;
  aplicarExtracaoNaBase(base, conversa.id, falas, completa, fim);
  fecharConversa(base, conversa.id, fim);
  return montarPainel(base, fim);
}
