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

export type TipoDeAlerta = 'emergencia' | 'golpe' | 'remedio' | 'saude' | 'humor';
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
  /** Como a Lia chama a pessoa: "dona Helena", "seu Antônio". */
  tratamento: string;
  idade: number;
  familiar: { nome: string; parentesco: string };
  remedios: { nome: string; horario: string }[];
  /** A primeira conversa leva a apresentação completa da Lia como assistente virtual. */
  primeiraConversaFeita: boolean;
}

export interface Base {
  idoso: Idoso;
  dias: Dia[];
  lembrancas: Lembranca[];
  alertas: Alerta[];
  conversas: Conversa[];
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
  atualizadoEm: string;
}

/** POST /api/familia */
export type AcaoDaFamilia = { acao: 'visto'; alertaId: string };

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
}
