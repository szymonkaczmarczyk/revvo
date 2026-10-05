export type VehicleStatus = "daily" | "build" | "weekend" | "track";

export type Mod = { category: string; part: string };

export type TimelineKind = "mod" | "service" | "track" | "photo";

export type EntryPhoto = { id: string; url: string; thumbUrl: string; width: number; height: number };

export type TimelineEntry = {
  id?: string;
  date: string;
  title: string;
  kind: TimelineKind;
  mileageKm?: number | null;
  costPln?: number | null;
  note: string;
  createdAt?: string;
  flames: number;
  photos?: EntryPhoto[];
};

export type Vehicle = {
  id?: string;
  slug: string;
  owner: { id?: string; name: string; verifiedMechanic?: boolean };
  make: string;
  model: string;
  variant: string;
  year?: number | null;
  engine?: string | null;
  powerHp?: number | null;
  paintCode?: string | null;
  mileageKm?: number | null;
  status: VehicleStatus;
  photo?: string | null;
  photoIsCatalog?: boolean;
  generationId?: number;
  catalogPath?: string | null;
  flames: number;
  mods: Mod[];
  timeline: TimelineEntry[];
};

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  daily: "Daily",
  build: "W trakcie budowy",
  weekend: "Weekend Toy",
  track: "Projekt na tor",
};

export const STATUS_DESCRIPTION: Record<VehicleStatus, string> = {
  daily: "Jeździsz nim na co dzień",
  build: "Trwa budowa lub remont",
  weekend: "Wyjeżdża na weekendy i zloty",
  track: "Przygotowany na tor",
};

export const TIMELINE_LABEL: Record<TimelineKind, string> = {
  service: "Serwis",
  mod: "Modyfikacja",
  track: "Tor",
  photo: "Zdjęcia",
};

export const VEHICLE_STATUSES = Object.keys(STATUS_LABEL) as VehicleStatus[];

export function vehicleName(v: Pick<Vehicle, "make" | "model" | "variant">) {
  return [v.make, v.model, v.variant].filter(Boolean).join(" ");
}
