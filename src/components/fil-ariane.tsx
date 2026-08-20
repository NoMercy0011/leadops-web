"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Fil d'Ariane dérivé de l'URL.
 *
 * L'en-tête ne portait jusqu'ici que la poignée de la navigation et le sélecteur
 * de thème : rien n'y disait où l'on était. Sur un produit qui descend à trois
 * niveaux — projet, prospect, fiche — c'est le repère qui manque le plus.
 *
 * Le libellé vient d'une table plutôt que du segment d'URL : « tableau-de-bord »
 * affiché tel quel serait à peine lisible, et la table permet aussi de nommer
 * correctement les segments accentués que l'URL ne peut pas porter.
 */
const LIBELLES: Record<string, string> = {
  "tableau-de-bord": "Tableau de bord",
  projets: "Projets",
  prospects: "Prospects",
  calendrier: "Calendrier",
  rapports: "Rapports",
  parametres: "Paramètres",
  "back-office": "Back-office",
  entreprises: "Entreprises",
  abonnements: "Abonnements",
  plans: "Plans",
};

/**
 * Repli pour un segment absent de la table — typiquement un identifiant. Un
 * nombre nu se lit mal en fil d'Ariane ; les écrans de détail remplaceront ce
 * segment par le nom réel de la ressource au fur et à mesure des lots.
 */
function libelle(segment: string): string {
  if (LIBELLES[segment]) {
    return LIBELLES[segment];
  }

  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }

  return segment.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function FilAriane() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const dernier = index === segments.length - 1;

          return (
            <Fragment key={href}>
              <BreadcrumbItem
                // Sur téléphone, seul le segment courant tient dans la barre.
                // Les parents restent atteignables par le bouton retour du
                // navigateur, qui est le geste naturel sur ce format.
                className={dernier ? undefined : "hidden sm:block"}
              >
                {dernier ? (
                  <BreadcrumbPage>{libelle(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{libelle(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {dernier ? null : (
                <BreadcrumbSeparator className="hidden sm:block" />
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
