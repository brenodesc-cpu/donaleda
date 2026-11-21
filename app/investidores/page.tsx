import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Bell, CalendarClock, ClipboardList, Phone, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/marca/Logo';
import { Rosto } from '@/components/Rosto';
import { Comparacao } from './Comparacao';
import { Mercado } from './Mercado';

export const metadata: Metadata = {
  title: 'Dona Leda | Apresentação para investidores',
  description: 'Conheça o mercado, a concorrência e a proposta da Dona Leda para o acompanhamento familiar de pessoas idosas que moram sozinhas.',
};

const secoes = [
  { id: 'mercado', nome: 'Mercado' },
  { id: 'concorrencia', nome: 'Concorrência' },
  { id: 'diferenciais', nome: 'Diferenciais' },
  { id: 'validacao', nome: 'Validação' },
];

const diferenciais = [
  {
    icone: CalendarClock,
    titulo: 'A conversa começa sozinha',
    texto: 'A Dona Leda liga no horário combinado. Se a pessoa não atender, tenta de novo em três minutos. Depois da segunda tentativa sem resposta, registra um aviso no painel.',
  },
  {
    icone: ClipboardList,
    titulo: 'A família acompanha o dia',
    texto: 'A ficha do dia e a visão da semana reúnem o que a pessoa contou sobre sono, alimentação, remédios e como está se sentindo.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Avisos com contexto brasileiro',
    texto: 'Se a pessoa contar que alguém pediu Pix ou senha, o relato pode gerar um aviso de possível golpe. A assistente conversa em português do Brasil e se apresenta como virtual.',
  },
];

const metricas = [
  ['Chamadas entregues e atendidas', 'Medir quantas chamadas tocam no aparelho e quantas viram conversa.'],
  ['Adesão ao longo do tempo', 'Observar se a pessoa quer continuar recebendo ligações depois da primeira semana.'],
  ['Valor para a família', 'Entender se a ficha ou um aviso motivou contato e quanto a família pagaria pelo acompanhamento.'],
];

export default function PaginaDeInvestidores() {
  return (
    <div className="bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Dona Leda, início">
            <Logo className="text-2xl" />
          </Link>
          <nav aria-label="Nesta página" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-muted-foreground sm:text-base">
            {secoes.map(({ id, nome }) => (
              <a key={id} href={`#${id}`} className="py-2 hover:text-primary hover:underline">{nome}</a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Apresentação para investidores</p>
            <h1 className="mt-4 max-w-[15ch] text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              Uma conversa por dia. <span className="text-primary">A família mais perto.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              A Dona Leda liga para pessoas idosas que moram sozinhas e transforma a conversa em uma ficha do dia, com avisos que ajudam a família a saber quando entrar em contato.
            </p>
            <a href="#mercado" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90">
              Conhecer a oportunidade <ArrowDown aria-hidden size={19} />
            </a>
          </div>

          <figure className="rounded-[2rem] border border-border bg-accent/20 p-4 sm:p-7">
            <div className="mx-auto grid max-w-md gap-3 min-[430px]:grid-cols-[1fr_1fr] min-[430px]:items-center">
              <div className="rounded-[1.7rem] border border-border bg-card px-3 py-5 text-center shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ligação recebida</p>
                <Rosto estado="parada" nivel={0} className="mx-auto !h-28 !w-28 sm:!h-36 sm:!w-36" />
                <p className="text-xl font-bold">Dona Leda</p>
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-bold text-white">
                  <Phone aria-hidden size={15} /> Atender
                </span>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Painel da família</p>
                <p className="mt-2 text-lg font-bold">Como foi o dia</p>
                <p className="mt-1 text-sm text-muted-foreground">Helena contou que dormiu bem e almoçou.</p>
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-warning-soft p-2.5 text-sm font-bold text-warning">
                  <Bell aria-hidden className="mt-0.5 shrink-0" size={16} /> Relato de pedido de Pix
                </div>
              </div>
            </div>
            <figcaption className="mt-4 text-center text-sm font-semibold text-muted-foreground">Ilustração do produto com dados fictícios</figcaption>
          </figure>
        </section>

        <Mercado />

        <section id="concorrencia" aria-labelledby="titulo-concorrencia" className="mx-auto max-w-7xl scroll-mt-4 px-5 py-12 sm:px-8 sm:py-16">
          <h2 id="titulo-concorrencia" className="text-3xl font-bold tracking-tight sm:text-5xl">Análise de concorrência</h2>
          <Comparacao />
        </section>

        <section id="diferenciais" aria-labelledby="titulo-diferenciais" className="scroll-mt-4 border-y border-border bg-card">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
            <h2 id="titulo-diferenciais" className="text-3xl font-bold tracking-tight sm:text-5xl">Diferenciais</h2>
            <div className="mt-7 grid gap-6 md:grid-cols-3">
              {diferenciais.map(({ icone: Icone, titulo, texto }) => (
                <article key={titulo} className="rounded-2xl bg-background p-5 sm:p-6">
                  <span className="inline-flex rounded-xl bg-primary/10 p-3 text-primary"><Icone aria-hidden size={24} /></span>
                  <h3 className="mt-4 text-xl font-bold">{titulo}</h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{texto}</p>
                </article>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Os avisos ficam no painel. Em emergências, procure o serviço de emergência local.</p>
          </div>
        </section>

        <section id="validacao" aria-labelledby="titulo-validacao" className="mx-auto grid max-w-7xl scroll-mt-4 gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2">
          <div>
            <h2 id="titulo-validacao" className="text-3xl font-bold tracking-tight sm:text-5xl">Modelo e validação</h2>
            <p className="mt-4 text-muted-foreground">A hipótese inicial é uma assinatura familiar para acompanhamento. A margem depende da duração real das chamadas, do custo por minuto de voz e do preço que a família aceita pagar.</p>
            <div className="mt-5 rounded-2xl border border-border bg-accent/15 p-5">
              <p className="text-lg font-bold">Cenário ilustrativo · cerca de R$ 84 por mês</p>
              <p className="mt-1 text-sm text-muted-foreground">Estimativa de custo de voz e áudio por pessoa, para cinco minutos diários durante 30 dias, com preço de tabela e câmbio de R$ 5,50 por dólar. Custos operacionais à parte.</p>
              <a href="https://docs.agora.io/en/ai/reference/pricing" className="mt-2 inline-block text-sm font-bold text-primary underline underline-offset-4">Tabela de preços da Agora</a>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h3 className="text-2xl font-bold">O que o piloto precisa medir</h3>
            <ul className="mt-4 divide-y divide-border">
              {metricas.map(([titulo, texto]) => (
                <li key={titulo} className="py-3">
                  <p className="font-bold">{titulo}</p>
                  <p className="text-base text-muted-foreground">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-7 sm:px-8">
          <Logo className="text-2xl" />
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90">
            Abrir o protótipo <ArrowRight aria-hidden size={18} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
