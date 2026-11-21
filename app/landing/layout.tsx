import type { Metadata } from 'next';
import { ASSINATURA, DEFINICAO } from '@/components/landing/conteudo';
import './landing.css';

export const metadata: Metadata = {
  title: ASSINATURA,
  description: DEFINICAO,
};

export default function LandingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
