import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Base } from '@/lib/tipos';

// As ações da assistente, chamadas do jeito que a nuvem da Agora chama.

let POST: (request: Request) => Promise<Response>;
let chave: string;
let arquivo: string;

beforeAll(async () => {
  arquivo = path.join(mkdtempSync(path.join(tmpdir(), 'lia-')), 'base.json');
  process.env.LIA_DADOS = arquivo;
  process.env.NEXT_AGORA_APP_CERTIFICATE = 'certificado-de-teste';
  ({ POST } = await import('@/app/api/mcp/route'));
  chave = (await import('@/lib/servidor')).chaveDasFerramentas() ?? '';
});

function pedido(corpo: unknown, comChave = true): Request {
  return new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(comChave ? { Authorization: `Bearer ${chave}` } : {}),
    },
    body: JSON.stringify(corpo),
  });
}

const base = (): Base => JSON.parse(readFileSync(arquivo, 'utf8')) as Base;

describe('ações da assistente (/api/mcp)', () => {
  it('recusa quem não tem a chave', async () => {
    const resposta = await POST(pedido({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, false));
    expect(resposta.status).toBe(401);
  });

  it('aceita a chave pelo endereço também', async () => {
    const resposta = await POST(
      new Request(`http://localhost/api/mcp?chave=${chave}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
      }),
    );
    expect(resposta.status).toBe(200);
  });

  it('responde à abertura e lista as quatro ações', async () => {
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

    const gravado = base();
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
    const alerta = base().alertas.find((a) => a.tipo === 'golpe');
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
