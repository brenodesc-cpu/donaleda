'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import type { Idoso, NovoIdoso } from '@/lib/tipos';
import { Campo, CLASSE_DO_BOTAO_PRINCIPAL, Erro } from './campos';
import { EditorDeRemedios } from './EditorDeRemedios';
import { HorariosDaLigacao } from './HorariosDaLigacao';
import { Cartao } from './Moldura';

interface FormularioDoIdosoProps {
  enviando: boolean;
  erro: string | null;
  onEnviar: (novo: NovoIdoso) => void;
}

const PARENTESCOS = ['filha', 'filho', 'neta', 'neto', 'sobrinha', 'sobrinho', 'nora', 'genro'];

/** O cadastro do idoso, em poucos campos. */
export function FormularioDoIdoso({ enviando, erro, onEnviar }: FormularioDoIdosoProps) {
  const [nome, setNome] = useState('');
  const [tratamento, setTratamento] = useState('');
  const [idade, setIdade] = useState('');
  const [seuNome, setSeuNome] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [remedios, setRemedios] = useState<Idoso['remedios']>([]);
  const [horarios, setHorarios] = useState<string[]>(['09:00', '18:00']);
  const [faltou, setFaltou] = useState<string | null>(null);

  const mudar = (definir: (valor: string) => void) => (evento: ChangeEvent<HTMLInputElement>) =>
    definir(evento.target.value);

  const handleEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const anos = Number(idade);
    if (!nome.trim()) return setFaltou('Falta o nome.');
    if (!tratamento.trim()) return setFaltou('Falta como a Dona Leda deve chamar.');
    if (!Number.isFinite(anos) || anos < 40 || anos > 120) {
      return setFaltou('A idade precisa ser um número entre 40 e 120.');
    }
    if (!seuNome.trim() || !parentesco.trim()) {
      return setFaltou('Falta o seu nome e o seu parentesco.');
    }
    setFaltou(null);
    onEnviar({
      nome: nome.trim(),
      tratamento: tratamento.trim(),
      idade: Math.round(anos),
      familiar: { nome: seuNome.trim(), parentesco: parentesco.trim().toLowerCase() },
      remedios,
      horariosDeLigacao: horarios,
    });
  };

  return (
    <form onSubmit={handleEnviar} className="flex flex-col gap-5" noValidate>
      <Cartao titulo="Quem a Dona Leda vai acompanhar">
        <Campo id="nome" rotulo="Nome" value={nome} onChange={mudar(setNome)} placeholder="Ex.: Helena" autoComplete="off" />
        <Campo
          id="tratamento"
          rotulo="Como a Dona Leda deve chamar"
          value={tratamento}
          onChange={mudar(setTratamento)}
          placeholder="Ex.: dona Helena"
          ajuda='Do jeito que a família fala: "dona Helena", "seu Antônio", "vó Lurdes".'
        />
        <Campo
          id="idade"
          rotulo="Idade"
          type="number"
          inputMode="numeric"
          min={40}
          max={120}
          value={idade}
          onChange={mudar(setIdade)}
          placeholder="Ex.: 78"
          className="sm:max-w-32"
        />
      </Cartao>

      <Cartao titulo="Quem está cadastrando">
        <Campo id="seu-nome" rotulo="O seu nome" value={seuNome} onChange={mudar(setSeuNome)} placeholder="Ex.: Marina" autoComplete="given-name" />
        <Campo
          id="parentesco"
          rotulo="Seu parentesco"
          value={parentesco}
          onChange={mudar(setParentesco)}
          placeholder="Ex.: filha"
          list="parentescos"
          ajuda="A Dona Leda fala de você nas conversas: a sua filha Marina me pediu pra ligar."
        />
        <datalist id="parentescos">
          {PARENTESCOS.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </Cartao>

      <Cartao titulo="Remédios">
        <p className="text-base text-muted-foreground">
          A Dona Leda pergunta na conversa se o remédio foi tomado e avisa você quando não foi.
        </p>
        <EditorDeRemedios remedios={remedios} onTrocar={setRemedios} />
      </Cartao>

      <Cartao titulo="Ligações">
        <p className="text-base text-muted-foreground">
          A Dona Leda liga nesses horários. Você também pode mandar ligar a qualquer hora.
        </p>
        <HorariosDaLigacao horarios={horarios} onTrocar={setHorarios} />
      </Cartao>

      <Erro texto={faltou ?? erro} />
      <button type="submit" disabled={enviando} className={CLASSE_DO_BOTAO_PRINCIPAL}>
        {enviando ? 'Cadastrando...' : 'Cadastrar'}
      </button>
    </form>
  );
}
