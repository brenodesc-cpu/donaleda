// O app nativo (Android/iOS) do idoso registra aqui o token de push (FCM ou APNs VoIP)
// para receber chamadas via Agora Signaling + Offline Push mesmo com o app fechado.

import { NextResponse } from 'next/server';
import { mudarBase, registrarAparelhoPush } from '@/lib/dados';
import { exigirAparelho } from '@/lib/sessao';
import { usuarioAgoraRtm } from '@/lib/sinalizacaoChamada';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;

  let corpo: { plataforma?: unknown; token?: unknown };
  try {
    corpo = (await request.json()) as { plataforma?: unknown; token?: unknown };
  } catch {
    return NextResponse.json({ ok: false, erro: 'json' }, { status: 400 });
  }

  const plataforma =
    corpo.plataforma === 'android' || corpo.plataforma === 'ios' ? corpo.plataforma : null;
  const token = typeof corpo.token === 'string' ? corpo.token.trim() : '';

  if (!plataforma || token.length < 16 || token.length > 512) {
    return NextResponse.json({ ok: false, erro: 'dados_invalidos' }, { status: 400 });
  }

  const agoraRtmUserId = usuarioAgoraRtm(aparelho.valor);
  await mudarBase(aparelho.valor, (base) =>
    registrarAparelhoPush(base, { plataforma, token, agoraRtmUserId }),
  );

  return NextResponse.json({ ok: true, agoraRtmUserId });
}
