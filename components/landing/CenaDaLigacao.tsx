'use client';

// As partes interativas da landing page. No topo, o celular toca e o botão Atender
// funciona. Em "como funciona", o celular fica parado na tela larga e troca de
// tela conforme a pessoa rola; no celular de quem lê, cada passo traz a sua tela.

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Aparelho, TelaConversa, TelaPainel, TelaTocando } from './Aparelho';

/** O celular do topo: toca até a pessoa tocar em Atender. */
export function AparelhoDoTopo() {
  const [atendeu, setAtendeu] = useState(false);
  return (
    <div className="flex flex-col items-center gap-4">
      <Aparelho>
        <div key={atendeu ? 'conversa' : 'tocando'} className="lp-tela-entra h-full">
          {atendeu ? (
            <TelaConversa onDesligar={() => setAtendeu(false)} />
          ) : (
            <TelaTocando onAtender={() => setAtendeu(true)} />
          )}
        </div>
      </Aparelho>
      <p aria-live="polite" className="max-w-[17rem] text-center text-base leading-snug text-[#F3E3C3]">
        {atendeu ? 'A frase da primeira ligação, com uma pessoa de exemplo.' : 'Toque em Atender.'}
      </p>
    </div>
  );
}

type Tela = 'tocando' | 'conversa' | 'dia' | 'aviso' | 'semana';

const CENAS: Array<{ tela: Tela; titulo: string; texto?: string; onde: string }> = [
  {
    tela: 'tocando',
    titulo: 'Na hora marcada, a Dona Leda liga',
    texto: 'Você escolhe os horários e também pode pedir uma ligação na hora.',
    onde: 'No aparelho do seu pai ou da sua mãe',
  },
  {
    tela: 'conversa',
    titulo: 'A pessoa só atende',
    texto: 'Ela pergunta do sono, da comida, do remédio e da dor, e lembra do que ouviu nos outros dias.',
    onde: 'No aparelho do seu pai ou da sua mãe',
  },
  {
    tela: 'dia',
    titulo: 'Você vê como foi o dia',
    onde: 'No seu celular',
  },
  {
    tela: 'aviso',
    titulo: 'O aviso chega quando a pessoa conta uma queda ou um golpe',
    texto: 'Dor no peito e ligação não atendida também viram aviso.',
    onde: 'No seu celular',
  },
  {
    tela: 'semana',
    titulo: 'E você acompanha a semana',
    texto: 'Em quantos dos últimos 7 dias a pessoa saiu de casa e conversou com alguém.',
    onde: 'No seu celular',
  },
];

function TelaDaCena({ tela }: { tela: Tela }) {
  if (tela === 'tocando') return <TelaTocando />;
  if (tela === 'conversa') return <TelaConversa />;
  return <TelaPainel parte={tela} />;
}

/** "Como funciona": o celular acompanha a rolagem. */
export function CenaDaLigacao() {
  const [ativa, setAtiva] = useState(0);
  const passos = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    // Vale o passo que cruza o meio da tela.
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          const indice = passos.current.indexOf(entrada.target as HTMLLIElement);
          if (indice >= 0) setAtiva(indice);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const passo of passos.current) if (passo) observador.observe(passo);
    return () => observador.disconnect();
  }, []);

  return (
    <div className="lg:grid lg:grid-cols-[auto_1fr] lg:gap-20">
      <div aria-hidden className="hidden lg:block">
        <div className="sticky top-[max(1.5rem,calc(50vh-310px))] flex flex-col items-center gap-4">
          <Aparelho>
            <div key={CENAS[ativa].tela} className="lp-tela-entra h-full">
              <TelaDaCena tela={CENAS[ativa].tela} />
            </div>
          </Aparelho>
          <p className="text-base text-[#F3E3C3]">{CENAS[ativa].onde}</p>
        </div>
      </div>

      <ol className="flex flex-col gap-20 lg:gap-0">
        {CENAS.map((cena, i) => (
          <li
            key={cena.tela}
            ref={(no) => {
              passos.current[i] = no;
            }}
            className="flex flex-col gap-8 lg:min-h-[78vh] lg:justify-center"
          >
            <div
              className={cn(
                'max-w-[34rem] transition-opacity duration-300',
                i === ativa ? 'lg:opacity-100' : 'lg:opacity-45',
              )}
            >
              <h3 className="font-titulo text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] text-balance sm:text-[2.75rem]">
                {cena.titulo}
              </h3>
              {cena.texto ? (
                <p className="mt-4 text-xl leading-relaxed text-[#F3E3C3] sm:text-[1.375rem]">{cena.texto}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-center gap-3 lg:hidden">
              <Aparelho>
                <TelaDaCena tela={cena.tela} />
              </Aparelho>
              <p className="text-base text-[#F3E3C3]">{cena.onde}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
