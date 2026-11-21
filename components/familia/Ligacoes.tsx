'use client';

import { Phone, PhoneCall } from 'lucide-react';
import type { PainelDaFamilia } from '@/lib/tipos';
import { CLASSES_DO_TOM, resultadoDaLigacao } from './formatos';
import { HorariosDaLigacao } from './HorariosDaLigacao';
import type { PedidoDeLigacao } from './usePainel';

interface LigacoesProps {
  painel: PainelDaFamilia;
  pedido: PedidoDeLigacao;
  onLigar: () => void;
  onTrocarHorarios: (horarios: string[]) => void;
  onTrocarAtenderSozinho: (ligado: boolean) => void;
}

interface BotaoDeLigarProps {
  painel: PainelDaFamilia;
  pedido: PedidoDeLigacao;
  onLigar: () => void;
}

const CLASSE_DO_BOTAO =
  'inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-primary px-6 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70';

function BotaoDeLigar({ painel, pedido, onLigar }: BotaoDeLigarProps) {
  const emLigacao = painel.ultimaConversa?.emAndamento === true;
  const tocando = painel.chamadaTocando !== null;

  if (emLigacao) {
    return (
      <button type="button" disabled className={CLASSE_DO_BOTAO}>
        <PhoneCall aria-hidden="true" className="h-6 w-6" />
        Em ligação agora
      </button>
    );
  }

  if (tocando) {
    return (
      <button type="button" disabled className={CLASSE_DO_BOTAO}>
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 animate-pulse rounded-full bg-primary-foreground"
        />
        Tocando no aparelho de {painel.idoso.tratamento}...
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
      {pedido === 'pedindo' ? 'Ligando...' : 'Ligar agora'}
    </button>
  );
}

interface ChaveProps {
  ligado: boolean;
  onTrocar: (ligado: boolean) => void;
}

function AtenderSozinho({ ligado, onTrocar }: ChaveProps) {
  const handleTrocar = () => onTrocar(!ligado);

  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby="rotulo-atender-sozinho"
        aria-describedby="ajuda-atender-sozinho"
        onClick={handleTrocar}
        className={`relative mt-0.5 inline-flex h-11 w-[72px] shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          ligado ? 'border-primary bg-primary' : 'border-border bg-muted'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-8 w-8 rounded-full bg-card shadow transition-transform ${
            ligado ? 'translate-x-9' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex min-w-0 flex-col gap-1">
        <p id="rotulo-atender-sozinho" className="text-base font-medium text-foreground">
          Atender sozinho depois de 10 segundos tocando
        </p>
        <p id="ajuda-atender-sozinho" className="text-base text-muted-foreground">
          Pra quem tem dificuldade de tocar na tela.
        </p>
      </div>
    </div>
  );
}

/** O cartão das ligações: ligar agora, as horas de todo dia e o atender sozinho. */
export function Ligacoes({
  painel,
  pedido,
  onLigar,
  onTrocarHorarios,
  onTrocarAtenderSozinho,
}: LigacoesProps) {
  const ultima = painel.chamadas[0];
  const resultado = ultima ? resultadoDaLigacao(ultima, painel.hoje.data) : null;
  const naoDeu = pedido === 'falhou' && painel.chamadaTocando === null;

  return (
    <section
      aria-labelledby="titulo-das-ligacoes"
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5"
    >
      <h2 id="titulo-das-ligacoes" className="text-xl font-semibold text-foreground">
        Ligações
      </h2>

      <div className="flex flex-col gap-2">
        <BotaoDeLigar painel={painel} pedido={pedido} onLigar={onLigar} />
        <div aria-live="polite" className="flex flex-col gap-1">
          {naoDeu ? (
            <p className="text-base text-muted-foreground">Não deu pra ligar agora.</p>
          ) : null}
          {resultado ? (
            <p className={`text-base ${CLASSES_DO_TOM[resultado.tom].valor}`}>
              {resultado.texto}
            </p>
          ) : null}
        </div>
      </div>

      <HorariosDaLigacao
        horarios={painel.idoso.horariosDeLigacao}
        onTrocar={onTrocarHorarios}
      />

      <AtenderSozinho
        ligado={painel.idoso.atenderSozinho}
        onTrocar={onTrocarAtenderSozinho}
      />
    </section>
  );
}
