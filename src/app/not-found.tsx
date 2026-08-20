import Link from "next/link";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

/**
 * 404 global.
 *
 * Il sert deux cas très différents, et c'est pour cela que le message reste
 * neutre : une URL réellement inexistante, et une ressource qui existe mais
 * qu'un autre tenant possède. L'API répond 404 dans ce second cas — jamais 403 —
 * précisément pour ne pas révéler l'existence de la ressource. Le front doit
 * tenir la même ligne : distinguer les deux ici annulerait la précaution prise
 * côté serveur.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <EmptyState
        className="max-w-lg border-none"
        icon={Compass}
        titre="Page introuvable"
        description="Cette adresse ne correspond à rien, ou la ressource demandée n'est pas accessible depuis votre compte."
        action={
          <Button asChild>
            <Link href="/tableau-de-bord">Retour au tableau de bord</Link>
          </Button>
        }
      />
    </main>
  );
}
