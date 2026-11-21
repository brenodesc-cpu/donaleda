// Tipos da Lia. Este arquivo é o contrato entre a conversa, a ficha e o painel
// da família: quem mexe numa dessas partes lê daqui.

export type Sono = 'bem' | 'mais_ou_menos' | 'mal';
export type Alimentacao = 'comeu_bem' | 'comeu_pouco' | 'nao_comeu';
export type Remedio = 'tomou' | 'nao_tomou' | 'nao_confirmou';
export type Humor = 'bem' | 'triste' | 'ansioso' | 'sozinho' | 'irritado';

export type CategoriaDeLembranca =
  | 'familia'
  | 'saude'
  | 'gosto'
  | 'historia'
  | 'rotina'
  | 'compromisso';

export type TipoDeAlerta = 'emergencia' | 'golpe' | 'remedio' | 'saude' | 'humor' | 'ligacao';
export type Gravidade = 'urgente' | 'atencao';

/** O que a Lia soube do idoso num dia. Campo vazio quer dizer "ainda não respondeu". */
export interface Dia {
  /** AAAA-MM-DD no horário de Brasília. */
  data: string;
  sono?: Sono;
  alimentacao?: Alimentacao;
  remedio?: Remedio;
  /** Dor de 0 a 10, dita pelo próprio idoso. */
  dor?: number;
  ondeDoi?: string;
  humor?: Humor;
  saiuDeCasa?: boolean;
  falouComAlguem?: boolean;
  observacoes: string[];
  /** true quando o dia veio dos dados de exemplo, e não de uma conversa de verdade. */
  exemplo?: boolean;
  atualizadoEm?: string;
}

/** Algo que a Lia aprendeu sobre a pessoa e usa nas próximas conversas. */
export interface Lembranca {
  id: string;
  texto: string;
  categoria: CategoriaDeLembranca;
  criadaEm: string;
  exemplo?: boolean;
}

export interface Alerta {
  id: string;
  tipo: TipoDeAlerta;
  gravidade: Gravidade;
  texto: string;
  criadoEm: string;
  /** 'assistente': a Lia decidiu avisar. 'regra': uma regra fixa do código disparou. */
  origem: 'assistente' | 'regra';
  visto: boolean;
}

/** Uma conversa. O texto do que foi dito não é guardado: só a duração e o resumo. */
export interface Conversa {
  id: string;
  inicio: string;
  fim?: string;
  falasDoIdoso: number;
  resumo?: string;
}

export interface Idoso {
  id: string;
  nome: string;
  /** Como a assistente chama a pessoa: "dona Helena", "seu Antônio". */
  tratamento: string;
  idade: number;
  familiar: { nome: string; parentesco: string };
  remedios: { nome: string; horario: string }[];
  /** A primeira conversa leva a apresentação completa da assistente virtual. */
  primeiraConversaFeita: boolean;
  /** Horas em que a assistente liga todo dia, "HH:MM" no horário de Brasília. */
  horariosDeLigacao: string[];
  /** Quando ligado, a ligação é atendida sozinha depois de alguns segundos tocando. */
  atenderSozinho: boolean;
}

/** Quem pediu a ligação: a hora marcada ou alguém da família, pelo painel. */
export type MotivoDaChamada = 'horario' | 'familia';
export type EstadoDaChamada = 'tocando' | 'atendida' | 'perdida' | 'recusada';

/** Uma ligação que a assistente faz pro aparelho do idoso. */
export interface Chamada {
  id: string;
  motivo: MotivoDaChamada;
  /** Só nas ligações de hora marcada: "HH:MM". */
  horario?: string;
  /** 1 na primeira tentativa, 2 na segunda. */
  tentativa: number;
  estado: EstadoDaChamada;
  pedidaEm: string;
  resolvidaEm?: string;
}

export interface Base {
  idoso: Idoso;
  dias: Dia[];
  lembrancas: Lembranca[];
  alertas: Alerta[];
  conversas: Conversa[];
  chamadas: Chamada[];
}

/** Resposta de GET /api/familia. O painel da família lê só isto. */
export interface PainelDaFamilia {
  assistente: string;
  idoso: Idoso;
  /** O dia de hoje. Sempre vem, mesmo sem conversa (aí os campos ficam vazios). */
  hoje: Dia;
  conversouHoje: boolean;
  ultimaConversa: {
    inicio: string;
    fim?: string;
    /** null enquanto a conversa está acontecendo. */
    minutos: number | null;
    resumo?: string;
    emAndamento: boolean;
  } | null;
  /** Não vistos primeiro, depois os mais novos. */
  alertas: Alerta[];
  /** Sete dias, do mais antigo até hoje. Dia sem dado vem com os campos vazios. */
  semana: Dia[];
  lembrancas: Lembranca[];
  /** A ligação que está tocando agora no aparelho do idoso, se houver. */
  chamadaTocando: Chamada | null;
  /** As últimas ligações, da mais nova pra mais antiga. */
  chamadas: Chamada[];
  atualizadoEm: string;
}

/**
 * POST /api/familia. Toda ação leva `idosoId`; sem ele, vale o primeiro idoso da família.
 * Resposta: `{ ok: true, ... }` ou `{ ok: false, erro }` com 400, 401, 403, 404 ou 409.
 */
export type AcaoDaFamilia = (
  | { acao: 'visto'; alertaId: string }
  /** Faz o aparelho do idoso tocar agora. Responde `{ ok, chamada }`, ou 409 se já está tocando. */
  | { acao: 'ligar' }
  /** Troca as horas das ligações de todo dia ("HH:MM"). Responde `{ ok, horarios }`. */
  | { acao: 'horarios'; horarios: string[] }
  | { acao: 'atender_sozinho'; ligado: boolean }
  /** Gera o código de 6 números pra ligar um aparelho. Responde `{ ok, ...CodigoDoAparelho }`. */
  | { acao: 'gerar_codigo' }
  /** Muda o perfil. Só os campos que vierem. Responde `{ ok, idoso }`. */
  | {
      acao: 'perfil';
      nome?: string;
      tratamento?: string;
      idade?: number;
      remedios?: { nome: string; horario: string }[];
      familiar?: { nome: string; parentesco: string };
    }
) & { idosoId?: string };

/** GET /api/chamada: o aparelho do idoso pergunta isto a cada 2 segundos. */
export interface SituacaoDaChamada {
  assistente: string;
  tratamento: string;
  /** A ligação tocando agora, ou null. */
  chamada: Chamada | null;
  /** Segundos tocando até atender sozinha, ou null quando o idoso precisa tocar em Atender. */
  atenderSozinhoEm: number | null;
  /** Próxima hora marcada de hoje ou de amanhã, "HH:MM", ou null. */
  proximaLigacao: string | null;
  horariosDeLigacao: string[];
}

/** POST /api/chamada: o aparelho do idoso conta o que aconteceu com a ligação. */
export type RespostaDaChamada =
  | { acao: 'atender'; chamadaId: string }
  | { acao: 'recusar'; chamadaId: string };

/** POST /api/conversa (a tela do idoso avisa o servidor do que acontece na conversa). */
export type EventoDaConversa =
  | { tipo: 'fala'; conversaId: string; texto: string }
  | { tipo: 'fim'; conversaId: string };

export interface RespostaDoEvento {
  ok: boolean;
  /** Vem quando a fala disparou uma regra de segurança (queda, golpe). */
  alerta?: Alerta;
}

/** O que POST /api/invite-agent devolve além dos campos do projeto-base. */
export interface InicioDaConversa {
  agent_id: string;
  create_ts: number;
  state: string;
  conversa_id: string;
  /** false quando a Lia está sem as ações (falta o endereço público do servidor). */
  ferramentas: boolean;
  /** true quando um avatar em vídeo entra na ligação junto com a voz. */
  avatar: boolean;
  /** Como a conversa rodou: Gemini Live (um modelo só) ou as três peças. */
  modo?: 'gemini' | 'tres';
}

// ---------- Contas, idosos e aparelhos (21/11, contrato entre servidor, painel e app) ----------

/** Um idoso que a família logada acompanha. GET /api/idosos devolve a lista. */
export interface IdosoDaFamilia {
  id: string;
  nome: string;
  tratamento: string;
  /** Quantos aparelhos estão ligados a este idoso. */
  aparelhos: number;
  /** Papel de quem está logado: quem cadastrou ou quem foi convidado. */
  papel: 'responsavel' | 'familiar';
}

/**
 * POST /api/idosos: a família cadastra um idoso. Também aceita `{ exemplo: true }`,
 * que cria a dona Helena com dias de exemplo. Responde `{ ok: true, id }`.
 */
export interface NovoIdoso {
  nome: string;
  tratamento: string;
  idade: number;
  /** Nome e parentesco de quem está cadastrando ("Marina", "filha"). */
  familiar: { nome: string; parentesco: string };
  remedios: { nome: string; horario: string }[];
  horariosDeLigacao: string[];
}

/** POST /api/familia { acao: 'gerar_codigo', idosoId } devolve isto. O código vale 30 minutos. */
export interface CodigoDoAparelho {
  codigo: string;
  expiraEm: string;
}

/** POST /api/aparelho/parear { codigo } devolve isto. O aparelho guarda o token pra sempre. */
export interface AparelhoPareado {
  token: string;
  idosoId: string;
  tratamento: string;
}

/** Cabeçalho que todo pedido do aparelho do idoso manda pro servidor. */
export const CABECALHO_DO_APARELHO = 'x-donaleda-aparelho';
