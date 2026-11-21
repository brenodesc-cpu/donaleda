// Em volta de cada tela de exemplo da /telas. O trecho abaixo roda antes do app e
// garante que a tela não fala com o servidor nem faz barulho: os pedidos pra /api
// voltam recusados na hora, e o toque e a vibração da ligação ficam mudos.
const GUARDA = `(function () {
  var buscar = window.fetch ? window.fetch.bind(window) : null;
  if (buscar) {
    window.fetch = function (entrada, opcoes) {
      var endereco = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || '';
      var caminho = endereco.replace(window.location.origin, '');
      if (caminho.indexOf('/api/') === 0) {
        return Promise.resolve(
          new Response(JSON.stringify({ ok: false, exemplo: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        );
      }
      return buscar(entrada, opcoes);
    };
  }
  try { window.AudioContext = undefined; window.webkitAudioContext = undefined; } catch (erro) {}
  try { navigator.vibrate = function () { return false; }; } catch (erro) {}
})();`;

export default function VerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: GUARDA }} />
      {children}
    </>
  );
}
