'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { MotivoDaFalha } from '@/types/conversation';
import { BotaoGrande } from './BotaoGrande';
import { comPreposicao, quandoElaLiga } from './horarios';
import { Rosto } from './Rosto';

const TITULO =
  'max-w-md text-balance text-center text-3xl font-semibold sm:text-4xl';
const APOIO = 'max-w-md text-balance text-center text-xl text-muted-foreground';
const MIOLO = 'flex w-full flex-1 flex-col items-center justify-center gap-8';

const AVISO_DE_FALHA: Record<MotivoDaFalha, string> = {
  microfone:
    'Preciso do microfone pra te ouvir. Toque em Permitir quando o celular perguntar.',
  conexao: 'Não consegui ligar agora.',
};

interface PrepararAparelhoProps {
  negado: boolean;
  onPreparar: () => void;
}

/** Primeira vez neste aparelho: o filho libera o microfone e o som com um toque. */
export function PrepararAparelho({ negado, onPreparar }: PrepararAparelhoProps) {
  return (
    <div className={MIOLO}>
      <Rosto estado="parada" nivel={0} />
      <h1 className={TITULO}>
        Deixe este aparelho pronto pra receber as ligações da{' '}
        {NOME_DA_ASSISTENTE}.
      </h1>
      {negado ? (
        <p role="alert" className="max-w-md text-center text-xl font-medium">
          {AVISO_DE_FALHA.microfone}
        </p>
      ) : (
        <p className={APOIO}>
          É um toque só. O aparelho vai pedir pra usar o microfone.
        </p>
      )}
      <BotaoGrande onClick={onPreparar}>Deixar pronto</BotaoGrande>
    </div>
  );
}

interface EsperandoProps {
  horarios: readonly string[];
  proxima: string | null;
  onLigar: () => void;
}

/** O aparelho pronto, esperando a assistente ligar. O idoso também pode chamar. */
export function Esperando({ horarios, proxima, onLigar }: EsperandoProps) {
  return (
    <>
      <div className={MIOLO}>
        <Rosto estado="parada" nivel={0} />
        <h1 className={TITULO}>{quandoElaLiga(NOME_DA_ASSISTENTE, horarios)}</h1>
        {proxima && horarios.length > 1 ? (
          <p className={APOIO}>A próxima ligação é {comPreposicao(proxima)}.</p>
        ) : null}
        <BotaoGrande onClick={onLigar}>
          <Phone aria-hidden className="h-7 w-7 shrink-0" />
          Ligar pra {NOME_DA_ASSISTENTE} agora
        </BotaoGrande>
      </div>
      <Link
        href="/familia"
        className="inline-flex min-h-11 items-center rounded-lg px-3 text-lg text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Painel da família
      </Link>
    </>
  );
}

/** Entre atender (ou chamar) e a assistente entrar na ligação. */
export function Ligando() {
  return (
    <div className={MIOLO}>
      <Rosto estado="ligando" nivel={0} />
      <h1 role="status" className={TITULO}>
        Ligando...
      </h1>
    </div>
  );
}

interface AvisoDeFalhaProps {
  motivo: MotivoDaFalha;
  onTentar: () => void;
  /** Sem `onVoltar` a tela só oferece tentar de novo. */
  onVoltar?: () => void;
}

/** A ligação não completou: uma frase simples, tentar de novo ou voltar a esperar. */
export function AvisoDeFalha({ motivo, onTentar, onVoltar }: AvisoDeFalhaProps) {
  return (
    <div className={MIOLO}>
      <Rosto estado="parada" nivel={0} />
      <p role="alert" className="max-w-md text-center text-2xl font-medium">
        {AVISO_DE_FALHA[motivo]}
      </p>
      <div className="flex w-full flex-col items-center gap-4">
        <BotaoGrande onClick={onTentar}>Tentar de novo</BotaoGrande>
        {onVoltar ? (
          <BotaoGrande tom="discreto" className="text-xl" onClick={onVoltar}>
            Voltar
          </BotaoGrande>
        ) : null}
      </div>
    </div>
  );
}
