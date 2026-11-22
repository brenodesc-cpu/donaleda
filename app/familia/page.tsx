'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PhoneOff, Video } from 'lucide-react';
import { destravarSom } from '@/hooks/somDoAparelho';
import { useToque } from '@/hooks/useToque';
import { AgendaEDocumentos } from '@/components/familia/AgendaEDocumentos';
import { Alertas } from '@/components/familia/Alertas';
import { enderecoCom } from '@/components/familia/api';
import { Esqueleto, ResumoDaConversa, Rodape } from '@/components/familia/Apoio';
import { Cabecalho } from '@/components/familia/Cabecalho';
import { DiaDeHoje } from '@/components/familia/DiaDeHoje';
import { Lembrancas } from '@/components/familia/Lembrancas';
import { Ligacoes } from '@/components/familia/Ligacoes';
import { Moldura } from '@/components/familia/Moldura';
import { Semana } from '@/components/familia/Semana';
import { useIdosos } from '@/components/familia/useIdosos';
import { usePainel } from '@/components/familia/usePainel';

export default function PainelDaFamiliaPage() {
  const { idosos, idoso, escolher, semConexao: semLista } = useIdosos();
  const {
    painel,
    semConexao,
    marcarVisto,
    responderAviso,
    pedidoDeLigacao,
    ligar,
    ensinarLembranca,
    corrigirLembranca,
    apagarLembranca,
    anexarDocumento,
    apagarDocumento,
    registrarPushFamilia,
  } = usePainel(idoso?.id ?? null);
  const resumo = painel?.ultimaConversa?.resumo?.trim();
  const [conviteMinimizado, setConviteMinimizado] = useState<string | null>(null);
  const chaveConvite = painel?.convite ? `${painel.convite.conversaId}:${painel.convite.abertoEm}` : null;
  const mostrarChamadaCheia =
    Boolean(painel && idoso && painel.convite && !painel.convite.entrou) &&
    chaveConvite !== conviteMinimizado;
  useToque(mostrarChamadaCheia);
  const alertaUrgente =
    painel?.alertas.find((a) => a.gravidade === 'urgente' && !a.visto) ??
    painel?.alertas.find((a) => a.gravidade === 'urgente');
  const tratamento = painel?.idoso.tratamento?.trim() || 'seu familiar';
  const tratamentoTitulo = `${tratamento[0].toUpperCase()}${tratamento.slice(1)}`;
  const linkLigacaoAuto = idoso
    ? `${enderecoCom('/familia/ligacao', idoso.id)}&auto=1`
    : '/familia/ligacao?auto=1';

  return (
    <Moldura
      idosos={idosos}
      idoso={idoso}
      onEscolher={escolher}
      ativa="painel"
      semConexao={semLista || semConexao}
    >
      {mostrarChamadaCheia && painel && idoso ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="titulo-chamada-emergencia"
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#33200F] px-6 py-12 text-[#FFF8E8]"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="rounded-full bg-[#C92A2A] px-4 py-1 text-sm font-bold uppercase tracking-wider text-white">
              {painel.convite?.motivo === 'urgente' ? 'Emergência ao vivo' : 'Pedido de chamada'}
            </span>
            <h2 id="titulo-chamada-emergencia" className="text-3xl font-bold sm:text-4xl">
              {tratamentoTitulo}
            </h2>
            <p className="max-w-md text-lg text-[#FDEBB5]">
              {alertaUrgente?.texto ??
                `A ${painel.assistente} está na ligação com ${tratamento} esperando você entrar.`}
            </p>
          </div>

          <div className="flex h-40 w-40 animate-pulse items-center justify-center rounded-full border-4 border-[#F7B90F] bg-[#FFF8E8]/15">
            <Video aria-hidden="true" className="h-16 w-16 text-[#F7B90F]" />
          </div>

          <div className="flex w-full max-w-md items-center justify-around gap-6">
            <button
              type="button"
              onClick={() => setConviteMinimizado(chaveConvite)}
              className="flex flex-col items-center gap-2"
            >
              <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#C92A2A] text-white shadow-lg">
                <PhoneOff aria-hidden="true" className="h-9 w-9" />
              </span>
              <span className="text-base font-semibold">Ver no painel</span>
            </button>
            <Link
              href={linkLigacaoAuto}
              onClick={() => void destravarSom()}
              className="flex flex-col items-center gap-2"
            >
              <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#1B7A3D] text-white shadow-lg">
                <Video aria-hidden="true" className="h-9 w-9" />
              </span>
              <span className="text-base font-semibold">Atender vídeo</span>
            </Link>
          </div>
        </div>
      ) : null}
      {painel && idoso ? (
        <>
          <Cabecalho painel={painel} onRegistrarPushFamilia={registrarPushFamilia} />
          <Ligacoes painel={painel} idosoId={idoso.id} pedido={pedidoDeLigacao} onLigar={ligar} />
          {painel.convite?.motivo === 'pedido' ? (
            <Link
              href={linkLigacaoAuto}
              onClick={() => void destravarSom()}
              className="flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-warning-soft p-5"
            >
              <span className="text-lg font-semibold">
                {tratamentoTitulo} pediu pra falar com você agora
              </span>
              <span className="inline-flex min-h-14 items-center justify-center rounded-xl bg-success px-6 text-xl font-semibold text-white">
                Entrar na ligação
              </span>
            </Link>
          ) : null}
          <Alertas
            alertas={painel.alertas}
            assistente={painel.assistente}
            tratamento={painel.idoso.tratamento}
            hoje={painel.hoje.data}
            onMarcarVisto={marcarVisto}
            onResponder={responderAviso}
            entrarNaLigacao={painel.convite ? linkLigacaoAuto : null}
          />
          <DiaDeHoje hoje={painel.hoje} />
          {resumo ? <ResumoDaConversa resumo={resumo} /> : null}
          <AgendaEDocumentos
            idosoId={idoso.id}
            lembrancas={painel.lembrancas}
            documentos={painel.documentos ?? []}
            assistente={painel.assistente}
            tratamento={painel.idoso.tratamento}
            onAgendar={ensinarLembranca}
            onAnexarDocumento={anexarDocumento}
            onApagarDocumento={apagarDocumento}
          />
          <Semana semana={painel.semana} hoje={painel.hoje.data} />
          <Lembrancas
            lembrancas={painel.lembrancas}
            reservadas={painel.reservadas}
            avisoDePrivacidadeEm={painel.idoso.avisoDePrivacidade?.dadoEm}
            assistente={painel.assistente}
            tratamento={painel.idoso.tratamento}
            onEnsinar={ensinarLembranca}
            onCorrigir={corrigirLembranca}
            onApagar={apagarLembranca}
          />
          <Rodape assistente={painel.assistente} />
        </>
      ) : (
        <Esqueleto />
      )}
    </Moldura>
  );
}
