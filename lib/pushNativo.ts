// Ponte Capacitor entre a tela do idoso e o plugin nativo `DonaLedaCallPush`
// (Android FCM + tela nativa de ligação / iOS PushKit + CallKit).
// No navegador comum, tudo aqui é no-op seguro.

import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { fetchDoAparelho, tokenDoAparelho } from './aparelho';

export interface AcaoDeChamadaNativa {
  acao: 'atender' | 'recusar';
  chamadaId: string;
}

interface TokenNativo {
  token: string;
  voipToken?: string;
  plataforma: 'android' | 'ios';
}

interface DonaLedaCallPushPlugin {
  register(options?: {
    aparelhoToken?: string;
    serverUrl?: string;
  }): Promise<{ token?: string; plataforma?: 'android' | 'ios' }>;
  registerFamilyAlerts(): Promise<{
    token?: string;
    voipToken?: string;
    plataforma?: 'android' | 'ios';
  }>;
  getPendingCall(): Promise<{ acao?: string; chamadaId?: string }>;
  getPendingFamilyRoute(): Promise<{ rota?: string }>;
  addListener(
    eventName: 'tokenReceived' | 'familyTokenReceived',
    listenerFunc: (data: TokenNativo) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'callAction',
    listenerFunc: (data: AcaoDeChamadaNativa) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'familyDeepLink',
    listenerFunc: (data: { rota: string }) => void,
  ): Promise<PluginListenerHandle>;
}

const plugin = registerPlugin<DonaLedaCallPushPlugin>('DonaLedaCallPush');

export function ehAppNativo(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Solicita permissão de notificação no app nativo (Android FCM / iOS APNs Alert)
 * para o celular do familiar responsável receber alertas e status mesmo fechado.
 */
export async function registrarPushDaFamiliaNativo(): Promise<TokenNativo | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const res = await plugin.registerFamilyAlerts();
    if (
      (res?.token || res?.voipToken) &&
      (res.plataforma === 'android' || res.plataforma === 'ios')
    ) {
      return {
        token: res.token ?? res.voipToken ?? '',
        ...(res.voipToken ? { voipToken: res.voipToken } : {}),
        plataforma: res.plataforma,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Escuta toques em notificações urgentes da família no Android/iOS para abrir
 * direto a sala da ligação ao vivo (`/familia/ligacao?idoso=...`).
 */
export function escutarRotaDaFamiliaNativa(onRota: (rota: string) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  let ativo = true;
  let handle: PluginListenerHandle | null = null;

  const aceitar = (rota?: string) => {
    if (!ativo || !rota || !rota.startsWith('/familia')) return;
    onRota(rota);
  };

  void (async () => {
    try {
      handle = await plugin.addListener('familyDeepLink', (d) => aceitar(d?.rota));
      const pendente = await plugin.getPendingFamilyRoute();
      aceitar(pendente?.rota);
    } catch {
      // Versão antiga do APK sem este método: segue normalmente no painel.
    }
  })();

  return () => {
    ativo = false;
    void handle?.remove().catch(() => undefined);
  };
}

async function enviarTokenAoServidor(plataforma: 'android' | 'ios', token: string): Promise<void> {
  if (!token || token.length < 16) return;
  await fetchDoAparelho('/api/aparelho/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plataforma, token }),
  }).catch(() => undefined);
}

/**
 * Registra o aparelho nativo (Android/iOS) para receber chamadas via Agora Signaling / Push
 * e escuta atualizações de token e ações ("atender" / "recusar") da tela nativa de chamada.
 */
export function iniciarPushDeChamadaNativa(
  onAcao: (evento: AcaoDeChamadaNativa) => void,
): () => void {
  if (!Capacitor.isNativePlatform()) return () => undefined;

  let ativo = true;
  const handles: PluginListenerHandle[] = [];

  const despacharSeValido = (acao?: string, chamadaId?: string) => {
    if (!ativo || !chamadaId) return;
    if (acao === 'atender' || acao === 'recusar') {
      onAcao({ acao, chamadaId });
    }
  };

  void (async () => {
    try {
      const hToken = await plugin.addListener('tokenReceived', (dados) => {
        if (ativo && dados?.token && (dados.plataforma === 'android' || dados.plataforma === 'ios')) {
          void enviarTokenAoServidor(dados.plataforma, dados.token);
        }
      });
      handles.push(hToken);

      const hAcao = await plugin.addListener('callAction', (dados) => {
        despacharSeValido(dados?.acao, dados?.chamadaId);
      });
      handles.push(hAcao);

      const registro = await plugin.register({
        aparelhoToken: tokenDoAparelho() ?? '',
        serverUrl: typeof window !== 'undefined' ? window.location.origin : '',
      });
      if (
        ativo &&
        registro?.token &&
        (registro.plataforma === 'android' || registro.plataforma === 'ios')
      ) {
        await enviarTokenAoServidor(registro.plataforma, registro.token);
      }

      const pendente = await plugin.getPendingCall();
      despacharSeValido(pendente?.acao, pendente?.chamadaId);
    } catch {
      // Sem google-services.json ou permissão negada: segue usando o polling normal.
    }
  })();

  return () => {
    ativo = false;
    for (const h of handles) {
      void h.remove().catch(() => undefined);
    }
  };
}
