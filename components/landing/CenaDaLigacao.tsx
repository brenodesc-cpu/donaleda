'use client';

// As partes interativas da landing page. No topo, o celular toca e o botão Atender
// funciona. Em "como funciona", o celular fica parado na tela larga e troca de
// tela conforme a pessoa rola; no celular de quem lê, cada passo traz a sua tela.

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CAMADA } from './conteudo';
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
        {atendeu
          ? 'É assim que a conversa começa. A frase é a da primeira ligação, com uma pessoa de exemplo.'
          : 'Esta é a tela que a pessoa vê. Toque em Atender.'}
      </p>
    </div>
  );
}

type Tela = 'tocando' | 'conversa' | 'dia' | 'aviso' | 'semana';

const CENAS: Array<{ tela: Tela; titulo: string; texto: string; onde: string }> = [
  {
    tela: 'tocando',
    titulo: 'Na hora marcada, a Dona Leda liga',
    texto:
      'O celular ou o tablet toca como uma chamada de vídeo comum. A família escolhe os horários e também pode pedir uma ligação na hora.',
    onde: 'No aparelho do seu pai ou da sua mãe',
  },
  {
    tela: 'conversa',
    titulo: 'A pessoa só atende',
    texto:
      'Um toque no botão verde e a conversa começa. Ela se apresenta como assistente virtual, pergunta do sono, da comida, do remédio e da dor, e lembra do que ouviu nos outros dias.',
    onde: 'No aparelho do seu pai ou da sua mãe',
  },
  {
    tela: 'dia',
    titulo: 'Você vê como foi o dia',
    texto: 'Depois da ligação, o painel da família mostra a ficha do dia e um resumo curto da conversa.',
    onde: 'No seu celular',
  },
  {
    tela: 'aviso',
    titulo: 'O aviso chega quando a pessoa conta uma queda ou um golpe',
    texto:
      'Queda, dor no peito, pedido de dinheiro ou senha e ligação não atendida viram aviso no painel. Os de queda e de golpe saem por regra fixa.',
    onde: 'No seu celular',
  },
  {
    tela: 'semana',
    titulo: 'E você acompanha a semana',
    texto:
      'O painel soma em quantos dos últimos 7 dias a pessoa saiu de casa e conversou com alguém. Pra saber dela agora, é só pedir uma ligação.',
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
              <p className="mt-4 text-xl leading-relaxed text-[#F3E3C3] sm:text-[1.375rem]">{cena.texto}</p>
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

/** A camada de cuidado em abas: uma necessidade por vez, com o que ela faz hoje. */
export function CamadaEmAbas() {
  const [ativa, setAtiva] = useState(0);
  const abas = useRef<Array<HTMLButtonElement | null>>([]);

  function irPara(indice: number) {
    const proxima = (indice + CAMADA.length) % CAMADA.length;
    setAtiva(proxima);
    abas.current[proxima]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="O que a Dona Leda faz em cada necessidade" className="flex flex-wrap gap-2.5">
        {CAMADA.map((parte, i) => (
          <button
            key={parte.nome}
            ref={(no) => {
              abas.current[i] = no;
            }}
            type="button"
            role="tab"
            id={`aba-${i}`}
            aria-selected={i === ativa}
            aria-controls="painel-da-camada"
            tabIndex={i === ativa ? 0 : -1}
            onClick={() => setAtiva(i)}
            onKeyDown={(evento) => {
              if (evento.key === 'ArrowRight') irPara(i + 1);
              if (evento.key === 'ArrowLeft') irPara(i - 1);
            }}
            className={cn(
              'min-h-12 rounded-full border-2 px-5 font-titulo text-lg font-bold transition-colors sm:text-xl',
              i === ativa
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-foreground/30 hover:border-foreground',
            )}
          >
            {parte.nome}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id="painel-da-camada"
        aria-labelledby={`aba-${ativa}`}
        className="mt-8 min-h-[15rem] sm:min-h-[11rem]"
      >
        <p
          key={ativa}
          className="lp-tela-entra max-w-[24ch] font-titulo text-[clamp(1.75rem,5.2vw,3rem)] font-bold leading-[1.12] tracking-[-0.015em] sm:max-w-[30ch]"
        >
          {CAMADA[ativa].hoje}
        </p>
      </div>
    </div>
  );
}
