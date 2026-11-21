import type { Metadata } from 'next';
import { ASSINATURA, DEFINICAO } from '@/components/landing/conteudo';

export const metadata: Metadata = {
  title: ASSINATURA,
  description: DEFINICAO,
};

export default function LandingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
