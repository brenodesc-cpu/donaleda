'use client';

import { useState } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';

import { concorrentes } from './concorrentes';
import { MapaConcorrencia } from './MapaConcorrencia';

export function Comparacao() {
  const [selecionado, selecionar] = useState(concorrentes[0]);

  return (
    <>
      <MapaConcorrencia selecionado={selecionado} selecionar={selecionar} />

      <h3 id="titulo-tabela-concorrencia" className="mt-9 text-2xl font-bold">Comparação por empresa</h3>
      <p id="instrucao-comparacao" className="mt-3 max-w-2xl text-muted-foreground">
        Selecione uma empresa para ver o que as duas ofertas têm em comum e onde a Dona Leda se diferencia.
      </p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <table aria-labelledby="titulo-tabela-concorrencia" aria-describedby="instrucao-comparacao nota-porte" className="w-full table-fixed border-collapse text-left text-sm sm:text-base">
          <thead className="bg-foreground text-background">
            <tr>
              <th scope="col" className="w-[40%] p-3 sm:w-[28%] sm:px-5">Concorrente</th>
              <th scope="col" className="hidden w-[34%] p-3 sm:table-cell">O que oferece</th>
              <th scope="col" className="p-3 sm:px-5">Dona Leda na comparação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {concorrentes.map((concorrente) => {
              const { nome, segmento, oferta, comparacao, url, porte } = concorrente;
              const ativo = selecionado.nome === nome;

              return (
                <tr
                  key={nome}
                  onClick={() => selecionar(concorrente)}
                  className={ativo ? 'bg-primary/5' : 'cursor-pointer hover:bg-muted/50'}
                >
                  <th scope="row" className="align-top">
                    <button
                      type="button"
                      onClick={(evento) => {
                        evento.stopPropagation();
                        selecionar(concorrente);
                      }}
                      aria-pressed={ativo}
                      className="flex min-h-14 w-full items-start justify-between gap-1 p-3 text-left focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-ring sm:gap-3 sm:px-5"
                    >
                      <span>
                        <span className={ativo ? 'block font-bold text-primary' : 'block font-bold'}>{nome}</span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground sm:text-sm">{segmento}</span>
                        <span className="mt-2 block text-xs font-semibold text-muted-foreground sm:text-sm">
                          {porte ?? 'Base de clientes e receita sem dados no levantamento'}
                        </span>
                      </span>
                      <ChevronRight aria-hidden size={16} className={ativo ? 'mt-1 shrink-0 rotate-90 text-primary' : 'mt-1 shrink-0 text-muted-foreground'} />
                    </button>
                  </th>
                  <td className="hidden p-3 align-top text-muted-foreground sm:table-cell">
                    {oferta}
                    {url && (
                      <a href={url} onClick={(evento) => evento.stopPropagation()} className="mt-2 flex w-fit items-center gap-1 font-semibold text-primary underline underline-offset-4">
                        Site de {nome} <ExternalLink aria-hidden size={13} />
                      </a>
                    )}
                  </td>
                  <td className="p-3 align-top sm:px-5">
                    {ativo ? (
                      <div className="space-y-2">
                        <p className="text-muted-foreground sm:hidden">{oferta}</p>
                        <p className="font-semibold text-foreground">{comparacao}</p>
                        {url && (
                          <a href={url} onClick={(evento) => evento.stopPropagation()} className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 sm:hidden">
                            Site de {nome} <ExternalLink aria-hidden size={13} />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span aria-hidden className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p role="status" className="sr-only">{selecionado.nome}. {selecionado.oferta} {selecionado.comparacao}</p>
      <p id="nota-porte" className="mt-3 max-w-3xl text-sm text-muted-foreground">
        Dados de porte do levantamento da equipe de novembro de 2026. Atendimentos acumulados, usuários, famílias e participantes de piloto medem coisas diferentes. Os números refletem os recortes indicados.
      </p>
    </>
  );
}
