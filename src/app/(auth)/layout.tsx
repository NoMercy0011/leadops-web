import Image from "next/image";

import { ModeToggle } from "@/components/mode-toggle";

/**
 * Coque des écrans non authentifiés : connexion, mot de passe oublié.
 *
 * Deux colonnes sur grand écran. Celle de droite n'est pas un ornement — c'est
 * le seul endroit du parcours où le produit peut dire ce qu'il est avant que
 * l'utilisateur n'entre. Elle disparaît sous `lg`, où l'espace vertical doit
 * aller au formulaire : sur un téléphone, une bannière de marque repousse les
 * champs sous la ligne de flottaison et oblige à faire défiler pour se
 * connecter.
 *
 * Le dégradé de marque est ici sur une surface d'accueil, ce que la direction
 * artistique autorise. Le texte qui l'accompagne est posé sur le navy plein,
 * jamais sur le dégradé lui-même : la règle du plan est explicite.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-1">
      <div className="flex flex-1 flex-col">
        <div className="flex justify-end p-4">
          <ModeToggle />
        </div>

        <main className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>

      <aside
        aria-hidden
        className="bg-sidebar text-sidebar-foreground relative hidden w-[46%] max-w-2xl overflow-hidden lg:flex lg:flex-col lg:justify-between"
      >
        {/* Halo de marque : le dégradé sert de lumière, très diffusé, et non
            d'aplat. Un dégradé plein derrière la colonne écraserait le navy,
            qui est ce qui identifie le produit. */}
        <div className="bg-brand-gradient pointer-events-none absolute -top-1/3 -right-1/4 size-[36rem] rounded-full opacity-25 blur-3xl" />

        <div className="relative p-12">
          <Image
            src="/logo_large.png"
            alt=""
            width={200}
            height={67}
            priority
            className="h-auto w-40 brightness-110"
          />
        </div>

        <div className="relative space-y-4 p-12">
          <div className="bg-brand-gradient h-1 w-16 rounded-full" />
          <p className="font-heading max-w-md text-2xl leading-snug font-semibold tracking-tight text-balance">
            Chaque projet garde sa cible, son questionnaire et son pipeline.
          </p>
          <p className="text-sidebar-foreground/70 max-w-md text-sm leading-relaxed">
            Pilotage des opérations de prospection commerciale, multi-entreprises
            et multi-projets.
          </p>
        </div>
      </aside>
    </div>
  );
}
