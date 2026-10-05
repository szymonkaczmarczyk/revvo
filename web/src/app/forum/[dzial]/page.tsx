import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForumLayout } from "@/components/forum-layout";
import { listThreads } from "@/server/forum/queries";
import { FORUM_CATEGORIES } from "@/server/forum/categories";

export function generateStaticParams() {
  return FORUM_CATEGORIES.map((c) => ({ dzial: c.slug }));
}

const find = (slug: string) => FORUM_CATEGORIES.find((c) => c.slug === slug);

export async function generateMetadata({ params }: PageProps<"/forum/[dzial]">): Promise<Metadata> {
  const c = find((await params).dzial);
  return c ? { title: c.name, description: c.description } : {};
}

export default async function CategoryPage({ params }: PageProps<"/forum/[dzial]">) {
  const { dzial } = await params;
  const category = find(dzial);
  if (!category) notFound();

  return (
    <ForumLayout
      eyebrow="Dział forum"
      title={category.name}
      description={category.description}
      threads={await listThreads(dzial)}
      active={dzial}
    />
  );
}
