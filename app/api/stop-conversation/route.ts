import { NextResponse } from 'next/server';
import { StopConversationRequest } from '@/types/conversation';
import { pararAssistente } from '@/lib/pararAssistente';
import { exigirAparelho } from '@/lib/sessao';

export async function POST(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;

  try {
    const body: StopConversationRequest = await request.json();
    const { agent_id } = body;

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
