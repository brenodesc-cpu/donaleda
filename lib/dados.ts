// A ficha de cada idoso. As funções de cima são puras e mexem num objeto Base;
// as de baixo leem e gravam a ficha no banco (Supabase), uma mudança de cada vez.

import { avisoAberto } from './avisos';
import { randomUUID } from 'node:crypto';
import { conviteAberto } from './convite';
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
  ContatoDeEmergencia,
  Conversa,
  Dia,
  DocumentoClinico,
  Escalonamento,
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

export function abrirConversa(
  base: Base,
  agora: Date = new Date(),
  chamadaId?: string,
  sala?: { canal: string; agenteId: string; modo?: 'gemini' | 'tres' },
): Conversa {
  // Conversa que ficou aberta (aba fechada, queda de conexão) é encerrada aqui.
  for (const c of base.conversas) {
    if (!c.fim) c.fim = agora.toISOString();
  }
  const diaDeHoje = base.dias.find((d) => d.data === dataEmBrasilia(agora));
  const conversa: Conversa = {
    id: randomUUID(),
    inicio: agora.toISOString(),
    falasDoIdoso: 0,
    diaNoInicio: diaDeHoje ? structuredClone(diaDeHoje) : null,
    lembrancasNoInicio: base.lembrancas.map((l) => l.id),
    alertasNoInicio: base.alertas.length,
    ...(chamadaId ? { chamadaId } : {}),
    ...(sala ? { canal: sala.canal, agenteId: sala.agenteId, ...(sala.modo ? { modo: sala.modo } : {}) } : {}),
  };
  base.conversas.push(conversa);
  return conversa;
}

/** A conversa que está acontecendo agora (a última, sem fim). */
export function conversaAberta(base: Base): Conversa | undefined {
  const ultima = base.conversas[base.conversas.length - 1];
  return ultima && !ultima.fim ? ultima : undefined;
}

/**
 * Outra pessoa atendeu a ligação: marca a conversa e avisa a família uma vez, com a hora.
 * Não guarda a voz nem nada do que a pessoa disse. Devolve false se não há conversa aberta.
 */
export function marcarOutraPessoa(base: Base, agora: Date = new Date()): boolean {
  const conversa = conversaAberta(base);
  if (!conversa) return false;
  if (conversa.outraPessoa) return true;
  conversa.outraPessoa = true;
  desfazerOQueALigacaoAnotou(base, conversa);
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(conversa.inicio));
  const { tratamento } = base.idoso;
  criarAlerta(
    base,
    {
      tipo: 'ligacao',
      gravidade: 'atencao',
      texto: `Outra pessoa atendeu a ligação das ${hora}. Nada do que ela disse entrou na ficha de ${tratamento}. Vale ligar pra saber como está.`,
      origem: 'assistente',
    },
    agora,
  );
  return true;
}

/**
 * Quem atendeu pode ter respondido como se fosse o idoso antes de dizer quem era.
 * A ficha do dia volta a como estava no começo da ligação, e saem as lembranças
 * guardadas nela e os avisos de rotina dela: remédio e saúde de atenção, da regra
 * ou da assistente. Os avisos de risco (emergência, golpe, tristeza e saúde urgente)
 * ficam com a família, por segurança.
 */
function desfazerOQueALigacaoAnotou(base: Base, conversa: Conversa): void {
  if (conversa.diaNoInicio !== undefined) {
    const data = conversa.diaNoInicio?.data ?? dataEmBrasilia(new Date(conversa.inicio));
    const i = base.dias.findIndex((d) => d.data === data);
    if (conversa.diaNoInicio === null) {
      if (i >= 0) base.dias.splice(i, 1);
    } else if (i >= 0) {
      base.dias[i] = structuredClone(conversa.diaNoInicio);
    }
  }
  if (conversa.lembrancasNoInicio) {
    const existiam = new Set(conversa.lembrancasNoInicio);
    base.lembrancas = base.lembrancas.filter((l) => existiam.has(l.id) || l.origem !== 'conversa');
  }
  if (typeof conversa.alertasNoInicio === 'number') {
    const inicio = conversa.alertasNoInicio;
    // Os avisos só crescem no fim da lista: os de depois do início são desta ligação.
    const deRotina = (a: Alerta) => a.tipo === 'remedio' || (a.tipo === 'saude' && a.gravidade === 'atencao');
    base.alertas = base.alertas.filter((a, i) => i < inicio || !deRotina(a));
  }
}

export function fecharConversa(
  base: Base,
  conversaId: string,
  agora: Date = new Date(),
): Conversa | null {
  const conversa = base.conversas.find((c) => c.id === conversaId);
  if (!conversa) return null;
  if (!conversa.fim) conversa.fim = agora.toISOString();
  delete conversa.diaNoInicio;
  delete conversa.lembrancasNoInicio;
  delete conversa.alertasNoInicio;
  if (conversa.falasDoIdoso > 0 && !conversa.outraPessoa) {
    // A saudação desta conversa levou o aviso de privacidade: fica a data na ficha.
    // Quando outra pessoa atendeu, quem ouviu o aviso não foi o idoso.
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

  // Ligação em que outra pessoa atendeu não aparece como a última conversa do idoso.
  const ultima = [...base.conversas].reverse().find((c) => !c.outraPessoa);
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

  const aberto = conviteAberto(base, agora);

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
      (c) =>
        dataEmBrasilia(new Date(c.inicio)) === hojeData && !c.outraPessoa && (c.falasDoIdoso > 0 || !c.fim),
    ),
    ultimaConversa,
    convite: aberto
      ? { conversaId: aberto.conversa.id, abertoEm: aberto.convite.abertoEm, motivo: aberto.convite.motivo, entrou: Boolean(aberto.convite.entrouEm) }
      : null,
    alertas,
    semana,
    ...paraOPainel(base),
    chamadaTocando: base.chamadas.find((c) => c.estado === 'tocando') ?? null,
    chamadas: [...base.chamadas].reverse().slice(0, 10),
    aparelhoPushAtivo: (base.aparelhosPush?.length ?? 0) > 0,
    notificacoesFamiliaAtivas: (base.aparelhosFamiliaPush?.length ?? 0) > 0,
    limiteDoDia: limiteDoDia(base, agora),
    documentos: [...(base.documentos ?? [])].reverse().slice(0, 30),
    redeDeApoio: base.redeDeApoio ?? [],
    escalonamentos: [...(base.escalonamentos ?? [])].reverse().slice(0, 10),
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

/** Normaliza telefone brasileiro/internacional pra E.164 (+55...) mantendo segurança. */
export function normalizarTelefone(bruto: string): string {
  const digitos = bruto.replace(/\D/g, '');
  if (digitos.length < 10 || digitos.length > 15) return '';
  if (bruto.trim().startsWith('+')) return `+${digitos}`;
  if (digitos.length === 10 || digitos.length === 11) return `+55${digitos}`;
  return `+${digitos}`;
}

export function adicionarDocumento(
  base: Base,
  entrada: Omit<DocumentoClinico, 'id' | 'criadoEm'> & { id?: string },
  agora: Date = new Date(),
): DocumentoClinico {
  base.documentos ??= [];
  const doc: DocumentoClinico = {
    ...entrada,
    id: entrada.id?.trim() || randomUUID(),
    criadoEm: agora.toISOString(),
  };
  base.documentos.push(doc);
  if (base.documentos.length > 40) base.documentos.splice(0, base.documentos.length - 40);
  return doc;
}

export function apagarDocumento(base: Base, documentoId: string): boolean {
  base.documentos ??= [];
  const i = base.documentos.findIndex((d) => d.id === documentoId);
  if (i < 0) return false;
  base.documentos.splice(i, 1);
  return true;
}

export function definirRedeDeApoio(
  base: Base,
  contatos: { id?: string; nome: string; parentesco: string; telefone: string }[],
): ContatoDeEmergencia[] {
  const limpos: ContatoDeEmergencia[] = [];
  for (const c of contatos.slice(0, 10)) {
    const nome = String(c.nome ?? '').trim().slice(0, 60);
    const parentesco = String(c.parentesco ?? '').trim().slice(0, 40) || 'familiar';
    const telefone = normalizarTelefone(String(c.telefone ?? ''));
    if (!nome || !telefone) continue;
    limpos.push({
      id: typeof c.id === 'string' && c.id.trim() ? c.id.trim() : randomUUID(),
      nome,
      parentesco,
      telefone,
    });
  }
  base.redeDeApoio = limpos;
  return limpos;
}

export function registrarAparelhoFamiliaPush(
  base: Base,
  plataforma: 'android' | 'ios',
  token: string,
  agora: Date = new Date(),
  voipToken?: string,
): boolean {
  const limpo = token.trim();
  const voipLimpo = voipToken?.trim();
  const temToken = limpo.length >= 16 && limpo.length <= 512;
  const temVoip = Boolean(voipLimpo && voipLimpo.length >= 16 && voipLimpo.length <= 512);
  if (!temToken && !temVoip) return false;
  const chave = temToken ? limpo : voipLimpo!;
  base.aparelhosFamiliaPush ??= [];
  const semAntigo = base.aparelhosFamiliaPush.filter(
    (a) => a.token !== chave && (!temVoip || a.voipToken !== voipLimpo),
  );
  semAntigo.push({
    plataforma,
    token: chave,
    ...(temVoip ? { voipToken: voipLimpo } : {}),
    atualizadoEm: agora.toISOString(),
  });
  base.aparelhosFamiliaPush = semAntigo.slice(-10);
  return true;
}

export function registrarEscalonamento(base: Base, escalonamento: Escalonamento): Escalonamento {
  base.escalonamentos ??= [];
  const existente = base.escalonamentos.find((e) => e.chamadaId === escalonamento.chamadaId);
  if (existente) return existente;
  base.escalonamentos.push(escalonamento);
  if (base.escalonamentos.length > 20) {
    base.escalonamentos.splice(0, base.escalonamentos.length - 20);
  }
  return escalonamento;
}

/** Completa uma ficha gravada por versão mais antiga, que não tinha as ligações. */
function completar(base: Base, idosoId: string): Base {
  base.chamadas ??= [];
  base.aparelhosPush ??= [];
  base.aparelhosFamiliaPush ??= [];
  base.documentos ??= [];
  base.redeDeApoio ??= [];
  base.escalonamentos ??= [];
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
