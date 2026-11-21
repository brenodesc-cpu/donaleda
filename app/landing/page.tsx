// As três direções da landing page lado a lado, pra escolher uma.
// O briefing está em conhecimento/landing.md.

import Link from 'next/link';
import { Logo } from '@/components/marca/Logo';

const DIRECOES = [
  {
    numero: 1,
    nome: 'Carta',
    resumo: 'Página de leitura, com letra grande, que conta uma ligação da Dona Leda do começo ao fim.',
    praQuem: 'Fala com a filha ou o filho, com calma, do jeito que a marca fala.',
  },
  {
    numero: 2,
    nome: 'Produto em cena',
    resumo: 'O celular toca na tela, o botão Atender funciona e o painel da família aparece conforme a pessoa rola.',
    praQuem: 'Mostra pra banca e pra família que o produto existe.',
  },
  {
    numero: 3,
    nome: 'Conta e prova',
    resumo: 'A conta do cuidador e os números do país na frente, com a camada de cuidado em tabela.',
    praQuem: 'Convence quem decide com planilha, como o dono de residencial.',
  },
] as const;

export default function EscolhaDaLanding() {
  return (
    <div className="lp min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-[90rem] flex-col gap-5 px-5 pb-8 pt-8 sm:px-8">
        <Logo className="text-2xl" />
        <div>
          <h1 className="font-titulo text-[clamp(2rem,6vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.025em]">
            Três direções pra landing page
          </h1>
          <p className="mt-3 max-w-[44rem] text-xl leading-relaxed text-muted-foreground">
            As três usam a mesma marca e o mesmo texto aprovado. O que muda é a estrutura, o ritmo e a imagem. Abra
            cada uma e escolha a que segue.
          </p>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[90rem] gap-8 px-5 pb-16 sm:px-8 lg:grid-cols-3 lg:gap-6">
        {DIRECOES.map((direcao) => (
          <article key={direcao.numero} className="flex flex-col gap-4">
            <div>
              <h2 className="font-titulo text-3xl font-extrabold tracking-[-0.01em]">
                {direcao.numero}. {direcao.nome}
              </h2>
              <p className="mt-2 text-lg leading-relaxed">{direcao.resumo}</p>
              <p className="mt-1 text-lg leading-relaxed text-muted-foreground">{direcao.praQuem}</p>
            </div>
            <Link
              href={`/landing/${direcao.numero}`}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-6 py-3 font-titulo text-xl font-bold text-primary-foreground hover:bg-[#4A2F17]"
            >
              Abrir a direção {direcao.numero}
            </Link>
            {/* A prévia mostra a página como ela fica no celular. No celular de quem escolhe, vale o botão. */}
            <div className="hidden overflow-hidden rounded-3xl border-2 border-foreground/20 bg-card lg:block">
              <iframe
                src={`/landing/${direcao.numero}`}
                title={`Prévia da direção ${direcao.numero}, ${direcao.nome}`}
                loading="lazy"
                className="h-[760px] w-full"
              />
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
