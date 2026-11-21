'use client';

import { AvisoSemConexao, Esqueleto } from '@/components/familia/Apoio';
import { BarraDoTopo } from '@/components/familia/BarraDoTopo';
import { TelaDaCasa } from '@/components/familia/casa/TelaDaCasa';
import { useCasa } from '@/components/familia/casa/useCasa';
import { useIdosos } from '@/components/familia/useIdosos';

/** Todos os moradores da casa numa tela só, em três colunas pela situação de hoje. */
export default function TodosOsMoradoresPage() {
  const { idosos, idoso, escolher, semConexao: semLista } = useIdosos();
  const { moradores, conta, carregando, semConexao, marcarVistos, ligar, pedidos } = useCasa(idosos);

  return (
    <main className="min-h-dvh bg-background text-base text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:py-8">
        <BarraDoTopo idosos={idosos} idoso={idoso} onEscolher={escolher} ativa="casa" />
        {semLista || semConexao ? <AvisoSemConexao /> : null}
        {!idosos || carregando ? (
          <Esqueleto />
        ) : (
          <TelaDaCasa
            moradores={moradores}
            conta={conta}
            agora={new Date().toISOString()}
            pedidos={pedidos}
            onJaVi={marcarVistos}
            onLigar={ligar}
          />
        )}
      </div>
    </main>
  );
}
