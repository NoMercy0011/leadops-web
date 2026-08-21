import {
  BarreFiltres,
  FamilleFiltre,
  LigneFiltre,
  RechercheFiltre,
  type OptionFiltre,
} from "@/components/filtres";
import type { ProspectFacets } from "@/lib/prospects";
import type { PipelineStage, Project, User } from "@/lib/types";

/**
 * Filtres de la liste des prospects.
 *
 * **Composant serveur, et c'est nouveau.** Les jetons sont des liens, la
 * recherche un formulaire GET : plus rien n'a besoin de tourner dans le
 * navigateur, alors que la version en listes déroulantes réclamait un
 * `useRouter`, un `useSearchParams` et une transition pour chaque changement.
 *
 * L'état reste dans l'URL, comme avant : un commercial qui partage « les
 * prospects non affectés du projet Santé » colle un lien, et le bouton
 * Précédent ramène le filtre d'avant.
 */
export function ProspectFilters({
  projets,
  utilisateurs,
  etapes,
  facettes,
  parametres,
  base = "/prospects",
}: {
  /**
   * Vide dans l'onglet Prospects d'un projet : le projet y est fixé par
   * l'URL, et proposer d'en changer ferait quitter la fiche sans le dire.
   */
  projets: Project[];
  utilisateurs: User[];
  etapes: PipelineStage[];
  facettes: ProspectFacets;
  parametres: URLSearchParams;
  base?: string;
}) {
  // Une facette absente vaut zéro : l'API ne renvoie que les groupes non
  // vides, et un jeton sans compte se lirait comme « compte inconnu ».
  const compte = (table: Record<string, number>, cle: string) =>
    table[cle] ?? 0;

  // Le total d'une famille se calcule sur ses propres facettes, jamais sur
  // celles d'une autre : sous le filtre « Qualifié », le jeton « Tous » de la
  // rangée Commercial doit annoncer quatre et non douze — c'est ce que
  // donnerait le retrait du seul filtre commercial.
  const totalDe = (table: Record<string, number>) =>
    Object.values(table).reduce((somme, n) => somme + n, 0);

  const optionsProjet: OptionFiltre[] = [
    {
      valeur: "",
      libelle: "Tous les projets",
      compte: totalDe(facettes.projects),
    },
    ...projets.map((projet) => ({
      valeur: String(projet.id),
      libelle: projet.name,
      compte: compte(facettes.projects, String(projet.id)),
    })),
  ];

  const optionsEtape: OptionFiltre[] = [
    { valeur: "", libelle: "Toutes", compte: totalDe(facettes.stages) },
    ...etapes.map((etape) => ({
      valeur: String(etape.id),
      libelle: etape.name,
      ton: etape.color,
      compte: compte(facettes.stages, String(etape.id)),
    })),
  ];

  // Les commerciaux d'abord, puis l'encadrement. Un tri par effectif serait
  // tentant, mais il ferait sauter les jetons de place à chaque filtre posé —
  // et une cible qui se déplace entre deux clics est le contraire de ce qu'on
  // cherche ici. Le rôle, lui, ne change pas : l'Admin et les managers, qui ne
  // portent presque jamais de dossiers, cessent de couper la rangée en deux.
  const RANG: Record<string, number> = {
    commercial: 0,
    manager: 1,
    admin_client: 2,
    super_admin: 3,
  };

  const membres = [...utilisateurs]
    .sort(
      (a, b) =>
        (RANG[a.role] ?? 9) - (RANG[b.role] ?? 9) ||
        a.name.localeCompare(b.name, "fr"),
    )
    .map((membre) => ({
      valeur: String(membre.id),
      libelle: membre.name,
      compte: compte(facettes.users, String(membre.id)),
    }));

  const optionsCommercial: OptionFiltre[] = [
    { valeur: "", libelle: "Tous", compte: totalDe(facettes.users) },
    ...membres,
    // Distribuer les non affectés est un geste quotidien : le choix reste au
    // bout de la rangée plutôt que noyé dans la liste des commerciaux.
    {
      valeur: "none",
      libelle: "Non affectés",
      compte: compte(facettes.users, "none"),
    },
  ];

  return (
    <BarreFiltres>
      <LigneFiltre>
        <RechercheFiltre
          base={base}
          parametres={parametres}
          placeholder="Nom, société, téléphone, email…"
        />
      </LigneFiltre>

      {projets.length > 0 ? (
        <LigneFiltre>
          <FamilleFiltre
            libelle="Projet"
            parametre="project_id"
            options={optionsProjet}
            valeurActive={parametres.get("project_id") ?? ""}
            base={base}
            parametres={parametres}
            // Changer de projet invalide l'étape retenue : les étapes
            // appartiennent à un projet précis, et garder l'ancienne donnerait
            // une liste vide sans que la cause soit visible.
            efface={["stage_id"]}
          />
        </LigneFiltre>
      ) : null}

      {/* Les étapes ne sont proposées qu'une fois un projet choisi : elles lui
          appartiennent, et une rangée mêlant les étapes de tous les projets
          n'aurait aucun sens. */}
      {etapes.length > 0 ? (
        <LigneFiltre>
          <FamilleFiltre
            libelle="Étape"
            parametre="stage_id"
            options={optionsEtape}
            valeurActive={parametres.get("stage_id") ?? ""}
            base={base}
            parametres={parametres}
          />
        </LigneFiltre>
      ) : null}

      {utilisateurs.length > 0 ? (
        <LigneFiltre>
          <FamilleFiltre
            libelle="Commercial"
            parametre="assigned_user_id"
            options={optionsCommercial}
            valeurActive={parametres.get("assigned_user_id") ?? ""}
            base={base}
            parametres={parametres}
          />
        </LigneFiltre>
      ) : null}
    </BarreFiltres>
  );
}
