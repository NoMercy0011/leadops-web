import { MapPin, Phone, Video } from "lucide-react";

import { StatusBadge, type Tone } from "@/components/status-badge";
import type { AppointmentStatus, AppointmentType } from "@/lib/types";

/**
 * Statut d'un rendez-vous.
 *
 * Ces quatre valeurs sont bien un enum côté API — contrairement aux étapes de
 * pipeline — et les mapper ici est donc légitime.
 *
 * « Annulé » et « Absent » reçoivent deux tons distincts : une annulation est
 * un fait neutre, une absence est un signal commercial qui appelle une
 * réaction. Les confondre visuellement effacerait cette différence.
 */
const TONS: Record<AppointmentStatus, Tone> = {
  planned: "info",
  completed: "success",
  cancelled: "neutral",
  no_show: "danger",
};

export function AppointmentStatusBadge({
  statut,
  libelle,
  enRetard = false,
}: {
  statut: AppointmentStatus;
  libelle: string;
  enRetard?: boolean;
}) {
  // Le retard n'est pas un statut mais un état calculé : il prime à
  // l'affichage parce qu'il appelle une action immédiate.
  if (enRetard) {
    return <StatusBadge tone="warning">À clôturer</StatusBadge>;
  }

  return <StatusBadge tone={TONS[statut]}>{libelle}</StatusBadge>;
}

const ICONES = {
  phone: Phone,
  video: Video,
  on_site: MapPin,
} as const;

export function AppointmentTypeIcon({
  type,
  libelle,
  className,
}: {
  type: AppointmentType;
  libelle: string;
  className?: string;
}) {
  const Icone = ICONES[type];

  // Le libellé accompagne toujours l'icône dans le nom accessible : une icône
  // seule ne dit rien à une synthèse vocale.
  return <Icone className={className} aria-label={libelle} />;
}
