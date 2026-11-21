// Pós-processamento automático ao encerrar uma conversa.
// Garante que ficha do dia, lembranças e resumo sejam atualizados mesmo quando
// a IA não disparou /api/mcp durante a ligação ou a chamada terminou antes da despedida.
// Privacidade (CLAUDE.md regra 3): as falas recebidas são processadas apenas em memória
// e NUNCA são gravadas no banco; qualquer segredo é filtrado por resumoSemSegredo/motivoDeRecusa.

import { aplicarBemEstar, criarAlerta, type BemEstar } from './dados';
import { dataPedida, GAVETAS, guardar, horaPedida, resumoSemSegredo } from './memoria';
import { avaliarFala } from './regras';
import type {
  Alimentacao,
  Base,
  CategoriaDeLembranca,
  FalaDaSessao,
  Humor,
  Remedio,
  Sono,
} from './tipos';

const SONO: readonly Sono[] = ['bem', 'mais_ou_menos', 'mal'];
const ALIMENTACAO: readonly Alimentacao[] = ['comeu_bem', 'comeu_pouco', 'nao_comeu'];
const REMEDIO: readonly Remedio[] = ['tomou', 'nao_tomou', 'nao_confirmou'];
const HUMOR: readonly Humor[] = ['bem', 'triste', 'ansioso', 'sozinho', 'irritado'];

export interface ExtracaoDaConversa {
  bemEstar?: BemEstar;
  lembrancas?: Array<{
    texto: string;
    categoria: CategoriaDeLembranca;
    sobre?: string;
    data?: string;
    hora?: string;
    reservada?: boolean;
  }>;
  resumo?: string;
}

function escolha<T extends string>(valor: unknown, opcoes: readonly T[]): T | undefined {
  return typeof valor === 'string' && (opcoes as readonly string[]).includes(valor)
    ? (valor as T)
    : undefined;
}

function textoLimpo(valor: unknown, limite: number): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpo = valor.trim().replace(/\s+/g, ' ');
  return limpo ? limpo.slice(0, limite) : undefined;
}

/** Sanitiza o payload recebido do navegador antes de qualquer uso. */
export function limparFalasDaSessao(entrada: unknown): FalaDaSessao[] {
  if (!Array.isArray(entrada)) return [];
  const limpas: FalaDaSessao[] = [];
  for (const item of entrada.slice(-60)) {
    if (!item || typeof item !== 'object') continue;
    const { quem, texto } = item as Record<string, unknown>;
    if (quem !== 'idoso' && quem !== 'assistente') continue;
    const t = textoLimpo(texto, 400);
    if (!t) continue;
    limpas.push({ quem, texto: t });
  }
  return limpas;
}

/** Valida e sanitiza a resposta JSON retornada pelo extrator de IA. */
export function validarExtracao(bruto: unknown): ExtracaoDaConversa {
  if (!bruto || typeof bruto !== 'object') return {};
  const obj = bruto as Record<string, unknown>;
  const resultado: ExtracaoDaConversa = {};

  if (obj.bemEstar && typeof obj.bemEstar === 'object') {
    const b = obj.bemEstar as Record<string, unknown>;
    const dor =
      typeof b.dor === 'number' && Number.isFinite(b.dor) ? Math.round(b.dor) : undefined;
    const parcial: BemEstar = {
      sono: escolha(b.sono, SONO),
      alimentacao: escolha(b.alimentacao, ALIMENTACAO),
      remedio: escolha(b.remedio, REMEDIO),
      dor,
      ondeDoi: textoLimpo(b.ondeDoi, 80),
      humor: escolha(b.humor, HUMOR),
      saiuDeCasa: typeof b.saiuDeCasa === 'boolean' ? b.saiuDeCasa : undefined,
      falouComAlguem: typeof b.falouComAlguem === 'boolean' ? b.falouComAlguem : undefined,
      observacao: textoLimpo(b.observacao, 240),
    };
    if (Object.values(parcial).some((v) => v !== undefined)) {
      resultado.bemEstar = parcial;
    }
  }

  if (Array.isArray(obj.lembrancas)) {
    const validas = obj.lembrancas
      .slice(0, 8)
      .map((l) => {
        if (!l || typeof l !== 'object') return null;
        const item = l as Record<string, unknown>;
        const frase = textoLimpo(item.texto, 240);
        if (!frase) return null;
        return {
          texto: frase,
          categoria: escolha(item.categoria, GAVETAS) ?? 'historia',
          sobre: textoLimpo(item.sobre, 60),
          data: textoLimpo(item.data, 40),
          hora: textoLimpo(item.hora, 20),
          reservada: typeof item.reservada === 'boolean' ? item.reservada : undefined,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (validas.length > 0) resultado.lembrancas = validas;
  }

  const resumo = textoLimpo(obj.resumo, 600);
  if (resumo) resultado.resumo = resumo;

  return resultado;
}

/**
 * Aplica de forma pura e segura na Base os fatos extraídos no fim da conversa.
 * - Passa todas as falas do idoso pelas regras fixas (caso alguma tenha escapado).
 * - Não sobrescreve resumo que o MCP já tenha gravado.
 * - Filtra segredos e dados proibidos antes de salvar lembranças e resumo.
 */
export function aplicarExtracaoNaBase(
  base: Base,
  conversaId: string,
  falas: FalaDaSessao[],
  extracao: ExtracaoDaConversa,
  agora: Date = new Date(),
): { aplicouAlgo: boolean } {
  let aplicouAlgo = false;

  // 1. Garante que toda fala do idoso passou pelas regras determinísticas de segurança.
  const falasDoIdoso = falas.filter((f) => f.quem === 'idoso');
  const conversa = base.conversas.find((c) => c.id === conversaId);
  if (conversa && falasDoIdoso.length > conversa.falasDoIdoso) {
    conversa.falasDoIdoso = falasDoIdoso.length;
    aplicouAlgo = true;
  }
  for (const fala of falasDoIdoso) {
    const alerta = avaliarFala(fala.texto);
    if (alerta) {
      criarAlerta(base, { ...alerta, origem: 'regra' }, agora);
      aplicouAlgo = true;
    }
  }

  // 2. Aplica campos de bem-estar extraídos (sem sobrescrever dados já gravados hoje).
  if (extracao.bemEstar) {
    aplicarBemEstar(base, extracao.bemEstar, agora);
    aplicouAlgo = true;
  }

  // 3. Guarda novas lembranças relevantes (passando por motivoDeRecusa e deduplicação).
  for (const item of extracao.lembrancas ?? []) {
    const r = guardar(
      base,
      {
        texto: item.texto,
        categoria: item.categoria,
        sobre: item.sobre,
        data: dataPedida(item.data, agora),
        hora: horaPedida(item.hora),
        reservada: item.reservada,
        origem: 'conversa',
      },
      agora,
    );
    if (r.ok && !r.jaExistia) aplicouAlgo = true;
  }

  // 4. Salva o resumo apenas se a conversa ainda não tiver um resumo salvo pelo MCP.
  if (extracao.resumo && conversa && !conversa.resumo) {
    const limpo = resumoSemSegredo(base, extracao.resumo);
    conversa.resumo = limpo.resumo.trim().slice(0, 600);
    aplicouAlgo = true;
  }

  return { aplicouAlgo };
}

/**
 * Chama o Gemini Flash em texto (REST API oficial, sem nova dependência) pra extrair
 * ficha do dia, lembranças e resumo a partir das falas efêmeras em memória.
 */
export async function extrairConhecimentoComIA(
  tratamento: string,
  falas: FalaDaSessao[],
  fetchImpl: typeof fetch = fetch,
): Promise<ExtracaoDaConversa> {
  const chave = (process.env.LIA_GEMINI_KEY || process.env.GEMINI_API_KEY || '').trim();
  const falasDoIdoso = falas.filter((f) => f.quem === 'idoso');
  if (!chave || falasDoIdoso.length === 0) return {};

  const dialogo = falas
    .map((f) => `${f.quem === 'idoso' ? tratamento : 'Dona Leda'}: ${f.texto}`)
    .join('\n');

  const prompt = [
    `Você analisa o encerramento de uma ligação da assistente virtual Dona Leda com ${tratamento}.`,
    'Extraia APENAS fatos explicitamente ditos pelo idoso na conversa abaixo. Nunca invente nada.',
    'Devolva SOMENTE um JSON válido com as chaves opcionais:',
    '{',
    '  "bemEstar": {',
    '    "sono": "bem" | "mais_ou_menos" | "mal",',
    '    "alimentacao": "comeu_bem" | "comeu_pouco" | "nao_comeu",',
    '    "remedio": "tomou" | "nao_tomou" | "nao_confirmou",',
    '    "dor": 0..10,',
    '    "ondeDoi": "string",',
    '    "humor": "bem" | "triste" | "ansioso" | "sozinho" | "irritado",',
    '    "saiuDeCasa": true | false,',
    '    "falouComAlguem": true | false,',
    '    "observacao": "frase curta com sintoma/fato importante do dia (ex.: relatou hipoglicemia)"',
    '  },',
    '  "lembrancas": [',
    '    { "texto": "frase em 3ª pessoa", "categoria": "pessoa|saude|dificuldade|rotina|gosto|historia|humor|compromisso", "sobre": "opcional", "data": "como dito", "hora": "como dito", "reservada": false }',
    '  ],',
    '  "resumo": "resumo acolhedor de 2 frases em português do Brasil para a família, omitindo qualquer assunto que o idoso pediu segredo (exceto risco/emergência)."',
    '}',
    'Omita campos que o idoso não mencionou. Nunca inclua senhas, dados bancários ou CPF.',
    '',
    'Conversa:',
    dialogo,
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const resposta = await fetchImpl(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': chave,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 600,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      },
    );
    if (!resposta.ok) return {};
    const dados = (await resposta.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const textoJson = dados.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textoJson) return {};
    return validarExtracao(JSON.parse(textoJson));
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}
