// Dados de exemplo pra demonstração. A pessoa é inventada. Tudo o que nasce aqui
// leva `exemplo: true`, e o painel da família mostra essa marca.

import { dataEmBrasilia, somarDias } from './assistente';
import type { Base, Dia, Lembranca } from './tipos';

export function baseDeExemplo(agora: Date = new Date()): Base {
  const hoje = dataEmBrasilia(agora);
  const dia = (atras: number, resto: Omit<Dia, 'data' | 'observacoes' | 'exemplo'>): Dia => ({
    data: somarDias(hoje, -atras),
    observacoes: [],
    exemplo: true,
    ...resto,
  });

  const lembranca = (
    id: string,
    categoria: Lembranca['categoria'],
    texto: string,
  ): Lembranca => ({
    id,
    categoria,
    texto,
    criadaEm: agora.toISOString(),
    exemplo: true,
  });

  return {
    idoso: {
      id: 'helena',
      nome: 'Helena',
      tratamento: 'dona Helena',
      idade: 78,
      familiar: { nome: 'Marina', parentesco: 'filha' },
      remedios: [
        { nome: 'remédio da pressão', horario: '8h' },
        { nome: 'remédio do colesterol', horario: '20h' },
      ],
      primeiraConversaFeita: false,
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
      lembranca('ex-1', 'familia', 'A filha Marina mora em Curitiba e liga aos domingos.'),
      lembranca('ex-2', 'familia', 'O neto Pedro tem 9 anos e joga futebol.'),
      lembranca('ex-3', 'gosto', 'Gosta de novela e de cuidar das orquídeas.'),
      lembranca('ex-4', 'saude', 'O joelho direito dói mais quando o tempo esfria.'),
      lembranca('ex-5', 'rotina', 'Faz hidroginástica às terças e quintas de manhã.'),
      lembranca('ex-6', 'compromisso', 'Tem consulta com o cardiologista na quinta-feira.'),
    ],
    alertas: [],
    conversas: [],
  };
}
