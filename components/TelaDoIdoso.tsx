'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import { useLigacao } from '@/hooks/useLigacao';
import type { MotivoDaFalha } from '@/types/conversation';
import { BotaoGrande } from './BotaoGrande';
import { ErrorBoundary } from './ErrorBoundary';
import { Rosto } from './Rosto';

// A conversa e a ligação da Agora só existem no navegador.
const Conversa = dynamic(() => import('./Conversa'), { ssr: false });
const ProvedorDaAgora = dynamic(() => import('./ProvedorDaAgora'), {
  ssr: false,
});

const AVISO_DE_FALHA: Record<MotivoDaFalha, string> = {
  microfone:
    'Preciso do microfone pra te ouvir. Toque em Permitir quando o celular perguntar.',
  conexao: 'Não consegui ligar agora.',
};

function recarregar() {
  window.location.reload();
}

/** Aparece se a conversa quebrar por dentro: mesma cara dos outros avisos. */
function ConversaQuebrou() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <Rosto estado="parada" nivel={0} />
      <p role="alert" className="max-w-md text-center text-2xl font-medium">
        {AVISO_DE_FALHA.conexao}
      </p>
      <BotaoGrande onClick={recarregar}>Tentar de novo</BotaoGrande>
    </div>
  );
}

interface AntesDaConversaProps {
  ligando: boolean;
  falha: MotivoDaFalha | null;
  onLigar: () => void;
}

/** A tela parada, a tela ligando e a tela de aviso: rosto, uma frase e um botão. */
function AntesDaConversa({ ligando, falha, onLigar }: AntesDaConversaProps) {
  const rotulo = ligando
    ? 'Ligando...'
    : falha
      ? 'Tentar de novo'
      : `Conversar com a ${NOME_DA_ASSISTENTE}`;

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-8">
      <Rosto estado={ligando ? 'ligando' : 'parada'} nivel={0} />
      {falha ? (
        <p role="alert" className="max-w-md text-center text-2xl font-medium">
          {AVISO_DE_FALHA[falha]}
        </p>
      ) : (
        <h1 className="max-w-md text-balance text-center text-3xl font-semibold sm:text-4xl">
          Oi! Eu sou a {NOME_DA_ASSISTENTE}, sua assistente virtual.
        </h1>
      )}
      <BotaoGrande onClick={onLigar} disabled={ligando} aria-busy={ligando}>
        {rotulo}
      </BotaoGrande>
    </div>
  );
}

export default function TelaDoIdoso() {
  const { fase, motivo, dados, rtm, ligar, encerrar, falhar, renovarTokens } =
    useLigacao();
  const conversando = fase === 'conversando' && dados !== null && rtm !== null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center gap-6 px-6 py-8">
      {conversando ? (
        <ErrorBoundary fallback={<ConversaQuebrou />}>
          <ProvedorDaAgora>
            <Conversa
              dados={dados}
              rtmClient={rtm}
              onRenovarTokens={renovarTokens}
              onEncerrar={encerrar}
              onFalha={falhar}
            />
          </ProvedorDaAgora>
        </ErrorBoundary>
      ) : (
        <>
          <AntesDaConversa
            ligando={fase === 'ligando'}
            falha={fase === 'erro' ? motivo : null}
            onLigar={ligar}
          />
          <Link
            href="/familia"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-base text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Painel da família
          </Link>
        </>
      )}
    </main>
  );
}
