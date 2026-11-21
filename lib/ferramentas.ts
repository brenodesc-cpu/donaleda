// As ações que a assistente pode fazer durante a conversa. A Agora chama estas
// ações pelo endereço /api/mcp (protocolo MCP), e cada uma mexe na ficha.

import {
  aplicarBemEstar,
  criarAlerta,
  lerBase,
  mudarBase,
  oQueFaltaSaber,
  resumirConversa,
  type BemEstar,
} from './dados';
import { NOME_DA_ASSISTENTE } from './assistente';
import { abrirConvite, fraseDoConvite } from './convite';
import { depois, falar } from './familiaNaLigacao';
import { avaliarFala, semAcento } from './regras';
import { buscar, citaSegredo, dataPedida, GAVETAS, guardar, horaPedida, linha, mudar, resumoSemSegredo, type Mudanca } from './memoria';
import type {
  Conversa,
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
const CATEGORIAS: CategoriaDeLembranca[] = GAVETAS;
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
      'Guarda algo sobre a vida da pessoa pra lembrar nas próximas conversas, na gaveta certa. Compromisso e aniversário levam a data e a hora como a pessoa disse. Se a pessoa pediu segredo ("isso fica entre nós"), mande reservada true.',
    inputSchema: {
      type: 'object',
      properties: {
        texto: { type: 'string', description: 'Uma frase completa, em terceira pessoa, com as palavras da pessoa.' },
        categoria: { type: 'string', enum: CATEGORIAS, description: 'pessoa, saude, dificuldade, rotina, gosto, historia, humor ou compromisso.' },
        sobre: { type: 'string', description: 'Nome da pessoa de quem a lembrança fala, se houver.' },
        data: { type: 'string', description: 'Pra compromisso e aniversário: como a pessoa disse ("amanhã", "quinta", "26/11"). Nunca calcule a data.' },
        hora: { type: 'string', description: 'Hora como a pessoa disse ("14h", "2 da tarde").' },
        reservada: { type: 'boolean', description: 'true quando a pessoa pediu pra não contar à família.' },
      },
      required: ['texto', 'categoria'],
      additionalProperties: false,
    },
  },
  {
    name: 'mudar_lembranca',
    description:
      'Corrige, esquece, reserva (segredo) ou libera (pode contar à família) uma lembrança, pelo número que aparece entre colchetes.',
    inputSchema: {
      type: 'object',
      properties: {
        numero: { type: 'integer', description: 'O número da lembrança, o que aparece entre colchetes.' },
        acao: { type: 'string', enum: ['corrigir', 'esquecer', 'reservar', 'liberar'] },
        texto: { type: 'string', description: 'Na correção: a frase certa, inteira.' },
        data: { type: 'string', description: 'Na correção de compromisso: a data como a pessoa disse.' },
        hora: { type: 'string', description: 'Na correção de compromisso: a hora como a pessoa disse.' },
      },
      required: ['numero', 'acao'],
      additionalProperties: false,
    },
  },
  {
    name: 'buscar_lembranca',
    description:
      'Procura na ficha inteira o que a pessoa já contou, quando ela pergunta algo da própria vida que não está nas suas lembranças de hoje.',
    inputSchema: {
      type: 'object',
      properties: { pergunta: { type: 'string', description: 'As palavras da pergunta, como "consulta", "chave da casa", "neto".' } },
      required: ['pergunta'],
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
    name: 'chamar_familia',
    description:
      'Quando a pessoa pede pra falar com a família agora ("chama minha filha", "quero falar com a Marina"). Avisa a família, que pode entrar nesta ligação. Não use em emergência: o aviso urgente já chama.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
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

function numero_(valor: unknown): number | undefined {
  const n = typeof valor === 'string' ? Number(valor) : valor;
  return typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : undefined;
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
    if (!frase) return 'Nada foi guardado: faltou o texto.';
    const categoria = escolha(a.categoria, CATEGORIAS) ?? 'historia';
    const r = await mudarBase(idosoId, (base) =>
      guardar(
        base,
        {
          texto: frase,
          categoria,
          sobre: texto(a.sobre, 60),
          data: dataPedida(texto(a.data, 40), agora),
          hora: horaPedida(texto(a.hora, 20)),
          reservada: simOuNao(a.reservada),
          origem: 'conversa',
        },
        agora,
      ),
    );
    if (!r.ok) return `Não guardei: ${r.motivo}. Diga isso com calma pra pessoa.`;
    return r.lembranca.reservada
      ? `Guardada como número ${r.lembranca.numero}, só entre vocês. A família não vê. Queda, emergência e golpe continuam indo pra família.`
      : `Guardada como número ${r.lembranca.numero}.`;
  }

  if (nome === 'mudar_lembranca') {
    const numero = numero_(a.numero);
    const acao = escolha(a.acao, ['corrigir', 'esquecer', 'reservar', 'liberar'] as const);
    if (!numero || !acao) return 'Nada mudou: faltou o número ou o que fazer.';
    const mudanca: Mudanca =
      acao === 'corrigir'
        ? { acao, texto: texto(a.texto, 240), data: dataPedida(texto(a.data, 40), agora), hora: horaPedida(texto(a.hora, 20)) }
        : { acao };
    const r = await mudarBase(idosoId, (base) => mudar(base, { numero }, mudanca, agora));
    if (!r.ok) return `Nada mudou: ${r.motivo}.`;
    return { corrigir: 'Corrigido.', esquecer: 'Esquecido. Saiu da ficha e do painel da família.', reservar: 'Agora fica só entre vocês.', liberar: 'Agora a família pode ver.' }[acao];
  }

  if (nome === 'buscar_lembranca') {
    const pergunta = texto(a.pergunta, 200);
    if (!pergunta) return 'Faltou o que procurar.';
    const base = await lerBase(idosoId);
    const achadas = buscar(base, pergunta);
    if (achadas.length === 0) return 'Não achei nada sobre isso na ficha. Diga que não sabe e ofereça guardar.';
    return `Achei:\n${achadas.map((l) => linha(l, base.idoso.familiar.nome)).join('\n')}`;
  }

  if (nome === 'avisar_familia') {
    const mensagem = texto(a.mensagem, 400);
    if (!mensagem) return 'Aviso não enviado: faltou a mensagem.';
    const tipo = escolha(a.tipo, TIPOS) ?? 'saude';
    const gravidade = escolha(a.gravidade, GRAVIDADES) ?? 'atencao';
    // Queda, golpe e o que as regras fixas tratam como risco (vontade de morrer, remédio
    // a mais) vão inteiros, mesmo com segredo. O resto não conta o assunto que a pessoa
    // pediu segredo, nem marcado como urgente: a família recebe o fato sem o motivo.
    // A tristeza longa da regra fixa é aviso de atenção e não libera o motivo.
    const daRegra = avaliarFala(mensagem);
    const riscoDaRegra = daRegra !== null && !(daRegra.tipo === 'humor' && daRegra.gravidade === 'atencao');
    const podeCitar = tipo === 'emergencia' || tipo === 'golpe' || RISCO_NO_AVISO.test(semAcento(mensagem)) || riscoDaRegra;
    let semOMotivo = false;
    let convite: { conversa: Conversa; frase: string } | null = null;
    await mudarBase(idosoId, (base) => {
      semOMotivo = !podeCitar && citaSegredo(base, mensagem);
      const textoDoAviso = semOMotivo ? avisoSemMotivo(tipo, base.idoso.nome) : mensagem;
      const alerta = criarAlerta(base, { tipo, gravidade, texto: textoDoAviso, origem: 'assistente' }, agora);
      // Aviso urgente com a ligação aberta abre o convite pra família entrar.
      const convidada = gravidade === 'urgente' ? abrirConvite(base, 'urgente', tipo, agora) : null;
      if (convidada) convite = { conversa: { ...convidada }, frase: fraseDoConvite(base) };
      return alerta;
    });
    const aberto = convite as { conversa: Conversa; frase: string } | null;
    if (aberto) depois(() => falar(aberto.conversa, aberto.frase, 'APPEND'));
    const resposta = semOMotivo
      ? 'A família foi avisada sem o motivo, porque o motivo é um assunto que a pessoa pediu segredo. Não mande de novo.'
      : 'A família foi avisada.';
    return aberto ? `${resposta} Ela pode entrar na ligação; a frase pra pessoa já vai ser dita, não repita.` : resposta;
  }

  if (nome === 'chamar_familia') {
    let convite: { conversa: Conversa; frase: string } | null = null;
    let nomeDaFamilia = 'a família';
    await mudarBase(idosoId, (base) => {
      nomeDaFamilia = base.idoso.familiar.nome;
      const convidada = abrirConvite(base, 'pedido', undefined, agora);
      if (!convidada) return null;
      criarAlerta(
        base,
        { tipo: 'ligacao', gravidade: 'atencao', texto: `Pediu pra falar com você agora, na ligação com a ${NOME_DA_ASSISTENTE}.`, origem: 'assistente' },
        agora,
      );
      convite = { conversa: { ...convidada }, frase: fraseDoConvite(base) };
      return null;
    });
    const aberto = convite as { conversa: Conversa; frase: string } | null;
    if (!aberto) return `${nomeDaFamilia} já foi chamada nesta ligação, ou a ligação não deixa chamar agora. Diga com calma que o recado fica no resumo.`;
    depois(() => falar(aberto.conversa, aberto.frase, 'APPEND'));
    return `Chamei ${nomeDaFamilia}. A frase pra pessoa já vai ser dita; não repita, só siga a conversa com calma.`;
  }

  if (nome === 'resumir_conversa') {
    const resumo = texto(a.resumo, 600);
    if (!resumo) return 'Resumo não guardado: faltou o texto.';
    let cortou = false;
    await mudarBase(idosoId, (base) => {
      const limpo = resumoSemSegredo(base, resumo);
      cortou = limpo.cortou;
      return resumirConversa(base, limpo.resumo);
    });
    return cortou ? 'Resumo guardado sem a parte que a pessoa pediu segredo.' : 'Resumo guardado.';
  }

  throw new FerramentaDesconhecida(`Ação desconhecida: ${nome}`);
}

// O aviso da assistente vem em terceira pessoa ("disse que não quer mais viver"), e as
// regras fixas leem a fala em primeira. Isto pega o risco do jeito que ela escreve.
const RISCO_NO_AVISO =
  /\b(nao (quer|quero|queria) mais viver|(quer|queria|quero) morrer|vontade de morrer|(se|me) matar|suicid\w*|tirar a (propria )?vida|acabar com a (propria )?vida|melhor sem (ela|ele|mim)|nao acordar mais|caiu|cai|caido|caida|queda|tombo|escorreg\w*|bat(eu|i) (o|a|com o|com a) (cabeca|joelho|perna|braco|quadril|bacia|costas|testa|rosto|ombro)|no chao|machuc\w*|desmai\w*|sangr\w*|dor no peito|falta de ar|remedio a mais|dose dupla|duas vezes o remedio|golpe|senha|pix|cartao)\b/;

/** O aviso que vai pra família quando o que a assistente escreveu citava o segredo. */
function avisoSemMotivo(tipo: TipoDeAlerta, nome: string): string {
  if (tipo === 'humor') return `${nome} disse na conversa de hoje que está triste. Vale ligar pra conversar.`;
  if (tipo === 'saude') return `${nome} falou de um incômodo de saúde na conversa de hoje. Vale ligar pra saber como está.`;
  if (tipo === 'remedio') return `Apareceu uma dúvida sobre o remédio na conversa de hoje com ${nome}. Vale ligar pra conferir.`;
  return `Vale ligar pra ${nome} hoje.`;
}
