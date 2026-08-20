import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/dal";

/**
 * Racine du site : un aiguillage, pas un écran.
 *
 * Le produit n'a pas de page publique — il n'y a ni inscription self-service ni
 * vitrine dans le périmètre MVP. Servir une page d'attente à cette adresse
 * ajouterait un clic entre l'utilisateur et son travail.
 *
 * L'aiguillage se fait ici et non dans le proxy : celui-ci ne sait que constater
 * la présence d'un cookie, alors que `getCurrentUser` interroge réellement
 * l'API. Un cookie périmé enverrait donc l'utilisateur sur un tableau de bord
 * qui le renverrait aussitôt à la connexion.
 */
export default async function Racine() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  // Le tableau de bord est l'accueil de tous les rôles, Super Admin compris :
  // les écrans du back-office arrivent au lot 2, et y envoyer aujourd'hui
  // produirait un 404 juste après la connexion.
  redirect("/tableau-de-bord");
}
