import { AppSidebar } from "@/components/app-sidebar";
import { FilAriane } from "@/components/fil-ariane";
import { ModeToggle } from "@/components/mode-toggle";
import { Notice } from "@/components/notice";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { requireUser } from "@/lib/dal";

/**
 * Coque de l'espace authentifié.
 *
 * `requireUser` est la barrière réelle : elle interroge l'API et redirige si le
 * jeton est absent, expiré ou révoqué. Le proxy ne fait qu'une vérification
 * optimiste en amont, qu'un cookie forgé franchirait sans peine.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const ecritureBloquee = Boolean(user.company && !user.company.allows_writes);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />

      <SidebarInset>
        {/* L'en-tête reste au-dessus du contenu qui défile. Le fond translucide
            évite la barre opaque qui coupe la page en deux, et le flou garde le
            texte lisible quand un tableau passe dessous. */}
        <header className="border-border bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <FilAriane />

          <div className="ml-auto flex items-center gap-1">
            <ModeToggle />
          </div>
        </header>

        {/* L'abonnement bloqué est un état global, pas une particularité du
            tableau de bord : le bandeau vit donc dans la coque, où il suit
            l'utilisateur sur tous les écrans où il pourrait tenter d'écrire. */}
        {ecritureBloquee ? (
          <div className="page-container px-4 pt-4 sm:px-6">
            <Notice variant="warning" titre="Enregistrement suspendu">
              L&apos;abonnement de votre entreprise ne permet plus
              d&apos;enregistrer de modifications. La consultation et
              l&apos;export restent disponibles.
            </Notice>
          </div>
        ) : null}

        <main className="page-container flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
