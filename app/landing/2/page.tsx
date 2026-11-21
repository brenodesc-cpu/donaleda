// Direção 2 da landing: Produto em cena. A ligação toca na tela, o botão Atender
// funciona e o painel da família aparece conforme a pessoa rola.
// O briefing está em conhecimento/landing.md.

import Link from 'next/link';
import { Logo } from '@/components/marca/Logo';
import { AparelhoDoTopo, CamadaEmAbas, CenaDaLigacao } from '@/components/landing/CenaDaLigacao';
import { Disco } from '@/components/landing/Disco';
import {
  ASSINATURA,
  CONFIANCA,
  DEFINICAO,
  DINHEIRO,
  EMAIL_DE_CONTATO,
  FONTES,
  RESIDENCIAIS,
  SONHO,
} from '@/components/landing/conteudo';
import {
  BotaoPrincipal,
  FaixaDeEscolha,
  FonteDoNumero,
  Perguntas,
  Rodape,
  SemViuva,
} from '@/components/landing/pecas';

const LARGURA = 'mx-auto w-full max-w-6xl px-5 sm:px-8';
const TITULO =
  'font-titulo text-[clamp(2.125rem,6.4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.025em] text-balance';
const CLARO_NO_ESCURO = 'text-[#F3E3C3]';

export default function LandingProdutoEmCena() {
  return (
    <div className="lp min-h-dvh bg-background text-foreground">
      <FaixaDeEscolha atual={2} />

      <div className="lp-escuro bg-primary text-primary-foreground">
        <header className={`${LARGURA} flex items-center justify-between py-5`}>
          <Logo className="text-2xl text-primary-foreground" />
          <Link href="/entrar" className="flex min-h-11 items-center text-lg font-semibold underline hover:no-underline">
            Entrar
          </Link>
        </header>

        <section className={`${LARGURA} grid items-center gap-14 pb-20 pt-8 lg:grid-cols-[1fr_auto] lg:gap-20 lg:pb-28 lg:pt-12`}>
          <div>
            <h1 className="font-titulo text-[clamp(2.25rem,7.6vw,4.25rem)] font-extrabold leading-[1.03] tracking-[-0.025em] text-balance">
              <SemViuva texto={SONHO[0]} />
              <span className="mt-[0.4em] block">
                <SemViuva texto={SONHO[1]} />
              </span>
            </h1>
            <p className={`mt-8 max-w-[36rem] text-xl leading-relaxed sm:text-[1.375rem] ${CLARO_NO_ESCURO}`}>
              {DEFINICAO}
            </p>
            <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
              <BotaoPrincipal tom="casca" />
              <a href="#como-funciona" className="flex min-h-11 items-center text-lg font-semibold underline hover:no-underline">
                Ver como funciona
              </a>
            </div>
          </div>
          <AparelhoDoTopo />
        </section>

        <section id="como-funciona" aria-labelledby="cena-titulo" className={`${LARGURA} pb-20 lg:pb-10`}>
          <h2 id="cena-titulo" className={`${TITULO} max-w-[18ch]`}>
            Ela liga, a pessoa atende e você fica sabendo
          </h2>
          <div className="mt-14 lg:mt-4">
            <CenaDaLigacao />
          </div>
        </section>
      </div>

      <main>
        <section aria-labelledby="camada-titulo" className={`${LARGURA} py-20 lg:py-28`}>
          <h2 id="camada-titulo" className={TITULO}>
            O que ela cuida hoje
          </h2>
          <p className="mt-4 max-w-[40rem] text-xl leading-relaxed text-muted-foreground">
            Escolha uma necessidade pra ver o que a Dona Leda já faz em cada uma.
          </p>
          <div className="mt-9">
            <CamadaEmAbas />
          </div>
        </section>

        <section aria-labelledby="dinheiro-titulo" className="bg-accent text-accent-foreground">
          <div className={`${LARGURA} grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28`}>
            <h2 id="dinheiro-titulo" className={TITULO}>
              <SemViuva texto={DINHEIRO[0]} />
              <span className="mt-[0.4em] block">
                <SemViuva texto={DINHEIRO[1]} />
              </span>
            </h2>
            <div>
              <div className="flex flex-col gap-6">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-xl font-semibold">Cuidador de 12 horas por dia</p>
                    <p className="numeros whitespace-nowrap font-titulo text-2xl font-extrabold">R$ 2.800 a 4.500</p>
                  </div>
                  <div aria-hidden className="mt-3 h-9 rounded-xl bg-primary" />
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="whitespace-nowrap text-xl font-semibold">Dona Leda</p>
                    <p className="whitespace-nowrap font-titulo text-2xl font-extrabold">menos de um décimo</p>
                  </div>
                  <div aria-hidden className="mt-3 h-9 w-[7%] min-w-6 rounded-xl bg-primary" />
                </div>
              </div>
              <p className="mt-8 text-lg leading-relaxed">
                Por mês. 62,5% de quem recebe do INSS ganha um salário mínimo, de R$ 1.621, e só o piso do salário de
                um cuidador com carteira é de R$ 1.760,44.
              </p>
              <p className="mt-4 text-base leading-relaxed">
                Fontes: <FonteDoNumero fonte={FONTES.cidesp} />; <FonteDoNumero fonte={FONTES.inss} />;{' '}
                <FonteDoNumero fonte={FONTES.caged} />.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="confianca-titulo" className={`${LARGURA} py-20 lg:py-28`}>
          <h2 id="confianca-titulo" className={TITULO}>
            O que ela faz e o que ela não faz
          </h2>
          <ul className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
            {CONFIANCA.map((regra) => (
              <li key={regra.titulo} className="border-t-2 border-foreground pt-5">
                <h3 className="font-titulo text-[1.625rem] font-bold leading-tight tracking-[-0.01em] sm:text-[1.75rem]">
                  {regra.titulo}
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground sm:text-xl">{regra.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="residenciais-titulo" className="bg-secondary">
          <div className={`${LARGURA} grid gap-8 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16 lg:py-20`}>
            <div>
              <h2 id="residenciais-titulo" className="font-titulo text-4xl font-extrabold tracking-[-0.02em]">
                {RESIDENCIAIS.titulo}
              </h2>
              <p className="mt-4 max-w-[42rem] text-xl leading-relaxed">{RESIDENCIAIS.texto}</p>
            </div>
            <a
              href={`mailto:${EMAIL_DE_CONTATO}?subject=Dona%20Leda%20no%20residencial`}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-foreground px-7 py-3 font-titulo text-xl font-bold hover:bg-background"
            >
              {RESIDENCIAIS.botao}
            </a>
          </div>
        </section>

        <section aria-labelledby="perguntas-titulo" className={`${LARGURA} py-20 lg:py-28`}>
          <div className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:gap-16">
            <h2 id="perguntas-titulo" className={TITULO}>
              Perguntas frequentes
            </h2>
            <Perguntas />
          </div>
        </section>
      </main>

      <div className="lp-escuro overflow-hidden bg-primary text-primary-foreground">
        <section className={`${LARGURA} relative py-20 lg:py-28`}>
          <Disco
            girando
            trava="#FFF8E8"
            furo="#33200F"
            semRosto
            className="pointer-events-none absolute -right-28 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 md:block"
          />
          <p className={`${TITULO} relative max-w-[16ch]`}>{ASSINATURA}</p>
          <BotaoPrincipal tom="casca" className="relative mt-9 w-full sm:w-auto" />
          <Rodape tom="escuro" className="relative mt-16 border-t border-[#FFF8E8]/25 pt-8" />
        </section>
      </div>
    </div>
  );
}
