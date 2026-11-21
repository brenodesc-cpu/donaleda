'use client';

import { useCallback, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useAparelhoPronto } from '@/hooks/useAparelhoPronto';
import { useChamada } from '@/hooks/useChamada';
import { useLigacao } from '@/hooks/useLigacao';
import { useTelaAcesa } from '@/hooks/useTelaAcesa';
import { iniciarPushDeChamadaNativa } from '@/lib/pushNativo';
import { ChamadaTocando } from './ChamadaTocando';
import { ErrorBoundary } from './ErrorBoundary';
import { Rosto } from './Rosto';
import {
  AvisoDeFalha,
  Esperando,
  Ligando,
  PrepararAparelho,
} from './TelasDeEspera';

// A ligação da Agora só existe no navegador.
const Conversa = dynamic(() => import('./Conversa'), { ssr: false });
const ProvedorDaAgora = dynamic(() => import('./ProvedorDaAgora'), {
  ssr: false,
});

function recarregar() {
  window.location.reload();
}

/**
 * A tela do aparelho do idoso. Quem começa a conversa é a assistente: o
 * aparelho fica esperando, toca quando ela liga, e a ligação tem cara de
 * chamada de vídeo. As telas, na ordem em que a pessoa vê:
 * preparar o aparelho, esperando, tocando, ligando e em ligação.
 */
export default function TelaDoIdoso() {
  const aparelho = useAparelhoPronto();
  const ligacao = useLigacao();
  const { fase, dados, rtm, ligar } = ligacao;

  const pronto = aparelho.estado === 'pronto';
  // Fora de uma ligação, o aparelho pergunta ao servidor se a assistente está ligando.
  const livre = fase === 'parada' || fase === 'erro';
  const { situacao, chamada, responder } = useChamada(pronto && livre);
  useTelaAcesa(pronto);

  const chamadaId = chamada?.id;
  const atender = useCallback(() => {
    if (!chamadaId) return;
    responder('atender', chamadaId);
    void ligar(chamadaId);
  }, [chamadaId, responder, ligar]);

  const recusar = useCallback(() => {
    if (chamadaId) responder('recusar', chamadaId);
  }, [chamadaId, responder]);

  // No app Android/iOS, registra o token de push (Agora Signaling + FCM / APNs VoIP)
  // e atende/recusa automaticamente quando o idoso toca na tela nativa de chamada.
  useEffect(() => {
    if (!pronto) return;
    return iniciarPushDeChamadaNativa(({ acao, chamadaId: id }) => {
      responder(acao, id);
      if (acao === 'atender') {
        void ligar(id);
      }
    });
  }, [pronto, responder, ligar]);

  const ligarEu = useCallback(() => void ligar(), [ligar]);

  const emLigacao = fase === 'conversando' && dados !== null && rtm !== null;

  let conteudo: ReactNode;
  if (emLigacao) {
    conteudo = (
      <ErrorBoundary
        fallback={<AvisoDeFalha motivo="conexao" onTentar={recarregar} />}
      >
        <ProvedorDaAgora>
          <Conversa
            dados={dados}
            rtmClient={rtm}
            onRenovarTokens={ligacao.renovarTokens}
            onFalasAtualizadas={ligacao.atualizarFalas}
            onEncerrar={ligacao.encerrar}
            onFalha={ligacao.falhar}
          />
        </ProvedorDaAgora>
      </ErrorBoundary>
    );
  } else if (fase === 'ligando') {
    conteudo = <Ligando />;
  } else if (aparelho.estado === 'conferindo') {
    // Um instante só, enquanto o navegador responde se o microfone já foi liberado.
    conteudo = (
      <div className="flex flex-1 items-center justify-center">
        <Rosto estado="parada" nivel={0} />
      </div>
    );
  } else if (aparelho.estado === 'precisa') {
    conteudo = (
      <PrepararAparelho
        negado={aparelho.negado}
        onPreparar={aparelho.preparar}
      />
    );
  } else if (chamada) {
    conteudo = (
      <ChamadaTocando
        key={chamada.id}
        atenderSozinhoEm={situacao?.atenderSozinhoEm ?? null}
        onAtender={atender}
        onRecusar={recusar}
      />
    );
  } else if (fase === 'erro' && ligacao.motivo) {
    conteudo = (
      <AvisoDeFalha
        motivo={ligacao.motivo}
        onTentar={ligacao.tentarDeNovo}
        onVoltar={ligacao.voltar}
      />
    );
  } else {
    conteudo = (
      <Esperando
        horarios={situacao?.horariosDeLigacao ?? []}
        proxima={situacao?.proximaLigacao ?? null}
        onLigar={ligarEu}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center gap-6 px-6 py-8">
      {conteudo}
    </main>
  );
}
