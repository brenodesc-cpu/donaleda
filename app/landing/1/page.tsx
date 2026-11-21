// Direção 1 da landing: Carta. Uma página de leitura, com letra grande, que conta
// uma ligação da Dona Leda de cima a baixo. O briefing está em conhecimento/landing.md.

import Link from 'next/link';
import { Logo } from '@/components/marca/Logo';
import { Disco } from '@/components/landing/Disco';
import {
  ASSINATURA,
  CAMADA,
  CONFIANCA,
  DEFINICAO,
  DINHEIRO,
  EMAIL_DE_CONTATO,
  FONTES,
  NOTA_DO_EXEMPLO,
  RESIDENCIAIS,
  SAUDACAO_DE_EXEMPLO,
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

const COLUNA = 'mx-auto w-full max-w-[44rem] px-5 sm:px-8';
const TITULO = 'font-titulo text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] text-balance sm:text-5xl';
const TEXTO = 'text-xl leading-[1.6] sm:text-[1.375rem] sm:leading-[1.6]';

/** A ligação, na ordem em que ela acontece. */
const MOMENTOS: Array<{ titulo: string; texto: string; fala?: boolean }> = [
  {
    titulo: 'Na hora marcada, o aparelho toca',
    texto:
      'O celular ou o tablet do seu pai ou da sua mãe mostra o disco girando e o aviso de que a Dona Leda está ligando. Os horários, quem escolhe é a família.',
  },
  {
    titulo: 'A pessoa só atende',
    texto: 'A tela tem um botão verde grande escrito Atender. Um toque e a conversa começa, por chamada de vídeo.',
  },
  {
    titulo: 'Ela diz quem é',
    texto: 'A primeira frase de toda ligação conta que ela é uma assistente virtual.',
    fala: true,
  },
  {
    titulo: 'Ela conversa e pergunta do dia',
    texto:
      'Devagar, uma pergunta de cada vez: do sono, da comida, do remédio e da dor. Ela lembra do que ouviu nos outros dias, como o neto, a consulta e o joelho, e puxa esses assuntos de novo.',
  },
  {
    titulo: 'Ela anota e avisa',
    texto:
      'O que a pessoa conta vai pra ficha do dia. Quando ela fala em queda, dor no peito ou num pedido de dinheiro ou senha, a família recebe um aviso. Se ninguém atende, a Dona Leda tenta de novo em três minutos e, sem resposta, avisa também.',
  },
  {
    titulo: 'Você vê como foi',
    texto:
      'No painel da família ficam o dia, a semana, os avisos e um resumo curto da conversa. Você pode pedir uma ligação na hora, e a pessoa pode ligar pra Dona Leda quando quiser.',
  },
];

export default function LandingCarta() {
  return (
    <div className="lp relative min-h-dvh overflow-x-clip bg-background text-foreground">
      <FaixaDeEscolha atual={1} />

      {/* O disco grande no canto, só em tela larga. */}
      <Disco
        semRosto
        className="pointer-events-none absolute -right-[250px] -top-[90px] hidden h-[540px] w-[540px] xl:block"
      />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo className="text-2xl" />
        <Link href="/entrar" className="flex min-h-11 items-center text-lg font-semibold underline hover:no-underline">
          Entrar
        </Link>
      </header>

      <main>
        <section className={`${COLUNA} pb-16 pt-8 sm:pt-14 lg:pb-24`}>
          <Disco titulo="O disco de telefone, símbolo da Dona Leda" className="h-24 w-24 sm:h-28 sm:w-28" />
          <p className="mt-8 text-xl italic text-muted-foreground sm:text-2xl">
            Pra quem tem pai ou mãe morando sozinho,
          </p>
          <h1 className="mt-4 font-titulo text-[clamp(2.375rem,8.2vw,4.5rem)] font-extrabold leading-[1.03] tracking-[-0.025em] text-balance">
            <SemViuva texto={SONHO[0]} />
            <span className="mt-[0.4em] block">
              <SemViuva texto={SONHO[1]} />
            </span>
          </h1>
          <p className="mt-9 text-[1.375rem] leading-[1.5] sm:text-[1.625rem] sm:leading-[1.45]">{DEFINICAO}</p>
          <div className="mt-9 flex flex-col items-start gap-4">
            <BotaoPrincipal className="w-full sm:w-auto" />
            <p className="text-lg text-muted-foreground">
              Ela é uma assistente virtual e diz isso em toda ligação.
            </p>
          </div>
        </section>

        <section aria-labelledby="carta-ligacao" className={`${COLUNA} pb-20 lg:pb-28`}>
          <h2 id="carta-ligacao" className={TITULO}>
            Uma ligação, do começo ao fim
          </h2>
          <ol className="relative mt-12 flex flex-col gap-12 py-2 pl-[4.75rem] sm:pl-24">
            {/* A faixa amarela é o disco desenrolado: cada furo é um momento da ligação. */}
            <li aria-hidden className="absolute bottom-0 left-0 top-0 w-14 rounded-full bg-accent sm:w-16" />
            {MOMENTOS.map((momento, i) => (
              <li key={momento.titulo} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[70px] -top-1 flex h-11 w-11 items-center justify-center rounded-full bg-background font-titulo text-xl font-extrabold sm:-left-[88px] sm:h-12 sm:w-12"
                >
                  {i + 1}
                </span>
                <h3 className="font-titulo text-[1.75rem] font-bold leading-tight tracking-[-0.01em] sm:text-3xl">
                  {momento.titulo}
                </h3>
                <p className={`mt-3 ${TEXTO}`}>{momento.texto}</p>
                {momento.fala ? (
                  <figure className="mt-5 rounded-3xl bg-secondary p-6 sm:p-8">
                    <blockquote className="font-titulo text-2xl font-semibold leading-snug sm:text-[1.75rem]">
                      “{SAUDACAO_DE_EXEMPLO}”
                    </blockquote>
                    <figcaption className="mt-4 text-base leading-relaxed text-[#7A4E00]">{NOTA_DO_EXEMPLO}</figcaption>
                  </figure>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="carta-dinheiro" className="bg-accent text-accent-foreground">
          <div className={`${COLUNA} py-16 lg:py-24`}>
            <h2
              id="carta-dinheiro"
              className="font-titulo text-[clamp(2.125rem,7.4vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-balance"
            >
              <SemViuva texto={DINHEIRO[0]} />
              <span className="mt-[0.4em] block">
                <SemViuva texto={DINHEIRO[1]} />
              </span>
            </h2>
            <p className={`mt-10 ${TEXTO}`}>
              Quem recebe um salário mínimo do INSS ganha <strong>R$ 1.621</strong> por mês, e é assim com 62,5% dos
              beneficiários. Só o piso do salário de um cuidador com carteira é de <strong>R$ 1.760,44</strong>. Um
              cuidador de 12 horas por dia custa de <strong>R$ 2.800 a 4.500</strong> por mês.
            </p>
            <p className="mt-6 text-base leading-relaxed">
              Fontes: <FonteDoNumero fonte={FONTES.inss} />; <FonteDoNumero fonte={FONTES.caged} />;{' '}
              <FonteDoNumero fonte={FONTES.cidesp} />.
            </p>
          </div>
        </section>

        <section aria-labelledby="carta-camada" className={`${COLUNA} py-16 lg:py-24`}>
          <h2 id="carta-camada" className={TITULO}>
            O que ela cuida hoje
          </h2>
          <p className={`mt-5 text-muted-foreground ${TEXTO}`}>
            São cinco necessidades de quem envelhece. Em cada uma, isto é o que a Dona Leda já faz.
          </p>
          <dl className="mt-10 border-t border-foreground/20">
            {CAMADA.map((parte) => (
              <div
                key={parte.nome}
                className="grid gap-2 border-b border-foreground/20 py-7 sm:grid-cols-[13rem_1fr] sm:gap-6"
              >
                <dt className="font-titulo text-3xl font-extrabold tracking-[-0.01em]">{parte.nome}</dt>
                <dd className={TEXTO}>{parte.hoje}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="carta-regras" className="bg-secondary">
          <div className={`${COLUNA} py-16 lg:py-24`}>
            <h2 id="carta-regras" className={TITULO}>
              As regras que ela segue
            </h2>
            <ul className="mt-10 flex flex-col gap-9">
              {CONFIANCA.map((regra) => (
                <li key={regra.titulo}>
                  <h3 className="font-titulo text-[1.75rem] font-bold leading-tight tracking-[-0.01em] sm:text-3xl">
                    {regra.titulo}
                  </h3>
                  <p className={`mt-3 ${TEXTO}`}>{regra.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="carta-residenciais" className={`${COLUNA} py-16 lg:py-24`}>
          <h2 id="carta-residenciais" className={TITULO}>
            {RESIDENCIAIS.titulo}
          </h2>
          <p className={`mt-5 ${TEXTO}`}>{RESIDENCIAIS.texto}</p>
          <a
            href={`mailto:${EMAIL_DE_CONTATO}?subject=Dona%20Leda%20no%20residencial`}
            className="mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-foreground px-7 py-3 font-titulo text-xl font-bold hover:bg-secondary"
          >
            {RESIDENCIAIS.botao}
          </a>
        </section>

        <section aria-labelledby="carta-perguntas" className={`${COLUNA} pb-16 lg:pb-24`}>
          <h2 id="carta-perguntas" className={TITULO}>
            Perguntas frequentes
          </h2>
          <Perguntas className="mt-6" />
        </section>

        <section className={`${COLUNA} pb-16`}>
          <p className="font-titulo text-[clamp(2.125rem,7.4vw,3.75rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-balance">
            {ASSINATURA}
          </p>
          <BotaoPrincipal className="mt-9 w-full sm:w-auto" />
          <p className="mt-10 text-xl italic text-muted-foreground">O time da Dona Leda</p>
          <Rodape className="mt-12 border-t border-foreground/20 pt-8" />
        </section>
      </main>
    </div>
  );
}
