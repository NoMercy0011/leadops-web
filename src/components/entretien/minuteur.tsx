import { ecrireDuree } from "@/lib/duree";

/**
 * Minuteur en anneau — lot 13, planche n°13 (S-17), décision n°1.
 *
 * Compte à rebours sur le temps prévu ; ambre à 80 %, rouge au-delà, sans
 * jamais rien bloquer (D5). L'anneau avance par une transition CSS, que la
 * règle « réduire les animations » de globals.css rend instantanée.
 * Sans temps prévu, il affiche le temps écoulé.
 */
export function Minuteur({ ecoule, prevu }: { ecoule: number; prevu: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const part = prevu > 0 ? Math.min(ecoule / prevu, 1) : 0;
  const ratio = prevu > 0 ? ecoule / prevu : 0;
  const couleur = ratio > 1 ? "var(--destructive)" : ratio >= 0.8 ? "var(--warning)" : "var(--chart-1)";
  const reste = prevu - ecoule;
  const texte = prevu === 0 ? ecrireDuree(ecoule) : reste >= 0 ? ecrireDuree(reste) : `+${ecrireDuree(-reste)}`;
  const sous = prevu === 0 ? "écoulées" : reste >= 0 ? `restantes sur ${ecrireDuree(prevu)}` : "de dépassement";

  return (
    <div role="timer" aria-live="off" aria-label={`${texte} ${sous}`}>
      <svg viewBox="0 0 168 168" className="mx-auto size-[168px]" aria-hidden>
        <circle cx="84" cy="84" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle
          cx="84"
          cy="84"
          r={r}
          fill="none"
          stroke={couleur}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(c * part).toFixed(1)} ${c.toFixed(1)}`}
          transform="rotate(-90 84 84)"
          className="transition-[stroke-dasharray,stroke] duration-(--duration-slow) ease-(--ease-brand)"
        />
        <text x="84" y="88" textAnchor="middle" className="fill-card-foreground font-mono text-[30px] font-semibold">
          {texte}
        </text>
        <text x="84" y="108" textAnchor="middle" className="fill-muted-foreground text-[11px]">
          {sous}
        </text>
      </svg>
    </div>
  );
}
