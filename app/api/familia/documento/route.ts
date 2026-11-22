// Recebe foto (JPEG/PNG/WebP) ou PDF de exame, consulta ou receita anexado pela família:
// - Lê com Gemini multimodal e extrai resumo simples sem CPF/RG (pro contexto da Dona Leda);
// - Guarda o arquivo original no bucket privado do Supabase Storage (acesso restrito à família)
//   para que o responsável possa revisitar/abrir o anexo direto pelo painel (GET).

import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { adicionarDocumento, lerBase, mudarBase } from '@/lib/dados';
import {
  analisarDocumentoClinico,
  apagarAnexosDeDocumento,
  detectarMimeReal,
  lerAnexoDeDocumento,
  mimeAceito,
  salvarAnexoDeDocumento,
  TAMANHO_MAXIMO_BYTES,
} from '@/lib/documentos';
import { guardar } from '@/lib/memoria';
import { exigirIdosoDaFamilia } from '@/lib/sessao';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const idosoPedido = url.searchParams.get('idoso');
  const documentoId = url.searchParams.get('id')?.trim();
  if (!documentoId) {
    return NextResponse.json({ ok: false, erro: 'sem_id' }, { status: 400 });
  }

  const conferido = await exigirIdosoDaFamilia(idosoPedido);
  if (!conferido.ok) return conferido.resposta;
  const { idosoId } = conferido.valor;

  const base = await lerBase(idosoId);
  const doc = (base.documentos ?? []).find((d) => d.id === documentoId);
  if (!doc?.arquivoCaminho || !doc.arquivoCaminho.startsWith(`${idosoId}/`)) {
    return NextResponse.json({ ok: false, erro: 'anexo_nao_encontrado' }, { status: 404 });
  }

  const anexo = await lerAnexoDeDocumento(
    doc.arquivoCaminho,
    doc.arquivoMime ?? 'application/octet-stream',
  );
  if (!anexo) {
    return NextResponse.json({ ok: false, erro: 'anexo_indisponivel' }, { status: 404 });
  }

  const nomeSeguro = (doc.arquivoNome ?? 'documento').replace(/["\\\r\n]/g, '');
  return new Response(new Uint8Array(anexo.buffer), {
    status: 200,
    headers: {
      'Content-Type': doc.arquivoMime || anexo.mimeType,
      'Content-Disposition': `inline; filename="${nomeSeguro}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, erro: 'formulario_invalido' }, { status: 400 });
  }

  const idosoIdRaw = form.get('idosoId');
  const conferido = await exigirIdosoDaFamilia(
    typeof idosoIdRaw === 'string' && idosoIdRaw.trim() ? idosoIdRaw.trim() : null,
  );
  if (!conferido.ok) return conferido.resposta;
  const { idosoId } = conferido.valor;

  const arquivo = form.get('arquivo');
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ ok: false, erro: 'arquivo_obrigatorio' }, { status: 400 });
  }
  if (arquivo.type && !mimeAceito(arquivo.type)) {
    return NextResponse.json(
      { ok: false, erro: 'formato_nao_suportado', detalhe: 'Envie foto (JPG, PNG, WebP) ou PDF.' },
      { status: 415 },
    );
  }
  if (arquivo.size <= 0 || arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return NextResponse.json(
      { ok: false, erro: 'tamanho_invalido', detalhe: 'O arquivo deve ter até 6 MB.' },
      { status: 413 },
    );
  }

  const notaRaw = form.get('nota');
  const notaDaFamilia = typeof notaRaw === 'string' ? notaRaw.trim().slice(0, 240) : undefined;

  // Valida assinatura binária real (magic bytes) em memória e descarta o buffer após leitura.
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const mimeReal = detectarMimeReal(buffer);
  if (!mimeReal) {
    return NextResponse.json(
      { ok: false, erro: 'formato_nao_suportado', detalhe: 'Envie foto válida (JPG, PNG, WebP) ou PDF.' },
      { status: 415 },
    );
  }
  const documentoId = randomUUID();
  const [leitura, anexoSalvo] = await Promise.all([
    analisarDocumentoClinico({
      base64: buffer.toString('base64'),
      mimeType: mimeReal,
      nomeDoArquivo: arquivo.name,
      notaDaFamilia,
    }),
    salvarAnexoDeDocumento({
      idosoId,
      documentoId,
      buffer,
      mimeType: mimeReal,
      nomeOriginal: arquivo.name,
    }),
  ]);

  if (!leitura) {
    if (anexoSalvo) await apagarAnexosDeDocumento([anexoSalvo.caminho]);
    return NextResponse.json(
      {
        ok: false,
        erro: 'nao_consegui_ler',
        detalhe: 'Não consegui ler esse documento agora. Tente uma foto mais nítida ou um PDF.',
      },
      { status: 422 },
    );
  }

  const agora = new Date();
  const salvo = await mudarBase(idosoId, (base) => {
    const documento = adicionarDocumento(
      base,
      {
        id: documentoId,
        titulo: leitura.titulo,
        tipo: leitura.tipo,
        ...(leitura.data ? { data: leitura.data } : {}),
        resumoSimples: leitura.resumoSimples,
        ...(leitura.orientacao ? { orientacao: leitura.orientacao } : {}),
        ...(anexoSalvo
          ? {
              arquivoCaminho: anexoSalvo.caminho,
              arquivoMime: mimeReal,
              arquivoNome: anexoSalvo.nome,
            }
          : {}),
      },
      agora,
    );

    let compromissosCriados = 0;
    for (const c of leitura.compromissos) {
      const r = guardar(
        base,
        {
          texto: c.texto,
          categoria: 'compromisso',
          data: c.data,
          hora: c.hora,
          origem: 'documento',
        },
        agora,
      );
      if (r.ok && !r.jaExistia) compromissosCriados += 1;
    }

    return { documento, compromissosCriados };
  });

  return NextResponse.json({ ok: true, ...salvo });
}
