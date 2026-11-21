import type { Metadata } from 'next';

// A página /telas reúne as telas do app com dados de exemplo, pra ver sem login e sem
// ligação. Fica fora do menu e fora da busca, como a /marca.
export const metadata: Metadata = {
  title: 'Telas da Dona Leda',
  description: 'Todas as telas do app da Dona Leda, com dados de exemplo.',
  robots: { index: false, follow: false },
};

export default function TelasLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
