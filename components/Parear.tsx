'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Keyboard } from 'lucide-react';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import { guardarAparelho } from '@/lib/aparelho';
import type { AparelhoPareado } from '@/lib/tipos';
import { BotaoGrande } from './BotaoGrande';
import { Rosto } from './Rosto';
import { TAMANHO_DO_CODIGO, TecladoDoCodigo } from './TecladoDoCodigo';

type Estado =
  | { fase: 'digitando'; erro?: string }
  | { fase: 'camera'; erro?: string }
  | { fase: 'conferindo' }
  | { fase: 'pronto'; tratamento: string };

const CODIGO_RUIM = 'Esse código não deu certo. Confira os números ou peça um novo pra sua família.';
const SEM_CONEXAO = 'Não consegui falar com a internet agora. Tente de novo.';
const SEM_CAMERA = 'Não consegui abrir a câmera. Você pode digitar os 6 números aqui embaixo.';

interface DetectorDeCodigo {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>;
}

interface JanelaComDetector {
  BarcodeDetector?: new (opts: { formats: string[] }) => DetectorDeCodigo;
}

/** Extrai 6 dígitos de um QR Code da Dona Leda (URL `/parear?codigo=...` ou código puro). */
export function extrairCodigoDeTexto(bruto: string): string | null {
  const limpo = bruto.trim();
  if (!limpo) return null;
  try {
    const url = new URL(limpo);
    const param = (url.searchParams.get('codigo') ?? '').replace(/\D/g, '');
    if (param.length === TAMANHO_DO_CODIGO) return param;
  } catch {
    // Não é URL completa; tenta extrair ?codigo= ou 6 dígitos puros.
  }
  const porQuery = limpo.match(/[?&]codigo=(\d{6})(?:$|&)/);
  if (porQuery) return porQuery[1];
  const soDigitos = limpo.replace(/\D/g, '');
  return soDigitos.length === TAMANHO_DO_CODIGO ? soDigitos : null;
}

function pareceAparelho(dado: unknown): dado is AparelhoPareado {
  if (!dado || typeof dado !== 'object') return false;
  const a = dado as Partial<AparelhoPareado>;
  return typeof a.token === 'string' && typeof a.idosoId === 'string';
}

function comMaiuscula(texto: string): string {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto;
}

/** O idoso, ou quem está com ele, lê o QR Code com a câmera ou digita os 6 números da família. */
export function Parear() {
  const router = useRouter();
  // A família pode mandar o link ou o QR Code (/parear?codigo=123456): aí o
  // aparelho confere sozinho ao abrir, sem a pessoa digitar nada.
  const doLink = (useSearchParams().get('codigo') ?? '').replace(/\D/g, '');
  const codigoDoLink = doLink.length === TAMANHO_DO_CODIGO ? doLink : '';
  const [codigo, setCodigo] = useState(codigoDoLink);
  const [estado, setEstado] = useState<Estado>({ fase: 'digitando' });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const conferir = useCallback(async (valor: string) => {
    setEstado({ fase: 'conferindo' });
    try {
      const resposta = await fetch('/api/aparelho/parear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: valor }),
      });
      const dado: unknown = await resposta.json().catch(() => null);
      if (!resposta.ok || !pareceAparelho(dado)) {
        setCodigo('');
        setEstado({
          fase: 'digitando',
          erro: resposta.status >= 500 ? SEM_CONEXAO : CODIGO_RUIM,
        });
        // Tira o código do endereço, pra recarregar a página não tentar o mesmo código.
        if (window.location.search) router.replace('/parear');
        return;
      }
      await guardarAparelho(dado);
      setEstado({ fase: 'pronto', tratamento: dado.tratamento });
    } catch {
      setCodigo('');
      setEstado({ fase: 'digitando', erro: SEM_CONEXAO });
    }
  }, [router]);

  // Com os seis números digitados, confere sozinho, sem botão de enviar.
  useEffect(() => {
    if (codigo.length === TAMANHO_DO_CODIGO && estado.fase === 'digitando') {
      void conferir(codigo);
    }
  }, [codigo, estado.fase, conferir]);

  // Leitor de QR Code pela câmera traseira (usa BarcodeDetector nativo com fallback em jsQR).
  useEffect(() => {
    if (estado.fase !== 'camera') return;
    let ativo = true;
    let stream: MediaStream | null = null;
    let intervalo: ReturnType<typeof setInterval> | undefined;

    const encerrarCamera = () => {
      if (intervalo) clearInterval(intervalo);
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
    };

    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (ativo) setEstado({ fase: 'digitando', erro: SEM_CAMERA });
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (!ativo) {
          encerrarCamera();
          return;
        }
        const video = videoRef.current;
        if (!video) {
          encerrarCamera();
          return;
        }
        video.srcObject = stream;
        await video.play();

        const Detector = (window as unknown as JanelaComDetector).BarcodeDetector;
        const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
        const jsQR = detector ? null : (await import('jsqr')).default;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let ocupando = false;

        intervalo = setInterval(() => {
          if (!ativo || ocupando || video.readyState < 2) return;
          ocupando = true;
          void (async () => {
            try {
              let textoLido: string | null = null;
              if (detector) {
                const achados = await detector.detect(video);
                textoLido = achados[0]?.rawValue ?? null;
              } else if (jsQR && ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const decodificado = jsQR(img.data, img.width, img.height, {
                  inversionAttempts: 'dontInvert',
                });
                textoLido = decodificado?.data ?? null;
              }
              const extraido = textoLido ? extrairCodigoDeTexto(textoLido) : null;
              if (ativo && extraido) {
                encerrarCamera();
                setCodigo(extraido);
                void conferir(extraido);
              }
            } catch {
              // Quadro ilegível; tenta o próximo em 200 ms.
            } finally {
              ocupando = false;
            }
          })();
        }, 200);
      } catch {
        encerrarCamera();
        if (ativo) setEstado({ fase: 'digitando', erro: SEM_CAMERA });
      }
    })();

    return () => {
      ativo = false;
      encerrarCamera();
    };
  }, [estado.fase, conferir]);

  const mudar = useCallback((novo: string) => {
    setCodigo(novo.replace(/\D/g, '').slice(0, TAMANHO_DO_CODIGO));
    setEstado((antes) => (antes.fase === 'digitando' ? { fase: 'digitando' } : antes));
  }, []);

  if (estado.fase === 'pronto') {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 bg-background px-6 py-10 text-center">
        <Rosto estado="parada" nivel={0} />
        <h1 className="max-w-md text-balance text-3xl font-semibold sm:text-4xl">
          Pronto, {comMaiuscula(estado.tratamento)}! A {NOME_DA_ASSISTENTE} vai ligar pra você.
        </h1>
        <p className="max-w-md text-balance text-xl text-muted-foreground">
          Deixe este aparelho ligado e por perto.
        </p>
        <BotaoGrande onClick={() => router.replace('/')}>Começar</BotaoGrande>
      </main>
    );
  }

  if (estado.fase === 'camera') {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-6 bg-background px-6 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="max-w-md text-balance text-3xl font-semibold sm:text-4xl">
            Aponte a câmera pro código
          </h1>
          <p className="max-w-md text-balance text-xl text-muted-foreground">
            Mostre o quadradinho que aparece no celular da sua família.
          </p>
        </div>

        <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-3xl border-4 border-foreground bg-black shadow-lg">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-accent/90"
          />
        </div>

        <BotaoGrande tom="discreto" onClick={() => setEstado({ fase: 'digitando' })}>
          <Keyboard aria-hidden="true" className="h-6 w-6 shrink-0" />
          Digitar os números
        </BotaoGrande>
      </main>
    );
  }

  const erro = estado.fase === 'digitando' ? estado.erro : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-6 bg-background px-6 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="max-w-md text-balance text-3xl font-semibold sm:text-4xl">
          Ligue este aparelho com a sua família
        </h1>
        <p className="max-w-md text-balance text-xl text-muted-foreground">
          Leia o código com a câmera ou digite os seis números.
        </p>
      </div>

      {erro ? (
        <p role="alert" className="max-w-md rounded-2xl border-2 border-foreground bg-secondary px-5 py-4 text-center text-xl font-medium text-foreground">
          {erro}
        </p>
      ) : null}
      {estado.fase === 'conferindo' ? (
        <p role="status" className="text-xl font-medium">
          Conferindo o código...
        </p>
      ) : null}

      <BotaoGrande
        onClick={() => setEstado({ fase: 'camera' })}
        disabled={estado.fase === 'conferindo'}
      >
        <Camera aria-hidden="true" className="h-6 w-6 shrink-0" />
        Ler código com a câmera
      </BotaoGrande>

      <TecladoDoCodigo codigo={codigo} onMudar={mudar} desligado={estado.fase === 'conferindo'} />

      <Link
        href="/"
        className="flex min-h-20 w-full max-w-md items-center justify-center rounded-2xl border-2 border-muted-foreground bg-card px-6 py-4 font-titulo text-xl font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]"
      >
        Voltar
      </Link>
    </main>
  );
}
