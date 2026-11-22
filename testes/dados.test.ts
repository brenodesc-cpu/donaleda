import { describe, expect, it } from 'vitest';
import {
  abrirConversa,
  aplicarBemEstar,
  criarAlerta,
  fecharConversa,
  guardarLembranca,
  montarPainel,
  oQueFaltaSaber,
} from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import { montarInstrucoes, montarSaudacao } from '@/lib/persona';

// 21/11/2026 às 10h de Brasília.
const AGORA = new Date('2026-11-21T13:00:00.000Z');

describe('ficha do dia', () => {
  it('junta respostas de momentos diferentes no mesmo dia', () => {
    const base = baseDeExemplo(AGORA);
    aplicarBemEstar(base, { sono: 'bem' }, AGORA);
    const { dia } = aplicarBemEstar(base, { alimentacao: 'comeu_pouco', dor: 4, ondeDoi: 'no joelho' }, AGORA);
    expect(dia.data).toBe('2026-11-21');
    expect(dia.sono).toBe('bem');
    expect(dia.alimentacao).toBe('comeu_pouco');
    expect(dia.dor).toBe(4);
    expect(oQueFaltaSaber(dia)).toEqual(['se tomou o remédio', 'como está se sentindo']);
  });

  it('usa a data de Brasília, e não a do servidor', () => {
    const base = baseDeExemplo(AGORA);
    // 01h de 22/11 em UTC ainda é 22h de 21/11 em Brasília.
    const { dia } = aplicarBemEstar(base, { sono: 'mal' }, new Date('2026-11-22T01:00:00.000Z'));
    expect(dia.data).toBe('2026-11-21');
  });

  it('remédio não tomado avisa a família, uma vez só no dia', () => {
    const base = baseDeExemplo(AGORA);
    const primeira = aplicarBemEstar(base, { remedio: 'nao_tomou' }, AGORA);
    aplicarBemEstar(base, { remedio: 'nao_tomou' }, new Date(AGORA.getTime() + 5 * 60_000));
    expect(primeira.alertas).toHaveLength(1);
    expect(base.alertas.filter((a) => a.tipo === 'remedio')).toHaveLength(1);
  });

  it('remédio tomado não gera aviso', () => {
    const base = baseDeExemplo(AGORA);
    expect(aplicarBemEstar(base, { remedio: 'tomou' }, AGORA).alertas).toHaveLength(0);
  });

  it('dor de 7 pra cima avisa a família e a nota fica entre 0 e 10', () => {
    const base = baseDeExemplo(AGORA);
    const { dia, alertas } = aplicarBemEstar(base, { dor: 14, ondeDoi: 'nas costas' }, AGORA);
    expect(dia.dor).toBe(10);
    expect(alertas[0]?.tipo).toBe('saude');
  });
});

describe('painel da família', () => {
  it('traz sete dias terminando hoje, com o dia vazio quando não houve conversa', () => {
    const painel = montarPainel(baseDeExemplo(AGORA), AGORA);
    expect(painel.semana).toHaveLength(7);
    expect(painel.semana[6].data).toBe('2026-11-21');
    expect(painel.semana[0].data).toBe('2026-11-15');
    expect(painel.hoje.sono).toBeUndefined();
    expect(painel.conversouHoje).toBe(false);
    expect(painel.ultimaConversa).toBeNull();
  });

  it('mostra a conversa em andamento e depois a duração', () => {
    const base = baseDeExemplo(AGORA);
    const conversa = abrirConversa(base, AGORA);
    expect(montarPainel(base, AGORA).ultimaConversa?.emAndamento).toBe(true);
    conversa.falasDoIdoso = 3;
    fecharConversa(base, conversa.id, new Date(AGORA.getTime() + 6 * 60_000));
    const painel = montarPainel(base, new Date(AGORA.getTime() + 7 * 60_000));
    expect(painel.ultimaConversa?.minutos).toBe(6);
    expect(painel.conversouHoje).toBe(true);
    expect(base.idoso.primeiraConversaFeita).toBe(true);
  });

  it('põe os avisos não vistos na frente', () => {
    const base = baseDeExemplo(AGORA);
    const visto = criarAlerta(base, { tipo: 'saude', gravidade: 'atencao', texto: 'A', origem: 'assistente' }, AGORA);
    visto.visto = true;
    criarAlerta(base, { tipo: 'golpe', gravidade: 'atencao', texto: 'B', origem: 'assistente' }, AGORA);
    expect(montarPainel(base, AGORA).alertas.map((a) => a.texto)).toEqual(['B', 'A']);
  });

  it('não guarda a mesma lembrança duas vezes', () => {
    const base = baseDeExemplo(AGORA);
    const antes = base.lembrancas.length;
    guardarLembranca(base, 'Gosta de bolo de fubá.', 'gosto', AGORA);
    guardarLembranca(base, 'gosta de bolo de fubá.', 'gosto', AGORA);
    expect(base.lembrancas).toHaveLength(antes + 1);
  });
});

describe('o que a assistente fala', () => {
  it('na primeira conversa se apresenta como assistente virtual e diz quem pediu', () => {
    const saudacao = montarSaudacao(baseDeExemplo(AGORA), AGORA);
    expect(saudacao).toContain('Bom dia, dona Helena');
    expect(saudacao).toContain(
      'Aqui é a Dona Leda, a assistente virtual que a sua filha Marina contratou pra conversar com a senhora todo dia.',
    );
  });

  it('nas outras conversas continua dizendo que é assistente virtual', () => {
    const base = baseDeExemplo(AGORA);
    base.idoso.primeiraConversaFeita = true;
    expect(montarSaudacao(base, AGORA)).toContain('assistente virtual');
  });

  it('as instruções levam a data certa, os limites e o que falta saber', () => {
    const base = baseDeExemplo(AGORA);
    aplicarBemEstar(base, { sono: 'bem' }, AGORA);
    const instrucoes = montarInstrucoes(base, AGORA, true);
    expect(instrucoes).toContain('21 de novembro de 2026');
    expect(instrucoes).toContain('um nove dois');
    expect(instrucoes).toContain('nunca pede dinheiro');
    expect(instrucoes).toContain('Hoje você já sabe: dormiu bem.');
    expect(instrucoes).toContain('registrar_bem_estar');
    expect(instrucoes).not.toContain('como dormiu, se comeu, se tomou o remédio, se sente dor, como está se sentindo.');
  });

  it('sem as ações, não promete avisar a família', () => {
    const instrucoes = montarInstrucoes(baseDeExemplo(AGORA), AGORA, false);
    expect(instrucoes).not.toContain('registrar_bem_estar');
    expect(instrucoes).toContain('Não prometa avisar a família');
  });

  it('classifica os horários de remédios pela hora atual de Brasília e prioriza mal-estar sobre roteiro', async () => {
    const { resumirRemediosNoHorario } = await import('@/lib/persona');
    // 21/11/2026 às 16:30 de Brasília (19:30 UTC).
    const tarde = new Date('2026-11-21T19:30:00.000Z');
    const resumo = resumirRemediosNoHorario(
      [
        { nome: 'Metformina', horario: '08:00' },
        { nome: 'Insulina', horario: '17:00' },
        { nome: 'Losartana', horario: '20:00' },
      ],
      tarde,
    );
    expect(resumo).toContain('Horário já passou hoje');
    expect(resumo).toContain('Metformina às 08:00');
    expect(resumo).toContain('Está na hora ou chegando agora');
    expect(resumo).toContain('Insulina às 17:00');
    expect(resumo).toContain('Só mais tarde hoje');
    expect(resumo).toContain('Losartana às 20:00');

    const instrucoes = montarInstrucoes(baseDeExemplo(tarde), tarde, true);
    expect(instrucoes).toContain('Prioridade absoluta: mal-estar e saúde vêm antes do roteiro');
    expect(instrucoes).toContain('PARE IMEDIATAMENTE o roteiro do dia');
    expect(instrucoes).toContain('hipoglicemia');
  });

  it('adapta a saudação e o roteiro ao período do dia (madrugada, manhã e noite com pendências)', async () => {
    const { montarRoteiroDoMomento, periodoDoDia } = await import('@/lib/persona');

    // 21/11/2026 02:30 Brasília (05:30 UTC) = madrugada
    const madrugada = new Date('2026-11-21T05:30:00.000Z');
    const baseMadrugada = baseDeExemplo(madrugada);
    baseMadrugada.idoso.primeiraConversaFeita = true;
    expect(periodoDoDia(madrugada)).toBe('madrugada');
    const oiMadrugada = montarSaudacao(baseMadrugada, madrugada, 'idoso');
    expect(oiMadrugada).toContain('madrugada');
    expect(oiMadrugada).not.toContain('Boa noite');
    expect(montarRoteiroDoMomento(baseMadrugada, madrugada)).toContain('MADRUGADA');

    // 21/11/2026 08:30 Brasília (11:30 UTC) = manhã com compromisso hoje
    const manha = new Date('2026-11-21T11:30:00.000Z');
    const baseManha = baseDeExemplo(manha);
    baseManha.lembrancas.push({
      id: 'comp-hoje',
      numero: 99,
      texto: 'Consulta no cardiologista',
      categoria: 'compromisso',
      data: '2026-11-21',
      hora: '14:00',
      origem: 'familia',
      criadaEm: manha.toISOString(),
    });
    const roteiroManha = montarRoteiroDoMomento(baseManha, manha);
    expect(roteiroManha).toContain('MANHÃ');
    expect(roteiroManha).toContain('Compromisso previsto pra HOJE às 14:00');
    expect(roteiroManha).toContain('Consulta no cardiologista');

    // 21/11/2026 20:00 Brasília (23:00 UTC) = noite cobrando pendências do dia + continuidade
    const noite = new Date('2026-11-21T23:00:00.000Z');
    const baseNoite = baseDeExemplo(noite);
    baseNoite.idoso.remedios = [{ nome: 'Metformina', horario: '08:00' }];
    baseNoite.dias = [];
    baseNoite.lembrancas.push({
      id: 'comp-passou',
      numero: 100,
      texto: 'Exame de sangue no posto',
      categoria: 'compromisso',
      data: '2026-11-21',
      hora: '09:00',
      origem: 'familia',
      criadaEm: manha.toISOString(),
    });
    baseNoite.alertas.push({
      id: 'alerta-hoje',
      tipo: 'saude',
      gravidade: 'atencao',
      texto: 'Relatou tontura leve após o almoço.',
      criadoEm: '2026-11-21T17:00:00.000Z',
      origem: 'assistente',
      visto: false,
    });
    baseNoite.conversas.push({
      id: 'conv-manha',
      inicio: '2026-11-21T12:00:00.000Z',
      fim: '2026-11-21T12:06:00.000Z',
      falasDoIdoso: 5,
      resumo: 'Contou que ia fazer exame de sangue e almoçar sopa.',
    });
    const roteiroNoite = montarRoteiroDoMomento(baseNoite, noite);
    expect(roteiroNoite).toContain('NOITE');
    expect(roteiroNoite).toContain('Compromisso de hoje que JÁ PASSOU (09:00)');
    expect(roteiroNoite).toContain('Pendente hoje (ainda não confirmou remédio): pergunte pelo nome se tomou Metformina (08:00)');
    expect(roteiroNoite).toContain('Relatou tontura leve após o almoço');
    expect(roteiroNoite).toContain('Contou que ia fazer exame de sangue e almoçar sopa');
  });
});

describe('quem contratou, com o artigo certo', () => {
  it('acerta o feminino e o masculino do parentesco', async () => {
    const { quemContratou } = await import('@/lib/persona');
    expect(quemContratou({ nome: 'Marina', parentesco: 'filha' })).toBe('a sua filha Marina');
    expect(quemContratou({ nome: 'Paulo', parentesco: 'filho' })).toBe('o seu filho Paulo');
    expect(quemContratou({ nome: 'Rosa', parentesco: 'mãe' })).toBe('a sua mãe Rosa');
    expect(quemContratou({ nome: 'Ana', parentesco: 'cuidadora' })).toBe('a sua cuidadora Ana');
  });
});

describe('aviso repetido (verificador, 21/11)', () => {
  it('o mesmo aviso volta depois de meia hora, pra ensaio não esconder o aviso do palco', () => {
    const base = baseDeExemplo(AGORA);
    const novo = { tipo: 'emergencia' as const, gravidade: 'urgente' as const, texto: 'Pode ser uma emergência: "Eu caí".', origem: 'regra' as const };
    const primeiro = criarAlerta(base, novo, AGORA);
    const duasHorasDepois = criarAlerta(base, novo, new Date(AGORA.getTime() + 2 * 60 * 60_000));
    expect(duasHorasDepois.id).not.toBe(primeiro.id);
    expect(base.alertas.filter((a) => a.tipo === 'emergencia')).toHaveLength(2);
  });
});

describe('leitura de QR Code de pareamento', () => {
  it('extrai os 6 dígitos tanto do link completo quanto de código puro e rejeita lixo', async () => {
    const { extrairCodigoDeTexto } = await import('@/components/Parear');
    expect(extrairCodigoDeTexto('https://donaleda.vercel.app/parear?codigo=482910')).toBe('482910');
    expect(extrairCodigoDeTexto('/parear?codigo=123456')).toBe('123456');
    expect(extrairCodigoDeTexto('987 654')).toBe('987654');
    expect(extrairCodigoDeTexto('https://exemplo.com/sem-codigo')).toBeNull();
    expect(extrairCodigoDeTexto('12345')).toBeNull();
  });
});

describe('gestão de exames, calendário de longo prazo e escalonamento em massa', () => {
  it('remove CPF/RG dos textos de exames e injeta documentos no prompt sem diagnóstico', async () => {
    const { limparDadosSensiveis } = await import('@/lib/documentos');
    const { adicionarDocumento, apagarDocumento } = await import('@/lib/dados');

    expect(limparDadosSensiveis('Paciente CPF 123.456.789-00 glicemia 110')).toBe(
      'Paciente [documento oculto] glicemia 110',
    );

    const base = baseDeExemplo(AGORA);
    const doc = adicionarDocumento(
      base,
      {
        titulo: 'Exame de sangue — Glicemia',
        tipo: 'exame',
        data: '2026-11-20',
        resumoSimples: 'O exame mediu a taxa de açúcar no sangue. O médico vai avaliar o resultado.',
        orientacao: 'Levar na próxima consulta',
      },
      AGORA,
    );
    const instrucoes = montarInstrucoes(base, AGORA, true);
    expect(instrucoes).toContain('Exames, consultas e receitas anexados pela família');
    expect(instrucoes).toContain('Exame de sangue — Glicemia');
    expect(instrucoes).toContain('NUNCA dê diagnóstico médico');

    expect(apagarDocumento(base, doc.id)).toBe(true);
    expect(base.documentos).toHaveLength(0);
  });

  it('lembra compromissos da semana e consultas marcadas meses à frente', async () => {
    const { montarRoteiroDoMomento } = await import('@/lib/persona');
    const hoje = new Date('2026-11-21T12:00:00.000Z');
    const base = baseDeExemplo(hoje);
    base.lembrancas.push(
      {
        id: 'semana',
        numero: 201,
        texto: 'Cardiologista no posto',
        categoria: 'compromisso',
        data: '2026-11-25',
        hora: '10:00',
        origem: 'familia',
        criadaEm: hoje.toISOString(),
      },
      {
        id: 'meses',
        numero: 202,
        texto: 'Retorno no oftalmologista',
        categoria: 'compromisso',
        data: '2027-02-14',
        hora: '09:30',
        origem: 'familia',
        criadaEm: hoje.toISOString(),
      },
    );
    const roteiro = montarRoteiroDoMomento(base, hoje);
    expect(roteiro).toContain('Compromisso NESTA SEMANA');
    expect(roteiro).toContain('Cardiologista no posto');
    expect(roteiro).toContain('Agendado mais à frente');
    expect(roteiro).toContain('Retorno no oftalmologista');
  });

  it('normaliza telefones da rede de apoio e registra escalonamento em massa após 3 tentativas', async () => {
    const { definirRedeDeApoio } = await import('@/lib/dados');
    const { dispararEscalonamentoEmMassa } = await import('@/lib/sinalizacaoChamada');

    const base = baseDeExemplo(AGORA);
    const rede = definirRedeDeApoio(base, [
      { nome: 'Marina', parentesco: 'filha', telefone: '(11) 99999-1234' },
      { nome: 'Paulo', parentesco: 'filho', telefone: '11988887777' },
      { nome: 'Invalido', parentesco: 'amigo', telefone: '123' },
    ]);
    expect(rede).toHaveLength(2);
    expect(rede[0].telefone).toBe('+5511999991234');
    expect(rede[1].telefone).toBe('+5511988887777');

    const esc = await dispararEscalonamentoEmMassa(
      base.idoso.id,
      base,
      {
        id: 'ch-3',
        motivo: 'horario',
        horario: '09:00',
        tentativa: 3,
        estado: 'perdida',
        pedidaEm: AGORA.toISOString(),
      },
      AGORA,
    );
    expect(esc.contatosAcionados).toHaveLength(2);
    expect(esc.motivo).toContain('3 tentativas');

    const { registrarEscalonamento } = await import('@/lib/dados');
    registrarEscalonamento(base, esc);
    registrarEscalonamento(base, esc);
    expect(base.escalonamentos).toHaveLength(1);
  });

  it('valida magic bytes reais de foto/PDF e bloqueia arquivo mascarado', async () => {
    const { detectarMimeReal, mimeAceito } = await import('@/lib/documentos');

    expect(mimeAceito('image/jpg')).toBe(true);
    expect(detectarMimeReal(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('image/jpeg');
    expect(detectarMimeReal(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toBe('image/png');
    expect(detectarMimeReal(Buffer.from('RIFF\x00\x00\x00\x00WEBP', 'latin1'))).toBe('image/webp');
    expect(detectarMimeReal(Buffer.from('%PDF-1.7\n1 0 obj', 'ascii'))).toBe('application/pdf');
    expect(detectarMimeReal(Buffer.from('<script>alert(1)</script>', 'utf8'))).toBeNull();
  });

  it('registra token de push do celular da família (Android e iOS) sem duplicar e expõe no painel', async () => {
    const { registrarAparelhoFamiliaPush } = await import('@/lib/dados');
    const base = baseDeExemplo(AGORA);
    expect(montarPainel(base, AGORA).notificacoesFamiliaAtivas).toBe(false);

    expect(registrarAparelhoFamiliaPush(base, 'android', 'curto')).toBe(false);
    expect(registrarAparelhoFamiliaPush(base, 'android', 'fcm-token-android-familia-123456', AGORA)).toBe(true);
    expect(registrarAparelhoFamiliaPush(base, 'android', 'fcm-token-android-familia-123456', AGORA)).toBe(true);
    expect(registrarAparelhoFamiliaPush(base, 'ios', 'apns-token-ios-familia-abcdef123456', AGORA)).toBe(true);

    expect(base.aparelhosFamiliaPush).toHaveLength(2);
    expect(montarPainel(base, AGORA).notificacoesFamiliaAtivas).toBe(true);
  });
});
