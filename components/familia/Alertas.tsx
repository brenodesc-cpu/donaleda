import {
  Video,
  Check,
  Frown,
  HeartPulse,
  PhoneMissed,
  Pill,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from 'lucide-react';
import type { Alerta, TipoDeAlerta } from '@/lib/tipos';
import { quandoFoi, rotuloDoAlerta } from './formatos';

interface AlertasProps {
  alertas: Alerta[];
  assistente: string;
  tratamento: string;
  hoje: string;
  onMarcarVisto: (alertaId: string) => void;
  /** Endereço pra entrar na ligação acontecendo agora, quando há uma. Aparece nos avisos urgentes. */
  entrarNaLigacao?: string | null;
}

const ICONE_DO_TIPO: Record<TipoDeAlerta, LucideIcon> = {
  emergencia: Siren,
  golpe: ShieldAlert,
  remedio: Pill,
  saude: HeartPulse,
  humor: Frown,
  ligacao: PhoneMissed,
};

function maisNovoPrimeiro(a: Alerta, b: Alerta): number {
  return b.criadoEm.localeCompare(a.criadoEm);
}

interface CartaoProps {
  alerta: Alerta;
  assistente: string;
  tratamento: string;
  hoje: string;
  onMarcarVisto?: (alertaId: string) => void;
  /** Endereço pra entrar na ligação acontecendo agora, quando há uma. */
  entrarNaLigacao?: string | null;
}

function CartaoDoAlerta({
  alerta,
  assistente,
  tratamento,
  hoje,
  onMarcarVisto,
  entrarNaLigacao,
}: CartaoProps) {
  const Icone = ICONE_DO_TIPO[alerta.tipo] ?? HeartPulse;
  const urgente = alerta.gravidade === 'urgente';
  const cheio = urgente && !alerta.visto;
  // Urgente é Goiabada cheia; atenção é Manteiga com contorno Café (brand book).
  const cores = alerta.visto
    ? 'border border-border bg-card'
    : urgente
      ? 'border-2 border-destructive bg-destructive'
      : 'border-2 border-foreground bg-warning-soft';
  const destaque = cheio ? 'text-destructive-foreground' : 'text-foreground';
  const origem =
    alerta.tipo === 'ligacao'
      ? null
      : alerta.origem === 'assistente'
        ? `avisado pela ${assistente}`
        : `na conversa com a ${assistente}`;

  const handleMarcarVisto = () => onMarcarVisto?.(alerta.id);

  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl p-5 ${cores}`}
    >
      <div className="flex items-start gap-3">
        <Icone aria-hidden="true" className={`mt-0.5 h-7 w-7 shrink-0 ${destaque}`} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className={`text-base font-semibold ${destaque}`}>
            {rotuloDoAlerta(alerta.tipo, tratamento)}
            {urgente ? <span className="sr-only"> (urgente)</span> : null}
          </p>
          <p className={`text-lg ${cheio ? 'text-destructive-foreground' : 'text-foreground'}`}>{alerta.texto}</p>
          <p className={`text-base ${cheio ? 'text-destructive-foreground' : 'text-muted-foreground'}`}>
            {quandoFoi(alerta.criadoEm, hoje)}{origem ? `, ${origem}` : ''}
          </p>
        </div>
      </div>
      {cheio && entrarNaLigacao ? (
        <a
          href={entrarNaLigacao}
          className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-success px-6 text-xl font-semibold text-white hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Video aria-hidden="true" className="h-6 w-6" />
          Entrar na ligação agora
        </a>
      ) : null}
      {!alerta.visto && onMarcarVisto ? (
        <button
          type="button"
          onClick={handleMarcarVisto}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg border border-border bg-card px-5 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Check aria-hidden="true" className="h-5 w-5" />
          Já vi
        </button>
      ) : null}
    </li>
  );
}

export function Alertas({
  alertas,
  assistente,
  tratamento,
  hoje,
  onMarcarVisto,
  entrarNaLigacao,
}: AlertasProps) {
  const novos = alertas.filter((a) => !a.visto).sort(maisNovoPrimeiro);
  const vistos = alertas.filter((a) => a.visto).sort(maisNovoPrimeiro);

  return (
    <section aria-label="Avisos" aria-live="polite" className="flex flex-col gap-3">
      {novos.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {novos.map((alerta) => (
            <CartaoDoAlerta
              key={alerta.id}
              alerta={alerta}
              assistente={assistente}
              tratamento={tratamento}
              hoje={hoje}
              onMarcarVisto={onMarcarVisto}
              entrarNaLigacao={entrarNaLigacao}
            />
          ))}
        </ul>
      ) : (
        <p className="flex items-start gap-2 rounded-2xl border border-border bg-card p-5 text-base text-muted-foreground">
          <Check aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          {vistos.length > 0
            ? 'Nenhum aviso novo'
            : 'Nenhum aviso hoje. Se houver queda, dor no peito, pedido de dinheiro ou ligação não atendida, o aviso aparece aqui.'}
        </p>
      )}

      {vistos.length > 0 ? (
        <details className="rounded-2xl border border-border bg-card p-5">
          <summary className="min-h-11 cursor-pointer text-base text-muted-foreground">
            Avisos já vistos ({vistos.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {vistos.map((alerta) => (
              <CartaoDoAlerta
                key={alerta.id}
                alerta={alerta}
                assistente={assistente}
                tratamento={tratamento}
                hoje={hoje}
              />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
