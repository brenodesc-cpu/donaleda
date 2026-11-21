// A ficha de cada idoso. Nesta primeira versão ela mora num arquivo JSON local
// (pasta dados/, fora do GitHub). As funções de cima são puras e mexem num objeto
// Base; as de baixo leem e gravam o arquivo, uma mudança de cada vez.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NOME_DA_ASSISTENTE, dataEmBrasilia, somarDias } from './assistente';
import { baseDeExemplo } from './exemplo';
import type {
  Alerta,
  Alimentacao,
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
  const hoje = dataEmBrasilia(agora);
  // O mesmo aviso não aparece duas vezes no dia, nem a mesma regra dispara de novo em um minuto.
  const repetido = base.alertas.find((a) => {
    if (a.tipo !== novo.tipo) return false;
    const mesmoDia = dataEmBrasilia(new Date(a.criadoEm)) === hoje;
    if (mesmoDia && a.texto === novo.texto) return true;
    const haPouco = agora.getTime() - new Date(a.criadoEm).getTime() < 60_000;
    return novo.origem === 'regra' && a.origem === 'regra' && haPouco;
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

  const observacao = parcial.observacao?.trim();
  if (observacao && !dia.observacoes.includes(observacao)) {
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

export function guardarLembranca(
  base: Base,
  texto: string,
  categoria: CategoriaDeLembranca,
  agora: Date = new Date(),
): Lembranca {
  const limpo = texto.trim();
  const igual = base.lembrancas.find(
    (l) => l.texto.toLowerCase() === limpo.toLowerCase(),
  );
  if (igual) return igual;
  const lembranca: Lembranca = {
    id: randomUUID(),
    texto: limpo,
    categoria,
    criadaEm: agora.toISOString(),
  };
  base.lembrancas.push(lembranca);
  return lembranca;
}

export function abrirConversa(base: Base, agora: Date = new Date()): Conversa {
  // Conversa que ficou aberta (aba fechada, queda de conexão) é encerrada aqui.
  for (const c of base.conversas) {
    if (!c.fim) c.fim = agora.toISOString();
  }
  const conversa: Conversa = {
    id: randomUUID(),
    inicio: agora.toISOString(),
    falasDoIdoso: 0,
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
  if (conversa.falasDoIdoso > 0) base.idoso.primeiraConversaFeita = true;
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
      if (a.visto !== b.visto) return a.visto ? 1 : -1;
      return b.criadoEm.localeCompare(a.criadoEm);
    })
    .slice(0, 20);

  return {
    assistente: NOME_DA_ASSISTENTE,
    idoso: base.idoso,
    hoje: porData.get(hojeData) ?? diaVazio(hojeData),
    conversouHoje: base.conversas.some(
      (c) => dataEmBrasilia(new Date(c.inicio)) === hojeData,
    ),
    ultimaConversa,
    alertas,
    semana,
    lembrancas: [...base.lembrancas].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
    atualizadoEm: agora.toISOString(),
  };
}

// ---------- Parte que lê e grava o arquivo ----------

function caminhoDaBase(): string {
  return process.env.LIA_DADOS || path.join(/*turbopackIgnore: true*/ process.cwd(), 'dados', 'base.json');
}

async function gravar(base: Base): Promise<void> {
  const destino = caminhoDaBase();
  await fs.mkdir(path.dirname(destino), { recursive: true });
  const provisorio = `${destino}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(provisorio, JSON.stringify(base, null, 2), 'utf8');
  await fs.rename(provisorio, destino);
}

export async function lerBase(): Promise<Base> {
  try {
    return JSON.parse(await fs.readFile(caminhoDaBase(), 'utf8')) as Base;
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code !== 'ENOENT') throw erro;
    const base = baseDeExemplo();
    await gravar(base);
    return base;
  }
}

// Uma fila só pra todas as rotas do servidor, guardada no objeto global porque o
// Next pode carregar este arquivo mais de uma vez no modo de desenvolvimento.
const global = globalThis as typeof globalThis & { __filaDaLia?: Promise<unknown> };

/** Lê, aplica a mudança e grava, uma mudança por vez. */
export function mudarBase<T>(mudanca: (base: Base) => T): Promise<T> {
  const anterior = global.__filaDaLia ?? Promise.resolve();
  const proxima = anterior.then(async () => {
    const base = await lerBase();
    const resultado = mudanca(base);
    await gravar(base);
    return resultado;
  });
  global.__filaDaLia = proxima.catch(() => undefined);
  return proxima;
}
