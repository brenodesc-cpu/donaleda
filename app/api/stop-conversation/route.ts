import { NextResponse } from 'next/server';
import { StopConversationRequest } from '@/types/conversation';
import { avisarFimDaLigacao, pararAssistente } from '@/lib/pararAssistente';
import { exigirAparelho } from '@/lib/sessao';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';

export async function POST(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;

  try {
    const body = (await request.json()) as StopConversationRequest & {
      acao?: 'encerrar' | 'avisar_fim';
      channel_name?: string;
    };
    const { agent_id, acao = 'encerrar', channel_name = '' } = body;

    if (!agent_id) {
      return NextResponse.json(
        { error: 'agent_id is required' },
        { status: 400 },
      );
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.NEXT_AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate) {
      throw new Error(
        'Missing Agora configuration. Set NEXT_PUBLIC_AGORA_APP_ID and NEXT_AGORA_APP_CERTIFICATE.',
      );
    }

    if (acao === 'avisar_fim') {
      const resultado = await avisarFimDaLigacao(appId, appCertificate, agent_id, channel_name);
      if (resultado === 'avisou') return NextResponse.json({ success: true, via: 'think' });
      if (resultado === 'ja_tinha_saido') return NextResponse.json({ success: true, state: 'already-stopping' });
      return NextResponse.json({ success: false, via: 'ignorado' });
    }

    // Pede a saída nos dois endereços da Agora: o do Gemini e o de três peças.
    const resultado = await pararAssistente(appId, appCertificate, agent_id);
    return NextResponse.json(
      resultado === 'parou' ? { success: true } : { success: true, state: 'already-stopping' },
    );
  } catch (error) {
    console.error('Error stopping conversation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to stop conversation',
      },
      { status: 500 },
    );
  }
}
