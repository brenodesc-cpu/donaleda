'use client';

// A barrinha do pé de uma tela de exemplo aberta sozinha (no celular, por exemplo):
// volta pra lista e passa pra tela de antes ou de depois. Dentro da moldura da
// /telas ela some, porque lá o menu já faz isso.

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { telaDaLista, vizinhas } from './lista';

const BOTAO = 'flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 hover:bg-white/15';

export function VoltarPraLista({ tela }: { tela: string }) {
  const [sozinha, setSozinha] = useState(false);
  useEffect(() => {
    setSozinha(window.self === window.top);
  }, []);
  if (!sozinha) return null;

  const { anterior, proxima } = vizinhas(tela);
  return (
    <nav
      aria-label="Telas de exemplo"
      className="fixed inset-x-0 bottom-3 z-[100] mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-[#1F1308] p-1 text-base font-semibold text-[#FFF8E8] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)]"
    >
      <a href={`/telas/ver/${anterior.id}`} aria-label={`Tela anterior: ${anterior.nome}`} className={BOTAO}>
        <ChevronLeft aria-hidden className="h-5 w-5" />
      </a>
      <a href={`/telas#${tela}`} className={BOTAO}>
        <LayoutGrid aria-hidden className="h-5 w-5 shrink-0" />
        <span className="max-w-[11rem] truncate">{telaDaLista(tela)?.nome ?? 'Telas'}</span>
      </a>
      <a href={`/telas/ver/${proxima.id}`} aria-label={`Próxima tela: ${proxima.nome}`} className={BOTAO}>
        <ChevronRight aria-hidden className="h-5 w-5" />
      </a>
    </nav>
  );
}
