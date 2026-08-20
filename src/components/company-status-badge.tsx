import type { Company } from "@/lib/types";

/**
 * L'état affiché combine deux informations distinctes : le statut de
 * l'entreprise, levier du back-office, et l'état effectif de son abonnement,
 * qui tient compte d'une échéance dépassée.
 *
 * Les confondre masquerait le motif réel du blocage — une entreprise active
 * dont l'abonnement a expiré n'est pas dans la même situation qu'une
 * entreprise suspendue commercialement.
 */
export function CompanyStatusBadge({ company }: { company: Company }) {
  const abonnement = company.subscription?.effective_status;

  const { libelle, classe } =
    company.status === "suspended"
      ? { libelle: "Suspendue", classe: "bg-destructive-subtle text-destructive" }
      : abonnement === "expired"
        ? { libelle: "Abonnement expiré", classe: "bg-warning-subtle text-warning" }
        : abonnement === "suspended"
          ? { libelle: "Abonnement suspendu", classe: "bg-warning-subtle text-warning" }
          : { libelle: "Active", classe: "bg-success-subtle text-success-foreground" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classe}`}
    >
      {libelle}
    </span>
  );
}
