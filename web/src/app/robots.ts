import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? SITE.url;
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/logowanie", "/rejestracja"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
