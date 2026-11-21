'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import { guardarAparelho } from '@/lib/aparelho';
import type { AparelhoPareado } from '@/lib/tipos';
import { BotaoGrande } from './BotaoGrande';
import { Rosto } from './Rosto';
import { TAMANHO_DO_CODIGO, TecladoDoCodigo } from './TecladoDoCodigo';

type Estado =
  | { fase: 'digitando'; erro?: string }
  | { fase: 'conferindo' }
  | { fase: 'pronto'; tratamento: string };

const CODIGO_RUIM = 'Esse código não vale mais. Peça um novo pra sua família.';
const SEM_CONEXAO = 'Não consegui falar com a internet agora. Tente de novo.';

function pareceAparelho(dado: unknown): dado is AparelhoPareado {
  if (!dado || typeof dado !== 'object') return false;
  const a = dado as Partial<AparelhoPareado>;
  return typeof a.token === 'string' && typeof a.idosoId === 'string';
}

function comMaiuscula(texto: string): string {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto;
}

/** O idoso, ou quem está com ele, digita o código que a família gerou no painel. */
export function Parear() {
  const router = useRouter();
  // A família pode mandar o link com o código (/parear?codigo=123456): aí o
  // aparelho confere sozinho ao abrir, sem a pessoa digitar nada.
  const doLink = (useSearchParams().get('codigo') ?? '').replace(/\D/g, '');
  const codigoDoLink = doLink.length === TAMANHO_DO_CODIGO ? doLink : '';
  const [codigo, setCodigo] = useState(codigoDoLink);
  const [estado, setEstado] = useState<Estado>({ fase: 'digitando' });

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

  const erro = estado.fase === 'digitando' ? estado.erro : undefined;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center gap-8 bg-background px-6 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="max-w-md text-balance text-3xl font-semibold sm:text-4xl">
          Digite o código da sua família
        </h1>
        <p className="max-w-md text-balance text-xl text-muted-foreground">
          São seis números. Quem cuida de você vê o código no aplicativo.
        </p>
      </div>

      {erro ? (
        <p role="alert" className="max-w-md rounded-2xl bg-danger-soft px-5 py-4 text-center text-xl font-medium text-destructive">
          {erro}
        </p>
      ) : null}
      {estado.fase === 'conferindo' ? (
        <p role="status" className="text-xl font-medium">
          Conferindo o código...
        </p>
      ) : null}

      <TecladoDoCodigo codigo={codigo} onMudar={mudar} desligado={estado.fase === 'conferindo'} />

      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-lg px-3 text-lg text-muted-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Voltar
      </Link>
    </main>
  );
}
