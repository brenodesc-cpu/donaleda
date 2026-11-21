// A ficha de cada idoso. As funções de cima são puras e mexem num objeto Base;
// as de baixo leem e gravam a ficha no banco (Supabase), uma mudança de cada vez.

import { avisoAberto } from './avisos';
import { randomUUID } from 'node:crypto';
import { citaSegredo, guardar, normalizarLembrancas, paraOPainel } from './memoria';
import { NOME_DA_ASSISTENTE, dataEmBrasilia, somarDias } from './assistente';
import { limiteDoDia } from './limiteDoDia';
import { VERSAO_DO_AVISO_DE_PRIVACIDADE } from './privacidade';
import type {
  Alerta,
  Alimentacao,
  AparelhoPush,
  Base,
  CategoriaDeLembranca,
  Conversa,
  Dia,
  Gravidade,
  Humor,
  Lembranca,
  PainelDaFamilia,
  Remedio,
  Sono,
  TipoDeAlerta,
} from './tipos';

// ---------- Parte pura: mexe no objeto, não toca em disco ----------

export interface BemEstar {
  sono?: Sono;
  alimentacao?: Alimentacao;
  remedio?: Remedio;
  dor?: number;
  ondeDoi?: string;
  humor?: Humor;
  saiuDeCasa?: boolean;
  falouComAlguem?: boolean;
  observacao?: string;
}

export function diaVazio(data: string): Dia {
  return { data, observacoes: [] };
}

function diaDeHoje(base: Base, agora: Date): Dia {
  const data = dataEmBrasilia(agora);
  let dia = base.dias.find((d) => d.data === data);
  if (!dia) {
    dia = diaVazio(data);
    base.dias.push(dia);
  }
  return dia;
}

export function criarAlerta(
  base: Base,
  novo: { tipo: TipoDeAlerta; gravidade: Gravidade; texto: string; origem: Alerta['origem'] },
  agora: Date = new Date(),
): Alerta {
  // O mesmo aviso não aparece duas vezes em meia hora, nem a mesma regra dispara de novo
  // em um minuto. A janela era o dia inteiro, e um ensaio de manhã escondia o aviso do palco.
  const repetido = base.alertas.find((a) => {
    if (a.tipo !== novo.tipo) return false;
    const passou = agora.getTime() - new Date(a.criadoEm).getTime();
    if (a.texto === novo.texto.trim() && passou < 30 * 60_000) return true;
    return novo.origem === 'regra' && a.origem === 'regra' && passou < 60_000;
  });
  if (repetido) return repetido;

  const alerta: Alerta = {
    id: randomUUID(),
    tipo: novo.tipo,
    gravidade: novo.gravidade,
    texto: novo.texto.trim(),
    criadoEm: agora.toISOString(),
    origem: novo.origem,
    visto: false,
  };
  base.alertas.push(alerta);
  return alerta;
}

/** Junta o que a pessoa contou com o que já se sabia do dia. Devolve o dia e os alertas que nasceram. */
export function aplicarBemEstar(
  base: Base,
  parcial: BemEstar,
  agora: Date = new Date(),
): { dia: Dia; alertas: Alerta[] } {
  const dia = diaDeHoje(base, agora);
  const alertas: Alerta[] = [];

  if (parcial.sono) dia.sono = parcial.sono;
  if (parcial.alimentacao) dia.alimentacao = parcial.alimentacao;
  if (parcial.humor) dia.humor = parcial.humor;
  if (typeof parcial.saiuDeCasa === 'boolean') dia.saiuDeCasa = parcial.saiuDeCasa;
  if (typeof parcial.falouComAlguem === 'boolean') dia.falouComAlguem = parcial.falouComAlguem;
  if (parcial.ondeDoi?.trim()) dia.ondeDoi = parcial.ondeDoi.trim();

  if (typeof parcial.dor === 'number' && Number.isFinite(parcial.dor)) {
    dia.dor = Math.min(10, Math.max(0, Math.round(parcial.dor)));
    if (dia.dor >= 7) {
      const onde = dia.ondeDoi ? ` ${dia.ondeDoi}` : '';
      alertas.push(
        criarAlerta(
          base,
          {
            tipo: 'saude',
            gravidade: 'atencao',
            texto: `Disse que está com dor forte, ${dia.dor} de 10${onde}.`,
            origem: 'regra',
          },
          agora,
        ),
      );
    }
  }

  if (parcial.remedio) {
    dia.remedio = parcial.remedio;
    if (parcial.remedio !== 'tomou') {
      alertas.push(
        criarAlerta(
          base,
          {
            tipo: 'remedio',
            gravidade: 'atencao',
            texto:
              parcial.remedio === 'nao_tomou'
                ? 'Disse que não tomou o remédio de hoje.'
                : 'Não confirmou se tomou o remédio de hoje.',
            origem: 'regra',
          },
          agora,
        ),
      );
    }
  }

  // A anotação do dia aparece no painel da família, então não pode contar o assunto
  // que a pessoa pediu segredo. O humor já foi anotado acima; a frase fica de fora.
  const observacao = parcial.observacao?.trim();
  if (observacao && !dia.observacoes.includes(observacao) && !citaSegredo(base, observacao)) {
    dia.observacoes.push(observacao);
  }

  // Dia que recebeu resposta de verdade deixa de ser exemplo.
  delete dia.exemplo;
  dia.atualizadoEm = agora.toISOString();
  return { dia, alertas };
}

/** O que ainda não se sabe do dia, em palavras, pra assistente saber o que falta perguntar. */
export function oQueFaltaSaber(dia: Dia): string[] {
  const falta: string[] = [];
  if (!dia.sono) falta.push('como dormiu');
  if (!dia.alimentacao) falta.push('se comeu');
  if (!dia.remedio) falta.push('se tomou o remédio');
  if (typeof dia.dor !== 'number') falta.push('se sente dor');
  if (!dia.humor) falta.push('como está se sentindo');
  return falta;
}

/** Guarda uma lembrança contada na conversa. A regra completa mora em lib/memoria.ts. */
export function guardarLembranca(
  base: Base,
  texto: string,
  categoria: CategoriaDeLembranca,
  agora: Date = new Date(),
): Lembranca | null {
  const r = guardar(base, { texto, categoria, origem: 'conversa' }, agora);
  return r.ok ? r.lembranca : null;
}

export function abrirConversa(base: Base, agora: Date = new Date(), chamadaId?: string): Conversa {
  // Conversa que ficou aberta (aba fechada, queda de conexão) é encerrada aqui.
  for (const c of base.conversas) {
    if (!c.fim) c.fim = agora.toISOString();
  }
  const conversa: Conversa = {
    id: randomUUID(),
    inicio: agora.toISOString(),
    falasDoIdoso: 0,
    ...(chamadaId ? { chamadaId } : {}),
  };
  base.conversas.push(conversa);
  return conversa;
}

export function fecharConversa(
  base: Base,
  conversaId: string,
  agora: Date = new Date(),
): Conversa | null {
  const conversa = base.conversas.find((c) => c.id === conversaId);
  if (!conversa) return null;
  if (!conversa.fim) conversa.fim = agora.toISOString();
  if (conversa.falasDoIdoso > 0) {
    // A saudação desta conversa levou o aviso de privacidade: fica a data na ficha.
    if (!base.idoso.primeiraConversaFeita) {
      base.idoso.avisoDePrivacidade ??= { dadoEm: conversa.inicio, versao: VERSAO_DO_AVISO_DE_PRIVACIDADE };
    }
    base.idoso.primeiraConversaFeita = true;
  }
  return conversa;
}

export function resumirConversa(base: Base, resumo: string): Conversa | null {
  const ultima = base.conversas[base.conversas.length - 1];
  if (!ultima) return null;
  ultima.resumo = resumo.trim();
  return ultima;
}

const DUAS_HORAS = 2 * 60 * 60 * 1000;

export function montarPainel(base: Base, agora: Date = new Date()): PainelDaFamilia {
  const hojeData = dataEmBrasilia(agora);
  const porData = new Map(base.dias.map((d) => [d.data, d]));
  const semana: Dia[] = [];
  for (let atras = 6; atras >= 0; atras -= 1) {
    const data = somarDias(hojeData, -atras);
    semana.push(porData.get(data) ?? diaVazio(data));
  }

  const ultima = base.conversas[base.conversas.length - 1];
  let ultimaConversa: PainelDaFamilia['ultimaConversa'] = null;
  if (ultima) {
    const inicio = new Date(ultima.inicio).getTime();
    const emAndamento = !ultima.fim && agora.getTime() - inicio < DUAS_HORAS;
    const minutos = ultima.fim
      ? Math.max(1, Math.round((new Date(ultima.fim).getTime() - inicio) / 60_000))
      : null;
    ultimaConversa = {
      inicio: ultima.inicio,
      fim: ultima.fim,
      minutos,
      resumo: ultima.resumo,
      emAndamento,
    };
  }

  const alertas = [...base.alertas]
    .sort((a, b) => {
      // Aberto primeiro: ninguém viu, ou quem viu ainda não contou o que fez.
      const abertoA = avisoAberto(a);
      if (abertoA !== avisoAberto(b)) return abertoA ? -1 : 1;
      return b.criadoEm.localeCompare(a.criadoEm);
    })
    .slice(0, 20);

  return {
    assistente: NOME_DA_ASSISTENTE,
    idoso: base.idoso,
    hoje: porData.get(hojeData) ?? diaVazio(hojeData),
    // Ligação que atendeu sozinha e terminou sem o idoso falar não conta como conversa.
    conversouHoje: base.conversas.some(
      (c) => dataEmBrasilia(new Date(c.inicio)) === hojeData && (c.falasDoIdoso > 0 || !c.fim),
    ),
    ultimaConversa,
    alertas,
    semana,
    ...paraOPainel(base),
    chamadaTocando: base.chamadas.find((c) => c.estado === 'tocando') ?? null,
    chamadas: [...base.chamadas].reverse().slice(0, 10),
    limiteDoDia: limiteDoDia(base, agora),
    atualizadoEm: agora.toISOString(),
  };
}

// ---------- Parte que lê e grava a ficha ----------
// Cada idoso tem uma linha em `fichas` (Supabase) com o objeto Base inteiro e uma
// versão. Gravar só vale se a versão for a que foi lida; senão lê de novo e refaz
// a mudança, até 5 vezes. Nos testes (LIA_DADOS=memoria) a ficha fica na memória.

export class FichaNaoEncontrada extends Error {
  constructor(idosoId: string) {
    super(`Ficha não encontrada: ${idosoId}`);
  }
}

interface FichaLida {
  base: Base;
  versao: number;
}

interface Armazem {
  ler(idosoId: string): Promise<FichaLida | null>;
  /** Devolve false quando outra gravação chegou antes. */
  gravar(idosoId: string, base: Base, versao: number): Promise<boolean>;
  criar(idosoId: string, base: Base): Promise<void>;
  listar(): Promise<string[]>;
}

const memoria = new Map<string, { base: string; versao: number }>();

const armazemNaMemoria: Armazem = {
  async ler(idosoId) {
    const linha = memoria.get(idosoId);
    return linha ? { base: JSON.parse(linha.base) as Base, versao: linha.versao } : null;
  },
  async gravar(idosoId, base, versao) {
    const linha = memoria.get(idosoId);
    if (!linha || linha.versao !== versao) return false;
    memoria.set(idosoId, { base: JSON.stringify(base), versao: versao + 1 });
    return true;
  },
  async criar(idosoId, base) {
    memoria.set(idosoId, { base: JSON.stringify(base), versao: 1 });
  },
  async listar() {
    return [...memoria.keys()];
  },
};

async function supabase() {
  const { clienteDoServidor } = await import('./supabase/servidor');
  return clienteDoServidor();
}

const armazemNoSupabase: Armazem = {
  async ler(idosoId) {
    const { data, error } = await (await supabase())
      .from('fichas')
      .select('base, versao')
      .eq('idoso_id', idosoId)
      .maybeSingle();
    if (error) throw new Error(`Não consegui ler a ficha: ${error.message}`);
    return data ? { base: data.base as Base, versao: data.versao as number } : null;
  },
  async gravar(idosoId, base, versao) {
    const { data, error } = await (await supabase()).rpc('gravar_ficha', {
      p_idoso: idosoId,
      p_base: base,
      p_versao: versao,
    });
    if (error) throw new Error(`Não consegui gravar a ficha: ${error.message}`);
    return data !== null && data !== undefined;
  },
  async criar(idosoId, base) {
    const { error } = await (await supabase())
      .from('fichas')
      .insert({ idoso_id: idosoId, base, versao: 1 });
    if (error) throw new Error(`Não consegui criar a ficha: ${error.message}`);
  },
  async listar() {
    const { data, error } = await (await supabase()).from('fichas').select('idoso_id');
    if (error) throw new Error(`Não consegui listar as fichas: ${error.message}`);
    return (data ?? []).map((l) => l.idoso_id as string);
  },
};

function armazem(): Armazem {
  return process.env.LIA_DADOS === 'memoria' ? armazemNaMemoria : armazemNoSupabase;
}

/** Registra ou atualiza o token de push de um aparelho pareado (mantém até 5 mais recentes). */
export function registrarAparelhoPush(
  base: Base,
  entrada: { plataforma: 'android' | 'ios'; token: string; agoraRtmUserId?: string },
  agora: Date = new Date(),
): AparelhoPush {
  const token = entrada.token.trim();
  const atual = (base.aparelhosPush ?? []).filter((a) => a.token !== token);
  const registro: AparelhoPush = {
    plataforma: entrada.plataforma,
    token,
    atualizadoEm: agora.toISOString(),
    ...(entrada.agoraRtmUserId ? { agoraRtmUserId: entrada.agoraRtmUserId } : {}),
  };
  atual.push(registro);
  base.aparelhosPush = atual.slice(-5);
  return registro;
}

/** Completa uma ficha gravada por versão mais antiga, que não tinha as ligações. */
function completar(base: Base, idosoId: string): Base {
  base.chamadas ??= [];
  base.aparelhosPush ??= [];
  normalizarLembrancas(base);
  base.idoso.id = idosoId;
  base.idoso.horariosDeLigacao ??= ['09:00', '19:00'];
  base.idoso.atenderSozinho ??= false;
  return base;
}

export async function criarFicha(idosoId: string, base: Base): Promise<void> {
  await armazem().criar(idosoId, completar(base, idosoId));
}

export async function listarFichas(): Promise<string[]> {
  return armazem().listar();
}

export async function lerBase(idosoId: string): Promise<Base> {
  const lida = await armazem().ler(idosoId);
  if (!lida) throw new FichaNaoEncontrada(idosoId);
  return completar(lida.base, idosoId);
}

// Uma fila por idoso dentro deste servidor, pra duas mudanças do mesmo processo
// não brigarem pela versão. Entre servidores diferentes, a versão resolve.
const global = globalThis as typeof globalThis & {
  __filasDaDonaLeda?: Map<string, Promise<unknown>>;
};
const filas = (global.__filasDaDonaLeda ??= new Map());

/**
 * Lê, aplica a mudança e grava só quando ela pede.
 * Serve pras rotas chamadas a cada 2 segundos, que quase nunca mudam nada.
 */
export function mudarBaseQuando<T>(
  idosoId: string,
  mudanca: (base: Base) => { gravar: boolean; resultado: T },
): Promise<T> {
  const anterior = filas.get(idosoId) ?? Promise.resolve();
  const proxima = anterior.then(async () => {
    for (let tentativa = 1; tentativa <= 5; tentativa += 1) {
      const lida = await armazem().ler(idosoId);
      if (!lida) throw new FichaNaoEncontrada(idosoId);
      const base = completar(lida.base, idosoId);
      const { gravar, resultado } = mudanca(base);
      if (!gravar) return resultado;
      if (await armazem().gravar(idosoId, base, lida.versao)) return resultado;
    }
    throw new Error('A ficha mudou cinco vezes seguidas enquanto eu gravava.');
  });
  filas.set(idosoId, proxima.catch(() => undefined));
  return proxima;
}

/** Lê, aplica a mudança e grava. */
export function mudarBase<T>(idosoId: string, mudanca: (base: Base) => T): Promise<T> {
  return mudarBaseQuando(idosoId, (base) => ({ gravar: true, resultado: mudanca(base) }));
}
