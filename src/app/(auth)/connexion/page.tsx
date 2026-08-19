import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="absolute top-6 right-6">
        <ModeToggle />
      </div>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo_large.png"
            alt="LeadOps"
            width={280}
            height={93}
            priority
            className="h-auto w-52 dark:brightness-110"
          />
          <div
            className="h-1 w-24 rounded-full"
            style={{ backgroundImage: "var(--brand-gradient)" }}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Accédez à votre espace de prospection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
