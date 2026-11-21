'use client';

import { Phone } from 'lucide-react';
import { FUSO, NOME_DA_ASSISTENTE } from '@/lib/assistente';
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
    'Não consegui usar o microfone. Toque em Tentar de novo e, se o aparelho perguntar, escolha Permitir. Se ele não perguntar, peça pra alguém da família liberar o microfone.',
  conexao: 'A ligação não deu certo. Toque em Tentar de novo.',
};

function minutosAgoraEmBrasilia(): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: FUSO,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .split(':')
    .map(Number);
  return (h % 24) * 60 + m;
}

function emMinutos(hhmm: string): number {
  const [h, m] = hhmm.trim().split(':').map(Number);
  return h * 60 + (m || 0);
}

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
          O microfone não foi liberado. Toque em Deixar pronto e escolha
          Permitir. Se o aparelho não perguntar, libere o microfone nos ajustes
          do aparelho e toque de novo.
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
  const eAmanha =
    proxima !== null &&
    proxima === horarios[0] &&
    emMinutos(proxima) <= minutosAgoraEmBrasilia();
  return (
    <>
      <div className={MIOLO}>
        <Rosto estado="parada" nivel={0} />
        <h1 className={TITULO}>{quandoElaLiga(NOME_DA_ASSISTENTE, horarios)}</h1>
        {proxima && horarios.length > 1 ? (
          <p className={APOIO}>
            A próxima ligação é {eAmanha ? 'amanhã ' : ''}
            {comPreposicao(proxima)}.
          </p>
        ) : null}
        <BotaoGrande className="px-4" onClick={onLigar}>
          <Phone aria-hidden className="h-7 w-7 shrink-0" />
          Ligar pra {NOME_DA_ASSISTENTE}
        </BotaoGrande>
      </div>
    </>
  );
}

/** Entre atender (ou chamar) e a assistente entrar na ligação. */
export function Ligando() {
  return (
    <div className={MIOLO}>
      <Rosto estado="ligando" nivel={0} />
      <h1 role="status" className={TITULO}>
        Só um instante...
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
