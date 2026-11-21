// Começa a conversa no modo direto: o aparelho do idoso fala com o Gemini ao
// vivo sem o motor de conversa da Agora (US$ 0,10 por minuto), e a Agora fica só
// com a sala de áudio. Este pedido abre a conversa na ficha e devolve o passe
// temporário do Google, junto do mesmo modelo, da mesma voz, das mesmas
// instruções e das mesmas ações do modo gemini de /api/invite-agent.
// A chave LIA_GEMINI_KEY nunca sai do servidor. Só liga com ?modo=direto.

import { NextRequest, NextResponse } from 'next/server';
import { abrirConversa, lerBase, mudarBase } from '@/lib/dados';
import { montarAbertura } from '@/lib/direto';
import { FERRAMENTAS } from '@/lib/ferramentas';
import { podeComecarConversa, TETO_NORMAL_MS, tetoDaConversaMs } from '@/lib/limiteDoDia';
import { pedirPasseDoGemini } from '@/lib/passeDoGemini';
import { montarInstrucoes, montarSaudacao, type OrigemDaLigacao } from '@/lib/persona';
import { exigirAparelho } from '@/lib/sessao';
import type { InicioDaConversa } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

/** O mesmo silêncio do modo da Agora: 650 ms por padrão, trocado por LIA_SILENCIO_MS. */
function esperaDeSilencio(): number {
  const pedido = Number(process.env.LIA_SILENCIO_MS);
  return Number.isFinite(pedido) && pedido >= 300 && pedido <= 2000 ? pedido : 650;
}

export async function POST(request: NextRequest) {
  const aparelho = await exigirAparelho(request);
  if (!aparelho.ok) return aparelho.resposta;
  const idosoId = aparelho.valor;

  try {
    const chaveDoGoogle = process.env.LIA_GEMINI_KEY?.trim();
    if (!chaveDoGoogle) {
      return NextResponse.json({ error: 'Falta a variável de ambiente LIA_GEMINI_KEY' }, { status: 503 });
    }

    const body = (await request.json().catch(() => ({}))) as { chamada_id?: string };
    const agora = new Date();
    const base = await lerBase(idosoId);
    // As ações rodam pelo aparelho pareado, em /api/direto/acao, então existem
    // mesmo sem o endereço público que a nuvem da Agora precisa.
    const instrucoes = montarInstrucoes(base, agora, true);
    const chamada = body.chamada_id
      ? base.chamadas.find((c) => c.id === body.chamada_id)
      : undefined;
    const origem: OrigemDaLigacao = chamada ? chamada.motivo : 'idoso';
    // Os minutos de conversa de hoje acabaram: só a ligação pedida pela família passa.
    if (!podeComecarConversa(base, origem, agora)) {
      return NextResponse.json(
        { error: 'limite_do_dia', mensagem: 'Os minutos de conversa de hoje acabaram.' },
        { status: 409 },
      );
    }
    const tetoMs = tetoDaConversaMs(base, origem, TETO_NORMAL_MS, agora);
    const saudacao = montarSaudacao(base, agora, origem);
    const modelo = process.env.LIA_MODELO_GEMINI?.trim() || 'models/gemini-3.8-live';

    const passe = await pedirPasseDoGemini(chaveDoGoogle);
    if (!passe.ok) {
      console.error('[direto] o Google recusou o passe:', passe.status, passe.detalhe);
      return NextResponse.json(
        { error: `O Google recusou o passe (${passe.status})` },
        { status: passe.status === 429 ? 429 : 502 },
      );
    }

    const conversa = await mudarBase(idosoId, (b) => abrirConversa(b, agora, chamada?.id));

    return NextResponse.json({
      // Não tem assistente da Agora na sala, então não tem agent_id pra parar depois.
      agent_id: '',
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
      conversa_id: conversa.id,
      ferramentas: true,
      avatar: false,
      modo: 'direto',
      teto_ms: tetoMs,
      direto: {
        passe: passe.token,
        abertura: montarAbertura({
          modelo,
          voz: process.env.LIA_VOZ_GEMINI?.trim() || 'Leda',
          instrucoes,
          ferramentas: FERRAMENTAS,
          silencioMs: esperaDeSilencio(),
        }),
        saudacao,
        modelo,
        silencioMs: esperaDeSilencio(),
      },
    } satisfies InicioDaConversa);
  } catch (error) {
    console.error('Erro ao começar a conversa direta:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível começar a conversa' },
      { status: 500 },
    );
  }
}
