'use client';

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileText, Plus, Trash2, Upload } from 'lucide-react';
import type { CategoriaDeLembranca, DocumentoClinico, Lembranca } from '@/lib/tipos';
import {
  CLASSE_DO_BOTAO_PRINCIPAL,
  CLASSE_DO_BOTAO_SECUNDARIO,
  CLASSE_DA_CAIXA,
  Erro,
  Salvo,
} from './campos';
import { dataDeBrasilia, gavetaDe, quandoDoCompromisso } from './formatos';
import type { CamposDaLembranca, ResultadoDaLembranca } from './usePainel';

interface AgendaEDocumentosProps {
  lembrancas: Lembranca[];
  documentos: DocumentoClinico[];
  assistente: string;
  tratamento: string;
  onAgendar: (
    campos: CamposDaLembranca & { texto: string; categoria: CategoriaDeLembranca },
  ) => Promise<ResultadoDaLembranca>;
  onAnexarDocumento: (
    arquivo: File,
    nota?: string,
  ) => Promise<{ ok: true; compromissosCriados: number } | { ok: false; erro: string }>;
  onApagarDocumento: (documentoId: string) => Promise<boolean>;
}

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const ROTULO_TIPO: Record<DocumentoClinico['tipo'], string> = {
  exame: 'Exame',
  consulta: 'Consulta',
  receita: 'Receita',
};

function isoDe(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/**
 * Gestão de agenda médica (calendário navegável meses/anos à frente) + anexo de exames/receitas
 * (lidos em memória via IA multimodal pra Dona Leda explicar de forma simples e avisar na semana).
 */
export function AgendaEDocumentos({
  lembrancas,
  documentos,
  assistente,
  tratamento,
  onAgendar,
  onAnexarDocumento,
  onApagarDocumento,
}: AgendaEDocumentosProps) {
  const hoje = dataDeBrasilia(new Date().toISOString());
  const [anoHoje, mesHoje] = hoje.split('-').map(Number);
  const [mesVisivel, setMesVisivel] = useState({ ano: anoHoje || 2026, mes: (mesHoje || 1) - 1 });
  const [diaSelecionado, setDiaSelecionado] = useState<string>(hoje);

  // Novo agendamento rápido
  const [abrindoAgenda, setAbrindoAgenda] = useState(false);
  const [tituloAgenda, setTituloAgenda] = useState('');
  const [dataAgenda, setDataAgenda] = useState(hoje);
  const [horaAgenda, setHoraAgenda] = useState('');
  const [salvandoAgenda, setSalvandoAgenda] = useState(false);
  const [avisoAgenda, setAvisoAgenda] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  // Anexo de documento clínico
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const [notaDoc, setNotaDoc] = useState('');
  const [lendoDoc, setLendoDoc] = useState(false);
  const [avisoDoc, setAvisoDoc] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const compromissos = useMemo(
    () =>
      lembrancas
        .filter((l) => gavetaDe(l.categoria) === 'compromisso' && l.data)
        .sort((a, b) => `${a.data}${a.hora ?? ''}`.localeCompare(`${b.data}${b.hora ?? ''}`)),
    [lembrancas],
  );

  const porData = useMemo(() => {
    const mapa = new Map<string, Lembranca[]>();
    for (const c of compromissos) {
      if (!c.data) continue;
      const lista = mapa.get(c.data) ?? [];
      lista.push(c);
      mapa.set(c.data, lista);
    }
    return mapa;
  }, [compromissos]);

  const futuros = useMemo(
    () => compromissos.filter((c) => (c.data ?? '') >= hoje),
    [compromissos, hoje],
  );

  const celulasDoMes = useMemo(() => {
    const primeiroDiaSemana = new Date(Date.UTC(mesVisivel.ano, mesVisivel.mes, 1, 12)).getUTCDay();
    const totalDias = new Date(Date.UTC(mesVisivel.ano, mesVisivel.mes + 1, 0, 12)).getUTCDate();
    const celulas: Array<{ dia: number; iso: string } | null> = [];
    for (let i = 0; i < primeiroDiaSemana; i += 1) celulas.push(null);
    for (let d = 1; d <= totalDias; d += 1) {
      celulas.push({ dia: d, iso: isoDe(mesVisivel.ano, mesVisivel.mes, d) });
    }
    return celulas;
  }, [mesVisivel]);

  const mudarMes = (delta: number) => {
    setMesVisivel((atual) => {
      const m = atual.mes + delta;
      if (m < 0) return { ano: atual.ano - 1, mes: 11 };
      if (m > 11) return { ano: atual.ano + 1, mes: 0 };
      return { ano: atual.ano, mes: m };
    });
  };

  const handleSalvarAgenda = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tituloAgenda.trim() || !dataAgenda) {
      setAvisoAgenda({ tipo: 'erro', texto: 'Informe o nome da consulta/exame e a data.' });
      return;
    }
    setSalvandoAgenda(true);
    setAvisoAgenda(null);
    const res = await onAgendar({
      texto: tituloAgenda.trim(),
      categoria: 'compromisso',
      data: dataAgenda,
      hora: horaAgenda || undefined,
    });
    setSalvandoAgenda(false);
    if (res.ok) {
      setTituloAgenda('');
      setHoraAgenda('');
      setAbrindoAgenda(false);
      setAvisoAgenda({ tipo: 'ok', texto: `Agendado! A ${assistente} já vai lembrar ${tratamento}.` });
    } else {
      setAvisoAgenda({ tipo: 'erro', texto: res.motivo ?? 'Não deu pra salvar agora.' });
    }
  };

  const handleArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setLendoDoc(true);
    setAvisoDoc(null);
    const res = await onAnexarDocumento(arquivo, notaDoc);
    setLendoDoc(false);
    if (res.ok) {
      setNotaDoc('');
      const extra =
        res.compromissosCriados > 0
          ? ` Também já entrou ${res.compromissosCriados} compromisso no calendário.`
          : '';
      setAvisoDoc({
        tipo: 'ok',
        texto: `Documento lido e salvo sem guardar a imagem original.${extra}`,
      });
    } else {
      setAvisoDoc({ tipo: 'erro', texto: res.erro });
    }
  };

  const eventosDoDia = porData.get(diaSelecionado) ?? [];

  return (
    <section
      aria-labelledby="titulo-agenda-saude"
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar aria-hidden="true" className="h-5 w-5 text-foreground" />
          <h2 id="titulo-agenda-saude" className="text-xl font-semibold text-foreground">
            Agenda de consultas e exames
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            setDataAgenda(diaSelecionado);
            setAbrindoAgenda((v) => !v);
            setAvisoAgenda(null);
          }}
          className={`${CLASSE_DO_BOTAO_SECUNDARIO} sm:w-auto`}
        >
          <Plus aria-hidden="true" className="h-5 w-5" />
          Agendar consulta ou exame
        </button>
      </div>

      <p className="text-base text-muted-foreground">
        Marque consultas e exames (mesmo pra meses à frente). A {assistente} avisa {tratamento} na
        semana e na véspera, sem precisar de ninguém ficar lembrando.
      </p>

      {avisoAgenda?.tipo === 'ok' ? <Salvo texto={avisoAgenda.texto} /> : null}
      {avisoAgenda?.tipo === 'erro' ? <Erro texto={avisoAgenda.texto} /> : null}

      {abrindoAgenda ? (
        <form
          onSubmit={handleSalvarAgenda}
          className="flex flex-col gap-3 rounded-xl border border-border bg-muted/60 p-4"
        >
          <label className="flex flex-col gap-1 text-base font-medium text-foreground">
            Consulta ou exame
            <input
              type="text"
              value={tituloAgenda}
              onChange={(e) => setTituloAgenda(e.target.value)}
              placeholder="Ex.: Cardiologista (levar exame de sangue) ou Jejum de 8h"
              className={CLASSE_DA_CAIXA}
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-base font-medium text-foreground">
              Data
              <input
                type="date"
                value={dataAgenda}
                onChange={(e) => setDataAgenda(e.target.value)}
                className={CLASSE_DA_CAIXA}
              />
            </label>
            <label className="flex flex-col gap-1 text-base font-medium text-foreground">
              Horário (opcional)
              <input
                type="time"
                value={horaAgenda}
                onChange={(e) => setHoraAgenda(e.target.value)}
                className={CLASSE_DA_CAIXA}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={salvandoAgenda}
              className={`${CLASSE_DO_BOTAO_PRINCIPAL} sm:w-auto`}
            >
              {salvandoAgenda ? 'Salvando...' : 'Salvar na agenda'}
            </button>
            <button
              type="button"
              onClick={() => setAbrindoAgenda(false)}
              className={`${CLASSE_DO_BOTAO_SECUNDARIO} sm:w-auto`}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {/* Calendário mensal navegável meses/anos à frente */}
      <div className="rounded-xl border border-border bg-background/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => mudarMes(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="font-titulo text-lg font-semibold text-foreground">
            {NOMES_MESES[mesVisivel.mes]} de {mesVisivel.ano}
          </p>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => mudarMes(1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
          {DIAS_SEMANA.map((d, idx) => (
            <span key={idx} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {celulasDoMes.map((celula, idx) => {
            if (!celula) return <span key={`v-${idx}`} className="h-10" />;
            const temEvento = porData.has(celula.iso);
            const selecionado = celula.iso === diaSelecionado;
            const ehHoje = celula.iso === hoje;
            return (
              <button
                key={celula.iso}
                type="button"
                onClick={() => {
                  setDiaSelecionado(celula.iso);
                  setDataAgenda(celula.iso);
                }}
                className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  selecionado
                    ? 'bg-primary text-primary-foreground'
                    : ehHoje
                      ? 'border border-primary/50 bg-accent/30 text-foreground'
                      : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{celula.dia}</span>
                {temEvento ? (
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${
                      selecionado ? 'bg-accent' : 'bg-destructive'
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {eventosDoDia.length > 0 ? (
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-sm font-semibold text-foreground">
              Agendado em {quandoDoCompromisso(diaSelecionado)}:
            </p>
            <ul className="mt-1 flex flex-col gap-1 text-base text-foreground">
              {eventosDoDia.map((ev) => (
                <li key={ev.id}>
                  • {ev.hora ? `${ev.hora} — ` : ''}
                  {ev.texto}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {futuros.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-foreground">
            Próximas consultas e exames ({futuros.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {futuros.slice(0, 8).map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-muted px-4 py-3 text-base"
              >
                <span className="font-medium text-foreground">{c.texto}</span>
                <span className="text-sm text-muted-foreground">
                  {quandoDoCompromisso(c.data!, c.hora)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Exames e documentos anexados (foto ou PDF lido em memória) */}
      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex items-center gap-2">
          <FileText aria-hidden="true" className="h-5 w-5 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            Exames e receitas no contexto da {assistente}
          </h3>
        </div>
        <p className="text-base text-muted-foreground">
          Tire foto ou anexe o PDF de um exame ou pedido médico. A IA extrai um resumo em palavras
          simples (sem guardar a imagem nem CPF) pra {assistente} ajudar {tratamento} a entender —
          sempre sem dar diagnóstico.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={notaDoc}
            onChange={(e) => setNotaDoc(e.target.value)}
            placeholder="Nota opcional (ex.: exame de rotina do posto)"
            className={`${CLASSE_DA_CAIXA} sm:flex-1`}
          />
          <input
            ref={inputArquivo}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleArquivo}
            className="hidden"
          />
          <button
            type="button"
            disabled={lendoDoc}
            onClick={() => inputArquivo.current?.click()}
            className={`${CLASSE_DO_BOTAO_PRINCIPAL} sm:w-auto`}
          >
            <Upload aria-hidden="true" className="h-5 w-5" />
            {lendoDoc ? 'Lendo documento...' : 'Anexar foto ou PDF'}
          </button>
        </div>

        {avisoDoc?.tipo === 'ok' ? <Salvo texto={avisoDoc.texto} /> : null}
        {avisoDoc?.tipo === 'erro' ? <Erro texto={avisoDoc.texto} /> : null}

        {documentos.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {documentos.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-2 rounded-xl border border-border bg-background/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-accent/40 px-2 py-0.5 text-xs font-semibold text-foreground">
                      {ROTULO_TIPO[doc.tipo]}
                    </span>
                    <span className="font-titulo text-base font-semibold text-foreground">
                      {doc.titulo}
                    </span>
                    {doc.data ? (
                      <span className="text-sm text-muted-foreground">({doc.data})</span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={`Apagar ${doc.titulo}`}
                    onClick={() => void onApagarDocumento(doc.id)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-base text-foreground">{doc.resumoSimples}</p>
                {doc.orientacao ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    Preparo / nota: {doc.orientacao}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
