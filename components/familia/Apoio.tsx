import Link from 'next/link';
import { WifiOff } from 'lucide-react';

/** Aviso discreto: a tela segue mostrando o último dado que chegou. */
export function AvisoSemConexao() {
  return (
    <p
      role="status"
      className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-base text-muted-foreground"
    >
      <WifiOff aria-hidden="true" className="h-5 w-5 shrink-0" />
      Sem conexão agora. O que está na tela pode não estar atualizado.
    </p>
  );
}

/** Só na primeira carga, antes de chegar qualquer dado. */
export function Esqueleto() {
  const blocos = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return (
    <div
      role="status"
      aria-label="Carregando o painel"
      className="flex animate-pulse flex-col gap-5"
    >
      <div className="flex flex-col gap-2">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-6 w-72 max-w-full rounded bg-muted" />
      </div>
      <div className="h-16 rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-4">
        {blocos.map((bloco) => (
          <div key={bloco} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-56 rounded-2xl bg-muted" />
    </div>
  );
}

export function ResumoDaConversa({ resumo }: { resumo: string }) {
  return (
    <section
      aria-labelledby="titulo-do-resumo"
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5"
    >
      <h2 id="titulo-do-resumo" className="text-xl font-semibold text-foreground">
        Resumo da última conversa
      </h2>
      <p className="text-lg leading-relaxed text-foreground">{resumo}</p>
    </section>
  );
}

export function Rodape({ assistente }: { assistente: string }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-border pt-5 text-base text-muted-foreground">
      <p>
        A {assistente} é uma assistente virtual e se apresenta assim. Este painel
        mostra o dia, a semana, os avisos, o resumo da última conversa e as
        lembranças que a{' '}{assistente} guarda. A conversa inteira não é
        guardada. A{' '}
        {assistente} não substitui médico nem serviço de emergência: em caso de
        urgência, ligue 192.
      </p>
      <Link
        href="/"
        className="inline-flex min-h-11 items-center self-start font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Ir para a tela inicial do app
      </Link>
    </footer>
  );
}
