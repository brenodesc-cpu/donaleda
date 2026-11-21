import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Gabarito, Lexend, Nunito } from 'next/font/google';
import { NOME_DA_ASSISTENTE } from '@/lib/assistente';
import { MARCA_ATIVA } from '@/components/marca/direcoes';
import { PALETAS } from '@/components/marca/paletas.gerado';
import { cn } from '@/lib/utils';
import './globals.css';

// As fontes das direções da marca (components/marca/direcoes.ts).
// A Gema, que é a ativa, usa a Gabarito no título e a Atkinson no texto: as duas
// carregam antes da tela aparecer. As outras fontes, só na página /marca.
const fonteVaranda = Atkinson_Hyperlegible_Next({
  subsets: ['latin', 'latin-ext'],
  variable: '--fonte-varanda',
  display: 'swap',
  preload: true,
});
const fonteGemaTitulo = Gabarito({
  subsets: ['latin', 'latin-ext'],
  variable: '--fonte-gema-titulo',
  display: 'swap',
  preload: true,
});
const fonteRadio = Lexend({
  subsets: ['latin', 'latin-ext'],
  variable: '--fonte-radio',
  display: 'swap',
  preload: false,
});
const fonteJardim = Nunito({
  subsets: ['latin', 'latin-ext'],
  variable: '--fonte-jardim',
  display: 'swap',
  preload: false,
});

// Sem `maximumScale`: quem enxerga menos precisa poder dar zoom na tela.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: PALETAS[MARCA_ATIVA].cores.background,
};

export const metadata: Metadata = {
  title: NOME_DA_ASSISTENTE,
  description: `A ${NOME_DA_ASSISTENTE} é uma assistente virtual que conversa todo dia com quem mora sozinho e avisa a família quando algo sai do normal.`,
  applicationName: NOME_DA_ASSISTENTE,
  manifest: '/site.webmanifest',
  appleWebApp: { title: NOME_DA_ASSISTENTE, statusBarStyle: 'default' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icone.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-marca={MARCA_ATIVA}
      className={cn(
        'h-full',
        fonteVaranda.variable,
        fonteGemaTitulo.variable,
        fonteRadio.variable,
        fonteJardim.variable,
      )}
    >
      <body className="h-full min-h-screen font-sans text-lg antialiased">{children}</body>
    </html>
  );
}
