// Leitura multimodal em memória de exames, pedidos de consulta e receitas anexados
// pela família (foto JPEG/PNG/WebP ou PDF). O arquivo original é processado pelo
// Gemini 2.5 Flash e descartado na hora — salvamos apenas o resumo estruturado sem
// CPF/RG e em linguagem simples, respeitando privacidade (LGPD) e segurança clínica
// (nunca dá diagnóstico nem altera dose de remédio).

import type { Base, DocumentoClinico, TipoDeDocumento } from './tipos';

export interface CompromissoExtraido {
  texto: string;
  data: string;
  hora?: string;
}

export interface ResultadoDaLeituraDeDocumento {
  titulo: string;
  tipo: TipoDeDocumento;
  data?: string;
  resumoSimples: string;
  orientacao?: string;
  compromissos: CompromissoExtraido[];
}

const MIME_ACEITOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
export const TAMANHO_MAXIMO_BYTES = 6 * 1024 * 1024;
// O mesmo modelo da leitura do fim da ligação (variável LIA_MODELO_EXTRACAO na Vercel).
// O gemini-2.5-flash responde 404 nesta chave (21/11).
const MODELO_DOCUMENTOS = () => process.env.LIA_MODELO_EXTRACAO?.trim() || 'gemini-3.1-flash-lite';
const TIMEOUT_MS = 18_000;

export function mimeAceito(mime: string): boolean {
  const normalizado = mime.toLowerCase().trim();
  return MIME_ACEITOS.has(normalizado === 'image/jpg' ? 'image/jpeg' : normalizado);
}

/**
 * Valida a assinatura binária (magic bytes) do arquivo em memória para impedir
 * spoof de Content-Type e suportar celulares que enviam MIME vazio ou image/jpg.
 */
export function detectarMimeReal(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  // PDF: %PDF-
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  return null;
}

/** Remove CPF, RG e sequências longas de documentos antes de guardar qualquer texto. */
export function limparDadosSensiveis(texto: string): string {
  return texto
    .replace(/\b(?:cpf|rg|cns|cart[aã]o\s+sus)\s*[:#-]?\s*[\d.\-/]+/gi, '[documento oculto]')
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[documento oculto]')
    .replace(/\s+/g, ' ')
    .trim();
}

function tipoValido(valor: unknown): TipoDeDocumento {
  if (valor === 'exame' || valor === 'consulta' || valor === 'receita') return valor;
  return 'exame';
}

function dataIsoValida(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const m = valor.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : undefined;
}

function horaValida(valor: unknown): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const m = valor.trim().match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return m ? `${m[1]}:${m[2]}` : undefined;
}

/**
 * Lê uma foto ou PDF de exame/consulta/receita em memória com o Gemini 2.5 Flash
 * e devolve apenas resumo estruturado em português simples (sem diagnóstico).
 */
export async function analisarDocumentoClinico(entrada: {
  base64: string;
  mimeType: string;
  nomeDoArquivo?: string;
  notaDaFamilia?: string;
}): Promise<ResultadoDaLeituraDeDocumento | null> {
  const chave = (process.env.LIA_GEMINI_KEY || process.env.GEMINI_API_KEY)?.trim();
  if (!chave || !mimeAceito(entrada.mimeType)) return null;

  const nota = entrada.notaDaFamilia?.trim().slice(0, 240);
  const prompt = `Você ajuda uma assistente virtual de voz (Dona Leda) a organizar exames, consultas e receitas de um idoso a pedido da família.
Analise a imagem ou PDF anexado e devolva APENAS JSON válido neste formato:
{
  "titulo": "nome curto e claro do exame, consulta ou receita (máx 80 caracteres)",
  "tipo": "exame" | "consulta" | "receita",
  "data": "AAAA-MM-DD se houver data do exame ou consulta, senão null",
  "resumoSimples": "explicação em 2 a 3 frases curtas de português muito simples, traduzindo só o que está escrito no documento (ex.: quais taxas foram medidas ou o que está agendado). NUNCA dê diagnóstico médico, NUNCA prescreva ou mude dose, e termine lembrando que o médico avalia o resultado.",
  "orientacao": "preparo ou recomendação explícita escrita no documento (ex.: jejum de 8h, levar exames anteriores), ou null",
  "compromissos": [
    { "texto": "consulta ou exame agendado com especialidade/local", "data": "AAAA-MM-DD", "hora": "HH:MM opcional" }
  ]
}
Regras obrigatórias de privacidade e segurança:
- NUNCA inclua CPF, RG, CNS, endereço, telefone ou nome completo do paciente.
- Se o documento estiver ilegível, informe isso no resumoSimples sem inventar nenhum valor.
${nota ? `Observação da família sobre este anexo: "${nota}"` : ''}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_DOCUMENTOS()}:generateContent`;
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: entrada.mimeType, data: entrada.base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 700,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!resposta.ok) return null;
    const corpo = (await resposta.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const texto = corpo.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    if (!texto.trim()) return null;

    const bruto = JSON.parse(texto) as {
      titulo?: unknown;
      tipo?: unknown;
      data?: unknown;
      resumoSimples?: unknown;
      orientacao?: unknown;
      compromissos?: unknown;
    };

    const titulo = limparDadosSensiveis(
      typeof bruto.titulo === 'string' && bruto.titulo.trim()
        ? bruto.titulo
        : entrada.nomeDoArquivo?.replace(/\.[^.]+$/, '') || 'Documento de saúde',
    ).slice(0, 90);

    const resumoSimples = limparDadosSensiveis(
      typeof bruto.resumoSimples === 'string' ? bruto.resumoSimples : '',
    ).slice(0, 480);

    if (!resumoSimples) return null;

    const orientacao =
      typeof bruto.orientacao === 'string' && bruto.orientacao.trim()
        ? limparDadosSensiveis(bruto.orientacao).slice(0, 220)
        : undefined;

    const compromissos: CompromissoExtraido[] = [];
    if (Array.isArray(bruto.compromissos)) {
      for (const item of bruto.compromissos.slice(0, 4)) {
        if (!item || typeof item !== 'object') continue;
        const c = item as { texto?: unknown; data?: unknown; hora?: unknown };
        const data = dataIsoValida(c.data);
        const desc = typeof c.texto === 'string' ? limparDadosSensiveis(c.texto).slice(0, 140) : '';
        if (data && desc) {
          compromissos.push({ texto: desc, data, hora: horaValida(c.hora) });
        }
      }
    }

    return {
      titulo,
      tipo: tipoValido(bruto.tipo),
      data: dataIsoValida(bruto.data),
      resumoSimples,
      ...(orientacao ? { orientacao } : {}),
      compromissos,
    };
  } catch {
    return null;
  }
}

/** Formata os exames/documentos recentes pro prompt da Dona Leda (máximo 5 mais novos). */
export function blocoDeDocumentos(base: Base): string {
  const docs: DocumentoClinico[] = [...(base.documentos ?? [])].slice(-5).reverse();
  if (docs.length === 0) return '';
  return docs
    .map((d) => {
      const data = d.data ? ` (${d.data})` : '';
      const orientacao = d.orientacao ? ` Preparo/nota: ${d.orientacao}.` : '';
      return `- [${d.tipo.toUpperCase()}] ${d.titulo}${data}: ${d.resumoSimples}${orientacao}`;
    })
    .join('\n');
}
