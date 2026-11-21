// O Next roda esta função uma vez quando o servidor sobe.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ligarRelogio } = await import('./lib/relogio');
    ligarRelogio();
  }
}
