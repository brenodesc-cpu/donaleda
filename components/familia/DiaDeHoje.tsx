import {
  Activity,
  DoorOpen,
  MessagesSquare,
  Moon,
  Pill,
  Smile,
  Utensils,
  type LucideIcon,
} from 'lucide-react';
import type { Dia } from '@/lib/tipos';
import {
  CLASSES_DO_TOM,
  lerAlimentacao,
  lerDor,
  lerFalouComAlguem,
  lerHumor,
  lerRemedio,
  lerSaiuDeCasa,
  lerSono,
  type Leitura,
} from './formatos';

interface DiaDeHojeProps {
  hoje: Dia;
}

interface Bloco {
  id: string;
  nome: string;
  icone: LucideIcon;
  leitura: Leitura;
}

function blocosDoDia(hoje: Dia): Bloco[] {
  return [
    { id: 'sono', nome: 'Sono', icone: Moon, leitura: lerSono(hoje) },
    {
      id: 'alimentacao',
      nome: 'Comida',
      icone: Utensils,
      leitura: lerAlimentacao(hoje),
    },
    { id: 'remedio', nome: 'Remédio', icone: Pill, leitura: lerRemedio(hoje) },
    { id: 'dor', nome: 'Dor (0 a 10)', icone: Activity, leitura: lerDor(hoje) },
    { id: 'humor', nome: 'Humor', icone: Smile, leitura: lerHumor(hoje) },
    {
      id: 'saiu',
      nome: 'Saiu de casa',
      icone: DoorOpen,
      leitura: lerSaiuDeCasa(hoje),
    },
    {
      id: 'falou',
      nome: 'Conversou',
      icone: MessagesSquare,
      leitura: lerFalouComAlguem(hoje),
    },
  ];
}

export function DiaDeHoje({ hoje }: DiaDeHojeProps) {
  const blocos = blocosDoDia(hoje);
  const observacoes = Array.from(
    new Set(hoje.observacoes.map((o) => o.trim()).filter(Boolean)),
  );

  return (
    <section
      aria-labelledby="titulo-do-dia"
      className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titulo-do-dia" className="text-xl font-semibold text-foreground">
          O dia de hoje
        </h2>
        {hoje.exemplo ? (
          <span className="rounded-full bg-muted px-3 py-1 text-base text-muted-foreground">
            dados de exemplo
          </span>
        ) : null}
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {blocos.map(({ id, nome, icone: Icone, leitura }) => {
          const classes = CLASSES_DO_TOM[leitura.tom];
          return (
            <li
              key={id}
              className={`flex flex-col gap-2 rounded-xl border p-3 sm:p-4 ${classes.bloco}`}
            >
              <span className="flex items-start gap-2 text-base leading-snug text-muted-foreground">
                <Icone aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                <span className="min-w-0 break-words">{nome}</span>
              </span>
              <span
                className={`text-base leading-snug ${classes.valor} ${
                  leitura.tom === 'vazio' ? 'font-normal' : 'font-semibold'
                }`}
              >
                {leitura.texto}
              </span>
            </li>
          );
        })}
      </ul>

      {observacoes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-foreground">Observações</h3>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-base text-foreground">
            {observacoes.map((observacao) => (
              <li key={observacao}>{observacao}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
