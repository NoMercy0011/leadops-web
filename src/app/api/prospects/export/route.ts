import { NextResponse, type NextRequest } from "next/server";

import { getSessionToken } from "@/lib/session";

/**
 * Relais de téléchargement pour l'export CSV.
 *
 * Un `<a href>` pointant directement sur Laravel ne fonctionnerait pas :
 * le jeton Sanctum vit dans un cookie `httpOnly` détenu par le serveur Next et
 * n'accompagne pas une navigation du navigateur vers un autre domaine
 * (invariant n°6). Ce gestionnaire refait donc l'appel côté serveur, en
 * réémettant le flux tel quel.
 *
 * Rien n'est mis en mémoire : le corps est repassé en flux, sans quoi un export
 * volumineux — la volumétrie d'un plan Enterprise est illimitée — saturerait la
 * mémoire du processus Node.
 */
export async function GET(request: NextRequest) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 });
  }

  const base = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";
  const projectId = request.nextUrl.searchParams.get("project_id");
  const suffixe = projectId ? `?project_id=${encodeURIComponent(projectId)}` : "";

  const reponse = await fetch(`${base}/prospects/export${suffixe}`, {
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
      // Le nom de fichier est repris de l'API quand elle le fournit : c'est
      // elle qui connaît la date de l'export.
      "Content-Disposition":
        reponse.headers.get("content-disposition") ??
        'attachment; filename="prospects.csv"',
    },
  });
}
