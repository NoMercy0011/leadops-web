import { NextResponse, type NextRequest } from "next/server";

import { getSessionToken } from "@/lib/session";

/**
 * Relais de téléchargement pour l'export des rapports.
 *
 * Même raison que pour l'export des prospects : le jeton Sanctum vit dans un
 * cookie `httpOnly` détenu par le serveur Next et n'accompagne pas une
 * navigation du navigateur vers un autre domaine (invariant n°6). Le flux est
 * réémis tel quel, sans mise en mémoire.
 */
export async function GET(request: NextRequest) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const base = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

  // Les filtres sont repris tels quels : l'export doit correspondre
  // exactement à ce qui est affiché.
  const params = new URLSearchParams();
  for (const cle of ["project_id", "variant_id", "user_id", "from", "to"]) {
    const valeur = request.nextUrl.searchParams.get(cle);
    if (valeur) params.set(cle, valeur);
  }

  const suffixe = params.size > 0 ? `?${params}` : "";

  const reponse = await fetch(`${base}/reports/export${suffixe}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/csv" },
    cache: "no-store",
  });

  if (!reponse.ok) {
    return NextResponse.json(
      { message: "L'export a échoué." },
      { status: reponse.status },
    );
  }

  return new NextResponse(reponse.body, {
    headers: {
      "Content-Type": "text/csv; charset=UTF-8",
      "Content-Disposition":
        reponse.headers.get("content-disposition") ??
        'attachment; filename="rapport.csv"',
    },
  });
}
