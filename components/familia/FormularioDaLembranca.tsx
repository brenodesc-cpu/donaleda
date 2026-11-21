'use client';

import { useId, useState, type ChangeEvent, type FormEvent } from 'react';
import type { CategoriaDeLembranca } from '@/lib/tipos';
import { CLASSE_DA_CAIXA, CLASSE_DO_BOTAO_PRINCIPAL, CLASSE_DO_BOTAO_SECUNDARIO, Erro } from './campos';
import { NOME_DA_CATEGORIA, ORDEM_DAS_CATEGORIAS } from './formatos';
import type { CamposDaLembranca, ResultadoDaLembranca } from './usePainel';

export interface ValoresDaLembranca {
  texto: string;
  categoria: CategoriaDeLembranca;
  data: string;
  hora: string;
}

interface FormularioDaLembrancaProps {
  inicial: ValoresDaLembranca;
  /** Corrigir não troca a gaveta; ensinar escolhe. */
  escolheGaveta: boolean;
  rotuloDoBotao: string;
  onSalvar: (campos: CamposDaLembranca & { texto: string; categoria: CategoriaDeLembranca }) => Promise<ResultadoDaLembranca>;
  onCancelar: () => void;
}

/** Texto, gaveta e, quando é compromisso, data e hora. */
export function FormularioDaLembranca({
  inicial,
  escolheGaveta,
  rotuloDoBotao,
  onSalvar,
  onCancelar,
}: FormularioDaLembrancaProps) {
  const id = useId();
  const [valores, setValores] = useState<ValoresDaLembranca>(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ehCompromisso = valores.categoria === 'compromisso';

  const mudar =
    (campo: keyof ValoresDaLembranca) =>
    (evento: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValores((antes) => ({ ...antes, [campo]: evento.target.value }));
      setErro(null);
    };

  const handleSalvar = async (evento: FormEvent) => {
    evento.preventDefault();
    const texto = valores.texto.trim();
    if (!texto) {
      setErro('Escreva o que a Dona Leda deve saber.');
      return;
    }
    setSalvando(true);
    const resultado = await onSalvar({
      texto,
      categoria: valores.categoria,
      ...(ehCompromisso && valores.data ? { data: valores.data } : {}),
      ...(ehCompromisso && valores.hora ? { hora: valores.hora } : {}),
    });
    setSalvando(false);
    if (resultado.ok) return;
    setErro(
      resultado.motivo
        ? `Não deu pra guardar: ${resultado.motivo}`
        : 'Não deu pra guardar agora. Tente de novo.',
    );
  };

  return (
    <form onSubmit={handleSalvar} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-texto`} className="text-base font-medium text-foreground">
          O que a Dona Leda deve saber
        </label>
        <textarea
          id={`${id}-texto`}
          value={valores.texto}
          onChange={mudar('texto')}
          rows={3}
          maxLength={240}
          placeholder="Ex.: A vizinha Zefa tem a chave da casa."
          className={`${CLASSE_DA_CAIXA} py-2`}
        />
      </div>

      {escolheGaveta ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-gaveta`} className="text-base font-medium text-foreground">
            Sobre o quê
          </label>
          <select
            id={`${id}-gaveta`}
            value={valores.categoria}
            onChange={mudar('categoria')}
            className={CLASSE_DA_CAIXA}
          >
            {ORDEM_DAS_CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {NOME_DA_CATEGORIA[categoria]}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {ehCompromisso ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-data`} className="text-base font-medium text-foreground">
              Dia
            </label>
            <input id={`${id}-data`} type="date" value={valores.data} onChange={mudar('data')} className={CLASSE_DA_CAIXA} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-hora`} className="text-base font-medium text-foreground">
              Hora
            </label>
            <input id={`${id}-hora`} type="time" value={valores.hora} onChange={mudar('hora')} className={CLASSE_DA_CAIXA} />
          </div>
        </div>
      ) : null}

      <Erro texto={erro} />

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={salvando} className={CLASSE_DO_BOTAO_PRINCIPAL}>
          {salvando ? 'Guardando...' : rotuloDoBotao}
        </button>
        <button type="button" onClick={onCancelar} disabled={salvando} className={CLASSE_DO_BOTAO_SECUNDARIO}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
