'use client';

import { Alertas } from '@/components/familia/Alertas';
import {
  AvisoSemConexao,
  Esqueleto,
  ResumoDaConversa,
  Rodape,
} from '@/components/familia/Apoio';
import { Cabecalho } from '@/components/familia/Cabecalho';
import { DiaDeHoje } from '@/components/familia/DiaDeHoje';
import { Lembrancas } from '@/components/familia/Lembrancas';
import { Semana } from '@/components/familia/Semana';
import { usePainel } from '@/components/familia/usePainel';

export default function PainelDaFamiliaPage() {
  const { painel, semConexao, marcarVisto } = usePainel();
  const resumo = painel?.ultimaConversa?.resumo?.trim();

  return (
    <main className="min-h-dvh bg-background text-base text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 md:py-10">
        {semConexao ? <AvisoSemConexao /> : null}

        {painel ? (
          <>
            <Cabecalho painel={painel} />
            <Alertas
              alertas={painel.alertas}
              assistente={painel.assistente}
              tratamento={painel.idoso.tratamento}
              hoje={painel.hoje.data}
              onMarcarVisto={marcarVisto}
            />
            <DiaDeHoje hoje={painel.hoje} />
            {resumo ? <ResumoDaConversa resumo={resumo} /> : null}
            <Semana semana={painel.semana} hoje={painel.hoje.data} />
            <Lembrancas
              lembrancas={painel.lembrancas}
              assistente={painel.assistente}
              tratamento={painel.idoso.tratamento}
            />
            <Rodape assistente={painel.assistente} />
          </>
        ) : (
          <Esqueleto />
        )}
      </div>
    </main>
  );
}
