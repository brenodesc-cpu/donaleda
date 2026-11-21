'use client';

import { useState, type ReactNode } from 'react';
import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react';

/**
 * Cria a ligação de áudio da Agora uma vez por conversa. Só roda no navegador:
 * quem usa este componente importa ele com `dynamic(..., { ssr: false })`.
 */
export default function ProvedorDaAgora({ children }: { children: ReactNode }) {
  // O estado atravessa o falso desmonte do StrictMode, então a conversa inteira
  // usa a mesma ligação (com useMemo seriam duas no modo de desenvolvimento).
  const [ligacao] = useState(() =>
    AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }),
  );
  return <AgoraRTCProvider client={ligacao}>{children}</AgoraRTCProvider>;
}
