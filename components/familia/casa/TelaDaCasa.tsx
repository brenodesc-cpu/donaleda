'use client';

import type { ReactNode } from 'react';
import type { PedidoDeLigacao } from '../usePainel';
import { comMaiuscula, dataPorExtenso } from '../formatos';
import { CartaoDoMorador } from './CartaoDoMorador';
import type { ContaDaCasa, Morador } from './ordem';

interface ColunaProps {
  titulo: string;
  moradores: Morador[];
  vazio: string;
  corDaConta: string;
  children: (morador: Morador) => ReactNode;
}

function Coluna({ titulo, moradores, vazio, corDaConta, children }: ColunaProps) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-3">
      <h2 className="flex items-center justify-between gap-2 px-1 font-titulo text-xl font-bold text-foreground">
        {titulo}
        <span className={`rounded-full px-3 py-0.5 font-sans text-base font-semibold ${corDaConta}`}>
          {moradores.length}
        </span>
      </h2>
      {moradores.length > 0 ? (
        <ul className="flex flex-col gap-3">{moradores.map(children)}</ul>
      ) : (
        <p className="px-1 pb-1 text-base text-muted-foreground">{vazio}</p>
      )}
    </section>
  );
}

interface TelaDaCasaProps {
  moradores: Morador[];
  conta: ContaDaCasa;
  /** Agora, em ISO: decide a próxima ligação de quem ainda não conversou. */
  agora: string;
  pedidos?: Record<string, PedidoDeLigacao>;
  onJaVi?: (idosoId: string, alertaIds: string[]) => void;
  onLigar?: (idosoId: string) => void;
}

const nada = () => {};

/** O título e as três colunas: com aviso novo, ainda não conversou hoje e conversou sem aviso. */
export function TelaDaCasa({ moradores, conta, agora, pedidos = {}, onJaVi = nada, onLigar = nada }: TelaDaCasaProps) {
  const data = moradores[0] ? dataPorExtenso(moradores[0].painel.hoje.data) : '';
  const comAviso = moradores.filter((m) => m.situacao === 'urgente' || m.situacao === 'atencao');
  const semConversa = moradores.filter((m) => m.situacao === 'sem_conversa');
  const conversou = moradores.filter((m) => m.situacao === 'conversando' || m.situacao === 'conversou');

  const cartao = (morador: Morador) => (
    <CartaoDoMorador
      key={morador.id}
      morador={morador}
      agora={agora}
      pedido={pedidos[morador.id] ?? 'parado'}
      onJaVi={onJaVi}
      onLigar={onLigar}
    />
  );

  return (
    <>
      <header className="flex flex-col gap-1">
        {data ? <p className="text-base text-muted-foreground">{comMaiuscula(data)}</p> : null}
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Todos os moradores</h1>
        <p className="text-lg text-foreground">
          {conta.moradores} {conta.moradores === 1 ? 'morador' : 'moradores'}
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Coluna
          titulo="Com aviso novo"
          moradores={comAviso}
          vazio="Nenhum aviso novo."
          corDaConta={
            comAviso.length > 0
              ? 'bg-destructive text-destructive-foreground'
              : 'border border-border bg-card text-foreground'
          }
        >
          {cartao}
        </Coluna>
        <Coluna
          titulo="Ainda não conversou hoje"
          moradores={semConversa}
          vazio="Todos já conversaram hoje."
          corDaConta="border border-border bg-card text-foreground"
        >
          {cartao}
        </Coluna>
        <Coluna
          titulo="Conversou hoje, sem aviso"
          moradores={conversou}
          vazio="Ninguém ainda."
          corDaConta="bg-success-soft text-success"
        >
          {cartao}
        </Coluna>
      </div>
    </>
  );
}
