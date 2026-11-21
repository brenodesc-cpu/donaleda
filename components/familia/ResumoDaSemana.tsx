import { contarSemana, fraseDaSemana } from '@/lib/semanaAtiva';
import type { Dia } from '@/lib/tipos';

interface ResumoDaSemanaProps {
  semana: Dia[];
}

function Numero({ valor, total, rotulo }: { valor: number; total: number; rotulo: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-3xl font-semibold text-foreground">
        {valor}
        <span className="text-lg font-medium text-muted-foreground"> de {total} dias</span>
      </p>
      <p className="text-base font-medium text-foreground">{rotulo}</p>
    </div>
  );
}

/** Em quantos dias da semana a pessoa saiu de casa e conversou com alguém. */
export function ResumoDaSemana({ semana }: ResumoDaSemanaProps) {
  const conta = contarSemana(semana);
  const frase = fraseDaSemana(conta);

  if (!frase) {
    return (
      <p className="text-base text-muted-foreground">
        Ainda não há resposta sobre sair de casa e conversar nesta semana.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Numero valor={conta.saiu} total={conta.dias} rotulo="Saiu de casa" />
        <Numero valor={conta.conversou} total={conta.dias} rotulo="Conversou com alguém" />
      </div>
      <p className="text-base text-muted-foreground">{frase}</p>
    </div>
  );
}
