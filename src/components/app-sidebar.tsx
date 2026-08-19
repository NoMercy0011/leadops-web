import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChartNoAxesColumn,
  FolderKanban,
  LayoutDashboard,
  Users,
} from "lucide-react";

import { logout } from "@/app/(auth)/connexion/actions";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { User, UserRole } from "@/lib/types";

interface Entree {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Rôles autorisés. L'API reste seule juge ; ceci ne fait qu'épurer l'écran. */
  roles: UserRole[];
}

const TOUS: UserRole[] = ["admin_client", "manager", "commercial"];

const NAVIGATION: Entree[] = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard, roles: TOUS },
  { href: "/projets", label: "Projets", icon: FolderKanban, roles: ["admin_client", "manager"] },
  { href: "/prospects", label: "Prospects", icon: Users, roles: TOUS },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays, roles: TOUS },
  { href: "/rapports", label: "Rapports", icon: ChartNoAxesColumn, roles: ["admin_client", "manager"] },
];

const BACK_OFFICE: Entree[] = [
  { href: "/back-office/entreprises", label: "Entreprises", icon: Building2, roles: ["super_admin"] },
];

export function AppSidebar({ user }: { user: User }) {
  const entrees = (user.role === "super_admin" ? BACK_OFFICE : NAVIGATION).filter(
    (entree) => entree.roles.includes(user.role),
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-3">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded" />
          <span className="font-heading text-base font-semibold">LeadOps</span>
        </Link>
        <div
          className="mx-2 h-0.5 rounded-full"
          style={{ backgroundImage: "var(--brand-gradient)" }}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {user.role === "super_admin" ? "Back-office" : "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {entrees.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild>
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-2 px-2 pb-2">
          <div className="space-y-0.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-sidebar-foreground/70 truncate text-xs">
              {user.role_label}
              {user.company ? ` · ${user.company.name}` : ""}
            </p>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground hover:bg-sidebar-accent w-full justify-start"
            >
              Se déconnecter
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
