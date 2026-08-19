import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireUser } from "@/lib/dal";

/**
 * Coque de l'espace authentifié.
 *
 * `requireUser` est la barrière réelle : elle interroge l'API et redirige si le
 * jeton est absent, expiré ou révoqué. Le proxy ne fait qu'une vérification
 * optimiste en amont, qu'un cookie forgé franchirait sans peine.
 */
export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="border-border bg-card/80 sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b px-4 backdrop-blur">
          <SidebarTrigger />
          <ModeToggle />
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
