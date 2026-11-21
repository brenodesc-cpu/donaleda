import { describe, expect, it } from 'vitest';
import { TurnStatus } from 'agora-agent-client-toolkit';
import { falasNovasDoIdoso, type ItemDoTranscript } from '@/lib/conversation';

// A fala do idoso chega aos pedaços. O aviso de queda precisa ver a frase inteira.

const ASSISTENTE = '123456';
const item = (turno: number, texto: string, status: TurnStatus, uid = '0'): ItemDoTranscript =>
  ({ turn_id: turno, uid, text: texto, status, _time: 0 }) as unknown as ItemDoTranscript;

describe('falas do idoso que vão pro servidor', () => {
  it('manda de novo quando o mesmo turno cresce depois de marcado como terminado', () => {
    const enviadas = new Map<string, string>();
    const primeira = falasNovasDoIdoso([item(1, 'Eu', TurnStatus.END)], ASSISTENTE, enviadas);
    expect(primeira.map((f) => f.texto)).toEqual(['Eu']);
    for (const f of primeira) enviadas.set(f.id, f.texto);

    const depois = falasNovasDoIdoso([item(1, 'Eu caí no banheiro', TurnStatus.END)], ASSISTENTE, enviadas);
    expect(depois.map((f) => f.texto)).toEqual(['Eu caí no banheiro']);
  });

  it('manda também a fala que ainda está em andamento', () => {
    const novas = falasNovasDoIdoso([item(2, 'Um moço ligou pedindo Pix', TurnStatus.IN_PROGRESS)], ASSISTENTE, new Map());
    expect(novas).toHaveLength(1);
  });

  it('não manda de novo a mesma frase nem a fala da assistente', () => {
    const enviadas = new Map([['1', 'Dormi bem']]);
    const novas = falasNovasDoIdoso(
      [item(1, 'Dormi bem', TurnStatus.END), item(3, 'Que bom!', TurnStatus.END, ASSISTENTE)],
      ASSISTENTE,
      enviadas,
    );
    expect(novas).toEqual([]);
  });
});
