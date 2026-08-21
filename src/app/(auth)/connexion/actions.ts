"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { ApiError, apiFetch } from "@/lib/api";
import { clearSessionToken, setSessionToken } from "@/lib/session";
import type { LoginResponse } from "@/lib/types";

// Zod 4 : le message d'erreur se passe via `error`, et non plus `message`.
// `invalid_type_error`, `required_error` et `errorMap` ont été supprimés.
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { error: "L'adresse email est obligatoire." })
    .email({ error: "Adresse email invalide." }),
  password: z.string().min(1, { error: "Le mot de passe est obligatoire." }),
});

export interface LoginState {
  message?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);

    return {
      fieldErrors: {
        email: flattened.fieldErrors.email?.[0],
        password: flattened.fieldErrors.password?.[0],
      },
    };
  }

  try {
    const { token } = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { ...parsed.data, device_name: "leadops-web" },
      anonymous: true,
    });

    await setSessionToken(token);
  } catch (error) {
    if (error instanceof ApiError && error.isValidation) {
      // L'API renvoie un message unique, sans distinguer compte inconnu et
      // mot de passe faux : le reproduire tel quel évite de recréer côté
      // front l'oracle que l'API prend soin de ne pas offrir.
      return { message: error.firstError("email") ?? "Connexion impossible." };
    }

    return {
      message: "Le service est momentanément indisponible. Réessayez.",
    };
  }

  // `redirect` lève une exception de contrôle : il doit rester hors du `try`,
  // sinon le `catch` l'intercepterait et la connexion échouerait en silence.
  redirect("/tableau-de-bord");
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Jeton déjà invalide côté API : le cookie doit être purgé quand même,
    // sinon l'utilisateur reste bloqué sur une session fantôme.
  }

  await clearSessionToken();
  redirect("/connexion");
}
