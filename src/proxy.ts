import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

/**
 * Depuis Next.js 16, le middleware s'appelle Proxy et vit dans `src/proxy.ts`.
 *
 * Attention à ce que fait ce fichier — et surtout à ce qu'il ne fait pas.
 *
 * Il se borne à constater la *présence* du cookie de session pour éviter un
 * aller-retour inutile vers une page protégée. Il ne valide pas le jeton, ne
 * consulte pas l'API et ne décide d'aucune autorisation : la documentation
 * Next.js déconseille explicitement d'en faire une solution de session.
 *
 * La vraie barrière est côté Laravel, relayée par le Data Access Layer. Un
 * cookie forgé passera donc ce filtre, et sera rejeté juste après par l'API.
 */

const ROUTES_PUBLIQUES = ["/connexion", "/charte"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const aUnCookie = request.cookies.has(SESSION_COOKIE);
  const estPublique = ROUTES_PUBLIQUES.some((route) =>
    pathname.startsWith(route),
  );

  if (!aUnCookie && !estPublique && pathname !== "/") {
    const destination = new URL("/connexion", request.url);
    return NextResponse.redirect(destination);
  }

  if (aUnCookie && pathname === "/connexion") {
    return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
