import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Connexion",
};

export default async function ConnexionPage() {
  // Déjà connecté : inutile de repasser par le formulaire.
  if (await getCurrentUser()) {
    redirect("/tableau-de-bord");
  }

  return (
    <div className="space-y-8">
      {/* Le logo n'apparaît qu'en dessous de `lg` : au-dessus, il est déjà
          présent dans la colonne de marque, et le répéter ferait doublon. */}
      <Image
        src="/logo_large.png"
        alt="LeadOps"
        width={280}
        height={93}
        priority
        className="h-auto w-44 dark:brightness-110 lg:hidden"
      />

      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Connexion
        </h1>
        <p className="text-muted-foreground text-sm">
          Accédez à votre espace de prospection.
        </p>
      </div>

      {/* Pas de carte autour du formulaire. Sur un écran qui ne contient que
          lui, la carte n'a rien à séparer : elle ajoute une bordure et une
          surface de plus sans rien structurer. */}
      <LoginForm />
    </div>
  );
}
