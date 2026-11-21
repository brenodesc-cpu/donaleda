'use client';

import { useEffect, useState } from 'react';
import { EVENTO_APARELHO_ESQUECIDO, carregarAparelho } from '@/lib/aparelho';
import { BoasVindas } from './BoasVindas';
import { Rosto } from './Rosto';
import TelaDoIdoso from './TelaDoIdoso';

type Estado = 'conferindo' | 'pareado' | 'sem-par';

/**
 * A primeira tela decide quem está com o aparelho. Aparelho já ligado a um
 * idoso abre direto a tela dele, que espera a ligação. Aparelho novo mostra a
 * escolha entre a família e o idoso.
 */
export function Inicio() {
  const [estado, setEstado] = useState<Estado>('conferindo');

  useEffect(() => {
    let vivo = true;
    void carregarAparelho().then((aparelho) => {
      if (vivo) setEstado(aparelho ? 'pareado' : 'sem-par');
    });
    const aoEsquecer = () => setEstado('sem-par');
    window.addEventListener(EVENTO_APARELHO_ESQUECIDO, aoEsquecer);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_APARELHO_ESQUECIDO, aoEsquecer);
    };
  }, []);

  if (estado === 'pareado') return <TelaDoIdoso />;
  if (estado === 'sem-par') return <BoasVindas />;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <Rosto estado="parada" nivel={0} />
    </main>
  );
}
