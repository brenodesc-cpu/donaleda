import type { CapacitorConfig } from '@capacitor/cli';

// O app da Dona Leda é o próprio site dentro de um aplicativo: abre o endereço
// publicado e usa o microfone e a câmera do aparelho. Um app só pros dois lados
// (família e idoso). Pra testar contra outro servidor, rode com CAP_SERVER_URL.
const servidor = process.env.CAP_SERVER_URL?.trim() || 'https://donaleda.vercel.app';

const config: CapacitorConfig = {
  appId: 'app.donaleda',
  appName: 'Dona Leda',
  // Página de reserva, mostrada só quando o servidor não abre.
  webDir: 'recursos/reserva',
  server: {
    url: servidor,
    cleartext: servidor.startsWith('http://'),
    errorPath: 'index.html',
  },
  ios: {
    contentInset: 'never',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
