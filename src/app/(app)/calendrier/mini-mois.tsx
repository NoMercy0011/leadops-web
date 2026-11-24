import Link from "next/link";

import { cn } from "@/lib/utils";

const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

const MOIS_LONG = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const JOUR_LONG = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** Date locale `AAAA-MM-JJ` d'un jour du mois affiché. */
function cle(annee: number, mois: number, jour: number): string {
  const d = new Date(Date.UTC(annee, mois, jour));

  return d.toISOString().slice(0, 10);
}

/**
 * Navigateur mensuel compact.
 *
 * **La grille montre la densité, plus les noms.** C'est l'échange central de
 * cet écran, et il est favorable : une case pleine largeur affichait trois
 * lignes tronquées puis « +2 autres », ce qui ne permettait ni de lire ni de
 * compter. Des points disent « combien » d'un coup d'œil sur le mois entier,
 * et le panneau voisin dit « qui », en entier.
 *
 * **Aujourd'hui et le jour choisi portent deux marques distinctes** — un
 * contour, un aplat. Les confondre, ce que font la plupart des
 * mini-calendriers, fait perdre le repère temporel dès qu'on consulte un autre
 * jour.
 *
 * Chaque case est un lien vers `?date=…` : la sélection vit dans l'URL, se
 * partage, et revient avec le bouton Précédent. Rien à exécuter dans le
 * navigateur.
 */
export function MiniMois({
  annee,
  /** Indice du mois, de 0 à 11. */
  mois,
  jourChoisi,
  ceJour,
  parJour,
  base,
  parametres,
}: {
  annee: number;
  mois: number;
  /** Date locale `AAAA-MM-JJ` sélectionnée. */
  jourChoisi: string;
  /** Date locale du jour, dans le fuseau de l'entreprise. */
  ceJour: string;
  /** Nombre de rendez-vous par date locale, et présence d'un retard. */
  parJour: Map<string, { total: number; retard: boolean }>;
  base: string;
  parametres: URLSearchParams;
}) {
  const premier = new Date(Date.UTC(annee, mois, 1));
  const joursDuMois = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();

  // `getUTCDay` place dimanche à 0 ; la semaine commence lundi.
  const decalage = (premier.getUTCDay() + 6) % 7;

  const lien = (date: string) => {
    const suivants = new URLSearchParams(parametres);
    suivants.set("date", date);

    return `${base}?${suivants}`;
  };

  return (
    <div className="flex flex-col">
      <p className="px-2 pt-2 pb-1 text-center text-xs font-semibold first-letter:uppercase">
        {MOIS_LONG.format(premier)}
      </p>

      <div className="grid grid-cols-7 px-1.5">
        {JOURS.map((initiale, index) => (
          <span
            key={index}
            aria-hidden
            className="text-muted-foreground text-center text-[0.625rem] font-semibold tracking-wide uppercase"
          >
            {initiale}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px px-1.5 pt-0.5 pb-2">
        {Array.from({ length: 42 }, (_, index) => {
          const jour = index - decalage + 1;
          const dansLeMois = jour >= 1 && jour <= joursDuMois;

          if (!dansLeMois) {
            // Les cases débordantes restent, vides : les retirer déformerait la
            // grille et ferait sauter les colonnes d'une semaine à l'autre.
            return <span key={index} aria-hidden className="aspect-square" />;
          }

          const date = cle(annee, mois, jour);
          const compte = parJour.get(date);
          const choisi = date === jourChoisi;
          const estCeJour = date === ceJour;

          const libelle = compte
            ? `${JOUR_LONG.format(new Date(`${date}T00:00:00Z`))} — ${compte.total} rendez-vous`
            : `${JOUR_LONG.format(new Date(`${date}T00:00:00Z`))} — aucun rendez-vous`;

          return (
            <Link
              key={index}
              href={lien(date)}
              aria-current={choisi ? "date" : undefined}
              aria-label={libelle}
              title={libelle}
              className={cn(
                "duration-(--duration-fast) ease-brand flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-[0.8125rem] tabular-nums transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                choisi
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted",
                // Le contour marque la date du jour et survit à la sélection :
                // les deux informations se superposent sans se remplacer.
                estCeJour && !choisi && "ring-primary font-semibold ring-1",
                estCeJour && choisi && "ring-primary ring-2 ring-offset-1",
              )}
            >
              <span>{jour}</span>

              <span aria-hidden className="flex h-1 items-center gap-px">
                {Array.from(
                  { length: Math.min(compte?.total ?? 0, 3) },
                  (_, k) => (
                    <span
                      key={k}
                      className={cn(
                        "size-1 rounded-full",
                        choisi
                          ? "bg-current"
                          : compte?.retard
                            ? "bg-warning-subtle-foreground"
                            : "bg-muted-foreground",
                      )}
                    />
                  ),
                )}

                {/* Au-delà de trois, un trait d'abondance : compter des points
                    devient plus lent que lire le nombre, resté en infobulle. */}
                {(compte?.total ?? 0) > 3 ? (
                  <span
                    className={cn(
                      "h-1 w-1.5 rounded-full opacity-60",
                      choisi ? "bg-current" : "bg-muted-foreground",
                    )}
                  />
                ) : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
