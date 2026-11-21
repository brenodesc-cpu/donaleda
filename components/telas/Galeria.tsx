'use client';

// A página /telas: o menu com todas as telas do app, em três grupos, e a tela
// escolhida dentro de uma moldura. No computador a tela abre ao lado do menu.
// No celular, o menu leva pra tela aberta sozinha, do tamanho do aparelho.

import { useEffect, useState, type MouseEvent } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Monitor, Smartphone } from 'lucide-react';
import { Logo } from '@/components/marca/Logo';
import { cn } from '@/lib/utils';
import { GRUPOS, TELAS, telaDaLista, vizinhas } from './lista';

type Moldura = 'celular' | 'computador';

function telaLarga(): boolean {
  return window.matchMedia('(min-width: 1024px)').matches;
}

const BOTAO_DE_TROCA =
  'flex min-h-11 items-center gap-2 rounded-full border-2 px-4 font-titulo text-base font-bold transition-colors';

export function Galeria() {
  const [ativa, setAtiva] = useState(TELAS[0].id);
  const [moldura, setMoldura] = useState<Moldura>('celular');
  const tela = telaDaLista(ativa) ?? TELAS[0];
  const { anterior, proxima } = vizinhas(tela.id);

  // O endereço guarda a tela aberta (/telas#painel), pra dar pra mandar o link dela.
  useEffect(() => {
    const doEndereco = telaDaLista(window.location.hash.slice(1));
    if (doEndereco) {
      setAtiva(doEndereco.id);
      setMoldura(doEndereco.larga ? 'computador' : 'celular');
    }
  }, []);

  const abrir = (id: string) => {
    setAtiva(id);
    setMoldura(telaDaLista(id)?.larga ? 'computador' : 'celular');
    window.history.replaceState(null, '', `#${id}`);
  };

  // No computador o toque no menu troca a tela ao lado. No celular o link abre a tela sozinha.
  const aoTocarNoMenu = (evento: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!telaLarga()) return;
    evento.preventDefault();
    abrir(id);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[92rem] flex-col gap-3 px-5 pb-6 pt-7 sm:px-8">
        <Logo className="text-2xl" />
        <h1 className="font-titulo text-[clamp(1.875rem,5vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          Todas as telas do app
        </h1>
        <p className="max-w-[46rem] text-lg leading-relaxed text-muted-foreground">
          São as telas de verdade, com pessoas de exemplo. Aqui os botões ficam travados e nada vai pro servidor.
        </p>
      </header>

      <div className="mx-auto grid w-full max-w-[92rem] gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-[19rem_1fr] lg:items-start">
        <nav aria-label="Telas do app" className="flex flex-col gap-7 lg:sticky lg:top-6">
          {GRUPOS.map((grupo) => (
            <section key={grupo.id} aria-labelledby={`grupo-${grupo.id}`}>
              <h2 id={`grupo-${grupo.id}`} className="font-titulo text-xl font-extrabold">
                {grupo.nome}
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                {TELAS.filter((item) => item.grupo === grupo.id).map((item) => {
                  const escolhida = item.id === tela.id;
                  return (
                    <li key={item.id}>
                      <a
                        href={`/telas/ver/${item.id}`}
                        onClick={(evento) => aoTocarNoMenu(evento, item.id)}
                        aria-current={escolhida ? 'true' : undefined}
                        className={cn(
                          'flex min-h-12 flex-col justify-center rounded-xl px-3 py-2 text-lg font-semibold leading-snug',
                          'border border-border bg-card lg:border-transparent lg:bg-transparent',
                          escolhida
                            ? 'lg:bg-primary lg:text-primary-foreground'
                            : 'hover:bg-secondary lg:hover:bg-secondary',
                        )}
                      >
                        {item.nome}
                        <span className="text-base font-normal leading-snug text-muted-foreground lg:hidden">
                          {item.oQueFaz}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>

        <section aria-live="polite" className="hidden min-w-0 flex-col gap-5 lg:flex">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-[44rem]">
              <h2 className="font-titulo text-3xl font-extrabold tracking-[-0.015em]">{tela.nome}</h2>
              <p className="mt-1.5 text-lg leading-relaxed text-muted-foreground">{tela.oQueFaz}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['celular', 'computador'] as const).map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  aria-pressed={moldura === opcao}
                  onClick={() => setMoldura(opcao)}
                  className={cn(
                    BOTAO_DE_TROCA,
                    moldura === opcao
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-foreground/30 hover:border-foreground',
                  )}
                >
                  {opcao === 'celular' ? (
                    <Smartphone aria-hidden className="h-5 w-5" />
                  ) : (
                    <Monitor aria-hidden className="h-5 w-5" />
                  )}
                  {opcao === 'celular' ? 'Celular' : 'Computador'}
                </button>
              ))}
              <a
                href={`/telas/ver/${tela.id}`}
                target="_blank"
                rel="noreferrer"
                className={cn(BOTAO_DE_TROCA, 'border-foreground/30 hover:border-foreground')}
              >
                <ExternalLink aria-hidden className="h-5 w-5" />
                Abrir sozinha
              </a>
            </div>
          </div>

          <div className="flex justify-center rounded-3xl bg-muted px-4 py-8">
            {moldura === 'celular' ? (
              <div className="rounded-[2.75rem] bg-[#1F1308] p-[11px] shadow-[0_30px_60px_-28px_rgba(51,32,15,0.7)]">
                <iframe
                  key={`${tela.id}-celular`}
                  src={`/telas/ver/${tela.id}`}
                  title={`Tela de exemplo: ${tela.nome}`}
                  className="block h-[clamp(560px,calc(100dvh-16rem),780px)] w-[390px] rounded-[2.1rem] bg-background"
                />
              </div>
            ) : (
              <div className="w-full max-w-[1120px] rounded-2xl bg-[#1F1308] p-[10px] shadow-[0_30px_60px_-28px_rgba(51,32,15,0.7)]">
                <iframe
                  key={`${tela.id}-computador`}
                  src={`/telas/ver/${tela.id}`}
                  title={`Tela de exemplo no computador: ${tela.nome}`}
                  className="block h-[clamp(560px,calc(100dvh-16rem),760px)] w-full rounded-lg bg-background"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => abrir(anterior.id)}
              className={cn(BOTAO_DE_TROCA, 'border-foreground/30 hover:border-foreground')}
            >
              <ChevronLeft aria-hidden className="h-5 w-5" />
              {anterior.nome}
            </button>
            <button
              type="button"
              onClick={() => abrir(proxima.id)}
              className={cn(BOTAO_DE_TROCA, 'border-foreground/30 hover:border-foreground')}
            >
              {proxima.nome}
              <ChevronRight aria-hidden className="h-5 w-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
