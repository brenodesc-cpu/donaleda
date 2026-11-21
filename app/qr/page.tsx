import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Converse com a Dona Leda',
  robots: { index: false, follow: false },
};

/** O QR Code da demonstração em tela cheia, pra apontar o celular no telão ou na mesa. */
export default function QrPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-4 py-6 text-center">
      <h1 className="font-titulo text-3xl font-bold text-foreground sm:text-5xl">Converse com a Dona Leda</h1>
      <Image
        src="/qr-experimente.png"
        alt="QR Code que abre donaleda.vercel.app/experimente"
        width={1200}
        height={1200}
        priority
        className="h-auto w-full max-w-[min(80vh,90vw)]"
      />
      <p className="text-xl text-foreground sm:text-3xl">
        Aponte a câmera do celular · <span className="font-semibold">donaleda.vercel.app/experimente</span>
      </p>
    </main>
  );
}
