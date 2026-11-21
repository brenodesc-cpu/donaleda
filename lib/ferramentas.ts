// As ações que a assistente pode fazer durante a conversa. A Agora chama estas
// ações pelo endereço /api/mcp (protocolo MCP), e cada uma mexe na ficha.

import {
  aplicarBemEstar,
  criarAlerta,
  guardarLembranca,
  mudarBase,
  oQueFaltaSaber,
  resumirConversa,
  type BemEstar,
} from './dados';
import type {
  Alimentacao,
  CategoriaDeLembranca,
  Gravidade,
  Humor,
  Remedio,
  Sono,
  TipoDeAlerta,
} from './tipos';

const SONO: Sono[] = ['bem', 'mais_ou_menos', 'mal'];
const ALIMENTACAO: Alimentacao[] = ['comeu_bem', 'comeu_pouco', 'nao_comeu'];
const REMEDIO: Remedio[] = ['tomou', 'nao_tomou', 'nao_confirmou'];
const HUMOR: Humor[] = ['bem', 'triste', 'ansioso', 'sozinho', 'irritado'];
const CATEGORIAS: CategoriaDeLembranca[] = ['familia', 'saude', 'gosto', 'historia', 'rotina', 'compromisso'];
const TIPOS: TipoDeAlerta[] = ['emergencia', 'golpe', 'remedio', 'saude', 'humor'];
const GRAVIDADES: Gravidade[] = ['urgente', 'atencao'];

export interface Ferramenta {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const FERRAMENTAS: Ferramenta[] = [
  {
    name: 'registrar_bem_estar',
    description:
      'Anota na ficha de hoje o que a pessoa contou sobre o dia dela. Mande só os campos que ela respondeu agora. Pode chamar várias vezes na mesma conversa.',
    inputSchema: {
      type: 'object',
      properties: {
        sono: { type: 'string', enum: SONO, description: 'Como dormiu.' },
        alimentacao: { type: 'string', enum: ALIMENTACAO, description: 'Se comeu hoje.' },
        remedio: {
          type: 'string',
          enum: REMEDIO,
          description: 'Se tomou o remédio de hoje. Use nao_confirmou quando perguntou e a pessoa não soube ou desconversou.',
        },
        dor: { type: 'integer', minimum: 0, maximum: 10, description: 'Dor de 0 (nenhuma) a 10, dita pela pessoa.' },
        onde_doi: { type: 'string', description: 'Onde dói, com a preposição: "no joelho direito", "nas costas".' },
        humor: { type: 'string', enum: HUMOR, description: 'Como está se sentindo.' },
        saiu_de_casa: { type: 'boolean', description: 'Se saiu de casa hoje.' },
        falou_com_alguem: { type: 'boolean', description: 'Se falou com alguém hoje (visita, telefone, vizinho).' },
        observacao: { type: 'string', description: 'Uma frase curta com algo do dia que a família deveria saber.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'guardar_lembranca',
    description:
      'Guarda algo sobre a vida da pessoa pra lembrar nas próximas conversas: família, gostos, histórias, rotina, compromissos.',
    inputSchema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'Uma frase completa, em terceira pessoa.' },
        categoria: { type: 'string', enum: CATEGORIAS },
      },
      required: ['texto', 'categoria'],
      additionalProperties: false,
    },
  },
  {
    name: 'avisar_familia',
    description:
      'Manda um aviso pro painel da família na mesma hora. Use pra queda, mal-estar, dor forte, tristeza que dura, pedido de dinheiro ou senha, remédio que acabou, ou recado que a pessoa pediu pra dar.',
    inputSchema: {
      type: 'object',
      properties: {
        tipo: { type: 'string', enum: TIPOS },
        gravidade: {
          type: 'string',
          enum: GRAVIDADES,
          description: 'urgente quando a família precisa agir agora; atencao pro resto.',
        },
        mensagem: { type: 'string', description: 'Uma ou duas frases com o fato.' },
      },
      required: ['tipo', 'gravidade', 'mensagem'],
      additionalProperties: false,
    },
  },
  {
    name: 'resumir_conversa',
    description:
      'No fim da conversa, guarda um resumo de duas ou três frases do que a pessoa contou hoje. A família lê esse resumo.',
    inputSchema: {
      type: 'object',
      properties: { resumo: { type: 'string' } },
      required: ['resumo'],
      additionalProperties: false,
    },
  },
];

type Entrada = Record<string, unknown>;

function escolha<T extends string>(valor: unknown, opcoes: readonly T[]): T | undefined {
  return typeof valor === 'string' && (opcoes as readonly string[]).includes(valor)
    ? (valor as T)
    : undefined;
}

function texto(valor: unknown, limite = 400): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpo = valor.trim().replace(/\s+/g, ' ');
  return limpo ? limpo.slice(0, limite) : undefined;
}

function simOuNao(valor: unknown): boolean | undefined {
  if (typeof valor === 'boolean') return valor;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  return undefined;
}

function numero(valor: unknown): number | undefined {
  const n = typeof valor === 'string' ? Number(valor) : valor;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

export class FerramentaDesconhecida extends Error {}

/** Executa uma ação e devolve uma frase curta pro modelo. */
export async function executarFerramenta(
  idosoId: string,
  nome: string,
  argumentos: unknown,
  agora: Date = new Date(),
): Promise<string> {
  const a: Entrada =
    argumentos && typeof argumentos === 'object' ? (argumentos as Entrada) : {};

  if (nome === 'registrar_bem_estar') {
    const parcial: BemEstar = {
      sono: escolha(a.sono, SONO),
      alimentacao: escolha(a.alimentacao, ALIMENTACAO),
      remedio: escolha(a.remedio, REMEDIO),
      dor: numero(a.dor),
      ondeDoi: texto(a.onde_doi, 80),
      humor: escolha(a.humor, HUMOR),
      saiuDeCasa: simOuNao(a.saiu_de_casa),
      falouComAlguem: simOuNao(a.falou_com_alguem),
      observacao: texto(a.observacao, 240),
    };
    const veioAlgo = Object.values(parcial).some((v) => v !== undefined);
    if (!veioAlgo) return 'Nada foi anotado: nenhum campo válido chegou.';
    const { dia, alertas } = await mudarBase(idosoId, (base) => aplicarBemEstar(base, parcial, agora));
    const falta = oQueFaltaSaber(dia);
    const avisou = alertas.length ? ' A família foi avisada.' : '';
    return falta.length
      ? `Anotado.${avisou} Ainda falta saber: ${falta.join(', ')}.`
      : `Anotado.${avisou} Você já sabe tudo de hoje.`;
  }

  if (nome === 'guardar_lembranca') {
    const frase = texto(a.texto, 240);
    const categoria = escolha(a.categoria, CATEGORIAS) ?? 'historia';
    if (!frase) return 'Nada foi guardado: faltou o texto.';
    await mudarBase(idosoId, (base) => guardarLembranca(base, frase, categoria, agora));
    return 'Guardado.';
  }

  if (nome === 'avisar_familia') {
    const mensagem = texto(a.mensagem, 400);
    if (!mensagem) return 'Aviso não enviado: faltou a mensagem.';
    const tipo = escolha(a.tipo, TIPOS) ?? 'saude';
    const gravidade = escolha(a.gravidade, GRAVIDADES) ?? 'atencao';
    await mudarBase(idosoId, (base) =>
      criarAlerta(base, { tipo, gravidade, texto: mensagem, origem: 'assistente' }, agora),
    );
    return 'A família foi avisada.';
  }

  if (nome === 'resumir_conversa') {
    const resumo = texto(a.resumo, 600);
    if (!resumo) return 'Resumo não guardado: faltou o texto.';
    await mudarBase(idosoId, (base) => resumirConversa(base, resumo));
    return 'Resumo guardado.';
  }

  throw new FerramentaDesconhecida(`Ação desconhecida: ${nome}`);
}
