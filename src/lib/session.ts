import "server-only";

import { cookies } from "next/headers";

export const SESSION_COOKIE = "leadops_token";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

/**
 * Le jeton Sanctum est conservé dans un cookie `httpOnly`, donc invisible au
 * JavaScript du navigateur. C'est ce qui empêche une faille XSS de l'exfiltrer.
 *
 * Il est stocké tel quel, sans chiffrement applicatif supplémentaire : le
 * cookie n'est jamais lu ailleurs que côté serveur, et le chiffrer n'ajouterait
 * qu'une clé à gérer sans fermer d'attaque réelle.
 */
export async function setSessionToken(token: string): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionToken(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
