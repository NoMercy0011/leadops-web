import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/dal";

/**
 * La racine n'affiche rien : elle oriente vers l'espace applicatif ou vers la
 * connexion selon l'état de la session.
 */
export default async function Home() {
  const user = await getCurrentUser();

  redirect(user ? "/tableau-de-bord" : "/connexion");
}
