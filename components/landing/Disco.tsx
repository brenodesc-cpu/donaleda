// O disco do telefone antigo, símbolo da Dona Leda, em tamanho livre pra landing.
// É o mesmo desenho de components/marca/DesenhosDoRosto.tsx, com as cores fixas
// da Gema pra funcionar em qualquer fundo (Casca, Café ou amarelo).

import { cn } from '@/lib/utils';

const GEMA = '#F7B90F';
const CAFE = '#33200F';
const CASCA = '#FFF8E8';

// Os dez furos, um a cada 30 graus. O vão sem furo fica embaixo, à direita.
const FUROS: Array<[number, number]> = [
  [140.7, 197.3], [99.3, 197.3], [63.4, 176.6], [42.7, 140.7], [42.7, 99.3],
  [63.4, 63.4], [99.3, 42.7], [140.7, 42.7], [176.6, 63.4], [197.3, 99.3],
];

interface DiscoProps {
  /** Gira e volta, como quem disca (a animação `disco-discando` do app). */
  girando?: boolean;
  /** Boca aberta, de quem está falando. */
  falando?: boolean;
  /** Sem o rosto no miolo, só o disco. */
  semRosto?: boolean;
  /** Cor da trava do dedo. Em fundo escuro, use a Casca. */
  trava?: string;
  /** Cor que aparece dentro dos furos. */
  furo?: string;
  /** Texto pra quem usa leitor de tela. Sem ele, o desenho é só enfeite. */
  titulo?: string;
  className?: string;
}

export function Disco({
  girando = false,
  falando = false,
  semRosto = false,
  trava = CAFE,
  furo = CASCA,
  titulo,
  className,
}: DiscoProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      className={cn('shrink-0', className)}
    >
      <g className={girando ? 'disco-discando' : undefined}>
        <circle cx={120} cy={120} r={108} fill={GEMA} />
        {FUROS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={13} fill={furo} />
        ))}
      </g>
      <path d="M 194.5 163 L 222 179" fill="none" stroke={trava} strokeWidth={9} strokeLinecap="round" />
      {semRosto ? (
        <circle cx={120} cy={120} r={50} fill={furo} />
      ) : (
        <>
          <circle cx={120} cy={120} r={50} fill="#FFFFFF" />
          <ellipse cx={104} cy={111} rx={5.5} ry={8.5} fill={CAFE} />
          <ellipse cx={136} cy={111} rx={5.5} ry={8.5} fill={CAFE} />
          {falando ? (
            <path d="M 101 129 Q 120 154 139 129 Z" fill={CAFE} stroke={CAFE} strokeWidth={5} strokeLinejoin="round" />
          ) : (
            <path d="M 99 130 Q 120 150 141 130" fill="none" stroke={CAFE} strokeWidth={6.5} strokeLinecap="round" />
          )}
        </>
      )}
    </svg>
  );
}
