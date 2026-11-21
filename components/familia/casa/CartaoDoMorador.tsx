import Link from 'next/link';
import {
  Check,
  ChevronRight,
  Frown,
  HeartPulse,
  Phone,
  PhoneMissed,
  Pill,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from 'lucide-react';
import type { TipoDeAlerta } from '@/lib/tipos';
import { enderecoCom } from '../api';
import {
  CLASSES_DO_TOM,
  comMaiuscula,
  lerAlimentacao,
  lerDor,
  lerHumor,
  lerSono,
  rotuloDoAlerta,
} from '../formatos';
import type { PedidoDeLigacao } from '../usePainel';
import { linhaDaConversa, podeLigarDeNovo, quandoDoAviso } from './frases';
import type { Morador } from './ordem';

const ICONE_DO_TIPO: Record<TipoDeAlerta, LucideIcon> = {
  emergencia: Siren,
  golpe: ShieldAlert,
  remedio: Pill,
  saude: HeartPulse,
  humor: Frown,
  ligacao: PhoneMissed,
};

const CLASSE_DO_BOTAO =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70';

interface CartaoDoMoradorProps {
  morador: Morador;
  agora: string;
  pedido: PedidoDeLigacao;
  onJaVi: (idosoId: string, alertaIds: string[]) => void;
  onLigar: (idosoId: string) => void;
}

/** Um morador: os avisos novos em cima, a conversa de hoje e como ele está. */
export function CartaoDoMorador({ morador, agora, pedido, onJaVi, onLigar }: CartaoDoMoradorProps) {
  const { id, painel, avisosNovos } = morador;
  const { assistente, idoso, hoje } = painel;
  const urgente = avisosNovos.some((a) => a.gravidade === 'urgente');
  const borda = avisosNovos.length === 0
    ? 'border border-border'
    : urgente
      ? 'border-2 border-destructive'
      : 'border-2 border-foreground';
  const conversa = linhaDaConversa(painel, agora);
  const leituras = [
    { nome: 'Humor', leitura: lerHumor(hoje) },
    { nome: 'Dor', leitura: lerDor(hoje) },
    { nome: 'Sono', leitura: lerSono(hoje) },
    { nome: 'Comida', leitura: lerAlimentacao(hoje) },
  ];
  const ligarDeNovo = podeLigarDeNovo(painel);
  const nome = comMaiuscula(idoso.tratamento);

  const handleJaVi = () => onJaVi(id, avisosNovos.map((a) => a.id));
  const handleLigar = () => onLigar(id);

  return (
    <li className={`flex flex-col overflow-hidden rounded-2xl bg-card ${borda}`}>
      {avisosNovos.map((alerta) => {
        const Icone = ICONE_DO_TIPO[alerta.tipo] ?? HeartPulse;
        const cheio = alerta.gravidade === 'urgente';
        return (
          <div
            key={alerta.id}
            className={`flex flex-col gap-1 border-b p-4 ${
              cheio
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'border-foreground/20 bg-warning-soft text-foreground'
            }`}
          >
            <p className="flex items-center gap-2 text-base font-semibold">
              <Icone aria-hidden="true" className="h-5 w-5 shrink-0" />
              {rotuloDoAlerta(alerta.tipo, idoso.tratamento)}
              {cheio ? <span className="sr-only"> (urgente)</span> : null}
            </p>
            <p className="text-base leading-snug">{alerta.texto}</p>
            <p className={`text-sm ${cheio ? 'text-destructive-foreground' : 'text-muted-foreground'}`}>
              {quandoDoAviso(alerta, hoje.data, assistente)}
            </p>
          </div>
        );
      })}

      <div className="flex flex-col gap-3 p-4">
        <Link
          href={enderecoCom('/familia', id)}
          className="-m-1 flex items-start justify-between gap-2 rounded-lg p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-titulo text-xl font-bold text-foreground">{nome}</span>
            <span
              className={`flex items-center gap-2 text-base ${
                conversa.tom === 'atencao'
                  ? `font-semibold ${CLASSES_DO_TOM.atencao.valor}`
                  : conversa.tom === 'bom'
                    ? `font-semibold ${CLASSES_DO_TOM.bom.valor}`
                    : conversa.tom === 'vazio'
                      ? 'text-muted-foreground'
                      : 'text-foreground'
              }`}
            >
              {conversa.agora ? (
                <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-full bg-success" />
              ) : null}
              {conversa.texto}
            </span>
          </span>
          <ChevronRight aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-muted-foreground" />
          <span className="sr-only">Abrir o painel de {nome}</span>
        </Link>

        <ul className="flex flex-col gap-1">
          {leituras.map(({ nome: campo, leitura }) => {
            const classes = CLASSES_DO_TOM[leitura.tom];
            return (
              <li key={campo} className="flex items-start gap-2 text-base">
                <span aria-hidden="true" className={`mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full ${classes.ponto}`} />
                <span className="w-16 shrink-0 text-muted-foreground">{campo}</span>
                <span className={`${classes.valor} ${leitura.tom === 'vazio' ? 'font-normal' : 'font-semibold'}`}>
                  {leitura.texto}
                </span>
              </li>
            );
          })}
        </ul>

        {avisosNovos.length > 0 || ligarDeNovo ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {avisosNovos.length > 0 ? (
                <button
                  type="button"
                  onClick={handleJaVi}
                  className={`${CLASSE_DO_BOTAO} border-border bg-card text-foreground hover:bg-muted`}
                >
                  <Check aria-hidden="true" className="h-5 w-5" />
                  Já vi
                </button>
              ) : null}
              {ligarDeNovo ? (
                <button
                  type="button"
                  onClick={handleLigar}
                  disabled={pedido === 'pedindo'}
                  className={`${CLASSE_DO_BOTAO} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}
                >
                  <Phone aria-hidden="true" className="h-5 w-5" />
                  {pedido === 'pedindo' ? 'Ligando...' : 'Ligar agora'}
                </button>
              ) : null}
            </div>
            {pedido === 'falhou' ? (
              <p className="text-base font-medium text-foreground" aria-live="polite">
                Não deu pra ligar agora. Confira se o aparelho está ligado na internet.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
