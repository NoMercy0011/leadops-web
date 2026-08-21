import { StatusBadge, type Tone } from "@/components/status-badge";
import type { Company } from "@/lib/types";

/**
 * L'état affiché combine deux informations distinctes : le statut de
 * l'entreprise, levier du back-office, et l'état effectif de son abonnement,
 * qui tient compte d'une échéance dépassée.
 *
 * Les confondre masquerait le motif réel du blocage — une entreprise active
 * dont l'abonnement a expiré n'est pas dans la même situation qu'une
 * entreprise suspendue commercialement.
 *
 * Le rendu délègue à `StatusBadge` : ce composant décide *quel* état est en
 * cause, pas *à quoi il ressemble*. Réécrire les aplats ici ferait diverger le
 * back-office du reste du produit à la première retouche de palette.
 */
export function CompanyStatusBadge({ company }: { company: Company }) {
  const abonnement = company.subscription?.effective_status;

  const { libelle, tone }: { libelle: string; tone: Tone } =
    company.status === "suspended"
      ? { libelle: "Suspendue", tone: "danger" }
      : abonnement === "expired"
        ? { libelle: "Abonnement expiré", tone: "warning" }
        : abonnement === "suspended"
          ? { libelle: "Abonnement suspendu", tone: "warning" }
          : { libelle: "Active", tone: "success" };

  return <StatusBadge tone={tone}>{libelle}</StatusBadge>;
}
