'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDoAparelho } from '@/lib/aparelho';
import type { ItemDoTranscript } from '@/lib/conversation';
import {
  avancarFala,
  base64ParaSom,
  criarReamostrador,
  ENDERECO_DO_GEMINI,
  juntarLegenda,
  LEGENDA_VAZIA,
  pedidoDaSaudacao,
  picoDoSom,
  SEM_FALA,
  somarUso,
  somParaBase64,
  TAXA_DA_VOZ,
  TAXA_DO_MICROFONE,
  usoZerado,
  type EstadoDaLegenda,
  type EventoDaLegenda,
} from '@/lib/direto';
import type { InicioDireto, PedidoDeAcao, PedidoDeUso, RespostaDaAcao, UsoDoGemini } from '@/lib/tipos';

// A conversa do modo direto: o aparelho abre a conversa ao vivo com o Gemini
// usando o passe temporário que o servidor emitiu. O microfone vai pro Gemini,
// a voz dela toca no aparelho e sai também numa faixa de som que a tela publica
// na sala da Agora. As ações que o Gemini pede (guardar lembrança, avisar a
// família) são repassadas ao servidor com o token do aparelho.

/** Tempo que o aparelho espera o Gemini confirmar a conversa antes de avisar que não deu. */
const ESPERA_PELO_GEMINI_MS = 15_000;
const INTERVALO_DO_NIVEL_MS = 80;
const SE_A_ACAO_FALHAR = 'Não consegui anotar agora. Siga a conversa normalmente.';

interface Entrada {
  direto: InicioDireto;
  conversaId: string;
  uidDaAssistente: string;
  /** O microfone aberto pelo aparelho. O mesmo som vai pro Gemini e pra sala da Agora. */
  microfone: MediaStreamTrack | null;
  /** Só liga depois do falso desmonte do StrictMode: o passe abre uma conversa só. */
  pronto: boolean;
  /** A conversa com o Gemini caiu sem ninguém desligar. `jaConversou` diz se ela chegou a abrir. */
  aoCair: (jaConversou: boolean) => void;
}

interface ChamadaDeFuncao {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
}

type ContextoDeSom = typeof AudioContext;

export function useGeminiDireto({ direto, conversaId, uidDaAssistente, microfone, pronto, aoCair }: Entrada) {
  const [legenda, setLegenda] = useState<EstadoDaLegenda>(LEGENDA_VAZIA);
  const [naLinha, setNaLinha] = useState(false);
  const [falando, setFalando] = useState(false);
  const [agindo, setAgindo] = useState(false);
  const [nivel, setNivel] = useState(0);
  const [faixaDaVoz, setFaixaDaVoz] = useState<MediaStreamTrack | null>(null);
  const [conta, setConta] = useState<{ uso: UsoDoGemini; segundos: number }>({ uso: usoZerado(), segundos: 0 });
  const [somPreso, setSomPreso] = useState(false);

  const contexto = useRef<AudioContext | null>(null);
  // O relógio lê sempre o valor mais novo destas coisas, sem reabrir a conversa.
  const cair = useRef(aoCair);
  const inicio = useRef(direto);
  useEffect(() => {
    cair.current = aoCair;
    inicio.current = direto;
  }, [aoCair, direto]);

  useEffect(() => {
    if (!pronto || !microfone) return;
    let vivo = true;
    let fechandoPorMim = false;
    let confirmado = false;
    let abertoEm = 0;
    let uso = usoZerado();
    let contaEntregue = false;

    const Contexto: ContextoDeSom =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: ContextoDeSom }).webkitAudioContext;
    const ctx = new Contexto();
    contexto.current = ctx;
    // Ligação atendida sozinha, sem toque de dedo: o navegador pode segurar o som.
    void ctx.resume().catch(() => undefined);
    const conferirSom = setTimeout(() => {
      if (vivo && ctx.state === 'suspended') setSomPreso(true);
    }, 400);

    // A voz dela sai por três lugares: o alto-falante, o medidor que mexe a boca
    // do rosto e a faixa de som que vai pra sala da Agora.
    const barra = ctx.createGain();
    const medidor = ctx.createAnalyser();
    medidor.fftSize = 1024;
    const amostrasDoMedidor = new Float32Array(medidor.fftSize);
    const praSala = ctx.createMediaStreamDestination();
    barra.connect(medidor);
    barra.connect(ctx.destination);
    barra.connect(praSala);
    setFaixaDaVoz(praSala.stream.getAudioTracks()[0] ?? null);

    let proximoInicio = 0;
    let tocando: AudioBufferSourceNode[] = [];

    const tocar = (base64: string) => {
      const amostras = base64ParaSom(base64);
      if (amostras.length === 0) return;
      const pedaco = ctx.createBuffer(1, amostras.length, TAXA_DA_VOZ);
      pedaco.getChannelData(0).set(amostras);
      const fonte = ctx.createBufferSource();
      fonte.buffer = pedaco;
      fonte.connect(barra);
      const quando = Math.max(ctx.currentTime, proximoInicio);
      fonte.start(quando);
      proximoInicio = quando + pedaco.duration;
      tocando.push(fonte);
      setFalando(true);
      fonte.onended = () => {
        tocando = tocando.filter((f) => f !== fonte);
        if (vivo && tocando.length === 0) setFalando(false);
      };
    };

    // O idoso falou por cima: o que já chegou de voz precisa parar na hora.
    const calar = () => {
      for (const fonte of tocando) {
        fonte.onended = null;
        try {
          fonte.stop();
        } catch {
          // já parou
        }
      }
      tocando = [];
      proximoInicio = 0;
      if (vivo) setFalando(false);
    };

    const relogioDoNivel = setInterval(() => {
      medidor.getFloatTimeDomainData(amostrasDoMedidor);
      let soma = 0;
      for (let i = 0; i < amostrasDoMedidor.length; i += 1) soma += amostrasDoMedidor[i] ** 2;
      const lido = Math.min(1, Math.sqrt(soma / amostrasDoMedidor.length) * 4);
      setNivel((anterior) => {
        const suave = Math.max(lido, anterior * 0.6);
        const novo = suave < 0.02 ? 0 : suave;
        return Math.abs(novo - anterior) > 0.02 || (novo === 0 && anterior !== 0) ? novo : anterior;
      });
    }, INTERVALO_DO_NIVEL_MS);

    const ws = new WebSocket(`${ENDERECO_DO_GEMINI}?access_token=${encodeURIComponent(inicio.current.passe)}`);
    // Em bytes, pra cada mensagem ser lida na ordem em que chegou: a voz vem em pedaços.
    ws.binaryType = 'arraybuffer';
    const leitor = new TextDecoder();

    const mandar = (mensagem: unknown) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(mensagem));
    };

    const anotarLegenda = (evento: EventoDaLegenda) => {
      setLegenda((atual) => juntarLegenda(atual, evento, uidDaAssistente));
    };

    let origem: MediaStreamAudioSourceNode | null = null;
    let processador: ScriptProcessorNode | null = null;

    // O microfone só começa a ir depois que o Gemini confirma a conversa: som
    // mandado antes disso é descartado.
    const ligarMicrofone = () => {
      const reamostrar = criarReamostrador(ctx.sampleRate, TAXA_DO_MICROFONE);
      const silencioMs = inicio.current.silencioMs;
      let fala = SEM_FALA;
      origem = ctx.createMediaStreamSource(new MediaStream([microfone]));
      processador = ctx.createScriptProcessor(2048, 1, 1);
      processador.onaudioprocess = (evento) => {
        const amostras = reamostrar(evento.inputBuffer.getChannelData(0));
        if (amostras.length === 0) return;
        mandar({
          realtimeInput: {
            audio: { data: somParaBase64(amostras), mimeType: `audio/pcm;rate=${TAXA_DO_MICROFONE}` },
          },
        });
        // Depois do silêncio combinado, o aparelho avisa que a fala acabou. O som
        // continua indo, e a próxima fala reabre a escuta sozinha.
        const passo = avancarFala(fala, picoDoSom(amostras), Date.now(), silencioMs);
        fala = passo.estado;
        if (passo.avisarFim) mandar({ realtimeInput: { audioStreamEnd: true } });
      };
      origem.connect(processador);
      // O processador só roda ligado na saída. Ele não escreve nada nela, então sai silêncio.
      processador.connect(ctx.destination);
    };

    const canceladas = new Set<string>();
    let filaDeAcoes: Promise<void> = Promise.resolve();

    const executar = async (chamadas: ChamadaDeFuncao[]) => {
      if (vivo) setAgindo(true);
      const respostas: { id?: string; name?: string; response: { result: string } }[] = [];
      for (const chamada of chamadas) {
        let texto = SE_A_ACAO_FALHAR;
        try {
          const pedido: PedidoDeAcao = { nome: chamada.name ?? '', argumentos: chamada.args ?? {} };
          const resposta = await fetchDoAparelho('/api/direto/acao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido),
          });
          const corpo = (await resposta.json()) as Partial<RespostaDaAcao>;
          if (typeof corpo?.texto === 'string' && corpo.texto) texto = corpo.texto;
        } catch {
          // A conversa segue mesmo sem a anotação.
        }
        // O Google cancela a ação quando o idoso fala por cima; a resposta dela não vai.
        if (chamada.id && canceladas.has(chamada.id)) continue;
        respostas.push({ id: chamada.id, name: chamada.name, response: { result: texto } });
      }
      if (vivo) setAgindo(false);
      if (respostas.length > 0) mandar({ toolResponse: { functionResponses: respostas } });
    };

    ws.onopen = () => mandar(inicio.current.abertura);

    ws.onmessage = (evento) => {
      if (!vivo) return;
      let m: Record<string, unknown>;
      try {
        const texto = typeof evento.data === 'string' ? evento.data : leitor.decode(evento.data as ArrayBuffer);
        m = JSON.parse(texto) as Record<string, unknown>;
      } catch {
        return;
      }

      if (m.usageMetadata) {
        uso = somarUso(uso, m.usageMetadata);
        setConta({ uso, segundos: abertoEm ? (Date.now() - abertoEm) / 1000 : 0 });
      }

      if (m.setupComplete !== undefined) {
        confirmado = true;
        abertoEm = Date.now();
        setNaLinha(true);
        ligarMicrofone();
        mandar(pedidoDaSaudacao(inicio.current.saudacao));
        return;
      }

      const cancelamento = m.toolCallCancellation as { ids?: string[] } | undefined;
      for (const id of cancelamento?.ids ?? []) canceladas.add(id);

      const pedido = m.toolCall as { functionCalls?: ChamadaDeFuncao[] } | undefined;
      if (pedido?.functionCalls?.length) {
        const chamadas = pedido.functionCalls;
        filaDeAcoes = filaDeAcoes.then(() => executar(chamadas)).catch(() => undefined);
        return;
      }

      const conteudo = m.serverContent as
        | {
            interrupted?: boolean;
            turnComplete?: boolean;
            modelTurn?: { parts?: { inlineData?: { data?: string } }[] };
            inputTranscription?: { text?: string };
            outputTranscription?: { text?: string };
          }
        | undefined;
      if (!conteudo) return;

      if (conteudo.inputTranscription?.text) {
        anotarLegenda({ tipo: 'idoso', texto: conteudo.inputTranscription.text });
      }
      if (conteudo.outputTranscription?.text) {
        anotarLegenda({ tipo: 'assistente', texto: conteudo.outputTranscription.text });
      }
      if (conteudo.interrupted) {
        calar();
        anotarLegenda({ tipo: 'interrompida' });
        return;
      }
      for (const parte of conteudo.modelTurn?.parts ?? []) {
        if (parte.inlineData?.data) tocar(parte.inlineData.data);
      }
      if (conteudo.turnComplete) anotarLegenda({ tipo: 'fim' });
    };

    ws.onclose = (evento) => {
      if (!vivo || fechandoPorMim) return;
      console.warn('[direto] o Gemini fechou a conversa:', evento.code, evento.reason);
      cair.current(confirmado);
    };

    const esperaPelaConversa = setTimeout(() => {
      if (vivo && !confirmado) {
        fechandoPorMim = true;
        try {
          ws.close();
        } catch {
          // já fechado
        }
        cair.current(false);
      }
    }, ESPERA_PELO_GEMINI_MS);

    // A conta de tokens vai pro servidor uma vez, quando a ligação acaba.
    const entregarConta = () => {
      if (contaEntregue || uso.respostas === 0 || !abertoEm) return;
      contaEntregue = true;
      const pedidoDeUso: PedidoDeUso = { conversaId, uso, segundos: Math.round((Date.now() - abertoEm) / 1000) };
      void fetchDoAparelho('/api/direto/uso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoDeUso),
        // keepalive deixa a conta sair mesmo se a pessoa fechar a aba.
        keepalive: true,
      }).catch(() => undefined);
    };
    window.addEventListener('pagehide', entregarConta);

    return () => {
      vivo = false;
      fechandoPorMim = true;
      clearTimeout(conferirSom);
      clearTimeout(esperaPelaConversa);
      clearInterval(relogioDoNivel);
      window.removeEventListener('pagehide', entregarConta);
      entregarConta();
      calar();
      if (processador) processador.onaudioprocess = null;
      try {
        processador?.disconnect();
        origem?.disconnect();
      } catch {
        // já desligado
      }
      try {
        ws.close();
      } catch {
        // já fechado
      }
      contexto.current = null;
      void ctx.close().catch(() => undefined);
      setFaixaDaVoz(null);
      setNaLinha(false);
      setFalando(false);
      setAgindo(false);
      setNivel(0);
    };
    // A conversa abre uma vez: o passe do Google é de uso único.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, microfone]);

  const soltarSom = useCallback(() => {
    void contexto.current?.resume().catch(() => undefined);
    setSomPreso(false);
  }, []);

  return {
    /** As falas no mesmo formato da legenda da Agora, pra tela reaproveitar o resto. */
    transcript: legenda.falas as unknown as ItemDoTranscript[],
    naLinha,
    falando,
    agindo,
    nivel,
    faixaDaVoz,
    conta,
    somPreso,
    soltarSom,
  };
}
