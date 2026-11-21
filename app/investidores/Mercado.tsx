import { ArrowUpRight, Globe2, TrendingUp } from 'lucide-react';

const fontes = {
  censo: 'https://censo2022.ibge.gov.br/',
  projecao: 'https://www.ibge.gov.br/estatisticas/sociais/populacao/9109-projecao-da-populacao.html',
  pnad: 'https://www.ibge.gov.br/estatisticas/sociais/populacao/17270-pnad-continua.html',
  tic: 'https://cetic.br/pt/pesquisa/domicilios/indicadores/',
  economia: 'https://www.aarp.org/pri/topics/economics/global-longevity-economy/',
  cuidados: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/L15069.htm',
};

const populacaoIdosa = [
  { ano: '2010', pessoas: 20.6, rotulo: '20,6 mi', tipo: 'Censo' },
  { ano: '2022', pessoas: 32.1, rotulo: '32,1 mi', tipo: 'Censo' },
  { ano: '2070', pessoas: 75.3, rotulo: '75,3 mi', tipo: 'Projeção' },
];

const escalaEmMilhoes = 80;

const sinais = [
  {
    titulo: 'Em 2070, 37,8% dos brasileiros terão 60 anos ou mais',
    texto: 'Na mesma série de projeções do IBGE, esse grupo respondia por 15,6% da população em 2023. A dinâmica demográfica torna o envelhecimento em casa uma questão de longo prazo.',
    fonte: 'IBGE · Projeções da População, revisão 2024',
    url: fontes.projecao,
  },
  {
    titulo: 'O Brasil instituiu a Política Nacional de Cuidados',
    texto: 'A Lei nº 15.069 de 2024 prevê ações para pessoas que precisam de cuidado e para quem cuida, incluindo familiares que prestam cuidado sem remuneração.',
    fonte: 'Planalto · Lei nº 15.069/2024',
    url: fontes.cuidados,
  },
];

export function Mercado() {
  return (
    <section id="mercado" aria-labelledby="titulo-mercado" className="scroll-mt-4 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <h2 id="titulo-mercado" className="text-3xl font-bold tracking-tight sm:text-5xl">Dados de mercado</h2>
        <p className="mt-3 max-w-2xl text-background/80">
          O Brasil envelhece e a economia ligada à população mais velha cresce. Para a Dona Leda, o primeiro recorte são as famílias que acompanham à distância uma pessoa idosa que mora sozinha.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <figure className="rounded-2xl border border-background/25 bg-background/5 p-5 sm:p-6">
            <TrendingUp aria-hidden className="text-accent" size={24} />
            <figcaption className="mt-3 text-xl font-bold sm:text-2xl">Brasileiros com 60 anos ou mais</figcaption>
            <ul className="mt-5 space-y-4">
              {populacaoIdosa.map(({ ano, pessoas, rotulo, tipo }) => (
                <li key={ano}>
                  <div className="mb-1 flex justify-between gap-2 text-sm sm:text-base">
                    <span className="text-background/85">{ano} · {tipo}</span>
                    <span className="font-bold">{rotulo}</span>
                  </div>
                  <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-background/15">
                    <div
                      className={tipo === 'Projeção' ? 'h-full rounded-full border-2 border-dashed border-accent bg-accent/20' : 'h-full rounded-full bg-accent'}
                      style={{ width: `${pessoas / escalaEmMilhoes * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <a href={fontes.censo} className="underline underline-offset-4">IBGE · Censos 2010 e 2022</a>
              <a href={fontes.projecao} className="underline underline-offset-4">IBGE · Projeções, revisão 2024</a>
            </p>
          </figure>

          <article className="rounded-2xl border border-background/25 bg-background/5 p-5 sm:p-6">
            <Globe2 aria-hidden className="text-accent" size={24} />
            <h3 className="mt-3 text-xl font-bold sm:text-2xl">Economia prateada no mundo</h3>
            <p className="mt-2 text-base text-background/85">Contribuição estimada da população de 50 anos ou mais para o PIB mundial, segundo a AARP.</p>
            <dl className="mt-5 grid gap-4 min-[400px]:grid-cols-2">
              <div className="border-t border-background/25 pt-3">
                <dt className="text-sm text-background/85">2020 · Estimativa</dt>
                <dd className="mt-1 text-2xl font-bold text-accent sm:text-3xl">US$ 45 tri</dd>
              </div>
              <div className="border-t border-background/25 pt-3">
                <dt className="text-sm text-background/85">2050 · Projeção</dt>
                <dd className="mt-1 text-2xl font-bold text-accent sm:text-3xl">US$ 118 tri</dd>
              </div>
            </dl>
            <a href={fontes.economia} className="mt-5 inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
              AARP · Global Longevity Economy Outlook <ArrowUpRight aria-hidden className="shrink-0" size={15} />
            </a>
          </article>
        </div>

        <h3 className="mt-9 text-xl font-bold sm:text-2xl">O recorte da Dona Leda no Brasil</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="border-t border-background/30 pt-4">
            <p className="text-4xl font-bold text-accent">≈ 6 mi</p>
            <p className="mt-2 text-base">Pessoas de 60 anos ou mais que moram sozinhas.</p>
            <a href={fontes.pnad} className="text-sm underline underline-offset-4">Estimativa arredondada · PNAD Contínua 2025</a>
          </article>
          <article className="border-t border-background/30 pt-4">
            <p className="text-4xl font-bold text-accent">59%</p>
            <p className="mt-2 text-base">Das pessoas com 60 anos ou mais usam internet, segundo a TIC Domicílios 2025.</p>
            <a href={fontes.tic} className="text-sm underline underline-offset-4">Cetic.br · Indicadores de uso da internet</a>
          </article>
          <article className="border-t border-background/30 pt-4">
            <h4 className="text-xl font-bold">De população a mercado pagante</h4>
            <p className="mt-2 text-base text-background/85">O acesso à internet e a um aparelho compatível delimita o público inicial. A disposição da família a pagar ainda precisa ser medida no piloto.</p>
          </article>
        </div>

        <h3 className="mt-9 text-xl font-bold sm:text-2xl">Outros sinais do mercado</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {sinais.map(({ titulo, texto, fonte, url }) => (
            <article key={titulo} className="rounded-2xl border border-background/25 p-5">
              <h4 className="text-lg font-bold">{titulo}</h4>
              <p className="mt-2 text-base text-background/85">{texto}</p>
              <a href={url} className="mt-3 inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
                {fonte} <ArrowUpRight aria-hidden className="shrink-0" size={15} />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
