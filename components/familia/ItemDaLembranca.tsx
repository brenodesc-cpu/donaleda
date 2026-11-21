'use client';

import { useState } from 'react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { Lembranca } from '@/lib/tipos';
import { diaEMes, dataDeBrasilia, gavetaDe, quandoDoCompromisso } from './formatos';
import { Erro } from './campos';
import { FormularioDaLembranca } from './FormularioDaLembranca';
import type { CamposDaLembranca, ResultadoDaLembranca } from './usePainel';

interface ItemDaLembrancaProps {
  lembranca: Lembranca;
  tratamento: string;
  onCorrigir: (lembrancaId: string, campos: CamposDaLembranca) => Promise<ResultadoDaLembranca>;
  onApagar: (lembrancaId: string) => Promise<ResultadoDaLembranca>;
}

type Modo = 'ver' | 'corrigir' | 'confirmar_apagar';

export function quemContou(lembranca: Lembranca, tratamento: string): string {
  const quando = dataDeBrasilia(lembranca.criadaEm);
  if (lembranca.origem === 'deduzida') {
    const daConversa = quando ? `da conversa de ${diaEMes(quando)}` : 'da conversa';
    return `A ${NOME_DA_ASSISTENTE} entendeu ${daConversa}. Ninguém confirmou ainda.`;
  }
  const quem = lembranca.origem === 'familia' ? 'A família contou' : `${tratamento} contou`;
  const quemComMaiuscula = quem.charAt(0).toLocaleUpperCase('pt-BR') + quem.slice(1);
  return quando ? `${quemComMaiuscula} em ${diaEMes(quando)}` : quemComMaiuscula;
}

const CLASSE_DO_LINK =
  'min-h-11 rounded-lg px-2 text-base font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Uma lembrança, com quem contou, e os botões de corrigir e apagar. */
export function ItemDaLembranca({ lembranca, tratamento, onCorrigir, onApagar }: ItemDaLembrancaProps) {
  const [modo, setModo] = useState<Modo>('ver');
  const [apagando, setApagando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const gaveta = gavetaDe(lembranca.categoria);

  if (modo === 'corrigir') {
    return (
      <li className="list-none">
        <FormularioDaLembranca
          inicial={{ texto: lembranca.texto, categoria: gaveta, data: lembranca.data ?? '', hora: lembranca.hora ?? '' }}
          escolheGaveta={false}
          rotuloDoBotao="Guardar a correção"
          onSalvar={async (campos) => {
            const resultado = await onCorrigir(lembranca.id, campos);
            if (resultado.ok) setModo('ver');
            return resultado;
          }}
          onCancelar={() => setModo('ver')}
        />
      </li>
    );
  }

  const handleApagar = async () => {
    setApagando(true);
    setFalhou(false);
    const resultado = await onApagar(lembranca.id);
    setApagando(false);
    if (!resultado.ok) setFalhou(true);
  };

  return (
    <li className="flex list-none flex-col gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
      {gaveta === 'compromisso' && lembranca.data ? (
        <p className="text-base font-semibold text-foreground">{quandoDoCompromisso(lembranca.data, lembranca.hora)}</p>
      ) : null}
      <p className="text-base text-foreground">
        {lembranca.texto}
        {lembranca.exemplo ? (
          <>
            <span aria-hidden="true">*</span>
            <span className="sr-only"> (dado de exemplo)</span>
          </>
        ) : null}
      </p>
      <p className="text-base text-muted-foreground">{quemContou(lembranca, tratamento)}</p>

      {modo === 'confirmar_apagar' ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base text-foreground">Apagar de vez?</span>
          <button
            type="button"
            onClick={handleApagar}
            disabled={apagando}
            className={`${CLASSE_DO_LINK} text-destructive`}
          >
            {apagando ? 'Apagando...' : 'Sim, apagar'}
          </button>
          <button type="button" onClick={() => setModo('ver')} className={`${CLASSE_DO_LINK} text-muted-foreground`}>
            Não
          </button>
        </div>
      ) : (
        <div className="-ml-2 flex flex-wrap gap-2">
          {lembranca.origem === 'deduzida' ? (
            <button
              type="button"
              onClick={async () => {
                setFalhou(false);
                const resultado = await onCorrigir(lembranca.id, {});
                if (!resultado.ok) setFalhou(true);
              }}
              aria-label={`Está certo: ${lembranca.texto}`}
              className={`${CLASSE_DO_LINK} text-foreground`}
            >
              Está certo
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setModo('corrigir')}
            aria-label={`Corrigir: ${lembranca.texto}`}
            className={`${CLASSE_DO_LINK} text-foreground`}
          >
            Corrigir
          </button>
          <button
            type="button"
            onClick={() => setModo('confirmar_apagar')}
            aria-label={`Apagar: ${lembranca.texto}`}
            className={`${CLASSE_DO_LINK} text-muted-foreground`}
          >
            Apagar
          </button>
        </div>
      )}
      <Erro texto={falhou ? 'Não deu certo agora. Tente de novo.' : null} />
    </li>
  );
}
