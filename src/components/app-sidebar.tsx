import Image from "next/image";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { UserMenu } from "@/components/user-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { User } from "@/lib/types";

/**
 * Bandeau navy pleine hauteur — écho direct au mot « Lead » du logo, et parti
 * pris central de la direction artistique : la profondeur du produit vient du
 * contraste entre ce bandeau, le canevas clair et les cartes blanches, pas
 * d'ombres portées.
 *
 * Composant serveur : il ne fait que distribuer l'utilisateur aux deux îlots
 * interactifs (navigation active, menu de compte). Le garder serveur évite
 * d'envoyer au navigateur la table de navigation et ses icônes.
 */
export function AppSidebar({ user }: { user: User }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/tableau-de-bord">
                <Image
                  src="/logo.png"
                  alt=""
                  width={32}
                  height={32}
                  priority
                  className="size-8 shrink-0 rounded-md"
                />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="font-heading truncate text-base font-semibold">
                    LeadOps
                  </span>
                  <span className="text-sidebar-foreground/70 truncate text-xs">
                    {user.company?.name ?? "Administration"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Le dégradé signature, en filet. Réduit en mode replié, où il
            deviendrait un trait coloré sans signification. */}
        <div
          aria-hidden
          className="bg-brand-gradient mx-2 h-0.5 rounded-full group-data-[collapsible=icon]:mx-1"
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain role={user.role} />
      </SidebarContent>

      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>

      {/* Poignée de redimensionnement : replier la navigation au clavier ou
          d'un clic sur le bord est attendu sur un outil utilisé toute la
          journée, où l'espace horizontal des tableaux compte. */}
      <SidebarRail />
    </Sidebar>
  );
}
