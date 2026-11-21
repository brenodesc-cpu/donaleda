// Uma direção da marca inteira numa coluna: nome, motivo, logo, rosto, fonte,
// cores com o contraste conferido e as duas amostras de tela.

import { Check } from 'lucide-react';
import { Rosto } from '@/components/Rosto';
import { cn } from '@/lib/utils';
import { AmostraDaLigacao, AmostraDoCartao } from './Amostras';
import { MARCA_ATIVA, type InfoDaDirecao } from './direcoes';
import { Logo } from './Logo';
import { PALETAS } from './paletas.gerado';

const AMOSTRAS_DE_COR = [
  { id: 'primary', nome: 'Principal', classe: 'bg-primary' },
  { id: 'success', nome: 'Atender', classe: 'bg-success' },
  { id: 'destructive', nome: 'Urgente', classe: 'bg-destructive' },
  { id: 'accent', nome: 'Destaque', classe: 'bg-accent' },
  { id: 'foreground', nome: 'Texto', classe: 'bg-foreground' },
  { id: 'background', nome: 'Fundo', classe: 'bg-background' },
] as const;

function Titulo({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-7 text-sm font-bold uppercase tracking-wider text-muted-foreground">{children}</h3>;
}

export function ColunaDaDirecao({ direcao }: { direcao: InfoDaDirecao }) {
  const paleta = PALETAS[direcao.id];
  const ativa = direcao.id === MARCA_ATIVA;

  return (
    <section
      data-marca={direcao.id}
      aria-labelledby={`direcao-${direcao.id}`}
      className={cn(
        'rounded-3xl border-2 bg-background p-5 font-sans text-foreground sm:p-6',
        ativa ? 'border-primary' : 'border-border',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`direcao-${direcao.id}`} className="text-2xl font-bold">
          {direcao.nome}
        </h2>
        {ativa && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
            <Check aria-hidden className="h-4 w-4" />
            Aplicada agora
          </span>
        )}
      </div>
      <p className="mt-2 text-base text-foreground">{direcao.resumo}</p>
      <p className="mt-2 text-base text-muted-foreground">
        <strong className="text-foreground">Por que escolher: </strong>
        {direcao.motivo}
      </p>

      <Titulo>Logo</Titulo>
      <div className="mt-3 rounded-2xl bg-card p-4">
        <Logo estilo={direcao.id} className="text-3xl sm:text-4xl" />
      </div>

      <Titulo>O rosto</Titulo>
      <div className="mt-2 flex items-end justify-center gap-1">
        <Rosto estilo={direcao.id} estado="parada" nivel={0} className="h-32 w-32 sm:h-36 sm:w-36" />
        <Rosto estilo={direcao.id} estado="falando" nivel={0.35} className="h-24 w-24 sm:h-24 sm:w-24" />
        <Rosto estilo={direcao.id} estado="pensando" nivel={0} className="h-24 w-24 sm:h-24 sm:w-24" />
      </div>

      <Titulo>Fonte: {direcao.fonte}</Titulo>
      <p className="mt-2 text-3xl font-bold leading-tight">{direcao.amostraDeTexto}</p>
      <p className="mt-2 text-lg leading-relaxed">
        Tomou o remédio das 8h? A sua filha Marina mandou um beijo.
      </p>

      <Titulo>Cores</Titulo>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {AMOSTRAS_DE_COR.map((cor) => (
          <div key={cor.id} className="text-center">
            <div className={cn('h-12 rounded-xl border border-border', cor.classe)} />
            <p className="mt-1 text-sm font-semibold">{cor.nome}</p>
            <p className="text-xs text-muted-foreground">{paleta.cores[cor.id]}</p>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        {paleta.pares.map((par) => (
          <li key={par.uso} className="flex justify-between gap-3 border-b border-border/60 py-1">
            <span>{par.uso}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {par.contraste.toFixed(1).replace('.', ',')} : 1
            </span>
          </li>
        ))}
      </ul>

      <Titulo>A ligação no aparelho do idoso</Titulo>
      <div className="mt-3">
        <AmostraDaLigacao estilo={direcao.id} />
      </div>

      <Titulo>Um cartão do painel da família</Titulo>
      <div className="mt-3">
        <AmostraDoCartao />
      </div>
    </section>
  );
}
