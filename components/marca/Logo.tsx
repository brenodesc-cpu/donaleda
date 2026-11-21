// O símbolo e o nome escrito da Dona Leda, em cada direção da marca.
// O símbolo sozinho é o ícone do app. Os arquivos soltos ficam em public/marca/.

import { cn } from '@/lib/utils';
import { MARCA_ATIVA, type Direcao } from './direcoes';

const TRACO = 'stroke-leda-traco';

// O disco do telefone em tamanho de símbolo (o mesmo desenho do rosto, pela metade).
const FUROS_DO_SIMBOLO: Array<[number, number]> = [
  [70.35, 98.65], [49.65, 98.65], [31.7, 88.3], [21.35, 70.35], [21.35, 49.65],
  [31.7, 31.7], [49.65, 21.35], [70.35, 21.35], [88.3, 31.7], [98.65, 49.65],
];

function SimboloGema() {
  return (
    <>
      <circle cx={60} cy={60} r={54} className="fill-leda-roupa" />
      {FUROS_DO_SIMBOLO.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={6.5} className="fill-leda-cabelo" />
      ))}
      <path d="M 97.25 81.5 L 111 89.5" className={cn('fill-none', TRACO)} strokeWidth={4.5} strokeLinecap="round" />
      <circle cx={60} cy={60} r={25} className="fill-leda-pele" />
      <ellipse cx={52} cy={55.5} rx={2.75} ry={4.25} className="fill-leda-traco" />
      <ellipse cx={68} cy={55.5} rx={2.75} ry={4.25} className="fill-leda-traco" />
      <path d="M 49.5 65 Q 60 75 70.5 65" className={cn('fill-none', TRACO)} strokeWidth={3.25} strokeLinecap="round" />
    </>
  );
}

function SimboloVaranda() {
  return (
    <>
      <circle cx={60} cy={22} r={13} className={cn('fill-leda-cabelo', TRACO)} strokeWidth={4} />
      <path
        d="M 60 30 C 90 30 104 46 104 66 C 104 88 86 102 60 102 C 52 102 45 101 39 98 L 18 108 L 24 88 C 18 81 16 74 16 66 C 16 46 30 30 60 30 Z"
        className={cn('fill-primary', TRACO)}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx={46} cy={62} r={5.5} className="fill-card" />
      <circle cx={74} cy={62} r={5.5} className="fill-card" />
      <path d="M 44 78 Q 60 90 76 78" className="fill-none stroke-card" strokeWidth={5} strokeLinecap="round" />
    </>
  );
}

function SimboloRadio() {
  return (
    <>
      <rect x={4} y={4} width={112} height={112} rx={14} className={cn('fill-primary', TRACO)} strokeWidth={6} />
      <path d="M 28 66 A 32 32 0 0 1 92 66" className={cn('fill-none', TRACO)} strokeWidth={8} />
      <rect x={20} y={58} width={14} height={24} rx={2} className="fill-leda-traco" />
      <rect x={86} y={58} width={14} height={24} rx={2} className="fill-leda-traco" />
      <circle cx={60} cy={70} r={22} className={cn('fill-card', TRACO)} strokeWidth={6} />
      <rect x={50} y={63} width={6} height={6} className="fill-leda-traco" />
      <rect x={64} y={63} width={6} height={6} className="fill-leda-traco" />
      <path d="M 51 77 L 69 77" className={TRACO} strokeWidth={5} strokeLinecap="square" />
    </>
  );
}

function SimboloJardim() {
  return (
    <>
      <path d="M 16 104 C 10 52 44 14 104 14 C 110 70 76 108 16 104 Z" className="fill-primary" />
      <circle cx={52} cy={62} r={5.5} className="fill-card" />
      <circle cx={74} cy={52} r={5.5} className="fill-card" />
      <path d="M 50 80 Q 68 86 82 68" className="fill-none stroke-card" strokeWidth={5} strokeLinecap="round" />
      <circle cx={98} cy={22} r={10} className="fill-accent" />
    </>
  );
}

const SIMBOLOS: Record<Direcao, () => React.JSX.Element> = {
  gema: SimboloGema,
  varanda: SimboloVaranda,
  radio: SimboloRadio,
  jardim: SimboloJardim,
};

export function Simbolo({ estilo = MARCA_ATIVA, className }: { estilo?: Direcao; className?: string }) {
  const Desenho = SIMBOLOS[estilo];
  return (
    <svg viewBox="0 0 120 120" aria-hidden className={cn('h-12 w-12 shrink-0', className)}>
      <Desenho />
    </svg>
  );
}

const NOME_ESCRITO: Record<Direcao, { texto: string; classe: string }> = {
  gema: { texto: 'Dona Leda', classe: 'font-titulo font-extrabold tracking-tight' },
  varanda: { texto: 'Dona Leda', classe: 'font-bold tracking-tight' },
  radio: { texto: 'DONA LEDA', classe: 'font-black tracking-wide' },
  jardim: { texto: 'dona leda', classe: 'font-extrabold tracking-tight' },
};

/** Símbolo e nome lado a lado. O tamanho segue o texto (`text-3xl`, `text-5xl`...). */
export function Logo({ estilo = MARCA_ATIVA, className }: { estilo?: Direcao; className?: string }) {
  const nome = NOME_ESCRITO[estilo];
  return (
    <span className={cn('inline-flex items-center gap-3 font-sans text-foreground', className)}>
      <Simbolo estilo={estilo} className="h-[1.6em] w-[1.6em]" />
      <span className={cn('whitespace-nowrap leading-none', nome.classe)}>{nome.texto}</span>
    </span>
  );
}
