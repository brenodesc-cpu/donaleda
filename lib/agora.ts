export const DEFAULT_AGENT_UID = 123456;

/**
 * Quem entra na ligação pela família ganha um uid a partir daqui. O aparelho do
 * idoso reconhece a família por esse número e a assistente não escuta esses uids.
 */
export const PRIMEIRO_UID_DA_FAMILIA = 900_000_000;

export function ehDaFamilia(uid: string | number | undefined | null): boolean {
  const n = Number(uid);
  return Number.isFinite(n) && n >= PRIMEIRO_UID_DA_FAMILIA;
}
