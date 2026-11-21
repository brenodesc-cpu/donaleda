'use client';

import { useState } from 'react';
import { BookHeart, Lock, Plus } from 'lucide-react';
import type { CategoriaDeLembranca, Lembranca } from '@/lib/tipos';
import { CLASSE_DO_BOTAO_SECUNDARIO } from './campos';
import { comMaiuscula, gavetaDe, NOME_DA_CATEGORIA, ORDEM_DAS_CATEGORIAS } from './formatos';
import { FormularioDaLembranca } from './FormularioDaLembranca';
import { ItemDaLembranca } from './ItemDaLembranca';
import type { CamposDaLembranca, ResultadoDaLembranca } from './usePainel';

interface LembrancasProps {
  lembrancas: Lembranca[];
  /** Quantas lembranças o idoso pediu pra guardar só com a assistente. */
  reservadas?: number;
  assistente: string;
  tratamento: string;
  onEnsinar?: (campos: CamposDaLembranca & { texto: string; categoria: CategoriaDeLembranca }) => Promise<ResultadoDaLembranca>;
  onCorrigir?: (lembrancaId: string, campos: CamposDaLembranca) => Promise<ResultadoDaLembranca>;
  onApagar?: (lembrancaId: string) => Promise<ResultadoDaLembranca>;
}

const NADA_FEITO: ResultadoDaLembranca = { ok: false, motivo: null };

function compromissosComData(lembrancas: Lembranca[]): Lembranca[] {
  return lembrancas
    .filter((l) => gavetaDe(l.categoria) === 'compromisso' && l.data)
    .sort((a, b) => `${a.data}${a.hora ?? ''}`.localeCompare(`${b.data}${b.hora ?? ''}`));
}

/** O que a assistente sabe do idoso, por gaveta, com os compromissos no topo. */
export function Lembrancas({
  lembrancas,
  reservadas = 0,
  assistente,
  tratamento,
  onEnsinar,
  onCorrigir,
  onApagar,
}: LembrancasProps) {
  const [ensinando, setEnsinando] = useState(false);
  const corrigir = onCorrigir ?? (async () => NADA_FEITO);
  const apagar = onApagar ?? (async () => NADA_FEITO);

  const agenda = compromissosComData(lembrancas);
  const naAgenda = new Set(agenda.map((l) => l.id));
  const grupos = ORDEM_DAS_CATEGORIAS.map((categoria) => ({
    categoria,
    itens: lembrancas.filter((l) => gavetaDe(l.categoria) === categoria && !naAgenda.has(l.id)),
  })).filter((grupo) => grupo.itens.length > 0);

  const temExemplo = lembrancas.some((l) => l.exemplo);
  const vazio = agenda.length === 0 && grupos.length === 0;
  const item = (lembranca: Lembranca) => (
    <ItemDaLembranca
      key={lembranca.id}
      lembranca={lembranca}
      tratamento={comMaiuscula(tratamento)}
      onCorrigir={corrigir}
      onApagar={apagar}
    />
  );

  return (
    <section
      aria-labelledby="titulo-das-lembrancas"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <h2 id="titulo-das-lembrancas" className="text-xl font-semibold text-foreground">
        O que a {assistente} sabe de {tratamento}
      </h2>

      {vazio ? (
        <p className="flex items-center gap-3 text-base text-muted-foreground">
          <BookHeart aria-hidden="true" className="h-6 w-6 shrink-0" />
          A {assistente} ainda está conhecendo {tratamento}. O que for contado nas
          conversas aparece aqui.
        </p>
      ) : null}

      {agenda.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl bg-muted p-4">
          <h3 className="text-base font-semibold text-foreground">Próximos compromissos</h3>
          <ul className="flex flex-col gap-3">{agenda.map(item)}</ul>
        </div>
      ) : null}

      {grupos.map(({ categoria, itens }) => (
        <div key={categoria} className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-muted-foreground">{NOME_DA_CATEGORIA[categoria]}</h3>
          <ul className="flex flex-col gap-3">{itens.map(item)}</ul>
        </div>
      ))}

      {reservadas > 0 ? (
        <p className="flex items-start gap-3 text-base text-muted-foreground">
          <Lock aria-hidden="true" className="mt-1 h-5 w-5 shrink-0" />
          {comMaiuscula(tratamento)} pediu pra guardar {reservadas}{' '}
          {reservadas === 1 ? 'assunto' : 'assuntos'} só com a {assistente}.
        </p>
      ) : null}

      {onEnsinar ? (
        ensinando ? (
          <FormularioDaLembranca
            inicial={{ texto: '', categoria: 'pessoa', data: '', hora: '' }}
            escolheGaveta
            rotuloDoBotao="Guardar"
            onSalvar={async (campos) => {
              const resultado = await onEnsinar(campos);
              if (resultado.ok) setEnsinando(false);
              return resultado;
            }}
            onCancelar={() => setEnsinando(false)}
          />
        ) : (
          <button type="button" onClick={() => setEnsinando(true)} className={`${CLASSE_DO_BOTAO_SECUNDARIO} sm:w-auto`}>
            <Plus aria-hidden="true" className="h-5 w-5" />
            Ensinar algo
          </button>
        )
      ) : null}

      {temExemplo ? (
        <p className="text-sm text-muted-foreground">* Itens marcados são dados de exemplo.</p>
      ) : null}
    </section>
  );
}
