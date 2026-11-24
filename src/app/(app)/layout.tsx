import { AppSidebar } from "@/components/app-sidebar";
import { FilAriane, FilArianeProvider } from "@/components/fil-ariane";
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
      <FilArianeProvider>
        <AppSidebar user={user} />

        {/* La coquille se fixe à la hauteur de la fenêtre, et c'est le contenu
            qui défile à l'intérieur — non plus le document.

            Sans cela, aucun écran ne peut décider de *ne pas* défiler : la
            coquille grandit avec lui et le navigateur fait défiler la page
            entière. Le calendrier, dont la grille doit occuper exactement la
            place disponible, le réclame ; tout écran plein comme un kanban en
            profitera de même.

            `svh` et non `vh` : sur mobile, `vh` ignore la barre d'outils et
            ampute le bas de l'écran. */}
        <SidebarInset className="h-svh overflow-hidden">
          {/* L'en-tête n'a plus besoin d'être `sticky` : il est désormais hors
              de la zone qui défile, donc fixe par construction. */}
          <header className="border-border bg-background flex h-14 shrink-0 items-center gap-2 border-b px-4">
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

          {/* La zone de défilement occupe toute la largeur, pour que la barre
              de défilement reste au bord de la fenêtre plutôt qu'au bord d'un
              conteneur centré.

              Un `div` et non un `main` : `SidebarInset` en est déjà un, et deux
              repères « principal » dans un document désorientent une navigation
              par landmarks autant qu'ils invalident le balisage.

              `min-h-full` sur le conteneur intérieur donne aux écrans qui le
              demandent une hauteur de référence : un enfant en `flex-1` y
              remplit la fenêtre, et l'écran ne défile pas. Les autres
              dépassent et défilent, exactement comme avant. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="page-container flex min-h-full flex-col px-4 py-6 sm:px-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </FilArianeProvider>
    </SidebarProvider>
  );
}
