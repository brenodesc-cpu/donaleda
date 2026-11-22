'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { LogOut, Mic, Settings, ShieldCheck, X } from 'lucide-react';
import { useAparelhoPronto } from '@/hooks/useAparelhoPronto';
import { useChamada } from '@/hooks/useChamada';
import { useLigacao } from '@/hooks/useLigacao';
import { useTelaAcesa } from '@/hooks/useTelaAcesa';
import { EVENTO_APARELHO_ESQUECIDO, esquecerAparelho } from '@/lib/aparelho';
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
// A ligação do modo direto (?modo=direto), em que o aparelho fala com o Gemini.
const ConversaDireta = dynamic(() => import('./ConversaDireta'), { ssr: false });
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
  const [configAberta, setConfigAberta] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);

  const desconectarAparelho = useCallback(async () => {
    await esquecerAparelho();
    setConfigAberta(false);
    setConfirmandoSaida(false);
    window.dispatchEvent(new Event(EVENTO_APARELHO_ESQUECIDO));
  }, []);

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
    const Ligacao = dados.modo === 'direto' && dados.direto ? ConversaDireta : Conversa;
    conteudo = (
      <ErrorBoundary
        fallback={<AvisoDeFalha motivo="conexao" onTentar={recarregar} />}
      >
        <ProvedorDaAgora>
          <Ligacao
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
        proximaEAmanha={situacao?.proximaEAmanha}
        limiteAcabou={situacao?.limiteDoDia?.acabou ?? false}
        onLigar={ligarEu}
      />
    );
  }

  const mostrarConfig = !emLigacao && !chamada && fase !== 'ligando';

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center gap-6 px-6 py-8">
      {mostrarConfig ? (
        <div className="flex w-full justify-end">
          <button
            type="button"
            aria-label="Configurações, privacidade e conta"
            onClick={() => {
              setConfirmandoSaida(false);
              setConfigAberta(true);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card/80 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings aria-hidden="true" className="h-4 w-4" />
            <span>Configurações</span>
          </button>
        </div>
      ) : null}

      {conteudo}

      {configAberta && mostrarConfig ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-config-aparelho"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-config-aparelho" className="text-xl font-semibold">
                Configurações deste aparelho
              </h2>
              <button
                type="button"
                aria-label="Fechar configurações"
                onClick={() => setConfigAberta(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            {situacao?.tratamento ? (
              <p className="rounded-xl bg-muted px-4 py-3 text-base">
                Conectado para: <strong>{situacao.tratamento}</strong>
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                A voz e o vídeo das conversas não são gravados. Pela LGPD, você pode consultar
                como seus dados são usados ou desconectar este aparelho a qualquer momento.
              </p>
              <Link
                href="/privacidade"
                className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 text-base font-medium text-foreground hover:bg-muted"
              >
                <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0" />
                Privacidade e seus dados (LGPD)
              </Link>
              <button
                type="button"
                onClick={() => {
                  setConfigAberta(false);
                  void aparelho.preparar();
                }}
                className="inline-flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-4 text-left text-base font-medium text-foreground hover:bg-muted"
              >
                <Mic aria-hidden="true" className="h-5 w-5 shrink-0" />
                Conferir permissão de microfone e som
              </button>
            </div>

            <div className="border-t border-border pt-4">
              {confirmandoSaida ? (
                <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Tem certeza? Este aparelho vai parar de receber ligações até ser pareado
                    novamente com um código ou QR Code.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void desconectarAparelho()}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-destructive px-4 text-base font-semibold text-destructive-foreground"
                    >
                      Confirmar desconexão
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoSaida(false)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card px-4 text-base font-medium text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoSaida(true)}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 px-4 text-base font-semibold text-destructive hover:bg-destructive/10"
                >
                  <LogOut aria-hidden="true" className="h-5 w-5" />
                  Trocar de conta / Desconectar aparelho
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
