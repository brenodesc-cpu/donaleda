'use client';

import { useState } from 'react';
import { Alertas } from '@/components/familia/Alertas';
import { ResumoDaConversa } from '@/components/familia/Apoio';
import { DiaDeHoje } from '@/components/familia/DiaDeHoje';
import { marcarAvisoVisto, registrarDesfecho } from '@/lib/avisos';
import type { PainelDaFamilia, RespostaDoAviso } from '@/lib/tipos';

/**
 * O fim da demonstração: o que a filha veria no celular depois da ligação, com
 * as mesmas peças do painel da família. "Já vi" e "O que você fez?" funcionam só
 * nesta tela, sem ir pro servidor.
 */
export function FichaDoFim({ painel }: { painel: PainelDaFamilia }) {
  const [alertas, setAlertas] = useState(painel.alertas);
  const resumo = painel.ultimaConversa?.resumo?.trim();
  const { familiar } = painel.idoso;

  const mudar = (alertaId: string, mudanca: (alerta: PainelDaFamilia['alertas'][number]) => void) =>
    setAlertas((atuais) =>
      atuais.map((alerta) => {
        if (alerta.id !== alertaId) return alerta;
        const copia = { ...alerta };
        mudanca(copia);
        return copia;
      }),
    );
  const marcarVisto = (alertaId: string) => mudar(alertaId, (a) => marcarAvisoVisto(a, familiar.nome));
  const responder = async (alertaId: string, resposta: RespostaDoAviso, nota: string) => {
    mudar(alertaId, (a) => registrarDesfecho(a, resposta, nota, familiar.nome));
    return true;
  };

  return (
    <div className="flex w-full flex-col gap-5 text-left">
      <h2 className="font-titulo text-2xl font-bold text-foreground">
        Isto é o que a {familiar.nome}, {familiar.parentesco}, veria no celular dela
      </h2>
      {alertas.length === 0 ? (
        <p className="text-lg text-muted-foreground">
          Nenhum aviso nesta conversa. Se você contar de uma queda ou disser que não tomou o remédio, o aviso aparece aqui.
        </p>
      ) : (
        <Alertas
          alertas={alertas}
          assistente={painel.assistente}
          tratamento={painel.idoso.tratamento}
          hoje={painel.hoje.data}
          onMarcarVisto={marcarVisto}
          onResponder={responder}
        />
      )}
      <DiaDeHoje hoje={painel.hoje} />
      {resumo ? <ResumoDaConversa resumo={resumo} /> : null}
    </div>
  );
}
