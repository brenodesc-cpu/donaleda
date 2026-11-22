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

/**
 * A dona Helena num dia em que já conversou os 10 minutos, com uma lembrança que a
 * Dona Leda só deduziu da conversa e o aviso de privacidade dado na primeira ligação.
 */
function helenaNoLimite(agora: Date) {
  const base = baseDeExemplo(agora, 'helena', { avisoFechado: true });
  const inicio = new Date(agora.getTime() - 3 * 60 * 60_000);
  // Uma conversa de verdade de hoje (id sem "ex-"), pra contar no limite do dia.
  base.conversas.push({
    id: 'galeria-hoje',
    inicio: inicio.toISOString(),
    fim: new Date(inicio.getTime() + 10 * 60_000).toISOString(),
    falasDoIdoso: 14,
    resumo: 'Dona Helena contou da feira e da visita da vizinha.',
  });
  const numero = base.lembrancas.reduce((m, l) => Math.max(m, l.numero), 0) + 1;
  base.lembrancas.push({
    id: 'galeria-deduzida',
    numero,
    texto: 'A vizinha Zefa passa na casa dela às quartas.',
    categoria: 'pessoa',
    sobre: 'Zefa',
    origem: 'deduzida',
    criadaEm: inicio.toISOString(),
    exemplo: true,
  });
  base.idoso.avisoDePrivacidade = { dadoEm: new Date(agora.getTime() - 6 * 86_400_000).toISOString(), versao: 1 };
  return base;
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
    helenaNoLimite: montarPainel(helenaNoLimite(agora), agora),
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
