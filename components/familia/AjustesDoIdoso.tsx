'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Idoso } from '@/lib/tipos';
import type { PerfilDoIdoso } from './api';
import { Campo, CLASSE_DO_BOTAO_PRINCIPAL, Erro, Salvo } from './campos';
import { ChaveAtenderSozinho } from './ChaveAtenderSozinho';
import { EditorDeRemedios } from './EditorDeRemedios';
import { HorariosDaLigacao } from './HorariosDaLigacao';
import { Cartao } from './Moldura';

interface AjustesDoIdosoProps {
  idoso: Idoso;
  onTrocarHorarios: (horarios: string[]) => void;
  onTrocarAtenderSozinho: (ligado: boolean) => void;
  onSalvarPerfil: (perfil: PerfilDoIdoso) => Promise<boolean>;
}

type Aviso = { tipo: 'salvo' | 'erro'; texto: string } | null;

/** Os ajustes de um idoso: como chamar, remédios, horários e atender sozinho. */
export function AjustesDoIdoso({
  idoso,
  onTrocarHorarios,
  onTrocarAtenderSozinho,
  onSalvarPerfil,
}: AjustesDoIdosoProps) {
  const [tratamento, setTratamento] = useState(idoso.tratamento);
  const [remedios, setRemedios] = useState<Idoso['remedios']>(idoso.remedios);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  const mudouAlgo =
    tratamento.trim() !== idoso.tratamento ||
    JSON.stringify(remedios) !== JSON.stringify(idoso.remedios);

  const handleTratamento = (evento: ChangeEvent<HTMLInputElement>) => {
    setTratamento(evento.target.value);
    setAviso(null);
  };

  const handleRemedios = (lista: Idoso['remedios']) => {
    setRemedios(lista);
    setAviso(null);
  };

  const handleSalvar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!tratamento.trim()) {
      setAviso({ tipo: 'erro', texto: 'Falta como a Dona Leda deve chamar.' });
      return;
    }
    setSalvando(true);
    const guardou = await onSalvarPerfil({ tratamento: tratamento.trim(), remedios });
    setSalvando(false);
    setAviso(
      guardou
        ? { tipo: 'salvo', texto: 'Salvo. A Dona Leda usa isso na próxima conversa.' }
        : { tipo: 'erro', texto: 'Não deu pra salvar agora. Tente de novo.' },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <Cartao titulo="Ligações">
        <HorariosDaLigacao horarios={idoso.horariosDeLigacao} onTrocar={onTrocarHorarios} />
        <ChaveAtenderSozinho ligado={idoso.atenderSozinho} onTrocar={onTrocarAtenderSozinho} />
      </Cartao>

      <form onSubmit={handleSalvar} noValidate className="flex flex-col gap-5">
        <Cartao titulo="Como chamar">
          <Campo
            id="tratamento"
            rotulo="Como a Dona Leda deve chamar"
            value={tratamento}
            onChange={handleTratamento}
            ajuda='Do jeito que a família fala: "dona Helena", "seu Antônio".'
          />
        </Cartao>

        <Cartao titulo="Remédios">
          <EditorDeRemedios remedios={remedios} onTrocar={handleRemedios} />
        </Cartao>

        {aviso?.tipo === 'erro' ? <Erro texto={aviso.texto} /> : null}
        {aviso?.tipo === 'salvo' ? <Salvo texto={aviso.texto} /> : null}
        <button type="submit" disabled={salvando || !mudouAlgo} className={CLASSE_DO_BOTAO_PRINCIPAL}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}
