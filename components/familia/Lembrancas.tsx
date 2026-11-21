import { BookHeart } from 'lucide-react';
import type { Lembranca } from '@/lib/tipos';
import { NOME_DA_CATEGORIA, ORDEM_DAS_CATEGORIAS } from './formatos';

interface LembrancasProps {
  lembrancas: Lembranca[];
  assistente: string;
  tratamento: string;
}

export function Lembrancas({ lembrancas, assistente, tratamento }: LembrancasProps) {
  const grupos = ORDEM_DAS_CATEGORIAS.map((categoria) => ({
    categoria,
    itens: lembrancas.filter((l) => l.categoria === categoria),
  })).filter((grupo) => grupo.itens.length > 0);

  const temExemplo = lembrancas.some((l) => l.exemplo);

  return (
    <section
      aria-labelledby="titulo-das-lembrancas"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <h2
        id="titulo-das-lembrancas"
        className="text-xl font-semibold text-foreground"
      >
        O que a {assistente} sabe sobre {tratamento}
      </h2>

      {grupos.length === 0 ? (
        <p className="flex items-center gap-3 text-base text-muted-foreground">
          <BookHeart aria-hidden="true" className="h-6 w-6 shrink-0" />
          A {assistente} ainda está conhecendo {tratamento}. O que for contado nas
          conversas aparece aqui.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.map(({ categoria, itens }) => (
            <div key={categoria} className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-muted-foreground">
                {NOME_DA_CATEGORIA[categoria]}
              </h3>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-base text-foreground">
                {itens.map((lembranca) => (
                  <li key={lembranca.id}>
                    {lembranca.texto}
                    {lembranca.exemplo ? (
                      <>
                        <span aria-hidden="true">*</span>
                        <span className="sr-only"> (dado de exemplo)</span>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {temExemplo ? (
        <p className="text-sm text-muted-foreground">
          * Itens marcados são dados de exemplo.
        </p>
      ) : null}
    </section>
  );
}
