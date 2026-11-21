import { Inicio } from '@/components/Inicio';
import { Landing } from '@/components/landing/Landing';

// A primeira tela. Aparelho ligado a um idoso abre a tela de espera da ligação.
// Aparelho novo vê a página de apresentação, que traz no topo os dois caminhos:
// a entrada da família e o aparelho que vai receber as ligações (decisão do Breno, 21/11/2026).
export default function Pagina() {
  return <Inicio semPar={<Landing comCaminhos />} />;
}
