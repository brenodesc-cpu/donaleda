'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { ehAppNativo, registrarPushDaFamiliaNativo } from '@/lib/pushNativo';
import type { PainelDaFamilia } from '@/lib/tipos';
import {
  comMaiuscula,
  dataPorExtenso,
  duracaoEmPalavras,
  horaCurta,
  horaDeBrasilia,
  quandoFoi,
} from './formatos';

interface CabecalhoProps {
  painel: PainelDaFamilia;
  onRegistrarPushFamilia?: (
    plataforma: 'android' | 'ios',
    token: string,
    voipToken?: string,
  ) => Promise<boolean>;
}

function Situacao({ painel }: CabecalhoProps) {
  const { assistente, ultimaConversa, conversouHoje, hoje } = painel;

  if (ultimaConversa?.emAndamento) {
    return (
      <p className="flex items-center gap-2 text-lg font-medium text-success">
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 animate-pulse rounded-full bg-success"
        />
        Conversando com a {assistente} agora
      </p>
    );
  }

  if (conversouHoje && ultimaConversa) {
    const hora = horaCurta(horaDeBrasilia(ultimaConversa.inicio));
    const duracao = duracaoEmPalavras(ultimaConversa.minutos);
    return (
      <p className="text-lg text-foreground">
        Conversou com a {assistente}
        {hora ? ` às ${hora}` : ''}
        {duracao ? `, por ${duracao}` : ''}
      </p>
    );
  }

  if (!ultimaConversa) {
    return (
      <div>
        <p className="text-lg font-medium text-foreground">
          Ainda não conversou com a {assistente}
        </p>
        <p className="text-base text-muted-foreground">
          A primeira conversa acontece na próxima ligação marcada, ou agora, se
          você tocar em Ligar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-lg font-medium text-foreground">Ainda não conversou hoje</p>
      <p className="text-base text-muted-foreground">
        Última conversa: {quandoFoi(ultimaConversa.inicio, hoje.data)}
      </p>
    </div>
  );
}

export function Cabecalho({ painel, onRegistrarPushFamilia }: CabecalhoProps) {
  const data = dataPorExtenso(painel.hoje.data);
  const [estadoNotif, setEstadoNotif] = useState<'idle' | 'ativando' | 'ativo' | 'negado'>('idle');

  useEffect(() => {
    if (ehAppNativo()) {
      setEstadoNotif(painel.notificacoesFamiliaAtivas ? 'ativo' : 'idle');
      return;
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') setEstadoNotif('ativo');
      else if (Notification.permission === 'denied') setEstadoNotif('negado');
    }
  }, [painel.idoso.id, painel.notificacoesFamiliaAtivas]);

  const ativarNotificacoes = async () => {
    setEstadoNotif('ativando');
    if (ehAppNativo()) {
      const reg = await registrarPushDaFamiliaNativo();
      if (reg && onRegistrarPushFamilia) {
        const ok = await onRegistrarPushFamilia(reg.plataforma, reg.token, reg.voipToken);
        setEstadoNotif(ok ? 'ativo' : 'negado');
        return;
      }
      setEstadoNotif('negado');
      return;
    }
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setEstadoNotif('negado');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setEstadoNotif(perm === 'granted' ? 'ativo' : 'negado');
    } catch {
      setEstadoNotif('negado');
    }
  };

  return (
    <header className="flex flex-col gap-2">
      {data ? (
        <p className="text-base text-muted-foreground">{comMaiuscula(data)}</p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            {comMaiuscula(painel.idoso.tratamento)} hoje
          </h1>
          <Situacao painel={painel} />
        </div>
        {onRegistrarPushFamilia ? (
          estadoNotif === 'ativo' ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm font-medium text-success">
              <BellRing aria-hidden="true" className="h-4 w-4" />
              Notificações ativas
            </span>
          ) : (
            <button
              type="button"
              disabled={estadoNotif === 'ativando'}
              onClick={() => void ativarNotificacoes()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              <Bell aria-hidden="true" className="h-4 w-4" />
              {estadoNotif === 'ativando'
                ? 'Ativando...'
                : estadoNotif === 'negado'
                  ? 'Permissão negada no aparelho'
                  : 'Ativar notificações neste aparelho'}
            </button>
          )
        ) : null}
      </div>
    </header>
  );
}
