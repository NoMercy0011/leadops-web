"use client";

import { useTransition } from "react";
import { ChevronsUpDown, LoaderCircle, LogOut } from "lucide-react";

import { logout } from "@/app/(auth)/connexion/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { initiales } from "@/lib/format";
import type { User } from "@/lib/types";

/**
 * Identité et déconnexion, en pied de navigation.
 *
 * La déconnexion était auparavant un bouton posé à plat dans le pied : visible
 * en permanence, à un clic de distance, juste sous la souris quand on vise la
 * dernière entrée de navigation. Une action irréversible ne se place pas là.
 * Elle vit maintenant dans un menu, ce qui coûte un clic et supprime la
 * fausse manœuvre.
 *
 * Le menu affiche aussi l'entreprise : sur un produit multi-entreprises, savoir
 * dans quel périmètre on travaille n'est pas un détail de confort.
 */
export function UserMenu({ user }: { user: User }) {
  const { isMobile } = useSidebar();
  const [enCours, demarrer] = useTransition();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground duration-(--duration-fast) ease-brand transition-colors"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg text-xs font-semibold">
                  {initiales(user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="text-sidebar-foreground/70 truncate text-xs">
                  {user.role_label}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 opacity-70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 shadow-overlay"
            // Sur mobile la barre latérale est une feuille : ancrer le menu en
            // haut le ferait sortir de l'écran par le bas.
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="grid gap-0.5 text-left">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
                {user.company ? (
                  <span className="text-muted-foreground truncate pt-1 text-xs">
                    {user.company.name}
                  </span>
                ) : null}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={enCours}
              onSelect={(event) => {
                // Sans ceci, Radix referme le menu et démonte l'élément avant
                // que l'action serveur ne parte.
                event.preventDefault();
                demarrer(() => logout());
              }}
            >
              {enCours ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              {enCours ? "Déconnexion…" : "Se déconnecter"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
