// Como a tela do idoso fala as horas das ligações: "9h", "19h30".

/** "09:00" vira "9h"; "19:30" vira "19h30". Hora que não dá pra ler volta como veio. */
export function horaFalada(horario: string): string {
  const achado = /^(\d{1,2}):(\d{2})$/.exec(horario.trim());
  if (!achado) return horario;
  const hora = Number(achado[1]);
  const minuto = achado[2];
  return minuto === '00' ? `${hora}h` : `${hora}h${minuto}`;
}

/** "às 9h", ou "à 1h" quando a hora pede o singular. */
export function comPreposicao(horario: string): string {
  const hora = Number(horario.trim().split(':')[0]);
  return `${hora <= 1 ? 'à' : 'às'} ${horaFalada(horario)}`;
}

/** "às 9h e às 19h", "às 9h, às 14h e às 19h". Sem horário nenhum, devolve null. */
export function horariosEmFrase(horarios: readonly string[]): string | null {
  const partes = horarios.filter((h) => h.trim() !== '').map(comPreposicao);
  if (partes.length === 0) return null;
  if (partes.length === 1) return partes[0];
  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

/** A frase da tela de espera, que diz quando a assistente liga. */
export function quandoElaLiga(nome: string, horarios: readonly string[]): string {
  const frase = horariosEmFrase(horarios);
  return frase
    ? `A ${nome} liga pra você ${frase}.`
    : `A ${nome} liga quando a sua família pedir.`;
}
