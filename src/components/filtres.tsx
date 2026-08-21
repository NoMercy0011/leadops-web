import Link from "next/link";
import { Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { formatNombre } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StageColor } from "@/lib/types";

/**
 * Filtres en jetons cliquables.
 *
 * **Pourquoi pas des listes déroulantes.** Une liste cache ses options : il
 * faut l'ouvrir pour apprendre quelles étapes existent, et filtrer coûte trois
 * gestes — ouvrir, parcourir, choisir. Les valeurs d'une famille tiennent
 * presque toujours sur une ligne ; affichées, elles filtrent en un clic et la
 * barre devient du même coup la légende du domaine.
 *
 * **Des liens, pas des boutons.** L'état vit dans l'URL : le filtre se partage,
 * se met en favori, et le bouton Précédent ramène le précédent. C'est aussi ce
 * qui permet à toute cette barre de rester un composant *serveur* — aucun
 * JavaScript n'est envoyé au navigateur pour la faire fonctionner, la recherche
 * comprise, qui est un simple formulaire GET.
 *
 * **L'état retenu ne repose pas sur la couleur.** Sur une bande où six jetons
 * portent six teintes, la couleur seule ne distinguerait pas le choisi des
 * autres. Le jeton actif prend son aplat *et* un filet *et* une coche *et* une
 * graisse plus forte.
 */

/** Teintes des étapes de pipeline — mêmes jetons que `StageChip`. */
const APLATS: Record<StageColor, string> = {
  slate: "bg-muted text-muted-foreground",
  blue: "bg-info-subtle text-info-subtle-foreground",
  teal: "bg-accent text-accent-foreground",
  sage: "bg-success-subtle text-success-subtle-foreground",
  amber: "bg-warning-subtle text-warning-subtle-foreground",
  violet: "bg-violet-subtle text-violet-subtle-foreground",
  rose: "bg-rose-subtle text-rose-subtle-foreground",
  red: "bg-destructive-subtle text-destructive-subtle-foreground",
};

const PUCES: Record<StageColor, string> = {
  slate: "text-muted-foreground",
  blue: "text-info-subtle-foreground",
  teal: "text-accent-foreground",
  sage: "text-success-subtle-foreground",
  amber: "text-warning-subtle-foreground",
  violet: "text-violet-subtle-foreground",
  rose: "text-rose-subtle-foreground",
  red: "text-destructive-subtle-foreground",
};

export interface OptionFiltre {
  /** Valeur du paramètre d'URL. La chaîne vide signifie « toutes ». */
  valeur: string;
  libelle: string;
  /** Teinte de l'aplat retenu. Absente, le jeton prend la couleur du texte. */
  ton?: StageColor;
  /** Nombre d'éléments derrière ce choix. Omis, aucun compte n'est affiché. */
  compte?: number;
}

/**
 * Construit l'URL d'un jeton : les filtres des *autres* familles sont
 * conservés, celui de la famille courante est remplacé.
 */
function lien(
  base: string,
  parametres: URLSearchParams,
  cle: string,
  valeur: string,
  efface: string[],
): string {
  const suivants = new URLSearchParams(parametres);

  if (valeur === "") {
    suivants.delete(cle);
  } else {
    suivants.set(cle, valeur);
  }

  // Changer de projet invalide l'étape retenue : les étapes appartiennent à un
  // projet précis, et garder l'ancienne donnerait une liste vide sans que la
  // cause soit visible.
  for (const autre of efface) suivants.delete(autre);

  return suivants.size > 0 ? `${base}?${suivants}` : base;
}

export function FamilleFiltre({
  libelle,
  parametre,
  options,
  valeurActive,
  base,
  parametres,
  efface = [],
}: {
  /** Nom de la famille, à gauche de la rangée. */
  libelle: string;
  /** Paramètre d'URL piloté par cette famille. */
  parametre: string;
  options: OptionFiltre[];
  valeurActive: string;
  base: string;
  parametres: URLSearchParams;
  /** Paramètres à effacer quand cette famille change. */
  efface?: string[];
}) {
  const id = `filtre-${parametre}`;

  return (
    <div className="grid gap-x-3 gap-y-1 sm:grid-cols-[6.5rem_1fr] sm:items-start">
      <span
        id={id}
        className="text-muted-foreground text-xs font-semibold tracking-wide uppercase sm:pt-1.5"
      >
        {libelle}
      </span>

      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const actif = option.valeur === valeurActive;
          const vide = option.compte === 0;

          return (
            <Link
              key={option.valeur || "toutes"}
              href={lien(base, parametres, parametre, option.valeur, efface)}
              aria-current={actif ? "page" : undefined}
              // Une facette vide reste proposée, en retrait : la masquer
              // ferait croire que la valeur n'existe pas, la proposer comme
              // les autres mènerait à une liste vide sans prévenir.
              className={cn(
                "duration-(--duration-fast) ease-brand inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.8125rem] whitespace-nowrap transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                actif
                  ? cn(
                      "border-current/30 font-semibold",
                      option.ton
                        ? APLATS[option.ton]
                        : "bg-foreground text-background border-transparent",
                    )
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent",
                vide && !actif && "opacity-45",
              )}
            >
              {option.ton && !actif ? (
                <span
                  aria-hidden
                  className={cn(
                    "size-2 shrink-0 rounded-full bg-current opacity-80",
                    PUCES[option.ton],
                  )}
                />
              ) : null}

              {option.libelle}

              {option.compte !== undefined ? (
                <span className="font-mono text-[0.6875rem] tabular-nums opacity-70">
                  {formatNombre(option.compte)}
                </span>
              ) : null}

              {actif ? <Check className="size-3 shrink-0" aria-hidden /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Champ de recherche, en formulaire GET.
 *
 * Aucun JavaScript : la soumission navigue vers `base` avec le terme saisi.
 * Les filtres des autres familles voyagent en champs cachés, sans quoi une
 * recherche les effacerait tous.
 */
export function RechercheFiltre({
  base,
  parametres,
  placeholder,
  parametre = "search",
}: {
  base: string;
  parametres: URLSearchParams;
  placeholder: string;
  parametre?: string;
}) {
  const autres = [...parametres.entries()].filter(([cle]) => cle !== parametre);

  return (
    <form action={base} className="relative w-full">
      {autres.map(([cle, valeur]) => (
        <input key={cle} type="hidden" name={cle} value={valeur} />
      ))}

      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        name={parametre}
        type="search"
        defaultValue={parametres.get(parametre) ?? ""}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-8"
      />
    </form>
  );
}

/**
 * Cadre de la barre de filtres : la recherche, puis les familles séparées par
 * un filet. Les regrouper dans une carte les distingue du contenu qu'ils
 * filtrent — sans quoi la bande se lit comme une première ligne de résultats.
 */
export function BarreFiltres({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border">
      <div className="divide-border flex flex-col divide-y px-4 py-1">
        {children}
      </div>
    </div>
  );
}

/** Une ligne de la barre — recherche ou famille. */
export function LigneFiltre({ children }: { children: React.ReactNode }) {
  return <div className="py-2.5">{children}</div>;
}
