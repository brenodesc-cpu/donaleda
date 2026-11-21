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
          <Alertas
            alertas={painel.alertas}
            assistente={painel.assistente}
            tratamento={painel.idoso.tratamento}
            hoje={painel.hoje.data}
            onMarcarVisto={marcarVisto}
            entrarNaLigacao={painel.ligacaoAoVivo ? enderecoCom('/familia/ligacao', idoso.id) : null}
          />
          <DiaDeHoje hoje={painel.hoje} />
          {resumo ? <ResumoDaConversa resumo={resumo} /> : null}
          <Semana semana={painel.semana} hoje={painel.hoje.data} />
          <Lembrancas
            lembrancas={painel.lembrancas}
            reservadas={painel.reservadas}
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
