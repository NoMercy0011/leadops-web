import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Layers } from "lucide-react";

import { VariantManager } from "./variant-manager";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/dal";
import { listVariants } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Variantes",
};

export default async function VariantesPage() {
  const user = await requireUser();

  // L'édition du vocabulaire de reporting reste à l'Admin Client : laisser
  // chacun créer des variantes recréerait le désordre que la table de
  // référence évite précisément.
  if (user.role !== "admin_client") {
    notFound();
  }

  const variantes = await listVariants();

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Variantes"
        description="Déclinaisons de produit ou d'offre. Elles servent d'axe de comparaison dans les rapports, ce pour quoi elles forment une liste fermée plutôt qu'un champ libre — une saisie libre produirait « Particulier », « particuliers » et « Particulier » comme trois lignes distinctes."
      />

      {variantes.length === 0 ? (
        <EmptyState
          icon={Layers}
          titre="Aucune variante"
          description="Créez vos déclinaisons d'offre — par exemple Particulier et Entreprise — pour pouvoir comparer leurs performances."
          action={<VariantManager variantes={[]} />}
        />
      ) : (
        <VariantManager variantes={variantes} />
      )}
    </div>
  );
}
