'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';
import { LogOut, Settings, Smartphone, LayoutDashboard } from 'lucide-react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { IdosoDaFamilia } from '@/lib/tipos';
import { enderecoCom } from './api';
import { sair } from './conta';
import { comMaiuscula } from './formatos';

export type TelaDaFamilia = 'painel' | 'aparelho' | 'ajustes' | 'novo';

interface BarraDoTopoProps {
  idosos: IdosoDaFamilia[] | null;
  idoso: IdosoDaFamilia | null;
  onEscolher: (id: string) => void;
  ativa: TelaDaFamilia;
}

const CLASSE_DO_LINK =
  'inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function classeDo(ativo: boolean): string {
  return `${CLASSE_DO_LINK} ${
    ativo ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;
}

/** A marca, o idoso que está na tela e os caminhos do lado da família. */
export function BarraDoTopo({ idosos, idoso, onEscolher, ativa }: BarraDoTopoProps) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  const id = idoso?.id ?? null;

  const handleEscolher = (evento: ChangeEvent<HTMLSelectElement>) => {
    onEscolher(evento.target.value);
  };

  const handleSair = async () => {
    setSaindo(true);
    await sair();
    router.replace('/entrar');
  };

  return (
    <header className="flex flex-col gap-3 border-b border-border pb-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={enderecoCom('/familia', id)}
          className="text-xl font-bold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {NOME_DA_ASSISTENTE}
        </Link>
        <button
          type="button"
          onClick={handleSair}
          disabled={saindo}
          className={`${CLASSE_DO_LINK} text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60`}
        >
          <LogOut aria-hidden="true" className="h-5 w-5" />
          {saindo ? 'Saindo...' : 'Sair'}
        </button>
      </div>

      {idosos && idosos.length > 1 && idoso ? (
        <label className="flex flex-col gap-1 text-base text-muted-foreground">
          Acompanhando
          <select
            value={idoso.id}
            onChange={handleEscolher}
            className="min-h-11 rounded-lg border border-border bg-card px-3 text-lg font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {idosos.map((item) => (
              <option key={item.id} value={item.id}>
                {comMaiuscula(item.tratamento)}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {id ? (
        <nav aria-label="Telas da família" className="-mx-1 flex flex-wrap gap-1">
          <Link href={enderecoCom('/familia', id)} className={classeDo(ativa === 'painel')}>
            <LayoutDashboard aria-hidden="true" className="h-5 w-5" />
            Painel
          </Link>
          <Link
            href={enderecoCom('/familia/aparelho', id)}
            className={classeDo(ativa === 'aparelho')}
          >
            <Smartphone aria-hidden="true" className="h-5 w-5" />
            Ligar o aparelho
          </Link>
          <Link href={enderecoCom('/familia/ajustes', id)} className={classeDo(ativa === 'ajustes')}>
            <Settings aria-hidden="true" className="h-5 w-5" />
            Ajustes
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
