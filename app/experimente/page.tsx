import type { Metadata } from 'next';
import { Experimente } from '@/components/experimente/Experimente';

export const metadata: Metadata = {
  title: 'Converse com a Dona Leda',
  description: 'Uma ligação de dois minutos com a Dona Leda, a assistente de cuidado de quem envelhece.',
  robots: { index: false, follow: false },
};

export default function ExperimentePage() {
  return <Experimente />;
}
