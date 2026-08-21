import { CircleCheck, Clock, UserMinus, Users } from "lucide-react";

import { StatTile } from "@/components/stat-tile";
import type { ProspectSummary } from "@/lib/types";

/**
 * En-tête chiffré de la liste des prospects.
 *
 * **Hiérarchie de lecture.** Les cinq chiffres que l'API renvoie n'ont pas le
 * même poids pour qui ouvre cet écran le matin. « À relancer » est le seul qui
 * appelle une action immédiate : il occupe donc deux colonnes et affiche sa
 * valeur en `text-4xl`, contre `text-2xl` pour les autres. Le reste — volume,
 * non affectés, convertis — est du contexte, et une rangée de quatre tuiles
 * identiques obligerait à les lire une à une pour retrouver celle qui compte.
 *
 * **Ce qui n'est pas affiché.** Les perdus. Le compte existe côté API et sert
 * au taux de conversion des rapports, mais sur un écran de travail il
 * n'appelle rien : le mettre au même rang que les relances en retard diluerait
 * précisément ce qu'on cherche à faire ressortir.
 *
 * Les chiffres portent sur le **filtre entier**, pas sur la page affichée —
 * c'est pourquoi ils viennent de l'API et ne sont pas recalculés ici.
 */
export function ProspectSummaryStrip({
  resume,
  filtres,
}: {
  resume: ProspectSummary;
  /** Filtres courants, à conserver dans les liens des tuiles cliquables. */
  filtres: URLSearchParams;
}) {
  function lienVers(parametres: Record<string, string>): string {
    const query = new URLSearchParams(filtres);

    for (const [cle, valeur] of Object.entries(parametres)) {
      query.set(cle, valeur);
    }

    return `/prospects?${query.toString()}`;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatTile
        className="lg:col-span-2"
        taille="lg"
        label="À relancer"
        valeur={resume.en_retard}
        icon={Clock}
        // L'accent n'apparaît que s'il y a matière : colorer un zéro en
        // alerte crie sans raison, et l'œil finit par ignorer la couleur.
        accent={resume.en_retard > 0 ? "warning" : undefined}
        detail={
          resume.en_retard > 0
            ? "Relances planifiées dont la date est passée. Les dossiers convertis ou perdus n'y figurent pas."
            : "Aucune relance en retard sur ce périmètre."
        }
      />

      <StatTile
        label="Prospects"
        valeur={resume.total}
        icon={Users}
        detail="Sur le filtre courant"
      />

      <StatTile
        label="Non affectés"
        valeur={resume.non_affectes}
        icon={UserMinus}
        // Seule tuile cliquable : c'est le seul de ces comptes que l'API sait
        // filtrer. Rendre les autres cliquables vers un filtre inexistant
        // serait une promesse creuse.
        href={
          resume.non_affectes > 0
            ? lienVers({ assigned_user_id: "none" })
            : undefined
        }
        detail={resume.non_affectes > 0 ? "Voir la liste" : "Tout est réparti"}
      />

      <StatTile
        label="Convertis"
        valeur={resume.convertis}
        icon={CircleCheck}
        accent={resume.convertis > 0 ? "success" : undefined}
      />
    </div>
  );
}
