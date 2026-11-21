// O desenho da Dona Leda em cada direção da marca. Na Gema, que é a escolhida,
// ela é o disco do telefone antigo com um rosto no miolo. Nas outras três ela é
// uma senhora desenhada, de coque e óculos, com fone de atendente. Em todas tem
// cara de personagem: ninguém confunde com uma pessoa de verdade.

import { cn } from '@/lib/utils';
import { Boca, Olhos, type PartesDoRosto } from './partesDoRosto';

const TRACO = 'stroke-leda-traco';

/** Varanda: traço de desenho à mão, cabelo grisalho de coque e óculos redondos. */
export function DesenhoVaranda({ partes }: { partes: PartesDoRosto }) {
  return (
    <>
      <circle cx={120} cy={120} r={114} className={cn('fill-primary/10', partes.pulsar && 'animate-pulse')} />
      <path d="M 44 240 Q 50 196 120 192 Q 190 196 196 240 Z" className={cn('fill-leda-roupa', TRACO)} strokeWidth={4} />
      <path d="M 104 186 L 104 200 Q 120 208 136 200 L 136 186 Z" className={cn('fill-leda-pele', TRACO)} strokeWidth={4} />
      <circle cx={120} cy={46} r={24} className={cn('fill-leda-cabelo', TRACO)} strokeWidth={4} />
      <ellipse cx={120} cy={130} rx={66} ry={72} className={cn('fill-leda-pele', TRACO)} strokeWidth={4} />
      <path
        d="M 54 126 Q 50 62 120 60 Q 190 62 186 126 Q 178 94 156 86 Q 136 100 120 80 Q 104 100 84 86 Q 62 94 54 126 Z"
        className={cn('fill-leda-cabelo', TRACO)}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <circle cx={80} cy={152} r={10} className="fill-accent/45" />
      <circle cx={160} cy={152} r={10} className="fill-accent/45" />
      <circle cx={95} cy={124} r={17} className={cn('fill-card/40', TRACO)} strokeWidth={4} />
      <circle cx={145} cy={124} r={17} className={cn('fill-card/40', TRACO)} strokeWidth={4} />
      <path d="M 112 122 Q 120 116 128 122" className={cn('fill-none', TRACO)} strokeWidth={4} />
      <Olhos partes={partes} />
      <Boca partes={partes} espessura={5} />
      <path d="M 50 128 A 70 70 0 0 1 190 128" className="fill-none stroke-primary" strokeWidth={7} strokeLinecap="round" />
      <rect x={38} y={112} width={20} height={38} rx={9} className={cn('fill-primary', TRACO)} strokeWidth={3} />
      <rect x={182} y={112} width={20} height={38} rx={9} className={cn('fill-primary', TRACO)} strokeWidth={3} />
      <path d="M 48 148 Q 52 184 88 186" className="fill-none stroke-primary" strokeWidth={5} strokeLinecap="round" />
      <circle cx={92} cy={186} r={6} className={cn('fill-primary', TRACO)} strokeWidth={3} />
    </>
  );
}

/** Rádio: formas geométricas de letreiro, traço grosso, cabelo curto e óculos quadrados. */
export function DesenhoRadio({ partes }: { partes: PartesDoRosto }) {
  return (
    <>
      <rect x={8} y={8} width={224} height={224} rx={28} className={cn('fill-primary', partes.pulsar && 'animate-pulse')} />
      <path d="M 40 240 L 52 204 Q 120 184 188 204 L 200 240 Z" className={cn('fill-card', TRACO)} strokeWidth={8} strokeLinejoin="round" />
      <path d="M 52 132 Q 50 54 120 54 Q 190 54 188 132 L 172 132 Q 170 92 120 90 Q 70 92 68 132 Z" className="fill-leda-cabelo" />
      <circle cx={120} cy={130} r={64} className={cn('fill-leda-pele', TRACO)} strokeWidth={8} />
      <path d="M 58 116 Q 64 66 120 64 Q 176 66 182 116 Q 150 104 136 84 Q 116 108 58 116 Z" className="fill-leda-cabelo" />
      <rect x={76} y={108} width={36} height={30} rx={6} className={cn('fill-card/50', TRACO)} strokeWidth={6} />
      <rect x={128} y={108} width={36} height={30} rx={6} className={cn('fill-card/50', TRACO)} strokeWidth={6} />
      <path d="M 112 120 L 128 120" className={TRACO} strokeWidth={6} />
      <Olhos partes={partes} rx={6} ry={7} />
      <Boca partes={partes} espessura={8} />
      <path d="M 46 132 A 74 74 0 0 1 194 132" className={cn('fill-none', TRACO)} strokeWidth={10} strokeLinecap="square" />
      <rect x={32} y={116} width={24} height={40} rx={4} className="fill-leda-traco" />
      <rect x={184} y={116} width={24} height={40} rx={4} className="fill-leda-traco" />
      <path d="M 44 156 L 44 184 L 84 184" className={cn('fill-none', TRACO)} strokeWidth={7} strokeLinejoin="round" />
      <rect x={82} y={177} width={14} height={14} rx={2} className="fill-leda-traco" />
    </>
  );
}

/** Jardim: formas redondas sem contorno, cabelo branco cacheado e uma flor no cabelo. */
export function DesenhoJardim({ partes }: { partes: PartesDoRosto }) {
  return (
    <>
      <circle cx={120} cy={120} r={114} className={cn('fill-primary/10', partes.pulsar && 'animate-pulse')} />
      <path d="M 30 92 Q 8 60 30 30 Q 58 52 30 92 Z" className="fill-primary/25" />
      <path d="M 210 92 Q 232 60 210 30 Q 182 52 210 92 Z" className="fill-primary/25" />
      <path d="M 46 240 Q 54 200 120 196 Q 186 200 194 240 Z" className="fill-leda-roupa" />
      <rect x={106} y={182} width={28} height={22} rx={10} className="fill-leda-pele" />
      {[
        [72, 92, 26], [98, 70, 26], [128, 64, 28], [158, 76, 26], [176, 102, 22], [62, 118, 20], [182, 128, 18],
      ].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} className="fill-leda-cabelo stroke-border" strokeWidth={2} />
      ))}
      <ellipse cx={120} cy={134} rx={62} ry={66} className="fill-leda-pele" />
      <path d="M 66 116 Q 84 86 120 90 Q 156 86 174 116 Q 150 100 120 104 Q 90 100 66 116 Z" className="fill-leda-cabelo" />
      <circle cx={170} cy={78} r={9} className="fill-accent" />
      <circle cx={170} cy={78} r={3.5} className="fill-warning-soft" />
      <circle cx={82} cy={154} r={11} className="fill-accent/45" />
      <circle cx={158} cy={154} r={11} className="fill-accent/45" />
      <Olhos partes={partes} />
      <Boca partes={partes} espessura={6} />
      <path d="M 54 132 A 66 66 0 0 1 186 132" className="fill-none stroke-primary" strokeWidth={8} strokeLinecap="round" />
      <circle cx={54} cy={138} r={14} className="fill-primary" />
      <circle cx={186} cy={138} r={14} className="fill-primary" />
      <path d="M 54 150 Q 60 182 92 184" className="fill-none stroke-primary" strokeWidth={6} strokeLinecap="round" />
      <circle cx={96} cy={184} r={6} className="fill-primary" />
    </>
  );
}

// Os dez furos do disco, um a cada 30 graus. O vão sem furo fica embaixo, à direita.
const FUROS: Array<[number, number]> = [
  [140.7, 197.3], [99.3, 197.3], [63.4, 176.6], [42.7, 140.7], [42.7, 99.3],
  [63.4, 63.4], [99.3, 42.7], [140.7, 42.7], [176.6, 63.4], [197.3, 99.3],
];

/**
 * Gema: o disco do telefone antigo, amarelo, com o rosto no miolo.
 * Ligando, o disco gira e volta, como quem disca. Ouvindo, um anel cresce em volta.
 * Pensando, os furos acendem um por um. Falando, a boca abre com a voz.
 */
export function DesenhoGema({ partes }: { partes: PartesDoRosto }) {
  const { estado, pulsar, piscar } = partes;
  const discando = pulsar && estado === 'ligando';
  return (
    <>
      {estado === 'ouvindo' && (
        <circle cx={120} cy={120} r={119} className={cn('fill-secondary', pulsar && 'animate-pulse')} />
      )}
      <g className={cn(discando && 'disco-discando')}>
        <circle cx={120} cy={120} r={108} className="fill-leda-roupa" />
        {FUROS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={13} className="fill-background" />
        ))}
        {estado === 'pensando' &&
          FUROS.map(([cx, cy], i) =>
            piscar ? (
              <circle key={`aceso-${cx}-${cy}`} cx={cx} cy={cy} r={13} className="fill-leda-traco" opacity={0}>
                <animate
                  attributeName="opacity"
                  values="0;1;1;0;0"
                  keyTimes="0;0.1;0.3;0.4;1"
                  dur="2s"
                  begin={`${i * 0.2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ) : i >= 6 && i <= 8 ? (
              <circle key={`aceso-${cx}-${cy}`} cx={cx} cy={cy} r={13} className="fill-leda-traco" />
            ) : null,
          )}
      </g>
      {/* A trava do dedo, que no telefone de verdade para o disco. */}
      <path d="M 194.5 163 L 222 179" className="fill-none stroke-leda-traco" strokeWidth={9} strokeLinecap="round" />
      <circle cx={120} cy={120} r={50} className="fill-leda-pele" />
      {/* Olhos e boca são os mesmos das outras direções, encolhidos pra caber no miolo. */}
      <g transform="translate(120 120) scale(0.75) translate(-120 -142)">
        <Olhos partes={partes} rx={7.5} ry={11} />
        <Boca partes={partes} espessura={8.5} />
      </g>
    </>
  );
}
