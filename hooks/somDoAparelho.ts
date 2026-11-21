// O som que a própria tela faz (o toque de chamada). O navegador só deixa tocar
// depois de um toque de dedo na página, então existe um "destravar" separado.

type JanelaComWebkit = Window & { webkitAudioContext?: typeof AudioContext };

let contexto: AudioContext | null = null;

/** O gerador de som da página, criado na primeira vez que alguém pede. */
export function contextoDeSom(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!contexto) {
    const Classe =
      window.AudioContext ?? (window as JanelaComWebkit).webkitAudioContext;
    if (!Classe) return null;
    try {
      contexto = new Classe();
    } catch {
      return null;
    }
  }
  return contexto;
}

/** Chame dentro de um toque de dedo: libera o som da página daí em diante. */
export function destravarSom(): Promise<void> {
  const som = contextoDeSom();
  if (!som || som.state === 'running') return Promise.resolve();
  return som.resume().catch(() => undefined);
}

/**
 * Um bipe suave, com começo e fim arredondados pra não estalar.
 * Devolve uma função que corta o bipe na hora.
 */
export function bipe(
  som: AudioContext,
  frequencia: number,
  atraso: number,
  duracao = 0.3,
): () => void {
  const inicio = som.currentTime + atraso;
  const oscilador = som.createOscillator();
  const volume = som.createGain();
  oscilador.type = 'sine';
  oscilador.frequency.value = frequencia;
  volume.gain.setValueAtTime(0, inicio);
  volume.gain.linearRampToValueAtTime(0.22, inicio + 0.03);
  volume.gain.setValueAtTime(0.22, inicio + duracao - 0.08);
  volume.gain.linearRampToValueAtTime(0, inicio + duracao);
  oscilador.connect(volume);
  volume.connect(som.destination);
  oscilador.start(inicio);
  oscilador.stop(inicio + duracao + 0.02);
  return () => {
    try {
      oscilador.stop();
    } catch {}
    oscilador.disconnect();
    volume.disconnect();
  };
}
