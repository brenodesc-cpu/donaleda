'use client';

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
  } = usePainel(idoso?.id ?? null);
  const resumo = painel?.ultimaConversa?.resumo?.trim();

  return (
    <Moldura
      idosos={idosos}
      idoso={idoso}
      onEscolher={escolher}
      ativa="painel"
      semConexao={semLista || semConexao}
    >
      {painel && idoso ? (
        <>
          <Cabecalho painel={painel} />
          <Ligacoes painel={painel} idosoId={idoso.id} pedido={pedidoDeLigacao} onLigar={ligar} />
          {painel.convite?.motivo === 'pedido' ? (
            <a
              href={enderecoCom('/familia/ligacao', idoso.id)}
              className="flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-warning-soft p-5"
            >
              <span className="text-lg font-semibold">
                {painel.idoso.tratamento[0].toUpperCase()}
                {painel.idoso.tratamento.slice(1)} pediu pra falar com você agora
              </span>
              <span className="inline-flex min-h-14 items-center justify-center rounded-xl bg-success px-6 text-xl font-semibold text-white">
                Entrar na ligação
              </span>
            </a>
          ) : null}
          <Alertas
            alertas={painel.alertas}
            assistente={painel.assistente}
            tratamento={painel.idoso.tratamento}
            hoje={painel.hoje.data}
            onMarcarVisto={marcarVisto}
            onResponder={responderAviso}
            entrarNaLigacao={painel.convite ? enderecoCom('/familia/ligacao', idoso.id) : null}
          />
          <DiaDeHoje hoje={painel.hoje} />
          {resumo ? <ResumoDaConversa resumo={resumo} /> : null}
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
