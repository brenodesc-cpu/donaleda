// O aviso de privacidade da primeira ligação. Ele vai na saudação fixa, que a Agora
// fala do jeito que está escrita, sem depender de o modelo lembrar de dizer. Quando a
// primeira conversa termina com o idoso tendo falado, a ficha grava a data do aviso
// e a versão do texto, pra família ver no painel e pra provar o que foi dito.

/** Sobe quando o texto do aviso mudar, pra ficha dizer qual versão a pessoa ouviu. */
export const VERSAO_DO_AVISO_DE_PRIVACIDADE = 1;

/** A frase que entra na saudação da primeira ligação, depois da apresentação. */
export function avisoDePrivacidade(pronome: string, familiar: string): string {
  return `Eu guardo o que ${pronome} me contar pra lembrar nas próximas conversas, ${familiar} recebe um resumo de como ${pronome} está, e é só pedir que eu esqueço o que ${pronome} quiser.`;
}
