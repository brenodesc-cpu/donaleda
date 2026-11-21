import { beforeAll, describe, expect, it } from 'vitest';
import type { Base } from '@/lib/tipos';

// As ações da assistente, chamadas do jeito que a nuvem da Agora chama.

const IDOSO = 'idoso-de-teste';
const OUTRO = 'outro-idoso';

let POST: (request: Request) => Promise<Response>;
let chave: string;
let lerBase: (idosoId: string) => Promise<Base>;

beforeAll(async () => {
  process.env.LIA_DADOS = 'memoria';
  process.env.NEXT_AGORA_APP_CERTIFICATE = 'certificado-de-teste';
  ({ POST } = await import('@/app/api/mcp/route'));
  chave = (await import('@/lib/servidor')).chaveDasFerramentas(IDOSO) ?? '';
  const dados = await import('@/lib/dados');
  lerBase = dados.lerBase;
  const { baseDeExemplo } = await import('@/lib/exemplo');
  await dados.criarFicha(IDOSO, baseDeExemplo(new Date(), IDOSO));
  await dados.criarFicha(OUTRO, baseDeExemplo(new Date(), OUTRO));
});

function pedido(corpo: unknown, comChave = true, idoso = IDOSO): Request {
  return new Request(`http://localhost/api/mcp?idoso=${idoso}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(comChave ? { Authorization: `Bearer ${chave}` } : {}),
    },
    body: JSON.stringify(corpo),
  });
}

const base = (): Promise<Base> => lerBase(IDOSO);

describe('ações da assistente (/api/mcp)', () => {
  it('recusa quem não tem a chave', async () => {
    const resposta = await POST(pedido({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, false));
    expect(resposta.status).toBe(401);
  });

  it('a chave de um idoso não abre a ficha de outro', async () => {
    const resposta = await POST(pedido({ jsonrpc: '2.0', id: 1, method: 'ping' }, true, OUTRO));
    expect(resposta.status).toBe(401);
  });

  it('aceita a chave pelo endereço também', async () => {
    const resposta = await POST(
      new Request(`http://localhost/api/mcp?idoso=${IDOSO}&chave=${chave}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
      }),
    );
    expect(resposta.status).toBe(200);
  });

  it('responde à abertura e lista as seis ações', async () => {
    const abertura = await (
      await POST(pedido({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } }))
    ).json();
    expect(abertura.result.protocolVersion).toBe('2025-03-26');
    expect(abertura.result.capabilities.tools).toBeDefined();

    const aviso = await POST(pedido({ jsonrpc: '2.0', method: 'notifications/initialized' }));
    expect(aviso.status).toBe(202);

    const lista = await (await POST(pedido({ jsonrpc: '2.0', id: 2, method: 'tools/list' }))).json();
    expect(lista.result.tools.map((t: { name: string }) => t.name)).toEqual([
      'registrar_bem_estar',
      'guardar_lembranca',
      'mudar_lembranca',
      'buscar_lembranca',
      'avisar_familia',
      'resumir_conversa',
    ]);
  });

  it('anota o dia na ficha e avisa a família quando o remédio não foi tomado', async () => {
    const resposta = await (
      await POST(
        pedido({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: { name: 'registrar_bem_estar', arguments: { sono: 'mal', remedio: 'nao_tomou', dor: '6' } },
        }),
      )
    ).json();
    expect(resposta.result.isError).toBe(false);
    expect(resposta.result.content[0].text).toContain('A família foi avisada');

    const gravado = await base();
    const hoje = gravado.dias[gravado.dias.length - 1];
    expect(hoje.sono).toBe('mal');
    expect(hoje.remedio).toBe('nao_tomou');
    expect(hoje.dor).toBe(6);
    expect(gravado.alertas.some((a) => a.tipo === 'remedio' && a.origem === 'regra')).toBe(true);
  });

  it('manda o aviso da assistente pro painel', async () => {
    await POST(
      pedido({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'avisar_familia',
          arguments: { tipo: 'golpe', gravidade: 'atencao', mensagem: 'Recebeu ligação pedindo a senha do banco.' },
        },
      }),
    );
    const alerta = (await base()).alertas.find((a) => a.tipo === 'golpe');
    expect(alerta?.origem).toBe('assistente');
    expect(alerta?.visto).toBe(false);
  });

  it('ignora valor fora da lista em vez de gravar lixo', async () => {
    const resposta = await (
      await POST(
        pedido({
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: { name: 'registrar_bem_estar', arguments: { sono: 'otimo demais' } },
        }),
      )
    ).json();
    expect(resposta.result.content[0].text).toContain('Nada foi anotado');
  });

  it('ação que não existe devolve erro', async () => {
    const resposta = await (
      await POST(pedido({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'comprar_remedio' } }))
    ).json();
    expect(resposta.error.code).toBe(-32602);
  });
});

describe('segundo cérebro pelas ações da assistente', () => {
  const chamar = async (name: string, args: Record<string, unknown>) =>
    (await (await POST(pedido({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name, arguments: args } }))).json()).result.content[0].text as string;

  it('guarda compromisso com a data dita em palavra, busca e esquece', async () => {
    const guardou = await chamar('guardar_lembranca', { texto: 'Dentista com a doutora Ana.', categoria: 'compromisso', data: 'amanhã', hora: '10h' });
    expect(guardou).toMatch(/Guardada como número \d+/);
    const numero = Number(guardou.match(/número (\d+)/)![1]);
    const achou = await chamar('buscar_lembranca', { pergunta: 'quando é o dentista?' });
    expect(achou).toContain('Dentista com a doutora Ana.');
    expect(achou).toContain('às 10h');
    expect(await chamar('mudar_lembranca', { numero, acao: 'esquecer' })).toContain('Esquecido');
    expect(await chamar('buscar_lembranca', { pergunta: 'dentista' })).toContain('Não achei');
  });

  it('reservada avisa que queda e golpe continuam indo pra família', async () => {
    const r = await chamar('guardar_lembranca', { texto: 'Tem medo de cair de novo no banho.', categoria: 'humor', reservada: true });
    expect(r).toContain('só entre vocês');
    expect(r).toContain('golpe continuam indo pra família');
  });

  it('não guarda senha', async () => {
    expect(await chamar('guardar_lembranca', { texto: 'A senha é 998877', categoria: 'historia' })).toContain('Não guardei');
  });
});

describe('o segredo não sai no aviso nem no resumo', () => {
  const chamar = async (name: string, args: Record<string, unknown>) =>
    (await (await POST(pedido({ jsonrpc: '2.0', id: 11, method: 'tools/call', params: { name, arguments: args } }))).json()).result.content[0].text as string;
  const ultimoAviso = async () => (await base()).alertas.at(-1)!;

  it('tristeza por causa do aluguel reservado chega à família sem o motivo', async () => {
    const r = await chamar('avisar_familia', {
      tipo: 'humor',
      gravidade: 'atencao',
      mensagem: 'Dona Helena está triste e chorando todos os dias por causa do aluguel atrasado.',
    });
    expect(r).toContain('sem o motivo');
    const aviso = await ultimoAviso();
    expect(aviso.texto).not.toMatch(/alugu/i);
    expect(aviso.texto).toContain('triste');
  });

  it('tristeza sem o assunto do segredo vai como a assistente escreveu', async () => {
    await chamar('avisar_familia', { tipo: 'humor', gravidade: 'atencao', mensagem: 'Dona Helena anda triste com a chuva, sem sair de casa.' });
    expect((await ultimoAviso()).texto).toBe('Dona Helena anda triste com a chuva, sem sair de casa.');
  });

  it('tristeza marcada como urgente também chega sem o motivo', async () => {
    const r = await chamar('avisar_familia', { tipo: 'humor', gravidade: 'urgente', mensagem: 'Dona Helena está muito triste por causa do aluguel atrasado.' });
    expect(r).toContain('sem o motivo');
    expect((await base()).alertas.some((a) => a.texto.includes('muito triste por causa do aluguel'))).toBe(false);
  });

  it.each([
    'Falou que não quer mais viver por causa do aluguel.',
    'Caiu no banheiro quando foi ver a conta do aluguel.',
  ])('risco vai inteiro, mesmo citando o segredo: %s', async (mensagem) => {
    const r = await chamar('avisar_familia', { tipo: 'humor', gravidade: 'urgente', mensagem });
    expect(r).toBe('A família foi avisada.');
    expect((await ultimoAviso()).texto).toBe(mensagem);
  });

  it('o resumo perde só a frase do segredo', async () => {
    const dados = await import('@/lib/dados');
    await dados.mudarBase(IDOSO, (b) => dados.abrirConversa(b, new Date()));
    const r = await chamar('resumir_conversa', {
      resumo: 'Dona Helena regou as orquídeas e foi à hidroginástica. Está preocupada com o aluguel atrasado.',
    });
    expect(r).toContain('sem a parte');
    const conversa = (await base()).conversas.at(-1);
    expect(conversa?.resumo).toBe('Dona Helena regou as orquídeas e foi à hidroginástica.');
  });
});

describe('queda guardada como segredo continua indo pra família', () => {
  it('a assistente guarda a queda como reservada e o aviso sai inteiro', async () => {
    const chamar = async (name: string, args: Record<string, unknown>) =>
      (await (await POST(pedido({ jsonrpc: '2.0', id: 12, method: 'tools/call', params: { name, arguments: args } }))).json()).result.content[0].text as string;
    await chamar('guardar_lembranca', { texto: 'Dona Helena escorregou no banho e bateu o joelho.', categoria: 'saude', reservada: true });
    const r = await chamar('avisar_familia', { tipo: 'saude', gravidade: 'atencao', mensagem: 'Dona Helena escorregou no banho e bateu o joelho.' });
    expect(r).toBe('A família foi avisada.');
    expect((await base()).alertas.at(-1)?.texto).toBe('Dona Helena escorregou no banho e bateu o joelho.');
  });
});
