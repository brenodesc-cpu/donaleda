// Olhos e boca da Dona Leda, iguais nas três direções. Só a espessura muda.
// Os olhos ficam em (95, 124) e (145, 124), e a boca em volta de (120, 164).

import type { EstadoDoRosto } from '@/lib/conversation';

export interface PartesDoRosto {
  estado: EstadoDoRosto;
  /** De 0 a 1: quanto a boca abre enquanto ela fala. */
  abertura: number;
  /** Deslocamento do olhar (ela olha pro alto quando pensa). */
  olharX: number;
  olharY: number;
  piscar: boolean;
  pulsar: boolean;
}

export function Olho({
  cx,
  cy,
  piscar,
  rx = 6.5,
  ry = 8.5,
}: {
  cx: number;
  cy: number;
  piscar: boolean;
  rx?: number;
  ry?: number;
}) {
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} className="fill-leda-traco">
      {piscar && (
        <animate
          attributeName="ry"
          values={`${ry};${ry};1.2;${ry};${ry}`}
          keyTimes="0;0.46;0.5;0.54;1"
          dur="5s"
          repeatCount="indefinite"
        />
      )}
    </ellipse>
  );
}

export function Olhos({ partes, ry, rx }: { partes: PartesDoRosto; rx?: number; ry?: number }) {
  const { olharX, olharY, piscar } = partes;
  return (
    <>
      <Olho cx={95 + olharX} cy={124 + olharY} piscar={piscar} rx={rx} ry={ry} />
      <Olho cx={145 + olharX} cy={124 + olharY} piscar={piscar} rx={rx} ry={ry} />
    </>
  );
}

export function Boca({ partes, espessura = 6 }: { partes: PartesDoRosto; espessura?: number }) {
  const { estado, abertura } = partes;
  if (estado === 'falando') {
    return (
      <ellipse
        cx={120}
        cy={166}
        rx={15 - abertura * 2}
        ry={3.5 + abertura * 12}
        className="fill-leda-traco"
      />
    );
  }
  const desenho =
    estado === 'pensando'
      ? 'M 109 166 L 131 166'
      : estado === 'parada'
        ? 'M 100 158 Q 120 178 140 158'
        : 'M 104 160 Q 120 173 136 160';
  return (
    <path
      d={desenho}
      className="fill-none stroke-leda-traco"
      strokeWidth={espessura}
      strokeLinecap="round"
    />
  );
}
