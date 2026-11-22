'use client';

// A família entra na ligação que a Dona Leda está fazendo agora com o idoso,
// com voz e vídeo. Chega aqui pelo botão do aviso urgente.

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Video } from 'lucide-react';
import { useState } from 'react';
import { destravarSom } from '@/hooks/somDoAparelho';
import { Esqueleto } from '@/components/familia/Apoio';
import { deuCerto, enderecoCom, entrarNaLigacao } from '@/components/familia/api';
import { Moldura } from '@/components/familia/Moldura';
import { useIdosos } from '@/components/familia/useIdosos';
import { usePainel } from '@/components/familia/usePainel';
import type { EntradaNaLigacao } from '@/lib/tipos';

const ProvedorDaAgora = dynamic(() => import('@/components/ProvedorDaAgora'), { ssr: false });
const SalaDaFamilia = dynamic(() => import('@/components/familia/SalaDaFamilia'), { ssr: false });

export default function LigacaoDaFamiliaPage() {
  const router = useRouter();
  const { idosos, idoso, escolher, semConexao: semLista } = useIdosos();
  const { painel, semConexao } = usePainel(idoso?.id ?? null);
  const [entrada, setEntrada] = useState<EntradaNaLigacao | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const tratamento = painel?.idoso.tratamento ?? idoso?.nome ?? 'o idoso';
  const aoVivo = Boolean(painel?.convite);

  const entrar = async () => {
    if (!idoso) return;
    // Destrava AudioContext dentro do gesto do toque (crítico no iOS Safari/WKWebView).
    void destravarSom();
    setEntrando(true);
    setErro(null);
    const { status, dado } = await entrarNaLigacao(idoso.id);
    setEntrando(false);
    if (deuCerto(status) && dado?.token) {
      setEntrada({ appId: dado.appId, canal: dado.canal, uid: dado.uid, token: dado.token });
      return;
    }
    setErro(status === 409 ? 'A ligação já terminou ou não está aberta pra entrar. Você pode pedir uma ligação nova pelo painel.' : 'Não deu pra entrar agora. Tente de novo.');
  };

  const sair = () => {
    setEntrada(null);
    router.push(enderecoCom('/familia', idoso?.id));
  };

  return (
    <Moldura idosos={idosos} idoso={idoso} onEscolher={escolher} ativa="painel" semConexao={semLista || semConexao}>
      {entrada && idoso ? (
        <ProvedorDaAgora>
          <SalaDaFamilia idosoId={idoso.id} entrada={entrada} tratamento={tratamento} onSair={sair} />
        </ProvedorDaAgora>
      ) : painel ? (
        <section className="flex flex-col gap-4 rounded-2xl border-2 border-foreground bg-card p-6">
          <h1 className="text-2xl font-semibold">Entrar na ligação com {tratamento}</h1>
          <p className="text-lg">
            {aoVivo
              ? `Você entra na ligação que a ${painel.assistente} está fazendo agora com ${tratamento}. Ela conta que você entrou e sai da ligação pra vocês conversarem. A câmera de ${tratamento} fica desligada; a sua, se você ligar, aparece pra ${tratamento}.`
              : `Não tem ligação acontecendo agora com ${tratamento} em que você possa entrar.`}
          </p>
          {aoVivo ? (
            <button
              type="button"
              onClick={entrar}
              disabled={entrando}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-success px-6 text-xl font-semibold text-white hover:bg-success/90 disabled:opacity-60"
            >
              <Video aria-hidden="true" className="h-6 w-6" />
              {entrando ? 'Entrando...' : 'Entrar na ligação'}
            </button>
          ) : null}
          {erro ? <p className="text-base text-destructive">{erro}</p> : null}
          <p className="text-base text-muted-foreground">
            Se for uma emergência, ligue pro SAMU no 192.
          </p>
        </section>
      ) : (
        <Esqueleto />
      )}
    </Moldura>
  );
}
