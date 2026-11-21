import { Suspense } from 'react';
import { Parear } from '@/components/Parear';

// O aparelho do idoso recebe o código de 6 números que a família gerou no painel.
// Com /parear?codigo=123456 (o link que a família manda pelo WhatsApp), pareia sozinho.
export default function PaginaDeParear() {
  return (
    <Suspense fallback={null}>
      <Parear />
    </Suspense>
  );
}
