// O painel da família lê tudo daqui e manda as ações dele por aqui: marcar aviso
// como visto, pedir uma ligação agora, trocar as horas das ligações, gerar o
// código do aparelho e mudar o perfil. Tudo por idoso, só pra quem acompanha ele.
// A conversa inteira não existe no servidor, então não tem como sair por aqui.

import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { marcarAvisoVisto, registrarDesfecho, respostaValida } from '@/lib/avisos';
import { arrumarHorarios, avancarChamadas, chamadaTocando, pedirChamadaDaFamilia } from '@/lib/chamadas';
import { conviteAberto, fraseDaEntrada, registrarEntrada } from '@/lib/convite';
import {
  apagarDocumento,
  definirRedeDeApoio,
  montarPainel,
  mudarBase,
  mudarBaseQuando,
  registrarAparelhoFamiliaPush,
  registrarEscalonamento,
} from '@/lib/dados';
import { depois, entradaDaFamilia, falar, tirarAssistente } from '@/lib/familiaNaLigacao';
import { apagarAnexosDeDocumento } from '@/lib/documentos';
import { dataPedida, GAVETAS, guardar, horaPedida, mudar } from '@/lib/memoria';
import {
  dispararConviteDeChamada,
  dispararEscalonamentoEmMassa,
} from '@/lib/sinalizacaoChamada';
import { exigirIdosoDaFamilia } from '@/lib/sessao';
import { clienteDoServidor } from '@/lib/supabase/servidor';
import type { AcaoDaFamilia, CodigoDoAparelho } from '@/lib/tipos';

export const dynamic = 'force-dynamic';

const TRINTA_MINUTOS = 30 * 60 * 1000;
const APARELHO_ONLINE_MS = 35_000;

export async function GET(request: Request) {
  const pedido = new URL(request.url).searchParams.get('idoso');
  const conferido = await exigirIdosoDaFamilia(pedido);
  if (!conferido.ok) return conferido.resposta;

  const agora = new Date();
  const [painelRes, aparelhosRes] = await Promise.all([
    mudarBaseQuando(conferido.valor.idosoId, (base) => {
      const antesId = chamadaTocando(base)?.id ?? null;
      const { mudou, escalarChamada } = avancarChamadas(base, agora);
      const depoisChamada = chamadaTocando(base);
      const novaChamada = depoisChamada && depoisChamada.id !== antesId ? depoisChamada : null;
      return {
        gravar: mudou,
        resultado: {
          painel: montarPainel(base, agora),
          novaChamada,
          aparelhosPush: novaChamada ? base.aparelhosPush : undefined,
          escalarChamada,
          baseSnapshot: escalarChamada ? structuredClone(base) : null,
        },
      };
    }),
    clienteDoServidor()
      .from('aparelhos')
      .select('visto_em')
      .eq('idoso_id', conferido.valor.idosoId)
      .order('visto_em', { ascending: false })
      .limit(1),
  ]);

  if (painelRes.novaChamada) {
    const nova = painelRes.novaChamada;
    const aparelhos = painelRes.aparelhosPush;
    depois(() => dispararConviteDeChamada(conferido.valor.idosoId, aparelhos, nova));
  }

  let painel = painelRes.painel;
  if (painelRes.escalarChamada && painelRes.baseSnapshot) {
    const esc = await dispararEscalonamentoEmMassa(
      conferido.valor.idosoId,
      painelRes.baseSnapshot,
      painelRes.escalarChamada,
      agora,
    );
    painel = await mudarBase(conferido.valor.idosoId, (base) => {
      registrarEscalonamento(base, esc);
      return montarPainel(base, agora);
    });
  }

  const vistoEm = (aparelhosRes.data?.[0]?.visto_em as string | null | undefined) ?? null;
  const aparelhoOnline =
    vistoEm !== null && agora.getTime() - new Date(vistoEm).getTime() <= APARELHO_ONLINE_MS;

  return NextResponse.json(
    { ...painel, aparelhoOnline, aparelhoVistoEm: vistoEm },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

function texto(valor: unknown, limite: number): string | undefined {
  if (typeof valor !== 'string') return undefined;
  const limpo = valor.trim().replace(/\s+/g, ' ');
  return limpo ? limpo.slice(0, limite) : undefined;
}

function remediosValidos(valor: unknown): { nome: string; horario: string }[] | undefined {
  if (!Array.isArray(valor)) return undefined;
  return valor
    .map((r) => ({ nome: texto(r?.nome, 80), horario: texto(r?.horario, 20) ?? '' }))
    .filter((r): r is { nome: string; horario: string } => Boolean(r.nome))
    .slice(0, 12);
}

async function gerarCodigo(idosoId: string, userId: string): Promise<CodigoDoAparelho | null> {
  const banco = clienteDoServidor();
  // Um código ativo por idoso: o novo substitui o anterior.
  await banco.from('codigos').delete().eq('idoso_id', idosoId).is('usado_em', null);
  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const codigo = String(randomInt(0, 1_000_000)).padStart(6, '0');
    // Código igual que já venceu ou foi usado sai da frente.
    await banco
      .from('codigos')
      .delete()
      .eq('codigo', codigo)
      .or(`usado_em.not.is.null,expira_em.lt.${new Date().toISOString()}`);
    const expiraEm = new Date(Date.now() + TRINTA_MINUTOS).toISOString();
    const { error } = await banco
      .from('codigos')
      .insert({ codigo, idoso_id: idosoId, criado_por: userId, expira_em: expiraEm });
    if (!error) return { codigo, expiraEm };
    if (error.code !== '23505') return null;
  }
  return null;
}

export async function POST(request: Request) {
  let acao: AcaoDaFamilia;
  try {
    acao = (await request.json()) as AcaoDaFamilia;
  } catch {
    return NextResponse.json({ ok: false, erro: 'json' }, { status: 400 });
  }
  if (!acao || typeof acao !== 'object') {
    return NextResponse.json({ ok: false, erro: 'acao' }, { status: 400 });
  }

  const conferido = await exigirIdosoDaFamilia(
    typeof acao.idosoId === 'string' ? acao.idosoId : null,
  );
  if (!conferido.ok) return conferido.resposta;
  const { idosoId, familia } = conferido.valor;

  if (acao.acao === 'visto' && typeof acao.alertaId === 'string') {
    const achou = await mudarBase(idosoId, (base) => {
      const alerta = base.alertas.find((a) => a.id === acao.alertaId);
      if (alerta) marcarAvisoVisto(alerta, familia.nome ?? '');
      return Boolean(alerta);
    });
    return NextResponse.json({ ok: achou }, { status: achou ? 200 : 404 });
  }

  if (acao.acao === 'desfecho' && typeof acao.alertaId === 'string') {
    if (!respostaValida(acao.resposta)) {
      return NextResponse.json({ ok: false, erro: 'resposta' }, { status: 400 });
    }
    const resposta = acao.resposta;
    const alerta = await mudarBase(idosoId, (base) => {
      const achado = base.alertas.find((a) => a.id === acao.alertaId);
      if (achado) registrarDesfecho(achado, resposta, acao.nota, familia.nome ?? '');
      return achado ?? null;
    });
    if (!alerta) return NextResponse.json({ ok: false, erro: 'nao_achei' }, { status: 404 });
    return NextResponse.json({ ok: true, alerta });
  }

  if (acao.acao === 'ligar') {
    const resultado = await mudarBase(idosoId, (base) => {
      const chamada = pedirChamadaDaFamilia(base);
      return chamada ? { chamada, aparelhosPush: base.aparelhosPush } : null;
    });
    // 409: já está tocando ou os dois já estão conversando.
    if (!resultado) return NextResponse.json({ ok: false, erro: 'ocupado' }, { status: 409 });
    await dispararConviteDeChamada(idosoId, resultado.aparelhosPush, resultado.chamada);
    return NextResponse.json({ ok: true, chamada: resultado.chamada });
  }

  if (acao.acao === 'horarios') {
    const horarios = arrumarHorarios(acao.horarios);
    await mudarBase(idosoId, (base) => {
      base.idoso.horariosDeLigacao = horarios;
    });
    return NextResponse.json({ ok: true, horarios });
  }

  if (acao.acao === 'atender_sozinho' && typeof acao.ligado === 'boolean') {
    await mudarBase(idosoId, (base) => {
      base.idoso.atenderSozinho = acao.ligado;
    });
    return NextResponse.json({ ok: true });
  }

  if (acao.acao === 'ensinar') {
    const r = await mudarBase(idosoId, (base) =>
      guardar(
        base,
        {
          texto: String(acao.texto ?? ''),
          categoria: GAVETAS.includes(acao.categoria) ? acao.categoria : 'historia',
          sobre: typeof acao.sobre === 'string' ? acao.sobre : undefined,
          data: dataPedida(typeof acao.data === 'string' ? acao.data : undefined),
          hora: horaPedida(typeof acao.hora === 'string' ? acao.hora : undefined),
          origem: 'familia',
        },
      ),
    );
    if (!r.ok) return NextResponse.json({ ok: false, erro: 'recusada', motivo: r.motivo }, { status: 422 });
    return NextResponse.json({ ok: true, lembranca: r.lembranca });
  }

  if (acao.acao === 'corrigir_lembranca' || acao.acao === 'apagar_lembranca') {
    const lembrancaId = typeof acao.lembrancaId === 'string' ? acao.lembrancaId : '';
    const r = await mudarBase(idosoId, (base) => {
      // A família não vê nem mexe no que o idoso pediu pra guardar só com a assistente.
      const alvo = base.lembrancas.find((l) => l.id === lembrancaId);
      if (!alvo || alvo.reservada) return { ok: false as const, motivo: 'não achei essa lembrança' };
      return acao.acao === 'apagar_lembranca'
        ? mudar(base, { id: lembrancaId }, { acao: 'esquecer' })
        : mudar(base, { id: lembrancaId }, {
            acao: 'corrigir',
            texto: typeof acao.texto === 'string' ? acao.texto : undefined,
            categoria: acao.categoria && GAVETAS.includes(acao.categoria) ? acao.categoria : undefined,
            sobre: typeof acao.sobre === 'string' ? acao.sobre : undefined,
            data: typeof acao.data === 'string' ? (dataPedida(acao.data) ?? '') : undefined,
            hora: typeof acao.hora === 'string' ? (horaPedida(acao.hora) ?? '') : undefined,
            // A família corrigiu ou tocou em "Está certo": o que era dedução vira fato.
            por: 'familia',
          });
    });
    if (!r.ok) return NextResponse.json({ ok: false, erro: r.motivo.startsWith('não achei') ? 'nao_achada' : 'recusada', motivo: r.motivo }, { status: r.motivo.startsWith('não achei') ? 404 : 422 });
    return NextResponse.json({ ok: true, lembranca: r.lembranca });
  }

  if (acao.acao === 'entrar_na_ligacao') {
    // Só entra com convite aberto (aviso urgente ou pedido do idoso) e a ligação ainda aberta.
    // Só devolve a chave RTC aqui: a Dona Leda permanece na sala segurando a ligação do idoso
    // até o navegador da família confirmar `familia_conectada` (isConnected === true na Agora).
    const aberto = await mudarBaseQuando(idosoId, (base) => ({
      gravar: false,
      resultado: conviteAberto(base, new Date()),
    }));
    if (!aberto?.conversa.canal) {
      return NextResponse.json({ ok: false, erro: 'sem_convite' }, { status: 409 });
    }
    const entrada = entradaDaFamilia(aberto.conversa.canal);
    return NextResponse.json({ ok: true, ...entrada });
  }

  if (acao.acao === 'familia_conectada') {
    // A família já está conectada na sala RTC com o idoso: anuncia a entrada e retira a Dona Leda.
    const achada = await mudarBase(idosoId, (base) => {
      const entrada = registrarEntrada(base, new Date());
      return entrada ? { conversa: { ...entrada.conversa }, primeira: entrada.primeira, frase: fraseDaEntrada(base) } : null;
    });
    if (!achada) return NextResponse.json({ ok: false, erro: 'sem_convite' }, { status: 409 });
    if (achada.primeira) {
      depois(async () => {
        await falar(achada.conversa, achada.frase, 'INTERRUPT');
        // Uns 6 segundos pra frase terminar antes de a Dona Leda sair da sala.
        await new Promise((r) => setTimeout(r, 6500));
        await tirarAssistente(achada.conversa);
      });
    }
    return NextResponse.json({ ok: true, primeira: achada.primeira });
  }

  if (acao.acao === 'apagar_documento' && typeof acao.documentoId === 'string') {
    const res = await mudarBase(idosoId, (base) => {
      const caminho = (base.documentos ?? []).find((d) => d.id === acao.documentoId)?.arquivoCaminho;
      const apagou = apagarDocumento(base, acao.documentoId);
      return { apagou, caminho };
    });
    if (res.apagou && res.caminho) {
      await apagarAnexosDeDocumento([res.caminho]);
    }
    return NextResponse.json({ ok: res.apagou }, { status: res.apagou ? 200 : 404 });
  }

  if (acao.acao === 'salvar_rede_de_apoio' && Array.isArray(acao.contatos)) {
    const redeDeApoio = await mudarBase(idosoId, (base) => definirRedeDeApoio(base, acao.contatos));
    return NextResponse.json({ ok: true, redeDeApoio });
  }

  if (
    acao.acao === 'registrar_push_familia' &&
    (acao.plataforma === 'android' || acao.plataforma === 'ios') &&
    typeof acao.token === 'string'
  ) {
    const salvou = await mudarBase(idosoId, (base) =>
      registrarAparelhoFamiliaPush(base, acao.plataforma, acao.token),
    );
    return NextResponse.json({ ok: salvou }, { status: salvou ? 200 : 400 });
  }

  if (acao.acao === 'gerar_codigo') {
    const codigo = await gerarCodigo(idosoId, familia.userId);
    if (!codigo) return NextResponse.json({ ok: false, erro: 'codigo' }, { status: 500 });
    return NextResponse.json({ ok: true, ...codigo });
  }

  if (acao.acao === 'perfil') {
    const nome = texto(acao.nome, 120);
    const tratamento = texto(acao.tratamento, 60);
    const idade = typeof acao.idade === 'number' && acao.idade > 0 && acao.idade < 130 ? Math.round(acao.idade) : undefined;
    const remedios = remediosValidos(acao.remedios);
    const familiarNome = texto(acao.familiar?.nome, 80);
    const familiarParentesco = texto(acao.familiar?.parentesco, 40);
    const idoso = await mudarBase(idosoId, (base) => {
      if (nome) base.idoso.nome = nome;
      if (tratamento) base.idoso.tratamento = tratamento;
      if (idade) base.idoso.idade = idade;
      if (remedios) base.idoso.remedios = remedios;
      if (familiarNome && familiarParentesco) {
        base.idoso.familiar = { nome: familiarNome, parentesco: familiarParentesco };
      }
      return base.idoso;
    });
    if (nome) await clienteDoServidor().from('idosos').update({ nome }).eq('id', idosoId);
    return NextResponse.json({ ok: true, idoso });
  }

  return NextResponse.json({ ok: false, erro: 'acao' }, { status: 400 });
}
