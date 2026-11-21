// Dados de exemplo pra demonstração. A pessoa é inventada. Tudo o que nasce aqui
// leva `exemplo: true`, e o painel da família mostra essa marca.

import { dataEmBrasilia, somarDias } from './assistente';
import { dataPedida } from './memoria';
import type { Base, Dia, Lembranca, NovoIdoso } from './tipos';

export function baseDeExemplo(agora: Date = new Date(), idosoId = 'helena'): Base {
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
    alertas: [],
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
