import {
  AgentState,
  TurnStatus,
  type AgentTranscription,
  type TranscriptHelperItem,
  type UserTranscription,
} from 'agora-agent-client-toolkit';

export type ItemDoTranscript = TranscriptHelperItem<
  Partial<UserTranscription | AgentTranscription>
>;

export type EstadoDoRosto =
  | 'parada'
  | 'ligando'
  | 'ouvindo'
  | 'pensando'
  | 'falando';

/** Volume a partir do qual a boca abre mesmo sem o aviso de "falando" ter chegado. */
const VOLUME_DE_FALA = 0.08;

/** Quantas letras da fala cabem na legenda grande do celular (umas 4 linhas). */
const TAMANHO_DA_LEGENDA = 130;

// Alguns serviços de voz mandam a pontuação grudada na palavra seguinte
// ("Oi.Tudo bem"). Aqui o espaço volta, inclusive antes de letra com acento.
export function arrumarEspacos(texto: string): string {
  return texto
    .replace(/([.!?])(\p{L})/gu, '$1 $2')
    .replace(/,(\p{L})/gu, ', $1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Fica com o fim da fala, cortando em palavra inteira, pra legenda mostrar o que está sendo dito agora. */
export function fimDaFala(
  texto: string,
  maximo: number = TAMANHO_DA_LEGENDA,
): string {
  if (texto.length <= maximo) return texto;
  const corte = texto.slice(texto.length - maximo);
  const primeiroEspaco = corte.indexOf(' ');
  const inteiro = primeiroEspaco === -1 ? corte : corte.slice(primeiroEspaco + 1);
  return `… ${inteiro}`;
}

function textoDe(item: ItemDoTranscript): string {
  return typeof item.text === 'string' ? arrumarEspacos(item.text) : '';
}

/**
 * A fala da assistente que vai pra legenda: a que está em andamento ou,
 * sem nenhuma em andamento, a última que ela terminou.
 */
export function legendaDaAssistente(
  transcript: ItemDoTranscript[],
  uidDaAssistente: string,
): string {
  const falas = transcript.filter(
    (item) => item.uid === uidDaAssistente && textoDe(item) !== '',
  );
  if (falas.length === 0) return '';
  const emAndamento = falas.findLast(
    (item) => item.status === TurnStatus.IN_PROGRESS,
  );
  const escolhida = emAndamento ?? falas[falas.length - 1];
  return fimDaFala(textoDe(escolhida));
}

export interface FalaDoIdoso {
  /** Um por fala (o turn_id da Agora), pra cada uma ir ao servidor uma vez só. */
  id: string;
  texto: string;
}

/**
 * As falas que o idoso já terminou. O toolkit marca a fala de quem está no
 * aparelho com uid "0"; aqui vale tudo que não veio da assistente.
 */
export function falasTerminadasDoIdoso(
  transcript: ItemDoTranscript[],
  uidDaAssistente: string,
): FalaDoIdoso[] {
  return transcript
    .filter(
      (item) =>
        item.uid !== uidDaAssistente &&
        item.status !== TurnStatus.IN_PROGRESS,
    )
    .map((item) => ({ id: String(item.turn_id), texto: textoDe(item) }))
    .filter((fala) => fala.texto !== '');
}

/** Junta o estado que a Agora informa com o volume do áudio pra decidir a cara do rosto. */
export function estadoDoRosto(
  estadoDoAgente: AgentState | null,
  assistenteNaLinha: boolean,
  nivel: number,
): EstadoDoRosto {
  if (!assistenteNaLinha) return 'ligando';
  if (estadoDoAgente === AgentState.SPEAKING || nivel > VOLUME_DE_FALA) {
    return 'falando';
  }
  if (estadoDoAgente === AgentState.THINKING) return 'pensando';
  return 'ouvindo';
}

export const TEXTO_DO_ESTADO: Record<EstadoDoRosto, string> = {
  parada: '',
  ligando: 'Ligando...',
  ouvindo: 'Estou te ouvindo',
  pensando: 'Pensando...',
  falando: 'Falando',
};

/**
 * As falas do idoso que mudaram desde o último envio, inclusive as que ainda estão
 * em andamento. A legenda marca cada pedaço como terminado na hora, então o mesmo
 * turno cresce depois ("Eu" vira "Eu caí no banheiro") e precisa ir de novo pro
 * servidor, que é onde as regras de queda e de golpe olham a frase.
 */
export function falasNovasDoIdoso(
  transcript: ItemDoTranscript[],
  uidDaAssistente: string,
  enviadas: ReadonlyMap<string, string>,
): FalaDoIdoso[] {
  return transcript
    .filter((item) => item.uid !== uidDaAssistente)
    .map((item) => ({ id: String(item.turn_id), texto: textoDe(item) }))
    .filter((fala) => fala.texto !== '' && enviadas.get(fala.id) !== fala.texto);
}

