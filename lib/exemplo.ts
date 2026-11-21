// Dados de exemplo pra demonstração. A pessoa é inventada. Tudo o que nasce aqui
// leva `exemplo: true`, e o painel da família mostra essa marca.

import { dataEmBrasilia, somarDias } from './assistente';
import { dataPedida } from './memoria';
import type { Alerta, Base, Dia, Lembranca, NovoIdoso } from './tipos';

function avisoFechadoDeOntem(hoje: string): Alerta {
  const criado = new Date(`${somarDias(hoje, -1)}T15:10:00-03:00`);
  const depois = (minutos: number) => new Date(criado.getTime() + minutos * 60_000).toISOString();
  return {
    id: 'ex-aviso-ontem',
    tipo: 'humor',
    gravidade: 'atencao',
    texto: 'Disse que estava se sentindo sozinha depois do almoço.',
    criadoEm: criado.toISOString(),
    origem: 'assistente',
    visto: true,
    vistoPor: 'Marina',
    vistoEm: depois(4),
    desfecho: { resposta: 'liguei', nota: 'Conversamos meia hora, ficou mais animada.', por: 'Marina', em: depois(11) },
  };
}

/**
 * A dona Helena da demonstração. Com `avisoFechado`, ganha um aviso de ontem que a filha
 * viu e fechou (o botão "Ver com um exemplo" e a página /telas usam assim; os testes não).
 */
export function baseDeExemplo(
  agora: Date = new Date(),
  idosoId = 'helena',
  opcoes: { avisoFechado?: boolean } = {},
): Base {
  const hoje = dataEmBrasilia(agora);
  const dia = (atras: number, resto: Omit<Dia, 'data' | 'observacoes' | 'exemplo'>): Dia => ({
    data: somarDias(hoje, -atras),
    observacoes: [],
    exemplo: true,
    ...resto,
  });

  let numero = 0;
  const lembranca = (
    id: string,
    categoria: Lembranca['categoria'],
    texto: string,
    extra: Partial<Pick<Lembranca, 'sobre' | 'data' | 'hora' | 'reservada' | 'origem'>> = {},
  ): Lembranca => ({
    id,
    numero: (numero += 1),
    categoria,
    texto,
    origem: 'conversa',
    ...extra,
    criadaEm: agora.toISOString(),
    exemplo: true,
  });
  const quinta = dataPedida('quinta', agora) ?? hoje;

  return {
    idoso: {
      id: idosoId,
      nome: 'Helena',
      tratamento: 'dona Helena',
      idade: 78,
      familiar: { nome: 'Marina', parentesco: 'filha' },
      remedios: [
        { nome: 'remédio da pressão', horario: '8h' },
        { nome: 'remédio do colesterol', horario: '20h' },
      ],
      primeiraConversaFeita: false,
      horariosDeLigacao: ['09:00', '19:00'],
      atenderSozinho: false,
    },
    dias: [
      dia(6, { sono: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', dor: 2, humor: 'bem', saiuDeCasa: true, falouComAlguem: true }),
      dia(5, { sono: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', dor: 3, ondeDoi: 'no joelho direito', humor: 'bem', saiuDeCasa: true, falouComAlguem: true }),
      dia(4, { sono: 'mais_ou_menos', alimentacao: 'comeu_pouco', remedio: 'tomou', dor: 5, ondeDoi: 'no joelho direito', humor: 'sozinho', saiuDeCasa: false, falouComAlguem: false }),
      dia(3, { sono: 'mal', alimentacao: 'comeu_pouco', remedio: 'nao_tomou', dor: 6, ondeDoi: 'no joelho direito', humor: 'triste', saiuDeCasa: false, falouComAlguem: true }),
      dia(2, { sono: 'mais_ou_menos', alimentacao: 'comeu_bem', remedio: 'tomou', dor: 4, ondeDoi: 'no joelho direito', humor: 'bem', saiuDeCasa: true, falouComAlguem: true }),
      dia(1, { sono: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', dor: 3, ondeDoi: 'no joelho direito', humor: 'bem', saiuDeCasa: true, falouComAlguem: true }),
    ],
    lembrancas: [
      lembranca('ex-1', 'pessoa', 'A filha Marina mora em Curitiba e liga aos domingos.', { sobre: 'Marina' }),
      lembranca('ex-2', 'pessoa', 'O neto Pedro tem 9 anos e joga futebol.', { sobre: 'Pedro' }),
      lembranca('ex-3', 'pessoa', 'A vizinha Zefa tem a chave da casa.', { sobre: 'Zefa' }),
      lembranca('ex-4', 'saude', 'Disse que o joelho direito dói mais quando o tempo esfria.'),
      lembranca('ex-5', 'dificuldade', 'Ouve mal do lado esquerdo.'),
      lembranca('ex-6', 'rotina', 'Faz hidroginástica às terças e quintas de manhã.'),
      lembranca('ex-7', 'gosto', 'Gosta de novela e de cuidar das orquídeas.'),
      lembranca('ex-8', 'historia', 'Foi costureira por 30 anos em Ribeirão Preto.'),
      lembranca('ex-9', 'humor', 'Domingo é o dia mais difícil desde que o marido morreu.'),
      lembranca('ex-10', 'compromisso', 'Consulta com o cardiologista, o doutor Renato.', { data: quinta, hora: '14:00', origem: 'familia' }),
      lembranca('ex-11', 'compromisso', 'Aniversário de 10 anos do neto Pedro.', { sobre: 'Pedro', data: somarDias(hoje, 5) }),
      lembranca('ex-12', 'humor', 'Anda preocupada com o aluguel e não quer que a filha saiba.', { reservada: true }),
    ],
    // Um aviso de ontem que a filha viu e fechou, pra mostrar quem cuidou e como terminou.
    alertas: opcoes.avisoFechado ? [avisoFechadoDeOntem(hoje)] : [],
    conversas: [],
    chamadas: [],
  };
}

/** Ficha em branco de um idoso que a família acabou de cadastrar. */
export function baseNova(idosoId: string, novo: NovoIdoso): Base {
  return {
    idoso: {
      id: idosoId,
      nome: novo.nome,
      tratamento: novo.tratamento,
      idade: novo.idade,
      familiar: novo.familiar,
      remedios: novo.remedios,
      primeiraConversaFeita: false,
      horariosDeLigacao: novo.horariosDeLigacao,
      atenderSozinho: false,
    },
    dias: [],
    lembrancas: [],
    alertas: [],
    conversas: [],
    chamadas: [],
  };
}

// ---------- Residencial de exemplo (oito moradores inventados) ----------

type DiaDeExemplo = Omit<Dia, 'data' | 'observacoes' | 'exemplo'>;

interface MoradorDeExemplo {
  nome: string;
  tratamento: string;
  idade: number;
  familiar: { nome: string; parentesco: string };
  remedios: { nome: string; horario: string }[];
  /** A conversa de hoje: hora no horário de Brasília e duração em minutos. */
  conversaDeHoje?: { hora: string; minutos: number; resumo: string };
  hoje?: DiaDeExemplo;
  aviso?: { tipo: Alerta['tipo']; gravidade: Alerta['gravidade']; texto: string };
  /** Aviso de hoje que a equipe já viu e fechou, pra mostrar quem cuidou e como terminou. */
  avisoFechado?: {
    tipo: Alerta['tipo'];
    gravidade: Alerta['gravidade'];
    texto: string;
    minutosAteVer: number;
    por: string;
    resposta: NonNullable<Alerta['desfecho']>['resposta'];
    nota?: string;
  };
  /** Sem conversa hoje: as duas ligações das 9h tocaram e ninguém atendeu. */
  naoAtendeu?: boolean;
  /** Ligação marcada pra daqui a pouco, ainda sem conversa. */
  ligacaoMaisTarde?: boolean;
  semana: DiaDeExemplo[];
  lembrancas: [Lembranca['categoria'], string][];
}

const MORADORES: MoradorDeExemplo[] = [
  {
    nome: 'Jorge', tratamento: 'seu Jorge', idade: 84,
    familiar: { nome: 'Carlos', parentesco: 'filho' },
    remedios: [{ nome: 'remédio da pressão', horario: '8h' }],
    conversaDeHoje: { hora: '09:05', minutos: 6, resumo: 'Seu Jorge contou que caiu no banheiro de manhã e que o quadril dói. Dormiu mal.' },
    hoje: { sono: 'mal', dor: 7, ondeDoi: 'no quadril', humor: 'ansioso', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
    aviso: { tipo: 'emergencia', gravidade: 'urgente', texto: 'Disse que caiu no banheiro de manhã e que o quadril dói.' },
    semana: [
      { sono: 'bem', dor: 2, humor: 'bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', dor: 3, humor: 'bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'mais_ou_menos', dor: 3, humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'bem', dor: 2, humor: 'bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'mais_ou_menos', dor: 4, humor: 'irritado', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: false },
      { sono: 'bem', dor: 3, humor: 'bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
    ],
    lembrancas: [['historia', 'Foi motorista de ônibus por 35 anos.'], ['pessoa', 'O filho Carlos visita aos sábados.'], ['gosto', 'Gosta de futebol e torce pro Palmeiras.']],
  },
  {
    nome: 'Cida', tratamento: 'dona Cida', idade: 79,
    familiar: { nome: 'Renata', parentesco: 'filha' },
    remedios: [{ nome: 'remédio da diabetes', horario: '7h' }],
    conversaDeHoje: { hora: '10:20', minutos: 4, resumo: 'Dona Cida contou que ligaram pedindo um Pix em nome do neto. Ficou nervosa.' },
    hoje: { sono: 'mais_ou_menos', humor: 'ansioso', remedio: 'tomou', alimentacao: 'comeu_bem', saiuDeCasa: false, falouComAlguem: true },
    aviso: { tipo: 'golpe', gravidade: 'urgente', texto: 'Contou que ligaram pedindo um Pix em nome do neto.' },
    semana: [
      { sono: 'bem', humor: 'bem', remedio: 'tomou', alimentacao: 'comeu_bem', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', remedio: 'tomou', alimentacao: 'comeu_bem', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', remedio: 'nao_confirmou', alimentacao: 'comeu_bem', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'mais_ou_menos', humor: 'bem', remedio: 'tomou', alimentacao: 'comeu_pouco', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', remedio: 'tomou', alimentacao: 'comeu_bem', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', remedio: 'tomou', alimentacao: 'comeu_bem', saiuDeCasa: true, falouComAlguem: true },
    ],
    lembrancas: [['pessoa', 'O neto Lucas mora em Belo Horizonte.'], ['rotina', 'Reza o terço todo fim de tarde.']],
  },
  {
    nome: 'Osvaldo', tratamento: 'seu Osvaldo', idade: 88,
    familiar: { nome: 'Sônia', parentesco: 'filha' },
    remedios: [{ nome: 'remédio do coração', horario: '8h' }],
    naoAtendeu: true,
    aviso: { tipo: 'ligacao', gravidade: 'atencao', texto: 'Não atendeu as duas ligações das 9h.' },
    semana: [
      { sono: 'bem', humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'mais_ou_menos', humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'bem', humor: 'sozinho', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: false },
      { sono: 'bem', humor: 'bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'mais_ou_menos', humor: 'bem', remedio: 'nao_confirmou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
    ],
    lembrancas: [['dificuldade', 'Ouve mal e prefere que falem devagar.'], ['historia', 'Foi marceneiro e ainda conserta cadeira.']],
  },
  {
    nome: 'Lurdes', tratamento: 'dona Lurdes', idade: 81,
    familiar: { nome: 'Patrícia', parentesco: 'filha' },
    remedios: [{ nome: 'remédio da tireoide', horario: '6h' }],
    conversaDeHoje: { hora: '09:40', minutos: 11, resumo: 'Dona Lurdes disse que se sente sozinha desde que a filha viajou. Comeu pouco no almoço.' },
    hoje: { sono: 'mais_ou_menos', humor: 'sozinho', alimentacao: 'comeu_pouco', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: false },
    aviso: { tipo: 'humor', gravidade: 'atencao', texto: 'Disse que se sente sozinha desde que a filha viajou.' },
    semana: [
      { sono: 'bem', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'mais_ou_menos', humor: 'sozinho', alimentacao: 'comeu_pouco', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: false },
      { sono: 'mais_ou_menos', humor: 'triste', alimentacao: 'comeu_pouco', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'bem', humor: 'sozinho', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: false },
      { sono: 'mais_ou_menos', humor: 'sozinho', alimentacao: 'comeu_pouco', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
    ],
    lembrancas: [['pessoa', 'A filha Patrícia viajou pra Portugal por um mês.'], ['gosto', 'Gosta de fazer crochê e de ouvir Roberto Carlos.']],
  },
  {
    nome: 'Neide', tratamento: 'dona Neide', idade: 76,
    familiar: { nome: 'Rafael', parentesco: 'neto' },
    remedios: [{ nome: 'remédio da pressão', horario: '8h' }],
    conversaDeHoje: { hora: '09:15', minutos: 8, resumo: 'Dona Neide passou bem a noite, foi à feira e o joelho dói pouco.' },
    avisoFechado: {
      tipo: 'saude', gravidade: 'atencao', texto: 'Disse que tropeçou no corredor e ralou o joelho.',
      minutosAteVer: 3, por: 'Ana', resposta: 'fui_la', nota: 'Fizemos o curativo, está bem.',
    },
    hoje: { sono: 'bem', dor: 3, ondeDoi: 'no joelho', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
    semana: [
      { sono: 'bem', dor: 3, humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', dor: 2, humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', dor: 4, humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'mais_ou_menos', dor: 3, humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'bem', dor: 3, humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', dor: 2, humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
    ],
    lembrancas: [['rotina', 'Vai à feira toda quarta e todo domingo.'], ['saude', 'O joelho dói mais quando sobe escada.']],
  },
  {
    nome: 'Antônio', tratamento: 'seu Antônio', idade: 82,
    familiar: { nome: 'Juliana', parentesco: 'filha' },
    remedios: [{ nome: 'remédio do colesterol', horario: '20h' }],
    conversaDeHoje: { hora: '09:30', minutos: 5, resumo: 'Seu Antônio dormiu bem e jogou dominó com os amigos.' },
    hoje: { sono: 'bem', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
    semana: [
      { sono: 'bem', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'mais_ou_menos', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'irritado', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', alimentacao: 'comeu_bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
    ],
    lembrancas: [['gosto', 'Joga dominó com os amigos na praça.'], ['historia', 'Nasceu em Minas e veio pra cidade com 18 anos.']],
  },
  {
    nome: 'Zilda', tratamento: 'dona Zilda', idade: 90,
    familiar: { nome: 'Márcia', parentesco: 'filha' },
    remedios: [{ nome: 'remédio da pressão', horario: '8h' }],
    ligacaoMaisTarde: true,
    semana: [
      { sono: 'bem', humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'mais_ou_menos', humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', remedio: 'tomou', saiuDeCasa: true, falouComAlguem: true },
      { sono: 'bem', humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
      { sono: 'mais_ou_menos', humor: 'bem', remedio: 'tomou', saiuDeCasa: false, falouComAlguem: true },
    ],
    lembrancas: [['historia', 'Teve sete filhos e tem quinze netos.'], ['gosto', 'Gosta de conversar sobre receitas.']],
  },
];

/** Instante de hoje, em Brasília, naquela hora. Se a hora ainda não chegou, usa um pouco antes de agora. */
function horaDeHoje(hora: string, agora: Date, recuoEmMinutos: number): Date {
  const instante = new Date(`${dataEmBrasilia(agora)}T${hora}:00-03:00`);
  return instante.getTime() < agora.getTime() - 60_000
    ? instante
    : new Date(agora.getTime() - recuoEmMinutos * 60_000);
}

function maisMinutos(quando: Date, minutos: number): string {
  return new Date(quando.getTime() + minutos * 60_000).toISOString();
}

/** A ficha de um morador do residencial de exemplo, com o estado de hoje e seis dias antes. */
function baseDoMorador(m: MoradorDeExemplo, idosoId: string, agora: Date, ordem: number): Base {
  const hoje = dataEmBrasilia(agora);
  const dia = (atras: number, resto: DiaDeExemplo): Dia => ({
    data: somarDias(hoje, -atras),
    observacoes: [],
    exemplo: true,
    ...resto,
  });
  // A ligação marcada fica na próxima hora cheia, pra continuar "marcada" na hora da demonstração.
  const horaMarcada = m.ligacaoMaisTarde
    ? `${String((Number(horaMinutoDe(agora).slice(0, 2)) + 1) % 24).padStart(2, '0')}:00`
    : '09:00';

  const base: Base = {
    idoso: {
      id: idosoId,
      nome: m.nome,
      tratamento: m.tratamento,
      idade: m.idade,
      familiar: m.familiar,
      remedios: m.remedios,
      primeiraConversaFeita: true,
      horariosDeLigacao: [horaMarcada],
      atenderSozinho: false,
    },
    dias: [...m.semana.map((d, i) => dia(6 - i, d)), ...(m.hoje ? [dia(0, m.hoje)] : [])],
    lembrancas: m.lembrancas.map(([categoria, texto], i) => ({
      id: `ex-${i + 1}`,
      numero: i + 1,
      categoria,
      texto,
      origem: 'conversa',
      criadaEm: agora.toISOString(),
      exemplo: true,
    })),
    alertas: [],
    conversas: [],
    chamadas: [],
  };

  // Ontem todo mundo conversou, pra "última conversa" nunca vir vazia.
  const ontem = new Date(new Date(`${somarDias(hoje, -1)}T09:10:00-03:00`).getTime() + ordem * 7 * 60_000);
  base.conversas.push({ id: `ex-ontem`, inicio: ontem.toISOString(), fim: maisMinutos(ontem, 6), falasDoIdoso: 9, resumo: `${m.tratamento[0].toUpperCase()}${m.tratamento.slice(1)} conversou bem ontem.` });

  let quandoDoAviso = agora;
  if (m.conversaDeHoje) {
    const inicio = horaDeHoje(m.conversaDeHoje.hora, agora, 30 + ordem * 9);
    base.chamadas.push({ id: 'ex-chamada', motivo: 'horario', horario: '09:00', tentativa: 1, estado: 'atendida', pedidaEm: maisMinutos(inicio, -1), resolvidaEm: inicio.toISOString() });
    base.conversas.push({
      id: 'ex-hoje',
      inicio: inicio.toISOString(),
      fim: maisMinutos(inicio, m.conversaDeHoje.minutos),
      falasDoIdoso: 6 + m.conversaDeHoje.minutos,
      chamadaId: 'ex-chamada',
      resumo: m.conversaDeHoje.resumo,
    });
    quandoDoAviso = new Date(maisMinutos(inicio, Math.max(1, m.conversaDeHoje.minutos - 2)));
  }
  if (m.naoAtendeu) {
    const primeira = horaDeHoje('09:00', agora, 20);
    base.chamadas.push(
      { id: 'ex-chamada-1', motivo: 'horario', horario: '09:00', tentativa: 1, estado: 'perdida', pedidaEm: primeira.toISOString(), resolvidaEm: maisMinutos(primeira, 1) },
      { id: 'ex-chamada-2', motivo: 'horario', horario: '09:00', tentativa: 2, estado: 'perdida', pedidaEm: maisMinutos(primeira, 4), resolvidaEm: maisMinutos(primeira, 5) },
    );
    quandoDoAviso = new Date(maisMinutos(primeira, 5));
  }
  if (m.aviso) {
    base.alertas.push({ id: 'ex-aviso', ...m.aviso, criadoEm: quandoDoAviso.toISOString(), origem: 'assistente', visto: false });
  }
  if (m.avisoFechado) {
    const { minutosAteVer, por, resposta, nota, ...aviso } = m.avisoFechado;
    base.alertas.push({
      id: 'ex-aviso-fechado',
      ...aviso,
      criadoEm: quandoDoAviso.toISOString(),
      origem: 'assistente',
      visto: true,
      vistoPor: por,
      vistoEm: maisMinutos(quandoDoAviso, minutosAteVer),
      desfecho: { resposta, nota, por, em: maisMinutos(quandoDoAviso, minutosAteVer + 6) },
    });
  }
  return base;
}

function horaMinutoDe(agora: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(agora);
}

/**
 * Os oito moradores do residencial de exemplo: nome pra tabela e a ficha montada
 * com o id que o banco der. A dona Helena é a mesma do exemplo da família.
 */
export function residencialDeExemplo(agora: Date = new Date()): { nome: string; ficha: (idosoId: string) => Base }[] {
  const moradores = MORADORES.map((m, ordem) => ({ nome: m.nome, ficha: (id: string) => baseDoMorador(m, id, agora, ordem) }));
  // A dona Helena entra em quinto, como na lista da tela.
  moradores.splice(4, 0, { nome: 'Helena', ficha: (id: string) => baseDeExemplo(agora, id) });
  return moradores;
}
