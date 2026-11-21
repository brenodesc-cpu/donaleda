// Nome da assistente e fuso. O nome muda num lugar só.
export const NOME_DA_ASSISTENTE =
  process.env.NEXT_PUBLIC_NOME_DA_ASSISTENTE?.trim() || 'Dona Leda';

export const FUSO = 'America/Sao_Paulo';

/** Data de hoje (AAAA-MM-DD) no horário de Brasília. A conta de data nunca fica com a IA. */
export function dataEmBrasilia(quando: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(quando);
}

/** Hora cheia (0 a 23) no horário de Brasília. */
export function horaEmBrasilia(quando: Date = new Date()): number {
  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: FUSO,
    hour: '2-digit',
    hour12: false,
  }).format(quando);
  return Number(hora) % 24;
}

/** Soma dias a uma data AAAA-MM-DD sem passar por fuso. */
export function somarDias(data: string, dias: number): string {
  const [ano, mes, dia] = data.split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return d.toISOString().slice(0, 10);
}
