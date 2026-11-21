import type { PainelDaFamilia } from '@/lib/tipos';
import {
  comMaiuscula,
  dataPorExtenso,
  duracaoEmPalavras,
  horaDeBrasilia,
  quandoFoi,
} from './formatos';

interface CabecalhoProps {
  painel: PainelDaFamilia;
}

function Situacao({ painel }: CabecalhoProps) {
  const { assistente, ultimaConversa, conversouHoje, hoje } = painel;

  if (ultimaConversa?.emAndamento) {
    return (
      <p className="flex items-center gap-2 text-lg font-medium text-success">
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 animate-pulse rounded-full bg-success"
        />
        Conversando com a {assistente} agora
      </p>
    );
  }

  if (conversouHoje && ultimaConversa) {
    const hora = horaDeBrasilia(ultimaConversa.inicio);
    const duracao = duracaoEmPalavras(ultimaConversa.minutos);
    return (
      <p className="text-lg text-foreground">
        Conversou com a {assistente}
        {hora ? ` às ${hora}` : ''}
        {duracao ? `, por ${duracao}` : ''}
      </p>
    );
  }

  return (
    <div>
      <p className="text-lg font-medium text-warning">Ainda não conversou hoje</p>
      {ultimaConversa ? (
        <p className="text-base text-muted-foreground">
          Última conversa: {quandoFoi(ultimaConversa.inicio, hoje.data)}
        </p>
      ) : null}
    </div>
  );
}

export function Cabecalho({ painel }: CabecalhoProps) {
  const data = dataPorExtenso(painel.hoje.data);

  return (
    <header className="flex flex-col gap-1">
      {data ? (
        <p className="text-base text-muted-foreground">{comMaiuscula(data)}</p>
      ) : null}
      <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
        {comMaiuscula(painel.idoso.tratamento)} hoje
      </h1>
      <Situacao painel={painel} />
    </header>
  );
}
