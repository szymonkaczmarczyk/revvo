import type { NextConfig } from "next";

// Zdjęcia katalogowe serwowane z R2 (NEXT_PUBLIC_MEDIA_URL, np. https://pub-….r2.dev lub https://media.revvo.com)
const media = process.env.NEXT_PUBLIC_MEDIA_URL ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL) : null;

const nextConfig: NextConfig = {
  // Statyczny „shell” (np. hero garażu) jest prefetchowany → płynny morph miniatury; dane dynamiczne streamują się w Suspense
  cacheComponents: true,
  images: {
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
    remotePatterns: media
      ? [{ protocol: media.protocol.replace(":", "") as "https", hostname: media.hostname, pathname: "/catalog/**" }]
      : [],
  },
};

export default nextConfig;
