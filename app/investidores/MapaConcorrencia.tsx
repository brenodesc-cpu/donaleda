import { cn } from '@/lib/utils';
import { concorrentes, tiposDeInicio, tiposDeRetorno, type Concorrente } from './concorrentes';

type MapaConcorrenciaProps = {
  selecionado: Concorrente;
  selecionar: (concorrente: Concorrente) => void;
};

export function MapaConcorrencia({ selecionado, selecionar }: MapaConcorrenciaProps) {
  return (
    <figure aria-labelledby="titulo-mapa-concorrencia" className="mt-5 rounded-2xl border border-border bg-card p-3 sm:p-6">
      <h3 id="titulo-mapa-concorrencia" className="text-2xl font-bold">Mapa de posicionamento</h3>
      <p className="mt-2 max-w-2xl text-base text-muted-foreground">
        Compare como o contato começa e o que a família recebe. Selecione uma empresa no mapa para abrir a comparação.
      </p>

      <table
        aria-labelledby="titulo-mapa-concorrencia"
        aria-describedby="nota-mapa-concorrencia"
        className="mt-4 w-full table-fixed border-collapse text-left text-xs sm:text-sm"
      >
        <thead>
          <tr>
            <td className="w-[26%] sm:w-[24%]" />
            <th colSpan={3} scope="colgroup" className="pb-2 text-center text-primary">Como o contato começa →</th>
          </tr>
          <tr className="align-bottom">
            <th scope="col" className="pb-2 pr-1 text-primary sm:pr-3">O que a família recebe</th>
            {tiposDeInicio.map(({ id, rotulo }) => (
              <th key={id} scope="col" className="border-b-2 border-border px-1 pb-2 text-center sm:px-3">{rotulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tiposDeRetorno.map(({ id: retorno, rotulo }) => (
            <tr key={retorno}>
              <th scope="row" className="py-2 pr-1 align-middle sm:pr-3">{rotulo}</th>
              {tiposDeInicio.map(({ id: inicio }) => (
                <td key={inicio} className="border border-border bg-background/70 p-1 text-center align-middle sm:p-2">
                  <div className="flex min-h-14 flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    {retorno === 'resumo' && inicio === 'solucao' && (
                      <span className="inline-flex max-w-full items-center gap-1 rounded-lg bg-primary px-1.5 py-1 text-left font-bold text-primary-foreground sm:gap-2 sm:px-2.5">
                        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-current" />
                        Dona Leda
                      </span>
                    )}
                    {concorrentes.filter((empresa) => empresa.inicio === inicio && empresa.retorno === retorno).map((empresa) => {
                      const ativo = empresa.nome === selecionado.nome;

                      return (
                        <button
                          key={empresa.nome}
                          type="button"
                          aria-pressed={ativo}
                          onClick={() => selecionar(empresa)}
                          className={cn(
                            'inline-flex min-h-8 max-w-full items-center gap-1 rounded-lg border px-1 py-1 text-left leading-tight [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-ring sm:gap-2 sm:px-2.5',
                            ativo ? 'border-primary bg-primary/10 font-bold text-primary' : 'border-border bg-card hover:border-primary',
                          )}
                        >
                          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full border border-current" />
                          {empresa.nome}
                        </button>
                      );
                    })}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <figcaption id="nota-mapa-concorrencia" className="mt-3 text-sm text-muted-foreground">
        Posições qualitativas com base nas ofertas descritas. Os pontos têm o mesmo tamanho porque os dados disponíveis usam métricas de porte diferentes.
      </figcaption>
      <div className="mt-4 rounded-xl border border-border bg-background p-3 text-base sm:p-4">
        <p className="font-bold text-primary">Dona Leda e {selecionado.nome}</p>
        <p className="mt-1">{selecionado.comparacao}</p>
      </div>
    </figure>
  );
}
