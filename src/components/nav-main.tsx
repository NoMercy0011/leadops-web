"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/types";

/**
 * Navigation principale.
 *
 * Composant client, et pour une seule raison : l'état actif. Sans lui, la
 * navigation ne dit pas où l'on se trouve, ce qui est le défaut d'ergonomie le
 * plus coûteux d'une application à onglets — l'utilisateur perd le fil à chaque
 * retour d'un formulaire.
 *
 * Le filtrage par rôle n'épure que l'écran. Il ne protège rien : l'autorisation
 * est tranchée par l'API, et masquer une entrée ne rend pas son URL
 * inaccessible. C'est écrit ici pour qu'aucune relecture ne s'y trompe.
 */

interface Entree {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

interface Groupe {
  label: string;
  entrees: Entree[];
}

const TOUS: UserRole[] = ["admin_client", "manager", "commercial"];
const ENCADREMENT: UserRole[] = ["admin_client", "manager"];

/** Navigation de l'espace entreprise. */
const ESPACE_ENTREPRISE: Groupe[] = [
  {
    label: "Pilotage",
    entrees: [
      {
        href: "/tableau-de-bord",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        roles: TOUS,
      },
      {
        href: "/rapports",
        label: "Rapports",
        icon: ChartNoAxesColumn,
        roles: ENCADREMENT,
      },
    ],
  },
  {
    label: "Prospection",
    entrees: [
      {
        href: "/projets",
        label: "Projets",
        icon: FolderKanban,
        // Ouvert aussi aux commerciaux : l'API leur renvoie les seuls projets
        // où ils sont affectés, et consulter le pipeline de son projet fait
        // partie du travail quotidien. Seule l'édition leur est refusée.
        roles: TOUS,
      },
      { href: "/prospects", label: "Prospects", icon: Users, roles: TOUS },
      {
        href: "/calendrier",
        label: "Calendrier",
        icon: CalendarDays,
        roles: TOUS,
      },
    ],
  },
  {
    label: "Administration",
    entrees: [
      {
        href: "/parametres",
        label: "Paramètres",
        icon: Settings,
        roles: ["admin_client"],
      },
    ],
  },
];

/** Navigation du back-office, réservée au Super Admin. */
const BACK_OFFICE: Groupe[] = [
  {
    label: "Pilotage",
    entrees: [
      {
        href: "/tableau-de-bord",
        label: "Tableau de bord",
        icon: LayoutDashboard,
        roles: ["super_admin"],
      },
    ],
  },
  {
    label: "Plateforme",
    entrees: [
      {
        href: "/back-office/entreprises",
        label: "Entreprises",
        icon: Building2,
        roles: ["super_admin"],
      },
      {
        href: "/back-office/abonnements",
        label: "Abonnements",
        icon: CreditCard,
        roles: ["super_admin"],
      },
    ],
  },
];

/**
 * Une entrée est active sur sa page et sur ses sous-pages : la fiche d'un
 * prospect doit garder « Prospects » allumé. Le préfixe est suivi d'un `/` pour
 * qu'un futur `/projets-archives` n'allume pas `/projets`.
 */
function estActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavMain({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const groupes = role === "super_admin" ? BACK_OFFICE : ESPACE_ENTREPRISE;

  return (
    <>
      {groupes.map((groupe) => {
        const entrees = groupe.entrees.filter((entree) =>
          entree.roles.includes(role),
        );

        // Un groupe dont toutes les entrées sont masquées ne doit pas laisser
        // son titre orphelin.
        if (entrees.length === 0) {
          return null;
        }

        return (
          <SidebarGroup key={groupe.label}>
            <SidebarGroupLabel>{groupe.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {entrees.map(({ href, label, icon: Icone }) => {
                  const active = estActive(pathname, href);

                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={label}
                        className="duration-(--duration-fast) ease-brand transition-colors"
                      >
                        <Link
                          href={href}
                          // Redondance volontaire avec `data-active` : celui-ci
                          // est un attribut de style, `aria-current` est ce que
                          // lit une synthèse vocale.
                          aria-current={active ? "page" : undefined}
                        >
                          <Icone />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}
