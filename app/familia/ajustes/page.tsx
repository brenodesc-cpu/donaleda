'use client';

import { AjustesDoIdoso } from '@/components/familia/AjustesDoIdoso';
import { ApagarIdoso } from '@/components/familia/ApagarIdoso';
import { Esqueleto } from '@/components/familia/Apoio';
import { Moldura } from '@/components/familia/Moldura';
import { useIdosos } from '@/components/familia/useIdosos';
import { usePainel } from '@/components/familia/usePainel';

export default function AjustesPage() {
  const { idosos, idoso, escolher, semConexao: semLista } = useIdosos();
  const {
    painel,
    semConexao,
    trocarHorarios,
    trocarAtenderSozinho,
    salvarPerfil,
    salvarRedeDeApoio,
  } = usePainel(idoso?.id ?? null);

  return (
    <Moldura
      idosos={idosos}
      idoso={idoso}
      onEscolher={escolher}
      ativa="ajustes"
      semConexao={semLista || semConexao}
    >
      {painel ? (
        <>
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Ajustes de {painel.idoso.tratamento}
          </h1>
          <AjustesDoIdoso
            key={painel.idoso.id}
            idoso={painel.idoso}
            redeDeApoio={painel.redeDeApoio ?? []}
            onTrocarHorarios={trocarHorarios}
            onTrocarAtenderSozinho={trocarAtenderSozinho}
            onSalvarPerfil={salvarPerfil}
            onSalvarRedeDeApoio={salvarRedeDeApoio}
          />
          {idoso?.papel === 'responsavel' ? (
            <ApagarIdoso idosoId={painel.idoso.id} tratamento={painel.idoso.tratamento} />
          ) : null}
        </>
      ) : (
        <Esqueleto />
      )}
    </Moldura>
  );
}
