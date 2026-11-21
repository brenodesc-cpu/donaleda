'use client';

import { useCallback } from 'react';
import { CodigoDoAparelho } from '@/components/familia/CodigoDoAparelho';
import { Esqueleto } from '@/components/familia/Apoio';
import { Cartao, Moldura } from '@/components/familia/Moldura';
import { useIdosos } from '@/components/familia/useIdosos';

function quantosAparelhos(total: number): string {
  if (total === 0) return 'Nenhum aparelho ligado ainda.';
  if (total === 1) return '1 aparelho já está ligado.';
  return `${total} aparelhos já estão ligados.`;
}

export default function AparelhoPage() {
  const { idosos, idoso, escolher, recarregar, semConexao } = useIdosos();
  const handleConferir = useCallback(() => void recarregar(), [recarregar]);

  return (
    <Moldura idosos={idosos} idoso={idoso} onEscolher={escolher} ativa="aparelho" semConexao={semConexao}>
      {idoso ? (
        <>
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Ligar o aparelho</h1>
            <p className="text-lg text-muted-foreground">
              É no celular ou no tablet de {idoso.tratamento} que a Dona Leda toca e conversa.
              Você faz isso uma vez só.
            </p>
            <p className="text-base text-foreground">{quantosAparelhos(idoso.aparelhos)}</p>
          </header>

          <Cartao titulo="Como fazer">
            <ol className="flex list-decimal flex-col gap-3 pl-6 text-lg text-foreground">
              <li>
                No celular ou tablet de {idoso.tratamento}, abra o app Dona Leda.
              </li>
              <li>Toque em &quot;Este aparelho vai receber as ligações&quot;.</li>
              <li>Digite o código que aparece aqui embaixo.</li>
            </ol>
            <p className="text-base text-muted-foreground">
              Deixe o aparelho ligado na tomada e na internet, com o app aberto, pra ele tocar na
              hora das ligações.
            </p>
          </Cartao>

          <Cartao titulo="Código">
            <CodigoDoAparelho key={idoso.id} idoso={idoso} onConferir={handleConferir} />
          </Cartao>
        </>
      ) : (
        <Esqueleto />
      )}
    </Moldura>
  );
}
