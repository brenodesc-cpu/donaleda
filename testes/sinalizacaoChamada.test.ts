import { afterEach, describe, expect, it, vi } from 'vitest';
import { registrarAparelhoPush } from '@/lib/dados';
import { baseDeExemplo } from '@/lib/exemplo';
import {
  dispararConviteDeChamada,
  montarPayloadDeChamada,
  usuarioAgoraRtm,
} from '@/lib/sinalizacaoChamada';
import type { Chamada } from '@/lib/tipos';

const chamadaExemplo: Chamada = {
  id: 'chamada-123',
  motivo: 'familia',
  tentativa: 1,
  estado: 'tocando',
  pedidaEm: '2026-11-21T18:00:00.000Z',
};

describe('sinalização de chamada (Agora Signaling + Offline Push)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_AGORA_APP_ID;
    delete process.env.NEXT_AGORA_CUSTOMER_ID;
    delete process.env.NEXT_AGORA_CUSTOMER_SECRET;
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.APNS_KEY_ID;
    delete process.env.APNS_TEAM_ID;
    delete process.env.APNS_PRIVATE_KEY;
  });

  it('monta payload mínimo sem dados pessoais ou clínicos', () => {
    const payload = montarPayloadDeChamada(chamadaExemplo);
    expect(payload.tipo).toBe('chamada');
    expect(payload.chamadaId).toBe('chamada-123');
    expect(payload.motivo).toBe('familia');
    expect(Object.keys(payload)).not.toContain('cpf');
    expect(Object.keys(payload)).not.toContain('saude');
    expect(Object.keys(payload)).not.toContain('remedios');
  });

  it('registra e deduplica tokens de push mantendo até 5 aparelhos', () => {
    const base = baseDeExemplo();
    for (let i = 1; i <= 7; i += 1) {
      registrarAparelhoPush(base, {
        plataforma: i % 2 === 0 ? 'ios' : 'android',
        token: `token-dispositivo-${i}-0123456789abcdef`,
        agoraRtmUserId: usuarioAgoraRtm(base.idoso.id),
      });
    }
    expect(base.aparelhosPush).toHaveLength(5);
    expect(base.aparelhosPush?.[0].token).toContain('token-dispositivo-3');
    expect(base.aparelhosPush?.[4].token).toContain('token-dispositivo-7');

    // Reenviar token existente atualiza sem duplicar.
    registrarAparelhoPush(base, {
      plataforma: 'android',
      token: 'token-dispositivo-3-0123456789abcdef',
    });
    expect(base.aparelhosPush).toHaveLength(5);
    expect(base.aparelhosPush?.[4].token).toContain('token-dispositivo-3');
  });

  it('degrada com segurança quando nenhuma credencial de push está configurada', async () => {
    const r = await dispararConviteDeChamada(
      'idoso-1',
      [{ plataforma: 'android', token: 'token-fcm-teste-1234567890', atualizadoEm: '2026-11-21T18:00:00Z' }],
      chamadaExemplo,
    );
    expect(r.agoraSignaling).toBe('nao_configurado');
    expect(r.fcmEnviados).toBe(0);
    expect(r.apnsEnviados).toBe(0);
    expect(r.erros).toHaveLength(0);
  });

  it('publica convite na API REST do Agora Signaling quando credenciais estão presentes', async () => {
    process.env.NEXT_PUBLIC_AGORA_APP_ID = 'app-id-teste';
    process.env.NEXT_AGORA_CUSTOMER_ID = 'cust-id';
    process.env.NEXT_AGORA_CUSTOMER_SECRET = 'cust-secret';

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ result: 'success' }), { status: 200 }),
    );

    const r = await dispararConviteDeChamada('idoso-abc', [], chamadaExemplo);
    expect(r.agoraSignaling).toBe('enviado');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/rtm/users/donaleda-server/peer_messages');
    expect(String(init?.body)).toContain('idoso-idoso-abc');
  });
});
