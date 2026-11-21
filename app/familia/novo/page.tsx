'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NovoIdoso } from '@/lib/tipos';
import { criarIdoso, criarResidencial, deuCerto, enderecoCom } from '@/components/familia/api';
import { CLASSE_DO_BOTAO_SECUNDARIO, Erro } from '@/components/familia/campos';
import { guardarIdosoEscolhido } from '@/components/familia/conta';
import { FormularioDoIdoso } from '@/components/familia/FormularioDoIdoso';
import { Moldura } from '@/components/familia/Moldura';
import { useIdosos } from '@/components/familia/useIdosos';

export default function NovoIdosoPage() {
  const router = useRouter();
  const { idosos, idoso, escolher, semConexao } = useIdosos({ exigirIdoso: false });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [origemDoErro, setOrigemDoErro] = useState<'exemplo' | 'formulario'>('formulario');
  const primeiraVez = idosos !== null && idosos.length === 0;

  const cadastrar = async (corpo: NovoIdoso | { exemplo: true }, depois: 'aparelho' | 'painel') => {
    setEnviando(true);
    setErro(null);
    setOrigemDoErro(depois === 'painel' ? 'exemplo' : 'formulario');
    const { status, dado } = await criarIdoso(corpo);
    if (status === 401) {
      router.replace('/entrar');
      return;
    }
    if (!deuCerto(status) || !dado?.id) {
      setEnviando(false);
      setErro('Não deu pra cadastrar agora. Tente de novo.');
      return;
    }
    guardarIdosoEscolhido(dado.id);
    router.replace(enderecoCom(depois === 'aparelho' ? '/familia/aparelho' : '/familia', dado.id));
  };

  const handleResidencial = async () => {
    setEnviando(true);
    setErro(null);
    setOrigemDoErro('exemplo');
    const { status } = await criarResidencial();
    if (status === 401) {
      router.replace('/entrar');
      return;
    }
    if (!deuCerto(status)) {
      setEnviando(false);
      setErro('Não deu pra montar o exemplo agora. Tente de novo.');
      return;
    }
    router.replace('/familia/casa');
  };

  const handleEnviar = (novo: NovoIdoso) => void cadastrar(novo, 'aparelho');
  const handleExemplo = () => void cadastrar({ exemplo: true }, 'painel');

  return (
    <Moldura idosos={idosos} idoso={idoso} onEscolher={escolher} ativa="novo" semConexao={semConexao}>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          {primeiraVez ? 'Vamos começar' : 'Cadastrar outra pessoa'}
        </h1>
        <p className="text-lg text-muted-foreground">
          Conte quem a Dona Leda vai acompanhar. Depois você prepara o celular ou o tablet em que a Dona Leda vai tocar.
        </p>
      </header>

      {primeiraVez ? (
        <section className="flex flex-col gap-2 rounded-2xl border border-border bg-muted p-5">
          <p className="text-base text-foreground">
            Quer ver antes como fica? A Dona Leda monta um exemplo com a dona Helena, uma pessoa
            inventada, com uma semana de conversas.
          </p>
          <button type="button" onClick={handleExemplo} disabled={enviando} className={CLASSE_DO_BOTAO_SECUNDARIO}>
            Ver com um exemplo
          </button>
          <p className="text-base text-foreground">
            Num residencial, a equipe vê todos os moradores numa tela só. O exemplo tem oito
            moradores inventados.
          </p>
          <button type="button" onClick={() => void handleResidencial()} disabled={enviando} className={CLASSE_DO_BOTAO_SECUNDARIO}>
            Ver um residencial de exemplo
          </button>
          <Erro texto={origemDoErro === 'exemplo' ? erro : null} />
        </section>
      ) : null}

      <FormularioDoIdoso
        enviando={enviando}
        erro={origemDoErro === 'formulario' ? erro : null}
        onEnviar={handleEnviar}
      />
    </Moldura>
  );
}
