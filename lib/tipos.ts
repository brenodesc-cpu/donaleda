// Tipos da Lia. Este arquivo é o contrato entre a conversa, a ficha e o painel
// da família: quem mexe numa dessas partes lê daqui.

export type Sono = 'bem' | 'mais_ou_menos' | 'mal';
export type Alimentacao = 'comeu_bem' | 'comeu_pouco' | 'nao_comeu';
export type Remedio = 'tomou' | 'nao_tomou' | 'nao_confirmou';
export type Humor = 'bem' | 'triste' | 'ansioso' | 'sozinho' | 'irritado';

/** As gavetas do segundo cérebro do idoso. A antiga 'familia' é lida como 'pessoa'. */
export type CategoriaDeLembranca =
  | 'pessoa'
  | 'saude'
  | 'dificuldade'
  | 'rotina'
  | 'gosto'
  | 'historia'
  | 'humor'
  | 'compromisso';

export type TipoDeAlerta = 'emergencia' | 'golpe' | 'remedio' | 'saude' | 'humor' | 'ligacao';
export type Gravidade = 'urgente' | 'atencao';
/** O que quem viu o aviso fez: ligou, foi até lá, chamou ajuda ou vai ver mais tarde. */
export type RespostaDoAviso = 'liguei' | 'fui_la' | 'chamei_ajuda' | 'depois';

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

export type OrigemDaLembranca = 'conversa' | 'familia' | 'deduzida';

/** Algo que a Dona Leda aprendeu sobre a pessoa e usa nas próximas conversas. */
export interface Lembranca {
  id: string;
  /** Número curto e fixo (1, 2, 3...), que a assistente cita pra corrigir ou esquecer. */
  numero: number;
  texto: string;
  categoria: CategoriaDeLembranca;
  /** Nome da pessoa de quem a lembrança fala ("Zefa", "Pedro"). */
  sobre?: string;
  /** Compromisso e aniversário: AAAA-MM-DD e HH:MM, no horário de Brasília. */
  data?: string;
  hora?: string;
  /** O idoso pediu pra não contar à família. A família vê só quantas são. */
  reservada?: boolean;
  /**
   * Quem contou: o idoso na conversa, a família no painel, ou a Dona Leda deduziu da
   * conversa depois que ela acabou (lib/posConversa.ts), sem ninguém confirmar.
   * Dedução nunca é tratada como fato: a assistente confirma antes, e o painel mostra
   * separado até alguém da família tocar em "Está certo" ou corrigir.
   */
  origem?: OrigemDaLembranca;
  criadaEm: string;
  atualizadaEm?: string;
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
  /** Quem tocou em "Já vi" primeiro (o nome do cadastro) e quando. Aviso visto antes de 21/11 não tem. */
  vistoPor?: string;
  vistoEm?: string;
  /** O que a pessoa fez depois de ver, com uma nota curta opcional. */
  desfecho?: { resposta: RespostaDoAviso; nota?: string; por: string; em: string };
}

/** Uma conversa. O texto do que foi dito não é guardado: só a duração e o resumo. */
/**
 * Tempo de resposta medido pela Agora numa conversa, por "peça.medida"
 * (ex.: "llm.ttfb" é quanto o modelo levou pra começar a responder).
 */
export type TemposDaConversa = Record<string, { n: number; mediaMs: number; piorMs: number }>;

export interface Conversa {
  id: string;
  inicio: string;
  fim?: string;
  falasDoIdoso: number;
  /** A ligação que abriu esta conversa, quando foi a assistente que ligou. */
  chamadaId?: string;
  /**
   * Quem atendeu não era o idoso (a assistente percebeu ou a pessoa disse). Nada desta
   * conversa entra na ficha, nas lembranças nem no resumo, e ela não conta como conversa dele.
   */
  outraPessoa?: boolean;
  /**
   * Como estava a ficha do dia quando a ligação começou (null: o dia ainda não existia).
   * Só existe durante a ligação: se outra pessoa atendeu, a ficha volta pra este ponto.
   */
  diaNoInicio?: Dia | null;
  /** As lembranças e a quantidade de avisos que existiam quando a ligação começou (só durante ela). */
  lembrancasNoInicio?: string[];
  alertasNoInicio?: number;
  resumo?: string;
  /** Vem da tela do idoso no fim da ligação, quando a Agora mandou medições. */
  tempos?: TemposDaConversa;
  /** Só no modo direto: os tokens que o Google cobrou e o custo da ligação. */
  uso?: UsoDaConversa;
}

/** Os tokens que o Gemini cobrou numa ligação do modo direto, somados resposta por resposta. */
export interface UsoDoGemini {
  /** Entrada que não é áudio: as instruções, as ações e a conversa até ali. */
  entradaTexto: number;
  /** A fala do idoso. */
  entradaAudio: number;
  /** A legenda e o que mais sair como texto. */
  saidaTexto: number;
  /** A voz da assistente, a parte mais cara. */
  saidaAudio: number;
  /** O que o modelo gastou pensando. O Google cobra como texto que sai. */
  raciocinio: number;
  /** Quantas respostas entraram na soma. */
  respostas: number;
}

/** A conta de uma ligação do modo direto, guardada junto da conversa. */
export interface UsoDaConversa extends UsoDoGemini {
  /** Quanto tempo a conversa com o Gemini ficou aberta. */
  segundos: number;
  /** Custo no Google, em dólares, pelo preço publicado. */
  dolares: number;
  /** Dólares por minuto de ligação, ou null se ela não chegou a 1 segundo. */
  dolaresPorMinuto: number | null;
  modelo: string;
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
  /**
   * Quando o idoso ouviu o aviso de privacidade (lib/privacidade.ts): na saudação da
   * primeira ligação em que ele falou. A versão diz qual texto foi dito.
   */
  avisoDePrivacidade?: { dadoEm: string; versao: number };
  /** Horas em que a assistente liga todo dia, "HH:MM" no horário de Brasília. */
  horariosDeLigacao: string[];
  /** Quando ligado, a ligação é atendida sozinha depois de alguns segundos tocando. */
  atenderSozinho: boolean;
}

/** Quem pediu a ligação: a hora marcada ou alguém da família, pelo painel. */
export type MotivoDaChamada = 'horario' | 'familia';
/** 'falhou': o idoso atendeu, mas a Agora recusou a assistente e ela não entrou. */
export type EstadoDaChamada = 'tocando' | 'atendida' | 'perdida' | 'recusada' | 'falhou';

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

/** Token de push de um aparelho pareado pra acordar a tela mesmo com o app fechado. */
export interface AparelhoPush {
  plataforma: 'android' | 'ios';
  token: string;
  atualizadoEm: string;
  /** Identificador deste aparelho no Agora Signaling (RTM). */
  agoraRtmUserId?: string;
}

export interface Base {
  idoso: Idoso;
  dias: Dia[];
  lembrancas: Lembranca[];
  alertas: Alerta[];
  conversas: Conversa[];
  chamadas: Chamada[];
  /** Aparelhos registrados pra receber convite de chamada via Agora Signaling / Push. */
  aparelhosPush?: AparelhoPush[];
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
  /** Sem as reservadas. Compromissos com data vêm primeiro, pela data. */
  lembrancas: Lembranca[];
  /** Quantas lembranças o idoso pediu pra guardar só com a assistente. */
  reservadas: number;
  /** A ligação que está tocando agora no aparelho do idoso, se houver. */
  chamadaTocando: Chamada | null;
  /** As últimas ligações, da mais nova pra mais antiga. */
  chamadas: Chamada[];
  /** Os minutos de conversa de hoje, somando as ligações, contra o limite do plano. */
  limiteDoDia?: LimiteDoDia;
  /** true quando o aparelho do idoso consultou o servidor nos últimos 30 s (app aberto). */
  aparelhoOnline?: boolean;
  /** Último instante em que o aparelho do idoso respondeu ao servidor, ou null. */
  aparelhoVistoEm?: string | null;
  /** true quando o aparelho do idoso tem push nativo (FCM / APNs VoIP) registrado. */
  aparelhoPushAtivo?: boolean;
  atualizadoEm: string;
}

/**
 * POST /api/familia. Toda ação leva `idosoId`; sem ele, vale o primeiro idoso da família.
 * Resposta: `{ ok: true, ... }` ou `{ ok: false, erro }` com 400, 401, 403, 404 ou 409.
 */
export type AcaoDaFamilia = (
  | { acao: 'visto'; alertaId: string }
  /** Conta o que fez com o aviso. Responde `{ ok, alerta }`. */
  | { acao: 'desfecho'; alertaId: string; resposta: RespostaDoAviso; nota?: string }
  /** Faz o aparelho do idoso tocar agora. Responde `{ ok, chamada }`, ou 409 se já está tocando. */
  | { acao: 'ligar' }
  /** Troca as horas das ligações de todo dia ("HH:MM"). Responde `{ ok, horarios }`. */
  | { acao: 'horarios'; horarios: string[] }
  | { acao: 'atender_sozinho'; ligado: boolean }
  /** Gera o código de 6 números pra ligar um aparelho. Responde `{ ok, ...CodigoDoAparelho }`. */
  | { acao: 'gerar_codigo' }
  /** A família ensina uma lembrança. Responde `{ ok, lembranca }` ou 422 `{ ok:false, erro:'recusada', motivo }`. */
  | { acao: 'ensinar'; texto: string; categoria: CategoriaDeLembranca; sobre?: string; data?: string; hora?: string }
  /** A família corrige uma lembrança que vê. Só os campos que vierem. Responde `{ ok, lembranca }`. */
  | { acao: 'corrigir_lembranca'; lembrancaId: string; texto?: string; categoria?: CategoriaDeLembranca; sobre?: string; data?: string; hora?: string }
  /** A família apaga uma lembrança que vê. Responde `{ ok }`. */
  | { acao: 'apagar_lembranca'; lembrancaId: string }
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
  /** true quando a próxima ligação marcada é só amanhã. */
  proximaEAmanha?: boolean;
  horariosDeLigacao: string[];
  /** Os minutos de conversa de hoje: quando acaba, o idoso não começa outra conversa. */
  limiteDoDia?: LimiteDoDia;
}

/** POST /api/chamada: o aparelho do idoso conta o que aconteceu com a ligação. */
export type RespostaDaChamada =
  | { acao: 'atender'; chamadaId: string }
  | { acao: 'recusar'; chamadaId: string };

/** Uma fala efêmera enviada apenas no fim da ligação pra gerar resumo/ficha em memória e descartar. */
export interface FalaDaSessao {
  quem: 'idoso' | 'assistente';
  texto: string;
}

/** POST /api/conversa (a tela do idoso avisa o servidor do que acontece na conversa). */
export type EventoDaConversa =
  | { tipo: 'fala'; conversaId: string; texto: string }
  | { tipo: 'fim'; conversaId: string; falas?: FalaDaSessao[] }
  | { tipo: 'tempos'; conversaId: string; tempos: TemposDaConversa };

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
  /**
   * Como a conversa rodou: Gemini Live pelo motor da Agora, as três peças, ou o
   * modo direto, em que o aparelho fala com o Gemini e a Agora fica só com a sala.
   */
  modo?: 'gemini' | 'tres' | 'direto';
  /** Só no modo direto: o que o aparelho precisa pra abrir a conversa com o Gemini. */
  direto?: InicioDireto;
  /** Teto desta ligação em milissegundos: o normal ou o que sobra do limite do dia. */
  teto_ms?: number;
}

/** POST /api/direto devolve isto dentro de InicioDaConversa. */
export interface InicioDireto {
  /** Passe temporário do Google: abre uma conversa só e vence em minutos. */
  passe: string;
  /** A primeira mensagem da conversa: modelo, voz, instruções e ações. */
  abertura: Record<string, unknown>;
  /** A frase que a assistente diz ao atender. */
  saudacao: string;
  modelo: string;
  /** Quanto silêncio o aparelho espera antes de avisar o Gemini que a fala acabou. */
  silencioMs: number;
}

/** POST /api/direto/acao: o Gemini pediu uma ação e o aparelho repassa. */
export interface PedidoDeAcao {
  nome: string;
  argumentos?: unknown;
}

export interface RespostaDaAcao {
  ok: boolean;
  /** A frase curta que volta pro modelo. */
  texto: string;
}

/** POST /api/direto/uso: a conta de tokens da ligação, mandada uma vez no fim. */
export interface PedidoDeUso {
  conversaId: string;
  uso: UsoDoGemini;
  segundos: number;
}

/**
 * Minutos de conversa do dia contra o limite do plano (lib/limiteDoDia.ts). A ligação
 * pedida pela família no "Ligar agora" passa mesmo quando o limite acabou.
 */
export interface LimiteDoDia {
  limiteMin: number;
  usadoMin: number;
  restanteMs: number;
  /** Sobra menos de 1 minuto: ligação marcada e ligação do idoso não começam mais hoje. */
  acabou: boolean;
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
