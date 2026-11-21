import { notFound } from 'next/navigation';
import { contarCasa, ordenarMoradores } from '@/components/familia/casa/ordem';
import { TelaDeExemplo, type DadosDeExemplo } from '@/components/telas/TelaDeExemplo';
import { VoltarPraLista } from '@/components/telas/VoltarPraLista';
import { TELAS, telaDaLista } from '@/components/telas/lista';
import { montarPainel } from '@/lib/dados';
import { baseDeExemplo, residencialDeExemplo } from '@/lib/exemplo';
import { montarSaudacao } from '@/lib/persona';

// Os dados de exemplo dependem do dia de hoje. A página é montada na publicação e
// refeita de hora em hora, pra "hoje" continuar sendo hoje.
export const revalidate = 3600;

export function generateStaticParams() {
  return TELAS.map((tela) => ({ tela: tela.id }));
}

/** A dona Helena e o residencial de exemplo, montados aqui porque lib/dados.ts só roda no servidor. */
function dadosDeExemplo(): DadosDeExemplo {
  const agora = new Date();
  const baseDaHelena = baseDeExemplo(agora, 'helena', { avisoFechado: true });
  const casa = residencialDeExemplo(agora).map((morador) => {
    const id = `exemplo-${morador.nome.toLowerCase()}`;
    return { id, painel: montarPainel(morador.ficha(id), agora) };
  });
  const moradores = ordenarMoradores(casa);
  const jorge = casa.find((morador) => morador.painel.idoso.nome === 'Jorge') ?? casa[0];
  return {
    helena: montarPainel(baseDaHelena, agora),
    jorge: jorge.painel,
    moradores,
    conta: contarCasa(moradores),
    agora: agora.toISOString(),
    saudacao: montarSaudacao(baseDaHelena, agora),
  };
}

export default async function VerTelaPage({ params }: { params: Promise<{ tela: string }> }) {
  const { tela } = await params;
  if (!telaDaLista(tela)) notFound();
  return (
    <>
      <TelaDeExemplo tela={tela} dados={dadosDeExemplo()} />
      <VoltarPraLista tela={tela} />
    </>
  );
}
