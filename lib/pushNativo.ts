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
  plataforma: 'android' | 'ios';
}

interface DonaLedaCallPushPlugin {
  register(options?: {
    aparelhoToken?: string;
    serverUrl?: string;
  }): Promise<{ token?: string; plataforma?: 'android' | 'ios' }>;
  getPendingCall(): Promise<{ acao?: string; chamadaId?: string }>;
  addListener(
    eventName: 'tokenReceived',
    listenerFunc: (data: TokenNativo) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'callAction',
    listenerFunc: (data: AcaoDeChamadaNativa) => void,
  ): Promise<PluginListenerHandle>;
}

const plugin = registerPlugin<DonaLedaCallPushPlugin>('DonaLedaCallPush');

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
