import "server-only";

import { getSessionToken } from "@/lib/session";
import type { ValidationErrors } from "@/lib/types";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors?: ValidationErrors,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Identifiants refusés, ou champ invalide. */
  get isValidation(): boolean {
    return this.status === 422;
  }

  /** Jeton absent, expiré ou révoqué. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /**
   * Première erreur d'un champ donné, pour l'afficher sous le champ concerné.
   */
  firstError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Envoyer la requête sans jeton (connexion, mot de passe oublié). */
  anonymous?: boolean;
  /**
   * Par défaut la réponse est déballée de son enveloppe `data`, qui n'apporte
   * rien à l'appelant. Passer `false` pour une collection paginée, dont le
   * bloc `meta` porte le nombre de pages et serait perdu au déballage.
   */
  unwrap?: boolean;
}

/**
 * Unique point de sortie réseau vers l'API — invariant n°6 du CLAUDE.md.
 *
 * Le module est marqué `server-only` : toute tentative de l'importer depuis un
 * composant client échoue à la compilation, ce qui garantit que le jeton ne
 * quitte jamais le serveur.
 */
export async function apiFetch<T>(
  path: string,
  { body, anonymous = false, unwrap = true, headers, ...init }: ApiOptions = {},
): Promise<T> {
  const token = anonymous ? null : await getSessionToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Les données métier sont cloisonnées par utilisateur : les mettre en cache
    // exposerait la réponse d'une entreprise à une autre.
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? `L'API a répondu ${response.status}.`,
      payload?.errors,
      payload?.code,
    );
  }

  return (unwrap ? (payload?.data ?? payload) : payload) as T;
}
