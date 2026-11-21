// A landing page da Dona Leda. A ligação toca na tela, o botão Atender funciona e o
// painel da família aparece conforme a pessoa rola. É a direção "Produto em cena",
// escolhida pelo Breno em 21/11/2026 entre três. Ela fala com a filha ou o filho de
// quem mora sozinho, que é quem contrata, e traz mais abaixo uma parte pras casas de
// repouso parceiras, que indicam. O briefing está em conhecimento/landing.md.
// Aparece em dois endereços: em /landing e, desde 21/11/2026, na página inicial de quem
// chega sem aparelho ligado a um idoso (components/Inicio.tsx).

import Link from 'next/link';
import { HeartHandshake, Smartphone } from 'lucide-react';
import { Logo } from '@/components/marca/Logo';
import { AparelhoDoTopo, CamadaEmAbas, CenaDaLigacao } from '@/components/landing/CenaDaLigacao';
import { Disco } from '@/components/landing/Disco';
import {
  ASSINATURA,
  CONFIANCA,
  DEFINICAO,
  DINHEIRO,
  MENSAGEM_DA_CASA,
  MENSAGEM_DO_CONTATO,
  FONTES,
  CASAS,
  SONHO,
} from '@/components/landing/conteudo';
import {
  BotaoDeContato,
  BotaoPrincipal,
  FonteDoNumero,
  Perguntas,
  Rodape,
  SemViuva,
} from '@/components/landing/pecas';
import './landing.css';

const LARGURA = 'mx-auto w-full max-w-6xl px-5 sm:px-8';
const TITULO =
  'font-titulo text-[clamp(2.125rem,6.4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.025em] text-balance';
const CLARO_NO_ESCURO = 'text-[#F3E3C3]';

// No celular os dois caminhos viram uma linha só, pra o topo caber na primeira tela.
const CAMINHO =
  'flex min-h-12 items-center gap-2 rounded-xl px-3 py-2 text-left font-titulo text-[0.95rem] font-semibold leading-tight transition-[background-color,transform] duration-150 active:scale-[0.98] md:min-h-24 md:gap-4 md:rounded-2xl md:px-6 md:py-5 md:text-2xl';
// O ícone some no celular, pra o nome do caminho caber em duas linhas.
const ICONE_DO_CAMINHO = 'hidden h-9 w-9 shrink-0 md:block';
const APOIO_DO_CAMINHO = 'hidden font-sans text-lg font-normal md:block';

/**
 * Os dois caminhos de quem já usa a Dona Leda, os mesmos da tela de boas-vindas
 * (components/BoasVindas.tsx): a família entra na conta e o aparelho do idoso
 * recebe o código de 6 números. Ficam no topo da página inicial, no navegador.
 */
function Caminhos() {
  return (
    <nav
      aria-label="Entrar na Dona Leda"
      className={`${LARGURA} grid grid-cols-[auto_1fr] gap-2 pb-3 pt-1 md:grid-cols-2 md:gap-4 md:pb-4 md:pt-2`}
    >
      <Link href="/entrar" className={`${CAMINHO} bg-background text-foreground hover:bg-white`}>
        <HeartHandshake aria-hidden className={ICONE_DO_CAMINHO} />
        <span>
          Sou da família
          <span className={`${APOIO_DO_CAMINHO} text-muted-foreground`}>Quero acompanhar quem eu cuido</span>
        </span>
      </Link>
      <Link href="/parear" className={`${CAMINHO} border-2 border-[#FFF8E8] hover:bg-white/10`}>
        <Smartphone aria-hidden className={ICONE_DO_CAMINHO} />
        <span>
          Este aparelho vai receber as ligações
          <span className={`${APOIO_DO_CAMINHO} ${CLARO_NO_ESCURO}`}>Vou digitar o código que a família mandou</span>
        </span>
      </Link>
    </nav>
  );
}

interface LandingProps {
  /** Mostra no topo os dois caminhos de quem já usa: a família e o aparelho do idoso. */
  comCaminhos?: boolean;
}

export function Landing({ comCaminhos = false }: LandingProps) {
  return (
    <div className="lp min-h-dvh bg-background text-foreground">
      <div className="lp-escuro bg-primary text-primary-foreground">
        <header className={`${LARGURA} flex items-center justify-between py-5`}>
          <Logo className="text-2xl text-primary-foreground" />
          <Link href="/entrar" className="flex min-h-11 items-center text-lg font-semibold underline hover:no-underline">
            Entrar
          </Link>
        </header>

        {comCaminhos ? <Caminhos /> : null}

        <section className={`${LARGURA} grid items-center gap-14 pb-20 pt-4 sm:pt-8 lg:grid-cols-[1fr_auto] lg:gap-20 lg:pb-24 lg:pt-6`}>
          <div>
            <h1 className="font-titulo text-[1.75rem] font-extrabold leading-[1.06] tracking-[-0.025em] sm:text-[clamp(2.25rem,4.6vw,3.25rem)] sm:leading-[1.04]">
              <SemViuva texto={SONHO[0]} palavras={2} />
              <span className="mt-[0.4em] block">
                <SemViuva texto={SONHO[1]} />
              </span>
            </h1>
            <p className={`mt-5 max-w-[36rem] text-lg leading-normal sm:mt-7 sm:text-[1.375rem] sm:leading-relaxed ${CLARO_NO_ESCURO}`}>
              {DEFINICAO}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <BotaoPrincipal tom="casca" />
              <BotaoDeContato tom="escuro" mensagem={MENSAGEM_DO_CONTATO} />
              <a
                href="#como-funciona"
                className="flex min-h-11 items-center text-lg font-semibold underline hover:no-underline sm:ml-1"
              >
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
            O que ela faz hoje
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

        <section aria-labelledby="casas-titulo" className="bg-secondary">
          <div className={`${LARGURA} py-20 lg:py-28`}>
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
              <div>
                <h2 id="casas-titulo" className={TITULO}>
                  {CASAS.titulo}
                </h2>
                <p className="mt-4 max-w-[44rem] text-xl leading-relaxed sm:text-[1.375rem]">{CASAS.texto}</p>
              </div>
              <BotaoDeContato
                mensagem={MENSAGEM_DA_CASA}
                className="border-primary bg-primary text-primary-foreground hover:bg-[#4A2F17]"
              />
            </div>

            <ul className="mt-12 grid gap-x-10 gap-y-9 md:grid-cols-3">
              {CASAS.itens.map((item) => (
                <li key={item.titulo} className="border-t-2 border-foreground pt-5">
                  <h3 className="font-titulo text-[1.625rem] font-bold leading-tight tracking-[-0.01em]">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed sm:text-xl">{item.texto}</p>
                </li>
              ))}
            </ul>

            {/* A tela de verdade, com pessoas de exemplo. Mora em /telas/ver/casa, com os botões travados. */}
            <figure className="mt-12">
              <div className="overflow-hidden rounded-2xl border-[10px] border-[#1F1308] bg-background shadow-[0_30px_60px_-30px_rgba(51,32,15,0.65)]">
                <iframe
                  src="/telas/ver/casa"
                  title={CASAS.legendaDaTela}
                  scrolling="no"
                  tabIndex={-1}
                  className="pointer-events-none block h-[520px] w-full bg-background lg:h-[600px]"
                />
              </div>
              <figcaption className="mt-3 text-base leading-relaxed">{CASAS.legendaDaTela}</figcaption>
            </figure>
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
          <div className="relative mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <BotaoPrincipal tom="casca" />
            <BotaoDeContato tom="escuro" mensagem={MENSAGEM_DO_CONTATO} />
          </div>
          <Rodape tom="escuro" className="relative mt-16 border-t border-[#FFF8E8]/25 pt-8" />
        </section>
      </div>
    </div>
  );
}
