'use client';

interface ChaveAtenderSozinhoProps {
  ligado: boolean;
  onTrocar: (ligado: boolean) => void;
}

/** Liga e desliga o atender sozinho da ligação, pra quem não consegue tocar na tela. */
export function ChaveAtenderSozinho({ ligado, onTrocar }: ChaveAtenderSozinhoProps) {
  const handleTrocar = () => onTrocar(!ligado);

  return (
    <div className="flex items-start gap-4">
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-labelledby="rotulo-atender-sozinho"
        aria-describedby="ajuda-atender-sozinho"
        onClick={handleTrocar}
        className={`relative mt-0.5 inline-flex h-11 w-[72px] shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          ligado ? 'border-primary bg-primary' : 'border-border bg-muted'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-8 w-8 rounded-full bg-card shadow transition-transform ${
            ligado ? 'translate-x-9' : 'translate-x-1'
          }`}
        />
      </button>
      <div className="flex min-w-0 flex-col gap-1">
        <p id="rotulo-atender-sozinho" className="text-base font-medium text-foreground">
          Atender sozinho depois de 10 segundos
        </p>
        <p id="ajuda-atender-sozinho" className="text-base text-muted-foreground">
          Pra quem tem dificuldade de tocar na tela.
        </p>
      </div>
    </div>
  );
}
