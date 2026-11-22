'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { PhoneCall, Plus, Trash2 } from 'lucide-react';
import type { ContatoDeEmergencia, Idoso } from '@/lib/tipos';
import type { PerfilDoIdoso } from './api';
import {
  Campo,
  CLASSE_DO_BOTAO_PRINCIPAL,
  CLASSE_DO_BOTAO_SECUNDARIO,
  CLASSE_DA_CAIXA,
  Erro,
  Salvo,
} from './campos';
import { ChaveAtenderSozinho } from './ChaveAtenderSozinho';
import { EditorDeRemedios } from './EditorDeRemedios';
import { HorariosDaLigacao } from './HorariosDaLigacao';
import { Cartao } from './Moldura';

interface AjustesDoIdosoProps {
  idoso: Idoso;
  redeDeApoio?: ContatoDeEmergencia[];
  onTrocarHorarios: (horarios: string[]) => void;
  onTrocarAtenderSozinho: (ligado: boolean) => void;
  onSalvarPerfil: (perfil: PerfilDoIdoso) => Promise<boolean>;
  onSalvarRedeDeApoio?: (
    contatos: Omit<ContatoDeEmergencia, 'id'>[] | ContatoDeEmergencia[],
  ) => Promise<ContatoDeEmergencia[] | null>;
}

type Aviso = { tipo: 'salvo' | 'erro'; texto: string } | null;

/** Os ajustes de um idoso: como chamar, remédios, horários, atender sozinho e rede de apoio. */
export function AjustesDoIdoso({
  idoso,
  redeDeApoio = [],
  onTrocarHorarios,
  onTrocarAtenderSozinho,
  onSalvarPerfil,
  onSalvarRedeDeApoio,
}: AjustesDoIdosoProps) {
  const [tratamento, setTratamento] = useState(idoso.tratamento);
  const [remedios, setRemedios] = useState<Idoso['remedios']>(idoso.remedios);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  const [contatos, setContatos] = useState<
    { id?: string; nome: string; parentesco: string; telefone: string }[]
  >(() =>
    redeDeApoio.length > 0
      ? redeDeApoio
      : [{ nome: '', parentesco: '', telefone: '' }],
  );
  const [salvandoRede, setSalvandoRede] = useState(false);
  const [avisoRede, setAvisoRede] = useState<Aviso>(null);

  const handleSalvarRede = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onSalvarRedeDeApoio) return;
    setSalvandoRede(true);
    setAvisoRede(null);
    const preenchidos = contatos.filter((c) => c.nome.trim() && c.telefone.trim());
    const salvos = await onSalvarRedeDeApoio(preenchidos);
    setSalvandoRede(false);
    if (!salvos) {
      setAvisoRede({
        tipo: 'erro',
        texto: 'Não deu pra salvar a rede de apoio agora. Tente de novo.',
      });
      return;
    }
    setContatos(
      salvos.length > 0 ? salvos : [{ nome: '', parentesco: '', telefone: '' }],
    );
    if (salvos.length < preenchidos.length) {
      setAvisoRede({
        tipo: 'erro',
        texto: `Salvos ${salvos.length} de ${preenchidos.length} contatos. Os demais tinham telefone inválido — informe DDD + número (ex.: 11 99999-9999).`,
      });
      return;
    }
    setAvisoRede({
      tipo: 'salvo',
      texto: `Rede de apoio salva (${salvos.length} contato${salvos.length === 1 ? '' : 's'}). Se não atender 3 tentativas, todos serão acionados.`,
    });
  };

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
        <p className="text-base text-muted-foreground">O que você muda aqui vale na hora, sem precisar salvar.</p>
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

      {onSalvarRedeDeApoio ? (
        <form onSubmit={handleSalvarRede} noValidate className="flex flex-col gap-4">
          <Cartao titulo="Rede de apoio (após 3 tentativas sem resposta)">
            <p className="text-base text-muted-foreground">
              Se {idoso.tratamento} não atender 3 tentativas seguidas de ligação, a Dona Leda gera
              alerta urgente e aciona em massa todos os contatos abaixo (com suporte a ligação
              automática via Agora Telephony).
            </p>

            <div className="flex flex-col gap-3">
              {contatos.map((contato, idx) => (
                <div
                  key={contato.id ?? idx}
                  className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-muted/40 p-3 sm:grid-cols-3"
                >
                  <input
                    type="text"
                    value={contato.nome}
                    onChange={(e) => {
                      const copia = [...contatos];
                      copia[idx] = { ...copia[idx], nome: e.target.value };
                      setContatos(copia);
                      setAvisoRede(null);
                    }}
                    placeholder="Nome (ex.: Marina)"
                    className={CLASSE_DA_CAIXA}
                  />
                  <input
                    type="text"
                    value={contato.parentesco}
                    onChange={(e) => {
                      const copia = [...contatos];
                      copia[idx] = { ...copia[idx], parentesco: e.target.value };
                      setContatos(copia);
                      setAvisoRede(null);
                    }}
                    placeholder="Parentesco (ex.: filha)"
                    className={CLASSE_DA_CAIXA}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={contato.telefone}
                      onChange={(e) => {
                        const copia = [...contatos];
                        copia[idx] = { ...copia[idx], telefone: e.target.value };
                        setContatos(copia);
                        setAvisoRede(null);
                      }}
                      placeholder="(11) 99999-9999"
                      className={`${CLASSE_DA_CAIXA} flex-1`}
                    />
                    <button
                      type="button"
                      aria-label="Remover contato"
                      onClick={() => {
                        setContatos(contatos.filter((_, i) => i !== idx));
                        setAvisoRede(null);
                      }}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setContatos([...contatos, { nome: '', parentesco: '', telefone: '' }])
              }
              className={`${CLASSE_DO_BOTAO_SECUNDARIO} sm:w-auto`}
            >
              <Plus aria-hidden="true" className="h-5 w-5" />
              Adicionar familiar ou cuidador
            </button>

            {avisoRede?.tipo === 'erro' ? <Erro texto={avisoRede.texto} /> : null}
            {avisoRede?.tipo === 'salvo' ? <Salvo texto={avisoRede.texto} /> : null}

            <button
              type="submit"
              disabled={salvandoRede}
              className={`${CLASSE_DO_BOTAO_PRINCIPAL} sm:w-auto`}
            >
              <PhoneCall aria-hidden="true" className="h-5 w-5" />
              {salvandoRede ? 'Salvando rede...' : 'Salvar rede de apoio'}
            </button>
          </Cartao>
        </form>
      ) : null}
    </div>
  );
}
