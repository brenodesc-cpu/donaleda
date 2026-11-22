// Recebe foto (JPEG/PNG/WebP) ou PDF de exame, consulta ou receita anexado pela família,
// lê em memória com o Gemini (sem salvar o arquivo bruto nem CPF/RG), guarda o
// resumo em linguagem simples na ficha do idoso e já agenda compromissos encontrados.

import { NextResponse } from 'next/server';
import { adicionarDocumento, mudarBase } from '@/lib/dados';
import {
  analisarDocumentoClinico,
  detectarMimeReal,
  mimeAceito,
  TAMANHO_MAXIMO_BYTES,
} from '@/lib/documentos';
import { guardar } from '@/lib/memoria';
import { exigirIdosoDaFamilia } from '@/lib/sessao';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';

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
  const leitura = await analisarDocumentoClinico({
    base64: buffer.toString('base64'),
    mimeType: mimeReal,
    nomeDoArquivo: arquivo.name,
    notaDaFamilia,
  });

  if (!leitura) {
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
        titulo: leitura.titulo,
        tipo: leitura.tipo,
        ...(leitura.data ? { data: leitura.data } : {}),
        resumoSimples: leitura.resumoSimples,
        ...(leitura.orientacao ? { orientacao: leitura.orientacao } : {}),
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
          origem: 'familia',
        },
        agora,
      );
      if (r.ok && !r.jaExistia) compromissosCriados += 1;
    }

    return { documento, compromissosCriados };
  });

  return NextResponse.json({ ok: true, ...salvo });
}
