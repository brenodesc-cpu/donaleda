// O convite pra família entrar na ligação (desenho aprovado pelo Breno em 21/11).
// Abre com aviso urgente durante a ligação ou quando a pessoa pede pra falar com a
// família. Tudo aqui mexe só na ficha; quem fala com a Agora é familiaNaLigacao.ts.

import type { Base, Conversa, ConviteDaFamilia, TipoDeAlerta } from './tipos';

/** Sem ninguém entrar nesse tempo, a Dona Leda conta pro idoso, uma vez. */
export const PRAZO_DO_CONVITE_MS = 90_000;
const DUAS_HORAS = 2 * 60 * 60 * 1000;

/** A conversa acontecendo agora numa sala em que a família pode entrar, ou null. */
export function conversaAoVivo(base: Base, agora: Date = new Date()): Conversa | null {
  const ultima = base.conversas[base.conversas.length - 1];
  if (!ultima || ultima.fim || !ultima.canal || !ultima.agenteId) return null;
  return agora.getTime() - new Date(ultima.inicio).getTime() < DUAS_HORAS ? ultima : null;
}

/**
 * Abre o convite na ligação ao vivo. Devolve a conversa só quando o convite nasceu
 * agora, pra quem chamou mandar a frase uma vez; aberto antes ou sem ligação, null.
 */
export function abrirConvite(
  base: Base,
  motivo: ConviteDaFamilia['motivo'],
  tipo: TipoDeAlerta | undefined,
  agora: Date = new Date(),
): Conversa | null {
  const conversa = conversaAoVivo(base, agora);
  if (!conversa || conversa.convite) return null;
  conversa.convite = { abertoEm: agora.toISOString(), motivo, ...(tipo ? { tipo } : {}) };
  return conversa;
}

/** O convite aberto na ligação ao vivo, ou null. */
export function conviteAberto(base: Base, agora: Date = new Date()): { conversa: Conversa; convite: ConviteDaFamilia } | null {
  const conversa = conversaAoVivo(base, agora);
  return conversa?.convite ? { conversa, convite: conversa.convite } : null;
}

/** Marca a entrada da família. `primeira` diz se é a primeira vez (só ela anuncia e tira a Dona Leda). */
export function registrarEntrada(base: Base, agora: Date = new Date()): { conversa: Conversa; primeira: boolean } | null {
  const aberto = conviteAberto(base, agora);
  if (!aberto) return null;
  const primeira = !aberto.convite.entrouEm;
  if (primeira) aberto.convite.entrouEm = agora.toISOString();
  return { conversa: aberto.conversa, primeira };
}

/**
 * Vence o prazo do convite quando o aparelho pergunta. Devolve a conversa só na vez em
 * que a frase de "não conseguiu entrar" deve tocar; nas outras perguntas, null.
 */
export function vencerConvite(base: Base, conversaId: string, agora: Date = new Date()): Conversa | null {
  const aberto = conviteAberto(base, agora);
  if (!aberto || aberto.conversa.id !== conversaId) return null;
  const { convite } = aberto;
  if (convite.entrouEm || convite.semEntradaEm) return null;
  if (agora.getTime() - new Date(convite.abertoEm).getTime() < PRAZO_DO_CONVITE_MS) return null;
  convite.semEntradaEm = agora.toISOString();
  return aberto.conversa;
}

// ---------- As frases fixas. Nenhuma promete socorro nem diz que alguém está vindo. ----------

const PARENTESCO_FEMININO = /^(m[aã]e|irm[aã]|nora|av[oó]|madrinha|esposa|mulher|tia)$/;

/** "a Marina" e "ela", ou "o Paulo" e "ele", pelo parentesco. */
function quem(familiar: { nome: string; parentesco: string }): { nome: string; ela: string } {
  const parentesco = familiar.parentesco.trim().toLowerCase();
  const feminino = parentesco.endsWith('a') || PARENTESCO_FEMININO.test(parentesco);
  return { nome: `${feminino ? 'a' : 'o'} ${familiar.nome}`, ela: feminino ? 'ela' : 'ele' };
}

function maiuscula(texto: string): string {
  return `${texto[0].toUpperCase()}${texto.slice(1)}`;
}

function senhora(tratamento: string): string {
  return /^seu\b/i.test(tratamento.trim()) ? 'o senhor' : 'a senhora';
}

/** Quando o convite abre. */
export function fraseDoConvite(base: Base): string {
  const { familiar, tratamento } = base.idoso;
  const f = quem(familiar);
  return `${maiuscula(tratamento)}, eu avisei ${f.nome}. Se ${f.ela} puder agora, ${f.ela} entra aqui na ligação com a gente. Enquanto isso, eu fico com ${senhora(tratamento)}.`;
}

/** Quando a família entra. Depois dela a Dona Leda sai da sala. */
export function fraseDaEntrada(base: Base): string {
  const { familiar, tratamento } = base.idoso;
  return `${maiuscula(tratamento)}, ${quem(familiar).nome} entrou na ligação. Vou deixar vocês conversarem.`;
}

/** Quando ninguém entra no prazo. No golpe, o fim da frase muda. */
export function fraseSemEntrada(base: Base, tipo: TipoDeAlerta | undefined): string {
  const { familiar, tratamento } = base.idoso;
  const f = quem(familiar);
  const fim =
    tipo === 'golpe'
      ? `Não passa nenhum dado pra ninguém antes de falar com ${f.ela}.`
      : `Se ${senhora(tratamento)} precisar de ajuda agora, liga pro um nove dois.`;
  return `${maiuscula(f.nome)} não conseguiu entrar agora. O aviso ficou com ${f.ela}, e ${f.ela} vê assim que pegar o celular. ${fim}`;
}
