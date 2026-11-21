import type { Metadata, Viewport } from 'next';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import './globals.css';

// Sem `maximumScale`: quem enxerga menos precisa poder dar zoom na tela.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: `${NOME_DA_ASSISTENTE}, assistente de voz`,
  description: `A ${NOME_DA_ASSISTENTE} é uma assistente virtual que conversa todo dia com quem mora sozinho e avisa a família quando algo sai do normal.`,
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full min-h-screen text-lg">{children}</body>
    </html>
  );
}
