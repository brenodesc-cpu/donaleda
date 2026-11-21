// Amostras pra julgar cada direção da marca na tela que importa: a ligação que
// toca no aparelho do idoso e um cartão do painel da família. Não são botões de verdade.

import { Phone } from 'lucide-react';
import { Rosto } from '@/components/Rosto';
import type { Direcao } from './direcoes';

export function AmostraDaLigacao({ estilo }: { estilo: Direcao }) {
  return (
    <div className="mx-auto w-full max-w-[19rem] rounded-[2rem] border-4 border-foreground/80 bg-background px-5 pb-6 pt-5 text-center shadow-lg">
      <p className="text-base text-muted-foreground">Chamada de vídeo</p>
      <Rosto estilo={estilo} estado="ligando" nivel={0} className="mx-auto h-40 w-40 sm:h-40 sm:w-40" />
      <p className="mt-1 font-titulo text-3xl font-semibold text-foreground">Dona Leda está ligando</p>
      <p className="text-lg text-muted-foreground">Sua assistente virtual</p>
      <span className="mt-5 flex min-h-20 w-full items-center justify-center gap-3 rounded-2xl bg-success text-2xl font-semibold text-white shadow-md">
        <Phone aria-hidden className="h-7 w-7" />
        Atender
      </span>
      <span className="mt-3 flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-border bg-card text-xl font-medium text-foreground">
        Agora não
      </span>
    </div>
  );
}

const SITUACOES = [
  { id: 'sono', rotulo: 'Sono', valor: 'Dormiu bem', classe: 'bg-success-soft text-success' },
  { id: 'comida', rotulo: 'Comida', valor: 'Comeu pouco', classe: 'bg-warning-soft text-warning' },
  { id: 'casa', rotulo: 'Saiu de casa', valor: 'Foi à feira', classe: 'bg-muted text-foreground' },
];

export function AmostraDoCartao() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm">
      <p className="text-sm text-muted-foreground">Sábado, 21 de novembro</p>
      <p className="text-2xl font-semibold text-foreground">Dona Helena hoje</p>
      <p className="mt-1 text-base text-muted-foreground">
        Conversou com a Dona Leda às 10h12, por 7 minutos
      </p>
      <div className="mt-4 rounded-xl border-2 border-foreground bg-warning-soft p-3 text-base font-semibold text-foreground">
        Não tomou o remédio da pressão
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {SITUACOES.map((s) => (
          <div key={s.id} className={`rounded-xl p-2.5 ${s.classe}`}>
            <p className="text-xs font-medium opacity-90">{s.rotulo}</p>
            <p className="text-sm font-bold leading-tight">{s.valor}</p>
          </div>
        ))}
      </div>
      <span className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
        Ligar agora
      </span>
    </div>
  );
}
