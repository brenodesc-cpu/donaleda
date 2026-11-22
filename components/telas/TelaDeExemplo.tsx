'use client';

// Uma tela do app montada com dados de exemplo, pra página /telas.
// Os componentes são os de verdade e ficam como estão. O que muda é em volta deles:
// os dados chegam prontos (nada é buscado no servidor), os botões ficam travados
// e as trocas de página não acontecem.

import { Suspense, type ReactNode } from 'react';
import { PhoneOff } from 'lucide-react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import EntrarPage from '@/app/entrar/page';
import { BoasVindas } from '@/components/BoasVindas';
import { BotaoGrande } from '@/components/BotaoGrande';
import { ChamadaTocando } from '@/components/ChamadaTocando';
import { Parear } from '@/components/Parear';
import { Rosto } from '@/components/Rosto';
import { AvisoDeFalha, Esperando, Ligando, PrepararAparelho } from '@/components/TelasDeEspera';
import { AjustesDoIdoso } from '@/components/familia/AjustesDoIdoso';
import { Alertas } from '@/components/familia/Alertas';
import { ApagarIdoso } from '@/components/familia/ApagarIdoso';
import { ResumoDaConversa, Rodape } from '@/components/familia/Apoio';
import { BarraDoTopo } from '@/components/familia/BarraDoTopo';
import { Cabecalho } from '@/components/familia/Cabecalho';
import { CodigoDoAparelho } from '@/components/familia/CodigoDoAparelho';
import { DiaDeHoje } from '@/components/familia/DiaDeHoje';
import { FormularioDoIdoso } from '@/components/familia/FormularioDoIdoso';
import { Lembrancas } from '@/components/familia/Lembrancas';
import { Ligacoes } from '@/components/familia/Ligacoes';
import { Cartao, Moldura } from '@/components/familia/Moldura';
import { Semana } from '@/components/familia/Semana';
import { CLASSE_DO_BOTAO_SECUNDARIO } from '@/components/familia/campos';
import { TelaDaCasa } from '@/components/familia/casa/TelaDaCasa';
import type { ContaDaCasa, Morador } from '@/components/familia/casa/ordem';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import type { IdosoDaFamilia, PainelDaFamilia } from '@/lib/tipos';

/** Os dados de exemplo, montados no servidor (app/telas/ver/[tela]/page.tsx). */
export interface DadosDeExemplo {
  /** A dona Helena, do exemplo da família. */
  helena: PainelDaFamilia;
  /** O seu Jorge, morador do residencial de exemplo, no dia de um aviso urgente. */
  jorge: PainelDaFamilia;
  /** A dona Helena num dia com os 10 minutos usados, uma dedução e o aviso de privacidade dado. */
  helenaNoLimite: PainelDaFamilia;
  moradores: Morador[];
  conta: ContaDaCasa;
  /** A hora em que os dados foram montados. */
  agora: string;
  /** A primeira frase que a Dona Leda diz à dona Helena. */
  saudacao: string;
}

function nada() {}
async function nadaDeuCerto() {
  return true;
}

// Dentro da /telas, pedir pra trocar de página não faz nada.
const ROTEADOR_PARADO = {
  back: nada,
  forward: nada,
  refresh: nada,
  push: nada,
  replace: nada,
  prefetch: nada,
};

const MOLDURA_DO_IDOSO = 'mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center gap-6 px-6 py-8';

function comoIdoso(painel: PainelDaFamilia): IdosoDaFamilia {
  return {
    id: painel.idoso.id,
    nome: painel.idoso.nome,
    tratamento: painel.idoso.tratamento,
    aparelhos: 1,
    papel: 'responsavel',
  };
}

/** O painel de quem cuida, montado como em app/familia/page.tsx. */
function Painel({ painel }: { painel: PainelDaFamilia }) {
  const idoso = comoIdoso(painel);
  const resumo = painel.ultimaConversa?.resumo?.trim();
  return (
    <Moldura idosos={[idoso]} idoso={idoso} onEscolher={nada} ativa="painel">
      <Cabecalho painel={painel} />
      <Ligacoes painel={painel} idosoId={idoso.id} pedido="parado" onLigar={nada} />
      <Alertas
        alertas={painel.alertas}
        assistente={painel.assistente}
        tratamento={painel.idoso.tratamento}
        hoje={painel.hoje.data}
        onMarcarVisto={nada}
      />
      <DiaDeHoje hoje={painel.hoje} />
      {resumo ? <ResumoDaConversa resumo={resumo} /> : null}
      <Semana semana={painel.semana} hoje={painel.hoje.data} />
      <Lembrancas
        lembrancas={painel.lembrancas}
        reservadas={painel.reservadas}
        avisoDePrivacidadeEm={painel.idoso.avisoDePrivacidade?.dadoEm}
        assistente={painel.assistente}
        tratamento={painel.idoso.tratamento}
      />
      <Rodape assistente={painel.assistente} />
    </Moldura>
  );
}

/** Uma imagem da conversa, com as mesmas peças da tela de verdade (components/Conversa.tsx). */
function ImagemDaConversa({ saudacao }: { saudacao: string }) {
  return (
    <section
      aria-label={`Ligação com a ${NOME_DA_ASSISTENTE}`}
      className="flex w-full flex-1 flex-col items-center justify-between gap-4"
    >
      <div className="relative flex min-h-64 w-full max-w-md flex-1 items-center justify-center overflow-hidden rounded-3xl bg-muted">
        <Rosto estado="falando" nivel={0.3} className="sm:h-80 sm:w-80" />
        <p className="absolute left-3 top-3 rounded-full bg-card/90 px-4 py-1.5 font-titulo text-lg font-semibold shadow-sm">
          {NOME_DA_ASSISTENTE}, assistente virtual
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-2">
        <p className="text-xl font-medium text-muted-foreground">Falando</p>
        <p className="min-h-28 w-full max-w-2xl text-balance text-center text-2xl font-medium leading-snug sm:text-3xl">
          {saudacao}
        </p>
      </div>
      <BotaoGrande tom="encerrar">
        <PhoneOff aria-hidden className="h-7 w-7 shrink-0" />
        Desligar
      </BotaoGrande>
    </section>
  );
}

function conteudoDaTela(tela: string, dados: DadosDeExemplo): ReactNode {
  const helena = comoIdoso(dados.helena);
  const horarios = dados.helena.idoso.horariosDeLigacao;

  switch (tela) {
    // ----- Idoso -----
    case 'boas-vindas':
      return <BoasVindas />;
    case 'ligar-o-aparelho':
      return (
        <Suspense fallback={null}>
          <Parear />
        </Suspense>
      );
    case 'deixar-pronto':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <PrepararAparelho negado={false} onPreparar={nada} />
        </main>
      );
    case 'microfone-negado':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <PrepararAparelho negado onPreparar={nada} />
        </main>
      );
    case 'espera':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <Esperando horarios={horarios} proxima={horarios[horarios.length - 1] ?? null} onLigar={nada} />
        </main>
      );
    case 'minutos-de-hoje-acabaram':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <Esperando
            horarios={horarios}
            proxima={horarios[0] ?? null}
            proximaEAmanha
            limiteAcabou
            onLigar={nada}
          />
        </main>
      );
    case 'tocando':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <ChamadaTocando atenderSozinhoEm={null} onAtender={nada} onRecusar={nada} />
        </main>
      );
    case 'tocando-atende-sozinha':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <ChamadaTocando atenderSozinhoEm={10} onAtender={nada} onRecusar={nada} />
        </main>
      );
    case 'ligando':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <Ligando />
        </main>
      );
    case 'conversa':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <ImagemDaConversa saudacao={dados.saudacao} />
        </main>
      );
    case 'falha':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <AvisoDeFalha motivo="conexao" onTentar={nada} onVoltar={nada} />
        </main>
      );
    case 'falha-do-microfone':
      return (
        <main className={MOLDURA_DO_IDOSO}>
          <AvisoDeFalha motivo="microfone" onTentar={nada} onVoltar={nada} />
        </main>
      );

    // ----- Quem cuida -----
    case 'entrar':
      return <EntrarPage />;
    case 'cadastrar':
      // Montada como em app/familia/novo/page.tsx, na primeira vez de uma conta.
      return (
        <Moldura idosos={[]} idoso={null} onEscolher={nada} ativa="novo">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Vamos começar</h1>
            <p className="text-lg text-muted-foreground">
              Conte quem a Dona Leda vai acompanhar. Depois você prepara o celular ou o tablet em que a Dona Leda vai
              tocar.
            </p>
          </header>
          <section className="flex flex-col gap-2 rounded-2xl border border-border bg-muted p-5">
            <p className="text-base text-foreground">
              Quer ver antes como fica? A Dona Leda monta um exemplo com a dona Helena, uma pessoa inventada, com uma
              semana de conversas.
            </p>
            <button type="button" className={CLASSE_DO_BOTAO_SECUNDARIO}>
              Ver com um exemplo
            </button>
            <p className="text-base text-foreground">
              Num residencial, a equipe vê todos os moradores numa tela só. O exemplo tem oito moradores inventados.
            </p>
            <button type="button" className={CLASSE_DO_BOTAO_SECUNDARIO}>
              Ver um residencial de exemplo
            </button>
          </section>
          <FormularioDoIdoso enviando={false} erro={null} onEnviar={nada} />
        </Moldura>
      );
    case 'codigo':
      // Montada como em app/familia/aparelho/page.tsx.
      return (
        <Moldura idosos={[helena]} idoso={helena} onEscolher={nada} ativa="aparelho">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-foreground md:text-3xl">Ligar o aparelho</h1>
            <p className="text-lg text-muted-foreground">
              É no celular ou no tablet de {helena.tratamento} que a Dona Leda toca e conversa. Você faz isso uma vez
              só.
            </p>
            <p className="text-base text-foreground">1 aparelho já está ligado.</p>
          </header>
          <Cartao titulo="Como fazer">
            <ol className="flex list-decimal flex-col gap-3 pl-6 text-lg text-foreground">
              <li>No celular ou tablet de {helena.tratamento}, abra o app Dona Leda.</li>
              <li>Toque em &quot;Este aparelho vai receber as ligações&quot;.</li>
              <li>Digite o código que aparece aqui embaixo.</li>
            </ol>
            <p className="text-base text-muted-foreground">
              Deixe o aparelho ligado na tomada e na internet, com o app aberto, pra ele tocar na hora das ligações.
            </p>
          </Cartao>
          <Cartao titulo="Código">
            <CodigoDoAparelho idoso={helena} onConferir={nada} />
          </Cartao>
        </Moldura>
      );
    case 'painel':
      return <Painel painel={dados.helena} />;
    case 'painel-com-aviso':
      return <Painel painel={dados.jorge} />;
    case 'painel-memoria-e-minutos':
      return <Painel painel={dados.helenaNoLimite} />;
    case 'ajustes':
      // Montada como em app/familia/ajustes/page.tsx.
      return (
        <Moldura idosos={[helena]} idoso={helena} onEscolher={nada} ativa="ajustes">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            Ajustes de {dados.helena.idoso.tratamento}
          </h1>
          <AjustesDoIdoso
            idoso={dados.helena.idoso}
            onTrocarHorarios={nada}
            onTrocarAtenderSozinho={nada}
            onSalvarPerfil={nadaDeuCerto}
          />
          <ApagarIdoso idosoId={helena.id} tratamento={helena.tratamento} />
        </Moldura>
      );

    // ----- Residencial -----
    case 'casa': {
      // Montada como em app/familia/casa/page.tsx.
      const idosos = dados.moradores.map((morador) => comoIdoso(morador.painel));
      return (
        <main className="min-h-dvh bg-background text-base text-foreground">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 md:py-8">
            <BarraDoTopo idosos={idosos} idoso={idosos[0] ?? null} onEscolher={nada} ativa="casa" />
            <TelaDaCasa moradores={dados.moradores} conta={dados.conta} agora={dados.agora} />
          </div>
        </main>
      );
    }
    default:
      return null;
  }
}

interface TelaDeExemploProps {
  tela: string;
  dados: DadosDeExemplo;
}

export function TelaDeExemplo({ tela, dados }: TelaDeExemploProps) {
  return (
    <AppRouterContext.Provider value={ROTEADOR_PARADO}>
      {/* `inert` trava toque, clique e teclado: a tela aparece, e os botões não fazem nada. */}
      <div inert className="min-h-dvh bg-background">
        {conteudoDaTela(tela, dados)}
      </div>
    </AppRouterContext.Provider>
  );
}
