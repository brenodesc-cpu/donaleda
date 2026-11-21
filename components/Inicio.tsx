'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { EVENTO_APARELHO_ESQUECIDO, carregarAparelho } from '@/lib/aparelho';
import { BoasVindas } from './BoasVindas';
import { Rosto } from './Rosto';
import TelaDoIdoso from './TelaDoIdoso';

type Estado = 'conferindo' | 'pareado' | 'sem-par';

/** true dentro do app de iPhone ou Android, false no navegador. */
async function dentroDoApp(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

interface InicioProps {
  /**
   * O que aparece no navegador de quem não tem aparelho ligado a um idoso. A página
   * inicial passa a página de apresentação (components/landing/Landing.tsx), que traz
   * no topo a escolha entre a família e o idoso. Dentro do app de iPhone e Android,
   * e quando nada é passado, vale a tela de boas-vindas.
   */
  semPar?: ReactNode;
}

/**
 * A primeira tela decide quem está com o aparelho. Aparelho já ligado a um
 * idoso abre direto a tela dele, que espera a ligação. Aparelho novo mostra a
 * escolha entre a família e o idoso: no navegador, dentro da página de
 * apresentação; no app, na tela de boas-vindas.
 */
export function Inicio({ semPar }: InicioProps = {}) {
  const [estado, setEstado] = useState<Estado>('conferindo');
  const [noApp, setNoApp] = useState(false);

  useEffect(() => {
    let vivo = true;
    void Promise.all([carregarAparelho(), dentroDoApp()]).then(([aparelho, app]) => {
      if (!vivo) return;
      setNoApp(app);
      setEstado(aparelho ? 'pareado' : 'sem-par');
    });
    const aoEsquecer = () => setEstado('sem-par');
    window.addEventListener(EVENTO_APARELHO_ESQUECIDO, aoEsquecer);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_APARELHO_ESQUECIDO, aoEsquecer);
    };
  }, []);

  if (estado === 'pareado') return <TelaDoIdoso />;
  if (estado === 'sem-par') return semPar && !noApp ? semPar : <BoasVindas />;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <Rosto estado="parada" nivel={0} />
    </main>
  );
}
