/**
 * Durées en minutes:secondes — lot 13.
 *
 * L'API compte en secondes ; l'écran écrit « 1:30 », comme un minuteur.
 * Partagé entre serveur et client : aucun accès à l'API ici.
 */

/** 90 → « 1:30 » ; une valeur négative s'écrit avec le signe moins. */
export function ecrireDuree(secondes: number): string {
  const s = Math.round(Math.abs(secondes));
  const texte = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return secondes < 0 ? `−${texte}` : texte;
}

/**
 * « 1:30 », « 90 » ou « 1 min 30 » → 90. Chaîne vide → `null` (pas de durée).
 * Illisible → `undefined`, que l'appelant transforme en message.
 */
export function lireDuree(brut: string): number | null | undefined {
  const texte = brut.trim();
  if (texte === "") return null;

  const mmss = texte.match(/^(\d{1,2}):([0-5]\d)$/);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);

  const minSec = texte.match(/^(\d{1,2})\s*min(?:\s*(\d{1,2}))?$/i);
  if (minSec) return Number(minSec[1]) * 60 + Number(minSec[2] ?? 0);

  if (/^\d{1,3}$/.test(texte)) return Number(texte);

  return undefined;
}
