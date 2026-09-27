import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { slugify } from "@/server/catalog/translate";

export type LegalDoc = {
  title: string;
  updated: string;
  effective: string;
  body: string;
  toc: { id: string; title: string }[];
  hasPlaceholders: boolean;
};

/** Dokumenty prawne żyją w web/content/prawne/*.md — edytuj je jak zwykły tekst. */
export async function getLegalDoc(name: "regulamin" | "polityka-prywatnosci"): Promise<LegalDoc> {
  "use cache";
  cacheLife("max"); // treść zmienia się tylko przy nowym buildzie
  const raw = await readFile(path.join(process.cwd(), "content/prawne", `${name}.md`), "utf8");
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = Object.fromEntries(
    (fm?.[1] ?? "")
      .split("\n")
      .map((l) => l.match(/^(\w+):\s*"?(.*?)"?$/))
      .filter(Boolean)
      .map((m) => [m![1], m![2]]),
  );
  const body = fm ? raw.slice(fm[0].length) : raw;
  const toc = [...body.matchAll(/^## (.+)$/gm)].map((m) => ({ id: slugify(m[1]), title: m[1] }));
  const hasPlaceholders = /\[\[.+?\]\]/.test(raw);

  return {
    title: meta.title ?? name,
    updated: meta.updated ?? "",
    effective: meta.effective ?? "",
    // [[pole do uzupełnienia]] → link-znacznik, renderowany jako podświetlenie
    body: body.replace(/\[\[(.+?)\]\]/g, (_, t: string) => `[${t}](#uzupelnij)`),
    toc,
    hasPlaceholders,
  };
}
