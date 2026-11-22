'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { RTMClient } from 'agora-rtm';
import { Phone } from 'lucide-react';
import { BotaoGrande } from '@/components/BotaoGrande';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Rosto } from '@/components/Rosto';
import { conseguirMicrofone, ligarRtm } from '@/hooks/pedidosDaLigacao';
import { useToque } from '@/hooks/useToque';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { FalaDaSessao, PainelDaFamilia } from '@/lib/tipos';
import type {
  FichaDaDemonstracao,
  MotivoDaRecusa,
  RespostaDaDemonstracao,
  SituacaoDaDemonstracao,
} from '@/lib/tiposDaDemonstracao';
import { FichaDoFim } from './FichaDoFim';

// A ligação só existe no navegador.
const ProvedorDaAgora = dynamic(() => import('@/components/ProvedorDaAgora'), { ssr: false });
const LigacaoPelaAgora = dynamic(() => import('./LigacaoPelaAgora'), { ssr: false });
const LigacaoDireta = dynamic(() => import('./LigacaoDireta'), { ssr: false });

type Ligacao = Extract<RespostaDaDemonstracao, { ok: true }>;

type Fase =
  | { tipo: 'inicio' }
  | { tipo: 'ligando' }
  | { tipo: 'conversando'; ligacao: Ligacao; rtm: RTMClient | null }
  | { tipo: 'preparando' }
  | { tipo: 'ficha'; painel: PainelDaFamilia | null }
  | { tipo: 'recusada'; motivo: MotivoDaRecusa }
  | { tipo: 'microfone' }
  | { tipo: 'falhou' };

const TITULO = 'font-titulo text-3xl font-bold text-foreground sm:text-4xl';
const TEXTO = 'text-lg leading-relaxed text-foreground sm:text-xl';
const PRIVACIDADE = 'Nada do que você disser fica guardado. No fim, a tela mostra o que a família veria, e isso some quando você fechar a página.';

const RECUSA: Record<MotivoDaRecusa, { titulo: string; texto: string }> = {
  cheia: {
    titulo: 'A demonstração de hoje está cheia',
    texto: 'Cada ligação tem um custo, então a demonstração tem um limite por dia.',
  },
  rede: {
    titulo: 'A demonstração de hoje está cheia',
    texto: 'Muitas ligações saíram desta rede hoje.',
  },
  visitante: {
    titulo: 'Você já fez as ligações de hoje',
    texto: 'Cada pessoa pode experimentar algumas vezes por dia.',
  },
  desligada: {
    titulo: 'A demonstração está fechada agora',
    texto: 'Ela volta em breve.',
  },
  fora: {
    titulo: `A ${NOME_DA_ASSISTENTE} não conseguiu atender agora`,
    texto: 'Tente de novo em alguns minutos.',
  },
};

/** O vídeo da demonstração, quando o servidor tiver um (LIA_DEMO_VIDEO). */
function Video({ endereco }: { endereco: string }) {
  const youtube = endereco.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (youtube) {
    return (
      <iframe
        title={`A ${NOME_DA_ASSISTENTE} conversando`}
        src={`https://www.youtube-nocookie.com/embed/${youtube[1]}`}
        className="aspect-video w-full rounded-2xl"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <video src={endereco} controls playsInline className="w-full rounded-2xl" />;
}

function pediuModoDireto(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('modo') === 'direto';
  } catch {
    return false;
  }
}

/**
 * A demonstração pública: um botão grande, a ligação de até dois minutos e, no
 * fim, o que a família veria daquela conversa. As falas ficam só neste aparelho
 * até o fim, quando vão uma vez pro servidor montar a ficha e são descartadas.
 */
export function Experimente() {
  const [fase, setFase] = useState<Fase>({ tipo: 'inicio' });
  const [video, setVideo] = useState<string | null>(null);
  const terminou = useRef(false);

  // Antes do toque, a página já diz se a demonstração de hoje encheu.
  useEffect(() => {
    let vivo = true;
    fetch('/api/experimente', { cache: 'no-store' })
      .then((r) => r.json() as Promise<SituacaoDaDemonstracao>)
      .then((situacao) => {
        if (!vivo) return;
        setVideo(situacao.video);
        if (!situacao.aberta) setFase({ tipo: 'recusada', motivo: situacao.motivo ?? 'cheia' });
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);

  useToque(fase.tipo === 'ligando');

  const ligar = useCallback(async () => {
    setFase({ tipo: 'ligando' });
    terminou.current = false;
    if (!(await conseguirMicrofone())) {
      setFase({ tipo: 'microfone' });
      return;
    }
    let resposta: RespostaDaDemonstracao;
    try {
      const pedido = await fetch('/api/experimente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pediuModoDireto() ? { modo: 'direto' } : {}),
      });
      resposta = (await pedido.json()) as RespostaDaDemonstracao;
    } catch {
      setFase({ tipo: 'recusada', motivo: 'fora' });
      return;
    }
    if (!resposta.ok) {
      setVideo(resposta.video);
      setFase({ tipo: 'recusada', motivo: resposta.motivo });
      return;
    }
    if (resposta.modo === 'direto') {
      setFase({ tipo: 'conversando', ligacao: resposta, rtm: null });
      return;
    }
    try {
      const rtm = await ligarRtm(resposta.sala);
      setFase({ tipo: 'conversando', ligacao: resposta, rtm });
    } catch {
      void fetch('/api/experimente/fim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passe: resposta.passe, falas: [] }),
      }).catch(() => undefined);
      setFase({ tipo: 'falhou' });
    }
  }, []);

  const ligacaoAtual = fase.tipo === 'conversando' ? fase : null;

  const aoFim = useCallback(
    async (falas: FalaDaSessao[]) => {
      if (terminou.current || !ligacaoAtual) return;
      terminou.current = true;
      ligacaoAtual.rtm?.logout().catch(() => undefined);
      setFase({ tipo: 'preparando' });
      try {
        const pedido = await fetch('/api/experimente/fim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passe: ligacaoAtual.ligacao.passe, falas }),
        });
        const ficha = (await pedido.json()) as FichaDaDemonstracao;
        setFase({ tipo: 'ficha', painel: ficha.ok ? ficha.painel : null });
      } catch {
        setFase({ tipo: 'ficha', painel: null });
      }
    },
    [ligacaoAtual],
  );

  const aoFalhar = useCallback(() => {
    if (terminou.current || !ligacaoAtual) return;
    terminou.current = true;
    ligacaoAtual.rtm?.logout().catch(() => undefined);
    void fetch('/api/experimente/fim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passe: ligacaoAtual.ligacao.passe, falas: [] }),
    }).catch(() => undefined);
    setFase({ tipo: 'falhou' });
  }, [ligacaoAtual]);

  const voltar = useCallback(() => setFase({ tipo: 'inicio' }), []);

  let conteudo;
  if (fase.tipo === 'conversando') {
    const { ligacao, rtm } = fase;
    conteudo =
      ligacao.modo === 'direto' ? (
        <LigacaoDireta direto={ligacao.direto} teto={ligacao.teto} onFim={aoFim} onFalha={aoFalhar} />
      ) : (
        <ProvedorDaAgora>
          <LigacaoPelaAgora sala={ligacao.sala} rtmClient={rtm!} teto={ligacao.teto} onFim={aoFim} onFalha={aoFalhar} />
        </ProvedorDaAgora>
      );
    conteudo = <ErrorBoundary fallback={<Falhou onTentar={voltar} />}>{conteudo}</ErrorBoundary>;
  } else if (fase.tipo === 'ligando') {
    conteudo = (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Rosto estado="ligando" nivel={0} />
        <p role="status" className={TITULO}>
          A {NOME_DA_ASSISTENTE} está ligando...
        </p>
      </div>
    );
  } else if (fase.tipo === 'preparando') {
    conteudo = (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Rosto estado="pensando" nivel={0} />
        <p role="status" className={TITULO}>
          Montando o que a família veria...
        </p>
      </div>
    );
  } else if (fase.tipo === 'ficha') {
    conteudo = (
      <div className="flex w-full flex-col items-center gap-6">
        {fase.painel ? (
          <FichaDoFim painel={fase.painel} />
        ) : (
          <p className={TEXTO}>Não deu pra montar a ficha desta conversa agora.</p>
        )}
        <p className="text-base text-muted-foreground">
          Nada desta conversa foi guardado. Esta tela some quando você fechar a página.
        </p>
        <BotaoGrande tom="discreto" onClick={voltar}>
          Ligar de novo
        </BotaoGrande>
        <Link href="/landing" className="text-lg font-semibold text-primary underline underline-offset-4">
          Conhecer a {NOME_DA_ASSISTENTE}
        </Link>
      </div>
    );
  } else if (fase.tipo === 'recusada') {
    const recusa = RECUSA[fase.motivo];
    conteudo = (
      <div className="flex w-full flex-col items-center gap-5 text-center">
        <h1 className={TITULO}>{recusa.titulo}</h1>
        <p className={TEXTO}>{recusa.texto}</p>
        {video ? <Video endereco={video} /> : null}
        {fase.motivo === 'fora' ? <BotaoGrande onClick={voltar}>Tentar de novo</BotaoGrande> : null}
        <Link href="/landing" className="text-lg font-semibold text-primary underline underline-offset-4">
          Conhecer a {NOME_DA_ASSISTENTE}
        </Link>
      </div>
    );
  } else if (fase.tipo === 'microfone') {
    conteudo = (
      <div className="flex w-full flex-col items-center gap-5 text-center">
        <h1 className={TITULO}>Falta liberar o microfone</h1>
        <p className={TEXTO}>
          A {NOME_DA_ASSISTENTE} precisa ouvir você. Libere o microfone nas permissões do navegador e toque de novo.
        </p>
        <BotaoGrande onClick={voltar}>Voltar</BotaoGrande>
      </div>
    );
  } else if (fase.tipo === 'falhou') {
    conteudo = <Falhou onTentar={voltar} />;
  } else {
    conteudo = (
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 text-center">
        <Rosto estado="parada" nivel={0} />
        <h1 className={TITULO}>Converse com a {NOME_DA_ASSISTENTE}</h1>
        <p className={TEXTO}>
          Ela liga todo dia pro idoso, pergunta do sono, da comida e do remédio e conta pra família como ele está. Toque
          no botão, libere o microfone e responda como se ela estivesse ligando pra você. A ligação dura até dois minutos.
        </p>
        <BotaoGrande tom="atender" onClick={() => void ligar()}>
          <Phone aria-hidden className="h-7 w-7 shrink-0" />
          Atender a ligação da {NOME_DA_ASSISTENTE}
        </BotaoGrande>
        <p className="text-base text-muted-foreground">{PRIVACIDADE}</p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center gap-6 px-4 py-8">{conteudo}</main>
  );
}

function Falhou({ onTentar }: { onTentar: () => void }) {
  return (
    <div className="flex w-full flex-col items-center gap-5 text-center">
      <h1 className={TITULO}>A ligação caiu</h1>
      <p className={TEXTO}>A {NOME_DA_ASSISTENTE} não conseguiu ficar na linha. Tente de novo.</p>
      <BotaoGrande onClick={onTentar}>Tentar de novo</BotaoGrande>
    </div>
  );
}
