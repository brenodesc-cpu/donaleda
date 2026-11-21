'use client';

import { useState, type ChangeEvent } from 'react';
import { Plus, X } from 'lucide-react';
import type { Idoso } from '@/lib/tipos';
import { CLASSE_DA_CAIXA } from './campos';

type Remedios = Idoso['remedios'];

interface EditorDeRemediosProps {
  remedios: Remedios;
  onTrocar: (remedios: Remedios) => void;
}

/** A lista dos remédios com o horário de cada um, com tirar e adicionar. */
export function EditorDeRemedios({ remedios, onTrocar }: EditorDeRemediosProps) {
  const [nome, setNome] = useState('');
  const [horario, setHorario] = useState('08:00');
  const podeAdicionar = nome.trim().length > 1 && horario.trim().length > 0;

  const handleNome = (evento: ChangeEvent<HTMLInputElement>) => setNome(evento.target.value);
  const handleHorario = (evento: ChangeEvent<HTMLInputElement>) =>
    setHorario(evento.target.value);

  const handleAdicionar = () => {
    if (!podeAdicionar) return;
    onTrocar([...remedios, { nome: nome.trim(), horario: horario.trim() }]);
    setNome('');
  };

  const handleTirar = (indice: number) => {
    onTrocar(remedios.filter((_, i) => i !== indice));
  };

  return (
    <div className="flex flex-col gap-3">
      {remedios.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {remedios.map((remedio, indice) => (
            <li
              key={`${remedio.nome}-${remedio.horario}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-2"
            >
              <span className="text-lg text-foreground">
                {remedio.nome} <span className="text-muted-foreground">às {remedio.horario}</span>
              </span>
              <button
                type="button"
                onClick={() => handleTirar(indice)}
                aria-label={`Tirar ${remedio.nome}`}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-base text-muted-foreground">Nenhum remédio cadastrado.</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-base font-medium text-foreground">
          Remédio
          <input
            value={nome}
            onChange={handleNome}
            placeholder="remédio da pressão"
            className={CLASSE_DA_CAIXA}
          />
        </label>
        <label className="flex flex-col gap-1 text-base font-medium text-foreground sm:w-36">
          Horário
          <input type="time" value={horario} onChange={handleHorario} className={CLASSE_DA_CAIXA} />
        </label>
        <button
          type="button"
          onClick={handleAdicionar}
          disabled={!podeAdicionar}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Adicionar
        </button>
      </div>
    </div>
  );
}
