'use client';

import { useState, type ChangeEvent } from 'react';
import { BOTAO_DA_RESPOSTA, RESPOSTAS_DO_AVISO, avisoAberto, linhaDoAviso } from '@/lib/avisos';
import type { Alerta, RespostaDoAviso } from '@/lib/tipos';

/** O que o painel faz quando a pessoa conta o que fez. Devolve true quando o servidor guardou. */
export type ResponderAviso = (alertaId: string, resposta: RespostaDoAviso, nota: string) => Promise<boolean>;

interface LinhaProps {
  alerta: Alerta;
  agora: string;
  /** Texto branco, no aviso urgente em Goiabada cheia. */
  cheio?: boolean;
}

/** "Ninguém viu ainda, há 12 min." ou "Marina viu em 4 min. Ligou, está tudo bem." */
export function LinhaDoAviso({ alerta, agora, cheio = false }: LinhaProps) {
  const linha = linhaDoAviso(alerta, agora);
  if (!linha) return null;
  return (
    <p className={`text-base font-medium ${cheio ? 'text-destructive-foreground' : 'text-foreground'}`}>
      {linha}
    </p>
  );
}

interface PerguntaProps {
  alerta: Alerta;
  cheio?: boolean;
  onResponder: ResponderAviso;
}

const CLASSE_DO_BOTAO =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-base font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60';

/** Depois do "Já vi": o que a pessoa fez, com uma nota curta opcional. */
export function PerguntaDoDesfecho({ alerta, cheio = false, onResponder }: PerguntaProps) {
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [falhou, setFalhou] = useState(false);
  if (!alerta.visto || !alerta.vistoEm || !avisoAberto(alerta)) return null;

  const handleNota = (evento: ChangeEvent<HTMLInputElement>) => setNota(evento.target.value);
  const responder = async (resposta: RespostaDoAviso) => {
    setEnviando(true);
    setFalhou(false);
    const guardou = await onResponder(alerta.id, resposta, nota);
    setEnviando(false);
    if (guardou) setNota('');
    else setFalhou(true);
  };

  const texto = cheio ? 'text-destructive-foreground' : 'text-foreground';
  return (
    <div className="flex flex-col gap-2">
      <p className={`text-base font-semibold ${texto}`}>O que você fez?</p>
      <div className="flex flex-wrap gap-2">
        {RESPOSTAS_DO_AVISO.map((resposta) => (
          <button
            key={resposta}
            type="button"
            disabled={enviando}
            onClick={() => void responder(resposta)}
            className={CLASSE_DO_BOTAO}
          >
            {BOTAO_DA_RESPOSTA[resposta]}
          </button>
        ))}
      </div>
      <label className={`flex flex-col gap-1 text-base ${texto}`}>
        Quer contar mais? (opcional)
        <input
          type="text"
          value={nota}
          onChange={handleNota}
          maxLength={140}
          disabled={enviando}
          className="min-h-11 rounded-lg border border-border bg-card px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      {falhou ? (
        <p className={`text-base font-medium ${texto}`} aria-live="polite">
          Não deu pra guardar agora. Tente de novo.
        </p>
      ) : null}
    </div>
  );
}
