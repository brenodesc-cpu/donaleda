// As frases do cartão de cada morador na tela "Todos os moradores". Conta pura.

import type { Alerta, PainelDaFamilia } from '@/lib/tipos';
import {
  comMaiuscula,
  dataDeBrasilia,
  duracaoEmPalavras,
  horaCurta,
  horaDeBrasilia,
  quandoFoi,
  type Tom,
} from '../formatos';

export interface LinhaDaConversa {
  texto: string;
  tom: Tom;
  /** Bolinha verde de quem está conversando agora. */
  agora?: boolean;
}

/** A próxima hora marcada depois de agora ("HH:MM"), ou a primeira de amanhã. */
export function proximaLigacao(horarios: string[], agora: string): { hora: string; amanha: boolean } | null {
  const ordem = [...horarios].sort();
  if (ordem.length === 0) return null;
  const hoje = ordem.find((h) => h > agora);
  return hoje ? { hora: hoje, amanha: false } : { hora: ordem[0], amanha: true };
}

function fraseDaProxima(painel: PainelDaFamilia, agora: string): string {
  const proxima = proximaLigacao(painel.idoso.horariosDeLigacao, agora);
  if (!proxima) return '';
  return `${proxima.amanha ? 'amanhã ' : ''}às ${horaCurta(proxima.hora)}`;
}

/** Como está a conversa de hoje: feita, acontecendo, tocando, perdida ou ainda por vir. */
export function linhaDaConversa(painel: PainelDaFamilia, agoraIso: string): LinhaDaConversa {
  const { assistente, ultimaConversa, conversouHoje, chamadaTocando } = painel;
  const hoje = painel.hoje.data;
  const agora = horaDeBrasilia(agoraIso);

  if (ultimaConversa?.emAndamento) {
    return { texto: `Conversando com a ${assistente} agora`, tom: 'bom', agora: true };
  }
  if (chamadaTocando) {
    return { texto: `A ${assistente} está ligando agora`, tom: 'neutro' };
  }
  if (conversouHoje && ultimaConversa) {
    const hora = horaCurta(horaDeBrasilia(ultimaConversa.inicio));
    const duracao = duracaoEmPalavras(ultimaConversa.minutos);
    return { texto: `Conversou às ${hora}${duracao ? `, por ${duracao}` : ''}`, tom: 'neutro' };
  }

  const proxima = fraseDaProxima(painel, agora);
  const perdida = painel.chamadas.find(
    (c) => c.estado === 'perdida' && dataDeBrasilia(c.pedidaEm) === hoje,
  );
  if (perdida) {
    const hora = horaCurta(perdida.horario ?? horaDeBrasilia(perdida.pedidaEm));
    return {
      texto: `Não atendeu às ${hora}.${proxima ? ` Próxima ligação ${proxima}` : ''}`,
      tom: 'atencao',
    };
  }
  return {
    texto: proxima ? `Ainda não conversou. Ligação marcada ${proxima}` : 'Ainda não conversou hoje',
    tom: 'vazio',
  };
}

/** Quando foi o aviso e quem avisou, como no painel do morador. */
export function quandoDoAviso(alerta: Alerta, hoje: string, assistente: string): string {
  const quando = quandoFoi(alerta.criadoEm, hoje);
  const dia = dataDeBrasilia(alerta.criadoEm) === hoje ? `Hoje ${quando}` : quando;
  const origem =
    alerta.tipo === 'ligacao'
      ? ''
      : alerta.origem === 'assistente'
        ? `, avisado pela ${assistente}`
        : `, na conversa com a ${assistente}`;
  return comMaiuscula(`${dia}${origem}`);
}

/** A equipe pode ligar de novo pra quem não atendeu hoje e não está em ligação. */
export function podeLigarDeNovo(painel: PainelDaFamilia): boolean {
  if (painel.conversouHoje || painel.chamadaTocando || painel.ultimaConversa?.emAndamento) return false;
  return painel.chamadas.some(
    (c) => c.estado === 'perdida' && dataDeBrasilia(c.pedidaEm) === painel.hoje.data,
  );
}
