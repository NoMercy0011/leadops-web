import Image from "next/image";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

/**
 * Page d'attente. L'écran d'accueil réel sera la redirection vers le tableau
 * de bord ou l'écran de connexion, mis en place au lot 1.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="absolute top-6 right-6">
        <ModeToggle />
      </div>

      <Image
        src="/logo_large.png"
        alt="LeadOps"
        width={420}
        height={140}
        priority
        className="h-auto w-full max-w-sm dark:brightness-110"
      />

      <p className="text-muted-foreground max-w-md text-center text-balance">
        Plateforme de pilotage des opérations de prospection commerciale,
        multi-entreprises et multi-projets.
      </p>

      <div
        className="h-1.5 w-40 rounded-full"
        style={{ backgroundImage: "var(--brand-gradient)" }}
      />

      <Button asChild>
        <Link href="/charte">Voir la charte graphique</Link>
      </Button>
    </main>
  );
}
