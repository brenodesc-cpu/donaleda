'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDoAparelho } from '@/lib/aparelho';
import type { ItemDoTranscript } from '@/lib/conversation';
import {
  aberturaDaRetomada,
  avancarFala,
  base64ParaSom,
  criarReamostrador,
  decidirNaMudez,
  ENDERECO_DO_GEMINI,
  ESPERA_DA_RESPOSTA_MS,
  ESPERA_DA_SAUDACAO_MS,
  ESPERA_DEPOIS_DA_ACAO_MS,
  falaAberta,
  FOLGA_DEPOIS_DE_REENVIAR_MS,
  juntarLegenda,
  LEGENDA_VAZIA,
  MAXIMO_DE_RELIGADAS,
  pedidoDaFalaPorEscrito,
  pedidoDaSaudacao,
  pedidoDeDesculpa,
  picoDoSom,
  REAVISOS_DO_FIM_MS,
  SEGURA_DEPOIS_DO_FIM_MS,
  SEM_FALA,
  somarUso,
  somParaBase64,
  TAXA_DA_VOZ,
  TETO_SEM_RESPOSTA_MS,
  TAXA_DO_MICROFONE,
  usoZerado,
  VOZ_AUDIVEL,
  type EstadoDaLegenda,
  type EventoDaLegenda,
} from '@/lib/direto';
import type {
  InicioDaConversa,
  InicioDireto,
  PedidoDeAcao,
  PedidoDeUso,
  RespostaDaAcao,
  UsoDoGemini,
} from '@/lib/tipos';

// A conversa do modo direto: o aparelho abre a conversa ao vivo com o Gemini
// usando o passe temporário que o servidor emitiu. O microfone vai pro Gemini,
// a voz dela toca no aparelho e sai também numa faixa de som que a tela publica
// na sala da Agora. As ações que o Gemini pede (guardar lembrança, avisar a
// família) são repassadas ao servidor com o token do aparelho.

/** Tempo que o aparelho espera o Gemini confirmar a conversa antes de avisar que não deu. */
const ESPERA_PELO_GEMINI_MS = 15_000;
const INTERVALO_DO_NIVEL_MS = 80;
const SE_A_ACAO_FALHAR = 'Não consegui anotar agora. Siga a conversa normalmente.';
/** Blocos de som guardados de antes da fala começar (uns 340 ms), pra primeira sílaba não se perder. */
const BLOCOS_ANTES_DA_FALA = 8;
/** O máximo de blocos guardados de uma fala sem resposta (uns 30 segundos). */
const TETO_DA_FALA = 700;

/**
 * Só pra teste: com `donaleda-teste-mudez` no aparelho, a primeira conversa finge
 * o defeito do Google, pra provar que o aparelho religa sozinho. Com 1 ela não
 * reage à fala; com 2 ela escreve a fala na legenda e não responde. Ninguém liga
 * isso sem querer.
 */
function testeDeMudez(): '' | '1' | '2' {
  try {
    const valor = window.localStorage.getItem('donaleda-teste-mudez');
    return valor === '1' || valor === '2' ? valor : '';
  } catch {
    return '';
  }
}

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
  /** Pra onde vão as ações. A demonstração pública troca por uma rota que não anota nada. */
  rotaDasAcoes?: string;
  /** Pra onde vai a conta de tokens no fim. null não manda (demonstração pública). */
  rotaDaConta?: string | null;
  /**
   * Onde o aparelho pede um passe novo pra religar a mesma conversa quando o
   * Gemini fica mudo ou a conexão cai. Sem ela nada religa, que é o caso da
   * demonstração pública.
   */
  rotaDoPasse?: string | null;
}

interface ChamadaDeFuncao {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
}

type ContextoDeSom = typeof AudioContext;

export function useGeminiDireto({
  direto,
  conversaId,
  uidDaAssistente,
  microfone,
  pronto,
  aoCair,
  rotaDasAcoes = '/api/direto/acao',
  rotaDaConta = '/api/direto/uso',
  rotaDoPasse = null,
}: Entrada) {
  const [legenda, setLegenda] = useState<EstadoDaLegenda>(LEGENDA_VAZIA);
  const [naLinha, setNaLinha] = useState(false);
  const [falando, setFalando] = useState(false);
  const [agindo, setAgindo] = useState(false);
  const [religando, setReligando] = useState(false);
  const [nivel, setNivel] = useState(0);
  const [faixaDaVoz, setFaixaDaVoz] = useState<MediaStreamTrack | null>(null);
  const [conta, setConta] = useState<{ uso: UsoDoGemini; segundos: number }>({ uso: usoZerado(), segundos: 0 });
  const [somPreso, setSomPreso] = useState(false);

  const contexto = useRef<AudioContext | null>(null);
  const socket = useRef<WebSocket | null>(null);
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
    let abertoEm = 0;
    let uso = usoZerado();
    let contaEntregue = false;

    // A ligação pode passar por mais de uma conversa com o Gemini: quando ele fica
    // mudo ou a conexão cai, o aparelho abre outra e continua. Isto atravessa todas.
    let wsAtual: WebSocket | null = null;
    let jaConfirmou = false;
    let religadas = 0;
    let religandoAgora = false;
    let legendaAtual: EstadoDaLegenda = LEGENDA_VAZIA;
    let microfoneLigado = false;
    // A fala que espera resposta: os blocos de som dela, pra mandar de novo, e desde quando espera.
    let antesDaFala: string[] = [];
    let pedacosDaFala: string[] = [];
    let esperandoDesde = 0;
    // A primeira fala desta leva que ficou sem resposta, e se o Gemini chegou a escrever ela na legenda.
    let primeiraEspera = 0;
    let transcreveu = false;
    // Quando a resposta de uma ação foi devolvida ao Gemini e ela ainda não voltou a falar.
    let esperandoDepoisDaAcao = 0;
    // Se ela já falou depois da última fala da pessoa. Quem fala e depois anota não precisa falar de novo.
    let falouDesdeAFala = true;
    let reavisos = 0;
    // Até quando o silêncio fica guardado em vez de ir pro Gemini, depois do aviso de fim de fala.
    let seguraAte = 0;
    let servidorOuviu = false;
    let falasSemReacao = 0;
    let esperandoSaudacaoDesde = 0;
    const fingirMudez = testeDeMudez();

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

    const leitor = new TextDecoder();

    const mandar = (mensagem: unknown) => {
      if (wsAtual?.readyState !== WebSocket.OPEN) return;
      wsAtual.send(typeof mensagem === 'string' ? mensagem : JSON.stringify(mensagem));
    };

    const anotarLegenda = (evento: EventoDaLegenda) => {
      legendaAtual = juntarLegenda(legendaAtual, evento, uidDaAssistente);
      setLegenda(legendaAtual);
    };

    /** Ela respondeu (falou ou pediu uma ação): a fala deixa de esperar. Só ouvir não conta. */
    const houveResposta = () => {
      esperandoDesde = 0;
      primeiraEspera = 0;
      transcreveu = false;
      esperandoDepoisDaAcao = 0;
      reavisos = 0;
      seguraAte = 0;
      servidorOuviu = false;
      falasSemReacao = 0;
      pedacosDaFala = [];
    };

    const fecharConexao = () => {
      const antiga = wsAtual;
      wsAtual = null;
      socket.current = null;
      try {
        antiga?.close();
      } catch {
        // já fechado
      }
    };

    const desistir = () => {
      fechandoPorMim = true;
      fecharConexao();
      cair.current(jaConfirmou);
    };

    /**
     * Abre outra conversa com o Gemini pra mesma ligação. `mudez`: ele ouviu a fala
     * e não respondeu, e a fala vai de novo. `saudacao`: a conversa abriu e ela não
     * falou. `queda`: a conexão caiu.
     */
    const religar = async (motivo: 'mudez' | 'saudacao' | 'queda' | 'acao') => {
      if (religandoAgora || !vivo || fechandoPorMim) return;
      if (!rotaDoPasse || religadas >= MAXIMO_DE_RELIGADAS) return desistir();
      religandoAgora = true;
      religadas += 1;
      console.warn(`[direto] religando a conversa (${motivo}), vez ${religadas}`);
      // A fala que o Gemini já escreveu na legenda volta por escrito; a que ele nem ouviu volta em som.
      const escrita = transcreveu ? falaAberta(legendaAtual.falas, uidDaAssistente) : '';
      const repetir = escrita ? [] : pedacosDaFala.slice();
      esperandoDesde = 0;
      primeiraEspera = 0;
      esperandoDepoisDaAcao = 0;
      reavisos = 0;
      esperandoSaudacaoDesde = 0;
      servidorOuviu = false;
      calar();
      fecharConexao();
      setReligando(true);
      try {
        const resposta = await fetchDoAparelho(rotaDoPasse, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversa_id: conversaId }),
        });
        if (!resposta.ok) throw new Error(`o passe novo não veio (${resposta.status})`);
        const novo = (await resposta.json()) as InicioDaConversa;
        if (!novo.direto) throw new Error('o passe novo veio sem a abertura');
        if (!vivo || fechandoPorMim) return;
        abrir(novo.direto, { retomada: true, saudar: motivo === 'saudacao', repetir, escrita });
      } catch (erro) {
        console.warn('[direto] não consegui religar:', erro);
        religandoAgora = false;
        if (vivo) {
          setReligando(false);
          desistir();
        }
      }
    };

    /** Confere, a cada bloco de som, se a fala ou a saudação ficou sem resposta tempo demais. */
    const vigiar = (agora: number, falandoAgora: boolean) => {
      if (religandoAgora || fechandoPorMim) return;
      if (esperandoSaudacaoDesde > 0 && agora - esperandoSaudacaoDesde >= ESPERA_DA_SAUDACAO_MS) {
        esperandoSaudacaoDesde = 0;
        if (rotaDoPasse) void religar('saudacao');
        return;
      }
      if (esperandoDepoisDaAcao > 0 && agora - esperandoDepoisDaAcao >= ESPERA_DEPOIS_DA_ACAO_MS) {
        esperandoDepoisDaAcao = 0;
        if (rotaDoPasse) void religar('acao');
        return;
      }
      if (primeiraEspera === 0) return;
      // Antes de religar, repete o aviso de fim de fala, se o Gemini nem fechou a fala e a pessoa não voltou a falar.
      if (
        !transcreveu &&
        !falandoAgora &&
        reavisos < REAVISOS_DO_FIM_MS.length &&
        agora - esperandoDesde >= REAVISOS_DO_FIM_MS[reavisos]
      ) {
        reavisos += 1;
        mandar({ realtimeInput: { audioStreamEnd: true } });
        seguraAte = agora + SEGURA_DEPOIS_DO_FIM_MS;
      }
      // O relógio conta do fim da última fala. Quem repete "alô" sem parar esbarra no teto da primeira.
      const venceu =
        !falandoAgora &&
        (agora - esperandoDesde >= ESPERA_DA_RESPOSTA_MS || agora - primeiraEspera >= TETO_SEM_RESPOSTA_MS);
      const decisao = decidirNaMudez({
        esperandoHaMs: venceu ? ESPERA_DA_RESPOSTA_MS : 0,
        servidorOuviu,
        falasSemReacao,
        religadas,
        podeReligar: Boolean(rotaDoPasse),
      });
      if (decisao === 'nada') return;
      if (decisao === 'esquecer') {
        falasSemReacao += 1;
        esperandoDesde = 0;
        primeiraEspera = 0;
        transcreveu = false;
        reavisos = 0;
        servidorOuviu = false;
        pedacosDaFala = [];
        return;
      }
      if (decisao === 'desistir') {
        console.warn('[direto] o Gemini ficou mudo de novo depois de religar; a ligação acaba');
        desistir();
        return;
      }
      void religar('mudez');
    };

    let origem: MediaStreamAudioSourceNode | null = null;
    let processador: ScriptProcessorNode | null = null;

    // O microfone só começa a ir depois que o Gemini confirma a conversa: som
    // mandado antes disso é descartado.
    const ligarMicrofone = () => {
      if (microfoneLigado) return;
      microfoneLigado = true;
      const reamostrar = criarReamostrador(ctx.sampleRate, TAXA_DO_MICROFONE);
      const silencioMs = inicio.current.silencioMs;
      let fala = SEM_FALA;
      origem = ctx.createMediaStreamSource(new MediaStream([microfone]));
      processador = ctx.createScriptProcessor(2048, 1, 1);
      processador.onaudioprocess = (evento) => {
        const amostras = reamostrar(evento.inputBuffer.getChannelData(0));
        if (amostras.length === 0) return;
        const pedaco = JSON.stringify({
          realtimeInput: {
            audio: { data: somParaBase64(amostras), mimeType: `audio/pcm;rate=${TAXA_DO_MICROFONE}` },
          },
        });
        const pico = picoDoSom(amostras);
        const agora = Date.now();
        const comVoz = pico > VOZ_AUDIVEL;
        // A fala fica guardada até o Gemini reagir, pra ir de novo se ele ficar mudo.
        if (comVoz && !fala.pendente && primeiraEspera === 0) pedacosDaFala = [...antesDaFala];
        if (comVoz || fala.pendente) {
          pedacosDaFala.push(pedaco);
          if (pedacosDaFala.length > TETO_DA_FALA) pedacosDaFala.shift();
        }
        // Logo depois do aviso de fim de fala o silêncio fica guardado. A voz que
        // voltar passa na hora, levando junto o pedacinho de antes dela.
        const segurando = agora < seguraAte;
        if (segurando && comVoz) {
          for (const guardado of antesDaFala) mandar(guardado);
          seguraAte = 0;
        }
        if (!segurando || comVoz) mandar(pedaco);
        if (!comVoz && !fala.pendente) {
          antesDaFala.push(pedaco);
          if (antesDaFala.length > BLOCOS_ANTES_DA_FALA) antesDaFala.shift();
        } else {
          antesDaFala = [];
        }
        // Depois do silêncio combinado, o aparelho avisa que a fala acabou e segura
        // o silêncio por um instante. A próxima fala reabre a escuta sozinha.
        const passo = avancarFala(fala, pico, agora, silencioMs);
        fala = passo.estado;
        if (passo.avisarFim) {
          mandar({ realtimeInput: { audioStreamEnd: true } });
          seguraAte = agora + SEGURA_DEPOIS_DO_FIM_MS;
          esperandoDesde = agora;
          if (primeiraEspera === 0) primeiraEspera = agora;
          reavisos = 0;
          falouDesdeAFala = false;
          esperandoDepoisDaAcao = 0;
        }
        vigiar(agora, comVoz || fala.pendente);
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
          const resposta = await fetchDoAparelho(rotaDasAcoes, {
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
      if (respostas.length > 0) {
        mandar({ toolResponse: { functionResponses: respostas } });
        // Quando a ação veio antes de ela falar, ela precisa falar depois. Se calar, a vigia religa.
        if (!falouDesdeAFala) esperandoDepoisDaAcao = Date.now();
      }
    };

    /** Abre uma conversa com o Gemini. A primeira dá a saudação; a religada continua de onde parou. */
    function abrir(
      dados: InicioDireto,
      opcoes: { retomada: boolean; saudar: boolean; repetir: string[]; escrita: string },
    ) {
      const ws = new WebSocket(`${ENDERECO_DO_GEMINI}?access_token=${encodeURIComponent(dados.passe)}`);
      // Em bytes, pra cada mensagem ser lida na ordem em que chegou: a voz vem em pedaços.
      ws.binaryType = 'arraybuffer';
      wsAtual = ws;
      socket.current = ws;
      let confirmado = false;

      const esperaPelaConversa = setTimeout(() => {
        if (vivo && ws === wsAtual && !confirmado) {
          console.warn('[direto] o Gemini não confirmou a conversa a tempo');
          religandoAgora = false;
          desistir();
        }
      }, ESPERA_PELO_GEMINI_MS);

      ws.onopen = () => {
        if (ws !== wsAtual) return;
        const abertura = opcoes.retomada
          ? aberturaDaRetomada(dados.abertura, legendaAtual.falas, uidDaAssistente, Boolean(opcoes.escrita))
          : dados.abertura;
        ws.send(JSON.stringify(abertura));
      };

      ws.onmessage = (evento) => {
        if (!vivo || ws !== wsAtual) return;
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
          jaConfirmou = true;
          clearTimeout(esperaPelaConversa);
          if (!abertoEm) abertoEm = Date.now();
          setNaLinha(true);
          ligarMicrofone();
          if (opcoes.retomada) {
            religandoAgora = false;
            setReligando(false);
          }
          if (!opcoes.retomada || opcoes.saudar) {
            mandar(pedidoDaSaudacao(dados.saudacao));
            esperandoSaudacaoDesde = Date.now();
          } else if (opcoes.escrita) {
            // O Gemini tinha ouvido e escrito a fala, e não respondeu: ela volta por escrito.
            mandar(pedidoDaFalaPorEscrito(opcoes.escrita));
            esperandoDesde = Date.now();
            primeiraEspera = esperandoDesde;
            transcreveu = true;
            servidorOuviu = true;
          } else if (opcoes.repetir.length > 0) {
            // A fala que ficou sem resposta vai de novo, inteira, e o relógio recomeça.
            for (const pedaco of opcoes.repetir) mandar(pedaco);
            mandar({ realtimeInput: { audioStreamEnd: true } });
            seguraAte = Date.now() + SEGURA_DEPOIS_DO_FIM_MS + FOLGA_DEPOIS_DE_REENVIAR_MS;
            esperandoDesde = Date.now() + FOLGA_DEPOIS_DE_REENVIAR_MS;
            primeiraEspera = esperandoDesde;
            reavisos = 0;
            servidorOuviu = true;
          } else {
            mandar(pedidoDeDesculpa());
            esperandoSaudacaoDesde = Date.now();
          }
          return;
        }

        // O Google marcou que tem alguém falando. Se ele calar depois disso, é o defeito dele.
        if (m.voiceActivity !== undefined) servidorOuviu = true;

        // Teste de mudez: a primeira conversa age como o Google com defeito.
        if (fingirMudez && religadas === 0 && primeiraEspera > 0) {
          servidorOuviu = true;
          const ouvido = (m.serverContent as { inputTranscription?: { text?: string } } | undefined)
            ?.inputTranscription?.text;
          if (fingirMudez === '2' && ouvido) {
            transcreveu = true;
            anotarLegenda({ tipo: 'idoso', texto: ouvido });
          }
          return;
        }

        const cancelamento = m.toolCallCancellation as { ids?: string[] } | undefined;
        for (const id of cancelamento?.ids ?? []) canceladas.add(id);

        const pedido = m.toolCall as { functionCalls?: ChamadaDeFuncao[] } | undefined;
        if (pedido?.functionCalls?.length) {
          houveResposta();
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
          // Ouvir e escrever a fala ainda não é responder: o relógio segue até ela falar.
          servidorOuviu = true;
          transcreveu = true;
          seguraAte = 0;
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
          if (parte.inlineData?.data) {
            houveResposta();
            falouDesdeAFala = true;
            esperandoSaudacaoDesde = 0;
            tocar(parte.inlineData.data);
          }
        }
        if (conteudo.turnComplete) anotarLegenda({ tipo: 'fim' });
      };

      ws.onclose = (evento) => {
        clearTimeout(esperaPelaConversa);
        if (!vivo || fechandoPorMim || ws !== wsAtual) return;
        console.warn('[direto] o Gemini fechou a conversa:', evento.code, evento.reason);
        // Conversa que já estava de pé e caiu é religada; a que nem abriu vira aviso de falha.
        if (confirmado) void religar('queda');
        else {
          religandoAgora = false;
          desistir();
        }
      };
    }

    abrir(inicio.current, { retomada: false, saudar: true, repetir: [], escrita: '' });

    // A conta de tokens vai pro servidor uma vez, quando a ligação acaba.
    const entregarConta = () => {
      if (!rotaDaConta || contaEntregue || uso.respostas === 0 || !abertoEm) return;
      contaEntregue = true;
      const pedidoDeUso: PedidoDeUso = { conversaId, uso, segundos: Math.round((Date.now() - abertoEm) / 1000) };
      void fetchDoAparelho(rotaDaConta, {
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
      fecharConexao();
      contexto.current = null;
      void ctx.close().catch(() => undefined);
      setFaixaDaVoz(null);
      setNaLinha(false);
      setFalando(false);
      setAgindo(false);
      setReligando(false);
      setNivel(0);
    };
    // A conversa abre uma vez: o passe do Google é de uso único.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, microfone]);

  const soltarSom = useCallback(() => {
    void contexto.current?.resume().catch(() => undefined);
    setSomPreso(false);
  }, []);

  /** Injeta aviso interno suave ~90 s antes do teto pra IA encaminhar a despedida sem cortar o idoso. */
  const avisarEncerramento = useCallback(() => {
    const ws = socket.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        clientContent: {
          turns: [
            {
              role: 'user',
              parts: [
                {
                  text: '[Aviso interno de tempo: falta cerca de um minuto pro limite desta ligação. Na sua próxima resposta, valide com carinho o que a pessoa acabou de contar e comece a se despedir com naturalidade, dizendo quando vocês conversam de novo.]',
                },
              ],
            },
          ],
          turnComplete: false,
        },
      }),
    );
  }, []);

  return {
    /** As falas no mesmo formato da legenda da Agora, pra tela reaproveitar o resto. */
    transcript: legenda.falas as unknown as ItemDoTranscript[],
    naLinha,
    falando,
    // Enquanto a conversa religa, a tela mostra o mesmo "pensando" de quando ela anota algo.
    agindo: agindo || religando,
    nivel,
    faixaDaVoz,
    conta,
    somPreso,
    soltarSom,
    avisarEncerramento,
  };
}
