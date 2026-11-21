'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apagarIdoso, deuCerto } from './api';
import { Erro } from './campos';
import { Cartao } from './Moldura';

interface ApagarIdosoProps {
  idosoId: string;
  tratamento: string;
}

/** Apaga o idoso e tudo o que a Dona Leda guardou dele. Pede confirmação antes. */
export function ApagarIdoso({ idosoId, tratamento }: ApagarIdosoProps) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleApagar = async () => {
    setApagando(true);
    setErro(null);
    const { status } = await apagarIdoso(idosoId);
    setApagando(false);
    if (deuCerto(status)) router.replace('/familia');
    else if (status === 403) setErro('Só quem cadastrou pode apagar.');
    else setErro('Não deu pra apagar agora. Tente de novo.');
  };

  return (
    <Cartao titulo={`Apagar os dados de ${tratamento}`}>
      <p className=" text-base text-muted-foreground">
        Apaga a ficha, as lembranças, os avisos e os aparelhos ligados. Não tem como desfazer.
      </p>
      <Erro texto={erro} />
      {confirmando ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleApagar}
            disabled={apagando}
            className="min-h-12 rounded-xl bg-destructive px-5 text-base font-semibold text-destructive-foreground disabled:opacity-60"
          >
            {apagando ? 'Apagando...' : 'Sim, apagar tudo'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="min-h-12 rounded-xl border border-border px-5 text-base font-semibold text-foreground"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="mt-4 min-h-12 rounded-xl border border-destructive px-5 text-base font-semibold text-destructive"
        >
          Apagar os dados
        </button>
      )}
    </Cartao>
  );
}
