import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CreditCard, Layers, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Paramètres",
};

/**
 * Les sections à venir sont listées mais désactivées, plutôt que masquées :
 * l'utilisateur voit ce que le produit couvrira, et ne cherche pas un réglage
 * qui n'existe pas encore.
 */
const SECTIONS = [
  {
    // Lot 9, décision P2 : l'abonnement est celui de l'entreprise, il quitte
    // la fiche projet pour vivre ici.
    href: "/parametres/abonnement",
    label: "Abonnement",
    description:
      "Votre plan, son échéance et la consommation de l'entreprise, tous projets confondus.",
    icon: CreditCard,
    disponible: true,
  },
  {
    href: "/parametres/variantes",
    label: "Variantes",
    description:
      "Déclinaisons de produit ou d'offre, utilisées comme axe de comparaison dans les rapports.",
    icon: Layers,
    disponible: true,
  },
  {
    href: "/parametres/utilisateurs",
    label: "Utilisateurs",
    description: "Comptes de votre entreprise, rôles et rattachement d'équipe.",
    icon: Users,
    disponible: false,
  },
  // La carte « Questionnaires — bientôt » est retirée (planche du lot 9) :
  // les questionnaires se règlent dans l'onglet Réglages de chaque projet, et
  // l'annoncer ici à venir laissait chercher un écran qui n'existera pas.
];

export default async function ParametresPage() {
  const user = await requireUser();

  if (user.role !== "admin_client") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Paramètres"
        description="Configuration de votre espace de travail."
      />

      <div className="grid max-w-3xl gap-3">
        {SECTIONS.map(({ href, label, description, icon: Icone, disponible }) => {
          const contenu = (
            <CardContent className="flex items-center gap-4 p-4">
              <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Icone className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-medium">
                  {label}
                  {!disponible ? (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      bientôt
                    </span>
                  ) : null}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {description}
                </p>
              </div>
              {disponible ? (
                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
              ) : null}
            </CardContent>
          );

          return disponible ? (
            <Card
              key={href}
              className="hover:border-ring hover:shadow-raised duration-(--duration-base) ease-brand transition-[color,background-color,border-color,box-shadow]"
            >
              <Link
                href={href}
                className="focus-visible:ring-ring/50 block rounded-xl focus-visible:ring-3 focus-visible:outline-none"
              >
                {contenu}
              </Link>
            </Card>
          ) : (
            <Card key={href} className="opacity-60">
              {contenu}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
