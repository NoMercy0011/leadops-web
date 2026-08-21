"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface Onglet {
  libelle: string;
  suffixe: string;
  icone: LucideIcon;
}

/**
 * Les onglets sont définis ici, dans le composant client, et non dans le
 * layout serveur qui les afficherait.
 *
 * Ce n'est pas un choix d'organisation : une icône de lucide est une
 * *fonction*, et React refuse de faire passer une fonction d'un composant
 * serveur à un composant client — rien ne saurait la sérialiser. Le layout
 * échouait donc à chaque rendu, et la page entière tombait sur sa frontière
 * d'erreur. Le serveur ne transmet plus que des données : l'identifiant du
 * projet, et l'affichage ou non de l'onglet Abonnement.
 */
const ONGLETS: Onglet[] = [
  { libelle: "Tableau de bord", suffixe: "", icone: LayoutDashboard },
  { libelle: "Prospects", suffixe: "/prospects", icone: Users },
  { libelle: "Rendez-vous", suffixe: "/rendez-vous", icone: CalendarDays },
  { libelle: "Abonnement", suffixe: "/abonnement", icone: CreditCard },
  { libelle: "Back office", suffixe: "/back-office", icone: Settings2 },
];

/**
 * Sections de la fiche projet.
 *
 * **Des liens, pas un `role="tablist"`.** Le réflexe est de reprendre les
 * attributs ARIA d'onglets, mais ils décrivent un composant qui affiche et
 * masque des panneaux déjà présents dans la page. Ici chaque section est une
 * URL : elle se partage, se met en favori, revient avec le bouton Précédent,
 * et son contenu n'est chargé qu'à la demande. Annoncer un `tablist` ferait
 * attendre à un lecteur d'écran une navigation aux flèches et un `tabpanel`
 * associé, dont rien n'existe. La sémantique juste est `nav` + `aria-current`.
 *
 * Volontairement sans compteurs ni pastilles : les afficher obligerait le
 * layout à interroger l'agenda et l'audit de qualité à *chaque* section, pour
 * répéter des nombres que le tableau de bord donne en grand. Une barre de
 * navigation indique où aller, pas ce qui s'y trouve.
 */
export function OngletsProjet({
  projectId,
  avecAbonnement,
}: {
  projectId: number;
  /**
   * L'API réserve la lecture de l'abonnement à l'Admin Client : proposer
   * l'onglet aux autres rôles mènerait à une page 404 annoncée.
   */
  avecAbonnement: boolean;
}) {
  const chemin = usePathname();
  const base = `/projets/${projectId}`;

  const visibles = ONGLETS.filter(
    (onglet) => avecAbonnement || onglet.suffixe !== "/abonnement",
  );

  return (
    <nav aria-label="Sections du projet" className="border-b">
      {/* `-mb-px` fait mordre le soulignement de l'onglet actif sur la bordure
          du conteneur, au lieu de flotter un pixel au-dessus. */}
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {visibles.map((onglet) => {
          const href = `${base}${onglet.suffixe}`;

          // Le tableau de bord est le seul segment sans suffixe : un
          // `startsWith` le rendrait actif sur toutes les autres sections.
          const actif =
            onglet.suffixe === "" ? chemin === href : chemin.startsWith(href);

          const Icone = onglet.icone;

          return (
            <li key={onglet.suffixe}>
              <Link
                href={href}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  // Resserré : la barre est le cadre, pas le contenu. Le texte
                  // reste en `text-sm` — le rétrécir aussi rendrait la
                  // navigation moins lisible que ce qu'elle encadre, ce qui
                  // n'économiserait que quelques pixels pour un vrai coût.
                  "duration-(--duration-fast) ease-brand flex items-center gap-1.5 border-b-2 px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors",
                  "focus-visible:ring-ring rounded-t-sm focus-visible:ring-2 focus-visible:outline-none",
                  actif
                    ? "border-primary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                <Icone
                  className={cn("size-3.5", actif ? "text-primary" : undefined)}
                  aria-hidden
                />
                {onglet.libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
