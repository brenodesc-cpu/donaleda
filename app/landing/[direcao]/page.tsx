import { redirect } from 'next/navigation';

// Os endereços /landing/1, /landing/2 e /landing/3 eram as três direções da escolha.
// O Breno escolheu a 2 em 21/11/2026, e ela passou a morar em /landing.
export default function DirecaoAntiga() {
  redirect('/landing');
}
