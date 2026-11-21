'use client';

import Link from 'next/link';
import { Phone, PhoneCall } from 'lucide-react';
import type { PainelDaFamilia } from '@/lib/tipos';
import { horariosEmFrase } from '@/components/horarios';
import { enderecoCom } from './api';
import { CLASSES_DO_TOM, resultadoDaLigacao } from './formatos';
import type { PedidoDeLigacao } from './usePainel';

interface LigacoesProps {
  painel: PainelDaFamilia;
  idosoId: string;
  pedido: PedidoDeLigacao;
  onLigar: () => void;
}

const CLASSE_DO_BOTAO =
  'inline-flex min-h-[60px] w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 font-titulo text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70';

function BotaoDeLigar({ painel, pedido, onLigar }: Omit<LigacoesProps, 'idosoId'>) {
  const { tratamento } = painel.idoso;

  if (painel.ultimaConversa?.emAndamento) {
    return (
      <button type="button" disabled className={CLASSE_DO_BOTAO}>
        <PhoneCall aria-hidden="true" className="h-6 w-6" />
        Em ligação agora
      </button>
    );
  }

  if (painel.chamadaTocando) {
    return (
      <button type="button" disabled className={CLASSE_DO_BOTAO}>
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary-foreground"
        />
        Tocando no aparelho de {tratamento}...
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onLigar}
      disabled={pedido === 'pedindo'}
      className={CLASSE_DO_BOTAO}
    >
      <Phone aria-hidden="true" className="h-6 w-6" />
      {pedido === 'pedindo' ? 'Ligando...' : `Ligar agora pra ${tratamento}`}
    </button>
  );
}

function horariosEmPalavras(horarios: string[]): string {
  const frase = horariosEmFrase(horarios);
  return frase ? `Liga todo dia ${frase}.` : 'Nenhum horário marcado.';
}

/** O botão grande de ligar, o resultado da última ligação e as horas de todo dia. */
export function Ligacoes({ painel, idosoId, pedido, onLigar }: LigacoesProps) {
  const ultima = painel.chamadas[0];
  const resultado = ultima ? resultadoDaLigacao(ultima, painel.hoje.data) : null;
  const naoDeu = pedido === 'falhou' && painel.chamadaTocando === null;

  return (
    <section aria-label="Ligações" className="flex flex-col gap-2">
      <BotaoDeLigar painel={painel} pedido={pedido} onLigar={onLigar} />
      {painel.aparelhoOnline === true ? (
        <p className="flex items-center gap-2 text-sm text-success">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 rounded-full bg-success"
          />
          Aparelho aberto e pronto pra receber a ligação
        </p>
      ) : painel.aparelhoOnline === false ? (
        <p className="text-sm text-muted-foreground">
          O aparelho de {painel.idoso.tratamento} parece estar com a tela fechada agora. A
          ligação só toca quando o app da Dona Leda estiver aberto na tela.
        </p>
      ) : null}
      <div aria-live="polite" className="flex flex-col gap-1">
        {naoDeu ? (
          <p className="text-base font-medium text-foreground">
            Não deu pra ligar agora. Confira se o aparelho está ligado na internet.
          </p>
        ) : null}
        {resultado ? (
          <p
            className={`text-base ${
              resultado.tom === 'atencao'
                ? 'text-foreground font-medium'
                : CLASSES_DO_TOM[resultado.tom].valor
            }`}
          >{resultado.texto}</p>
        ) : null}
      </div>
      <p className="text-base text-muted-foreground">
        {horariosEmPalavras(painel.idoso.horariosDeLigacao)}{' '}
        <Link
          href={enderecoCom('/familia/ajustes', idosoId)}
          className="inline-flex min-h-11 items-center px-1 font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
        >
          Mudar
        </Link>
      </p>
    </section>
  );
}
