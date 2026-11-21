'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import { Logo } from '@/components/marca/Logo';
import { Campo, CLASSE_DO_BOTAO_PRINCIPAL, Erro } from '@/components/familia/campos';
import { criarConta, entrar, jaEntrou } from '@/components/familia/conta';

type Modo = 'entrar' | 'criar';

export default function EntrarPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Quem já entrou neste aparelho vai direto pro painel.
  useEffect(() => {
    void jaEntrou().then((entrou) => {
      if (entrou) router.replace('/familia');
    });
  }, [router]);

  const mudar = (definir: (valor: string) => void) => (evento: ChangeEvent<HTMLInputElement>) =>
    definir(evento.target.value);

  const handleTrocarModo = (novo: Modo) => {
    setModo(novo);
    setErro(null);
  };

  const handleEnviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (modo === 'criar' && !nome.trim()) return setErro('Falta o seu nome.');
    if (!email.trim()) return setErro('Falta o e-mail.');
    if (senha.length < 6) return setErro('A senha precisa de pelo menos 6 letras ou números.');
    setEnviando(true);
    setErro(null);
    const falha = modo === 'criar' ? await criarConta(nome, email, senha) : await entrar(email, senha);
    if (falha) {
      setEnviando(false);
      setErro(falha);
      return;
    }
    router.replace('/familia');
  };

  const classeDaAba = (ativa: boolean) =>
    `min-h-12 flex-1 rounded-lg text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      ativa ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <main className="flex min-h-dvh flex-col items-center bg-background px-4 py-10 text-base text-foreground">
      <div className="flex w-full max-w-md flex-col gap-6">
        <header className="flex flex-col gap-2 text-center">
          <p>
            <Logo className="text-3xl" />
          </p>
          <h1 className="text-xl font-semibold text-foreground">
            {modo === 'entrar' ? 'Entre pra ver como ela está' : 'Crie a sua conta'}
          </h1>
          <p className="text-base text-muted-foreground">
            A {NOME_DA_ASSISTENTE} conversa todo dia com quem você ama e conta pra você como foi.
          </p>
        </header>

        <div role="tablist" aria-label="Entrar ou criar conta" className="flex gap-1 rounded-xl bg-muted p-1">
          <button type="button" role="tab" aria-selected={modo === 'entrar'} onClick={() => handleTrocarModo('entrar')} className={classeDaAba(modo === 'entrar')}>
            Entrar
          </button>
          <button type="button" role="tab" aria-selected={modo === 'criar'} onClick={() => handleTrocarModo('criar')} className={classeDaAba(modo === 'criar')}>
            Criar conta
          </button>
        </div>

        <form onSubmit={handleEnviar} noValidate className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
          {modo === 'criar' ? (
            <Campo id="nome" rotulo="O seu nome" value={nome} onChange={mudar(setNome)} autoComplete="name" placeholder="Marina" />
          ) : null}
          <Campo
            id="email"
            rotulo="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={mudar(setEmail)}
            placeholder="voce@email.com"
          />
          <Campo
            id="senha"
            rotulo="Senha"
            type="password"
            autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
            value={senha}
            onChange={mudar(setSenha)}
            ajuda={modo === 'criar' ? 'Pelo menos 6 letras ou números.' : undefined}
          />
          <Erro texto={erro} />
          <button type="submit" disabled={enviando} className={CLASSE_DO_BOTAO_PRINCIPAL}>
            {enviando ? 'Só um instante...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </main>
  );
}
