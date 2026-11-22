// O fim da ligação da demonstração: manda a assistente da Agora embora e devolve
// o que a família veria daquela conversa (os avisos e a ficha do dia).
// As falas chegam do aparelho do visitante, são lidas em memória e descartadas:
// nada vai pro banco nem pro registro do servidor. A leitura do Google
// (lib/posConversa.ts) fica de fora de propósito: ela tem cota por dia, e a cota
// é das ligações dos idosos de verdade. Aqui valem as regras fixas e a leitura
// simples das falas de lib/demonstracao.ts, que não chamam serviço nenhum.

import { NextResponse } from 'next/server';
import { AgoraClient, Area } from 'agora-agents';
import { conferirPasseDaFicha, fichaDaDemonstracao } from '@/lib/demonstracao';
import { limparFalasDaSessao } from '@/lib/posConversa';
import type { FichaDaDemonstracao } from '@/lib/tiposDaDemonstracao';

export const dynamic = 'force-dynamic';

async function pararAssistente(agentId: string) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.NEXT_AGORA_APP_CERTIFICATE;
  if (!agentId || !appId || !appCertificate) return;
  try {
    await new AgoraClient({ area: Area.US, appId, appCertificate }).stopAgent(agentId);
  } catch {
    // Já saiu sozinha, ou vai sair quando o visitante deixar a sala.
  }
}

export async function POST(request: Request) {
  const pedido = (await request.json().catch(() => null)) as { passe?: unknown; falas?: unknown } | null;
  const conferido = conferirPasseDaFicha(pedido?.passe);
  if (!conferido) {
    return NextResponse.json({ ok: false } satisfies FichaDaDemonstracao, { status: 403 });
  }
  await pararAssistente(conferido.agentId);
  const falas = limparFalasDaSessao(pedido?.falas);
  const painel = fichaDaDemonstracao(falas, {}, conferido.inicio);
  return NextResponse.json({ ok: true, painel } satisfies FichaDaDemonstracao, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
