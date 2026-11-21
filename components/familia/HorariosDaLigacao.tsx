'use client';

import { useState, type ChangeEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { arrumarHorarios, horaCurta, horarioValido } from './formatos';

interface HorariosDaLigacaoProps {
  horarios: string[];
  onTrocar: (horarios: string[]) => void;
}

/** As horas em que a assistente liga todo dia, com tirar e adicionar. */
export function HorariosDaLigacao({ horarios, onTrocar }: HorariosDaLigacaoProps) {
  const [novo, setNovo] = useState('');
  const podeAdicionar = horarioValido(novo) && !horarios.includes(novo);

  const handleMudarNovo = (evento: ChangeEvent<HTMLInputElement>) => {
    setNovo(evento.target.value);
  };

  const adicionar = () => {
    if (!podeAdicionar) return;
    onTrocar(arrumarHorarios([...horarios, novo]));
    setNovo('');
  };

  const handleTirar = (horario: string) => {
    onTrocar(horarios.filter((h) => h !== horario));
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-semibold text-foreground">Liga todo dia às</h3>

      {horarios.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {horarios.map((horario) => (
            <li
              key={horario}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-muted pl-4 pr-1 text-lg font-medium text-foreground"
            >
              {horaCurta(horario)}
              <button
                type="button"
                onClick={() => handleTirar(horario)}
                aria-label={`Tirar o horário das ${horaCurta(horario)}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted-foreground">Sem horário marcado, a Dona Leda só liga quando você pedir. Escolha uma hora embaixo e toque em Adicionar.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="novo-horario" className="sr-only">
          Novo horário de ligação
        </label>
        <input
          id="novo-horario"
          type="time"
          value={novo}
          onChange={handleMudarNovo}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              adicionar();
            }
          }}
          className="min-h-11 rounded-lg border border-border bg-background px-3 text-lg text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={adicionar}
          disabled={!podeAdicionar}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Adicionar
        </button>
      </div>
    </div>
  );
}
