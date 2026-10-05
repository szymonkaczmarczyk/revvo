import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { listThreadSlugs } from "@/server/forum/queries";
import { listVehicleSlugs } from "@/server/garage/queries";
import { getCatalogOverview } from "@/server/catalog/queries";
import { FORUM_CATEGORIES } from "@/server/forum/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? SITE.url;
  const [makes, threads, vehicles] = await Promise.all([getCatalogOverview(), listThreadSlugs(), listVehicleSlugs()]);

  const paths = [
    "/",
    "/forum",
    "/katalog",
    "/kontakt",
    "/regulamin",
    "/polityka-prywatnosci",
    ...FORUM_CATEGORIES.map((category) => `/forum/${category.slug}`),
    ...threads.map((thread) => `/forum/watek/${thread.slug}`),
    ...vehicles.map((vehicle) => `/garaz/${vehicle.slug}`),
    ...makes.flatMap((make) => make.models.map((model) => `/katalog/${make.slug}/${model.modelSlug}`)),
  ];

  return paths.map((path) => ({ url: `${base}${path === "/" ? "" : path}` }));
}
