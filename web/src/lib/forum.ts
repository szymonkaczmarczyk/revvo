import type { Vehicle } from "./vehicles";

export type BadgeVehicle = Pick<Vehicle, "slug" | "owner" | "make" | "model" | "variant" | "photo" | "status">;

export type DiagnosisItem = { label: string; value: string };

export type ThreadSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  categoryName: string;
  createdAt: string;
  authorName: string;
  vehicle: BadgeVehicle | null;
  tags: string[];
  replies: number;
  flames: number;
  diagnosis: DiagnosisItem[] | null;
};

export type ThreadComment = {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  deleted: boolean;
  flames: number;
  authorName: string;
  vehicle: BadgeVehicle | null;
};

export type ThreadDetail = ThreadSummary & { body: string; comments: ThreadComment[] };

export function excerptFrom(markdown: string, length = 220) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > length ? `${plain.slice(0, length).replace(/\s+\S*$/, "")}…` : plain;
}
