import { NextResponse } from 'next/server';
import { AgoraClient, Area, generateConvoAIToken } from 'agora-agents';
import { StopConversationRequest } from '@/types/conversation';
import { exigirAparelho } from '@/lib/sessao';

export const dynamic = 'force-dynamic';
export const preferredRegion = 'iad1';

const INSTRUCAO_DE_DESPEDIDA =
  '[Aviso interno de tempo: falta cerca de um minuto pro limite desta ligação. Não interrompa a pessoa de forma brusca; na sua próxima resposta, valide com carinho o que ela acabou de contar, reforce qualquer combinado importante e encaminhe a despedida com naturalidade, dizendo quando vocês conversam de novo.]';

const FALA_RESERVA_DE_DESPEDIDA =
  'Nossa conversa está ótima, mas já estamos chegando perto do nosso tempinho de hoje. Vamos nos despedindo com calma — já já eu ligo de novo pra gente continuar!';

function isAgentAlreadyStoppingOrStopped(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeErr = error as {
    statusCode?: number;
    body?: { detail?: string; reason?: string };
    message?: string;
  };

  const statusCode = maybeErr.statusCode;
  const reason = maybeErr.body?.reason?.toLowerCase();
  const detail = maybeErr.body?.detail?.toLowerCase() ?? maybeErr.message?.toLowerCase() ?? '';

  if (statusCode === 404) return true;
  if (reason === 'invalidrequest' && detail.includes('already in the process of shutting down')) {
    return true;
  }
  return false;
}

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

    const customerId = process.env.NEXT_AGORA_CUSTOMER_ID?.trim();
    const customerSecret = process.env.NEXT_AGORA_CUSTOMER_SECRET?.trim();

    if (acao === 'avisar_fim') {
      const client =
        customerId && customerSecret
          ? new AgoraClient({ area: Area.US, appId, appCertificate, customerId, customerSecret })
          : new AgoraClient({
              area: Area.US,
              appId,
              appCertificate,
              authToken: generateConvoAIToken({
                appId,
                appCertificate,
                channelName: channel_name,
                uid: 0,
              }),
            });
      try {
        await client.agentManagement.agentThink({
          appid: appId,
          agentId: agent_id,
          text: INSTRUCAO_DE_DESPEDIDA,
          on_listening_action: 'append',
          on_thinking_action: 'append',
          on_speaking_action: 'append',
          interruptable: true,
        });
        return NextResponse.json({ success: true, via: 'think' });
      } catch (erroThink) {
        if (isAgentAlreadyStoppingOrStopped(erroThink)) {
          return NextResponse.json({ success: true, state: 'already-stopping' });
        }
        // Fallback: se o modo atual não aceitar agentThink, anuncia despedida suave via speak APPEND.
        try {
          await client.agents.speak({
            appid: appId,
            agentId: agent_id,
            text: FALA_RESERVA_DE_DESPEDIDA,
            priority: 'APPEND',
            interruptable: true,
          });
          return NextResponse.json({ success: true, via: 'speak' });
        } catch {
          return NextResponse.json({ success: false, via: 'ignorado' });
        }
      }
    }

    // area: change to Area.EU or Area.AP for European or Asia-Pacific deployments.
    const client = new AgoraClient({
      area: Area.US,
      appId,
      appCertificate,
    });
    try {
      await client.stopAgent(agent_id);
    } catch (error) {
      if (isAgentAlreadyStoppingOrStopped(error)) {
        // Treat stop as idempotent: agent is already exiting (or gone).
        return NextResponse.json({ success: true, state: 'already-stopping' });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
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
