// Direção 3 da landing: Conta e prova. Os números do cuidador e do país na frente,
// com a camada de cuidado em tabela, pra quem decide com planilha.
// O briefing está em conhecimento/landing.md.

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Logo } from '@/components/marca/Logo';
import {
  ASSINATURA,
  CAMADA,
  CONTA,
  DEFINICAO,
  DINHEIRO,
  EMAIL_DE_CONTATO,
  FONTES,
  NUNCA,
  ONDE_ELA_ENTRA,
  PAIS,
  PASSOS,
  RESIDENCIAIS,
  SAIDAS_DE_HOJE,
  SEMPRE,
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
  'font-titulo text-[clamp(2rem,5.6vw,3.25rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-balance';
const CABECA_DA_TABELA = 'pb-3 text-left text-base font-semibold text-muted-foreground';
const ROTULO_NO_CELULAR = 'block text-base font-semibold text-muted-foreground md:hidden';

const MAIOR_VALOR = 4500;

/** A conta de um mês: quanto entra, quanto custa um cuidador e onde fica a Dona Leda. */
function ContaDeUmMes() {
  return (
    <div className="rounded-3xl bg-card p-6 text-foreground shadow-[0_28px_60px_-30px_rgba(51,32,15,0.6)] sm:p-8">
      <h2 className="font-titulo text-2xl font-extrabold tracking-[-0.01em] sm:text-[1.75rem]">A conta de um mês</h2>
      <ul className="mt-5 flex flex-col">
        {CONTA.map((linha, i) => (
          <li key={linha.oQue} className="border-t border-foreground/15 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-lg font-semibold leading-snug">{linha.oQue}</span>
              <span className="numeros whitespace-nowrap font-titulo text-2xl font-extrabold">{linha.valor}</span>
            </div>
            <div aria-hidden className="mt-2.5 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="lp-barra h-full rounded-full bg-primary"
                style={{ width: `${(linha.numero / MAIOR_VALOR) * 100}%`, animationDelay: `${i * 120}ms` }}
              />
            </div>
            <p className="mt-2.5 text-base leading-snug text-muted-foreground">
              {linha.detalhe}. Fonte: <FonteDoNumero fonte={linha.fonte} />.
            </p>
          </li>
        ))}
        <li className="mt-1 rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-lg font-semibold">Dona Leda</span>
            <span className="font-titulo text-2xl font-extrabold">menos de um décimo</span>
          </div>
          <div aria-hidden className="mt-2.5 h-3 overflow-hidden rounded-full bg-white/15">
            <div className="lp-barra h-full w-[6%] rounded-full bg-accent" style={{ animationDelay: '480ms' }} />
          </div>
          <p className="mt-2.5 text-base leading-snug text-[#F3E3C3]">
            Do preço de um cuidador, pelo cuidado de todo dia.
          </p>
        </li>
      </ul>
    </div>
  );
}

export default function LandingContaEProva() {
  return (
    <div className="lp min-h-dvh bg-background text-foreground">
      <FaixaDeEscolha atual={3} />

      <div className="bg-accent text-accent-foreground">
        <header className={`${LARGURA} flex items-center justify-between py-5`}>
          <Logo className="text-2xl" />
          <Link href="/entrar" className="flex min-h-11 items-center text-lg font-semibold underline hover:no-underline">
            Entrar
          </Link>
        </header>

        <section className={`${LARGURA} grid gap-12 pb-16 pt-6 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14 lg:pb-24 lg:pt-10`}>
          <div>
            <h1 className="font-titulo text-[clamp(2.125rem,7vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-balance">
              <SemViuva texto={SONHO[0]} />
              <span className="mt-[0.4em] block">
                <SemViuva texto={SONHO[1]} />
              </span>
            </h1>
            <p className="mt-7 max-w-[36rem] text-xl leading-relaxed sm:text-[1.375rem]">{DEFINICAO}</p>
            <BotaoPrincipal className="mt-8 w-full sm:w-auto" />
            <p className="mt-10 max-w-[30rem] font-titulo text-2xl font-bold leading-snug tracking-[-0.01em] sm:text-[1.75rem]">
              {DINHEIRO[0]} {DINHEIRO[1]}
            </p>
          </div>
          <ContaDeUmMes />
        </section>
      </div>

      <main>
        <section aria-labelledby="pais-titulo" className="bg-primary text-primary-foreground">
          <div className={`${LARGURA} py-16 lg:py-20`}>
            <h2 id="pais-titulo" className={TITULO}>
              Quem envelhece no Brasil, em números
            </h2>
            <dl className="mt-10 grid border-t border-[#FFF8E8]/25 md:grid-cols-3">
              {PAIS.map((dado) => (
                <div
                  key={dado.numero}
                  className="border-b border-[#FFF8E8]/25 py-7 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"
                >
                  <dt className="numeros font-titulo text-[clamp(2.5rem,7vw,3.75rem)] font-extrabold leading-none tracking-[-0.02em]">
                    {dado.numero}
                  </dt>
                  <dd className="mt-3 text-xl leading-snug">{dado.oQue}</dd>
                  <dd className="mt-3 text-base text-[#F3E3C3]">{dado.fonte.nome}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="saidas-titulo" className={`${LARGURA} py-16 lg:py-24`}>
          <h2 id="saidas-titulo" className={TITULO}>
            O que a família usa hoje, e o que falta em cada saída
          </h2>
          <table className="mt-10 w-full border-collapse">
            <thead className="hidden md:table-header-group">
              <tr>
                <th scope="col" className={CABECA_DA_TABELA}>
                  O que a família usa
                </th>
                <th scope="col" className={CABECA_DA_TABELA}>
                  Quanto custa
                </th>
                <th scope="col" className={CABECA_DA_TABELA}>
                  O que falta
                </th>
              </tr>
            </thead>
            <tbody>
              {SAIDAS_DE_HOJE.map((saida) => (
                <tr key={saida.oQue} className="block border-t border-foreground/20 py-5 md:table-row md:py-0">
                  <th scope="row" className="block text-left font-titulo text-2xl font-extrabold md:table-cell md:py-5 md:pr-6">
                    {saida.oQue}
                  </th>
                  <td className="mt-2 block md:mt-0 md:table-cell md:py-5 md:pr-6">
                    <span className={ROTULO_NO_CELULAR}>Quanto custa</span>
                    <span className="numeros text-xl font-semibold">{saida.custo}</span>
                    {saida.fonte ? (
                      <span className="block text-base text-muted-foreground">
                        <FonteDoNumero fonte={saida.fonte} />
                      </span>
                    ) : null}
                  </td>
                  <td className="mt-2 block text-xl md:mt-0 md:table-cell md:py-5">
                    <span className={ROTULO_NO_CELULAR}>O que falta</span>
                    {saida.falta}
                  </td>
                </tr>
              ))}
              <tr className="block rounded-2xl bg-accent px-5 py-5 md:table-row md:rounded-none md:px-0 md:py-0">
                <th scope="row" className="block text-left font-titulo text-2xl font-extrabold md:table-cell md:rounded-l-2xl md:py-6 md:pl-5 md:pr-6">
                  Dona Leda
                </th>
                <td className="mt-2 block text-xl font-semibold md:mt-0 md:table-cell md:py-6 md:pr-6">
                  <span className="block text-base font-semibold md:hidden">Quanto custa</span>
                  Menos de um décimo do preço de um cuidador
                </td>
                <td className="mt-2 block text-xl md:mt-0 md:table-cell md:rounded-r-2xl md:py-6 md:pr-5">
                  <span className="block text-base font-semibold md:hidden">O que entrega</span>
                  Cuidado de todo dia pra quem ainda mora sozinho
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-8 max-w-[46rem] text-xl leading-relaxed text-muted-foreground">{ONDE_ELA_ENTRA}</p>
        </section>

        <section aria-labelledby="camada-titulo" className="bg-muted">
          <div className={`${LARGURA} py-16 lg:py-24`}>
            <h2 id="camada-titulo" className={TITULO}>
              A camada de cuidado, linha por linha
            </h2>
            <table className="mt-10 w-full border-collapse">
              <thead className="hidden md:table-header-group">
                <tr>
                  <th scope="col" className={CABECA_DA_TABELA}>
                    Necessidade
                  </th>
                  <th scope="col" className={CABECA_DA_TABELA}>
                    O que a Dona Leda faz hoje
                  </th>
                </tr>
              </thead>
              <tbody>
                {CAMADA.map((parte) => (
                  <tr key={parte.nome} className="block border-t border-foreground/20 py-5 md:table-row md:py-0">
                    <th
                      scope="row"
                      className="block text-left align-top font-titulo text-2xl font-extrabold md:table-cell md:w-56 md:py-6 md:pr-6"
                    >
                      {parte.nome}
                    </th>
                    <td className="mt-2 block text-xl leading-relaxed md:mt-0 md:table-cell md:py-6">{parte.hoje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="funciona-titulo" className={`${LARGURA} py-16 lg:py-24`}>
          <h2 id="funciona-titulo" className={TITULO}>
            Como funciona, em três passos
          </h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="border-t-4 border-foreground pt-5">
                <span aria-hidden className="numeros font-titulo text-5xl font-extrabold leading-none">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-titulo text-2xl font-bold leading-tight tracking-[-0.01em]">{passo.titulo}</h3>
                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="regras-titulo" className="bg-secondary">
          <div className={`${LARGURA} py-16 lg:py-24`}>
            <h2 id="regras-titulo" className={TITULO}>
              O que ela sempre faz e o que ela nunca faz
            </h2>
            <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-14">
              <div>
                <h3 className="font-titulo text-3xl font-extrabold">Sempre</h3>
                <ul className="mt-5 flex flex-col gap-4">
                  {SEMPRE.map((item) => (
                    <li key={item} className="flex gap-3 text-xl leading-snug">
                      <Check aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-success" strokeWidth={3} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-titulo text-3xl font-extrabold">Nunca</h3>
                <ul className="mt-5 flex flex-col gap-4">
                  {NUNCA.map((item) => (
                    <li key={item} className="flex gap-3 text-xl leading-snug">
                      <X aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-destructive" strokeWidth={3} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="residenciais-titulo" className={`${LARGURA} py-16 lg:py-24`}>
          <div className="grid gap-8 rounded-3xl border-2 border-foreground p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14">
            <div>
              <h2 id="residenciais-titulo" className="font-titulo text-4xl font-extrabold tracking-[-0.02em]">
                {RESIDENCIAIS.titulo}
              </h2>
              <p className="mt-4 max-w-[42rem] text-xl leading-relaxed">{RESIDENCIAIS.texto}</p>
            </div>
            <a
              href={`mailto:${EMAIL_DE_CONTATO}?subject=Dona%20Leda%20no%20residencial`}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-7 py-3 font-titulo text-xl font-bold text-primary-foreground hover:bg-[#4A2F17]"
            >
              {RESIDENCIAIS.botao}
            </a>
          </div>
        </section>

        <section aria-labelledby="perguntas-titulo" className={`${LARGURA} pb-16 lg:pb-24`}>
          <div className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:gap-16">
            <h2 id="perguntas-titulo" className={TITULO}>
              Perguntas frequentes
            </h2>
            <Perguntas />
          </div>
        </section>
      </main>

      <div className="bg-accent text-accent-foreground">
        <section className={`${LARGURA} py-16 lg:py-24`}>
          <p className="max-w-[18ch] font-titulo text-[clamp(2.25rem,7vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-balance">
            {ASSINATURA}
          </p>
          <BotaoPrincipal className="mt-9 w-full sm:w-auto" />
        </section>
      </div>

      <div className={`${LARGURA} py-12`}>
        <h2 className="font-titulo text-2xl font-extrabold">Fontes dos números</h2>
        <ul className="mt-4 flex flex-col gap-2 text-base leading-relaxed text-muted-foreground">
          {Object.values(FONTES).map((fonte) => (
            <li key={fonte.nome}>
              <FonteDoNumero fonte={fonte} />
            </li>
          ))}
        </ul>
        <Rodape className="mt-10 border-t border-foreground/20 pt-8" />
      </div>
    </div>
  );
}
