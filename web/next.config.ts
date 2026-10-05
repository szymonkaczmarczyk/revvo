import type { NextConfig } from "next";

// Zdjęcia katalogowe serwowane z R2 (NEXT_PUBLIC_MEDIA_URL, np. https://pub-….r2.dev lub https://media.revvo.com)
const media = process.env.NEXT_PUBLIC_MEDIA_URL ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL) : null;

const csp = [
  "default-src 'self'",
  `img-src 'self' data: blob:${media ? ` ${media.origin}` : ""}`,
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-src https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Statyczny „shell” (np. hero garażu) jest prefetchowany → płynny morph miniatury; dane dynamiczne streamują się w Suspense
  cacheComponents: true,
  images: {
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
    remotePatterns: media
      ? ["/catalog/**", "/vehicles/**"].map((pathname) => ({
          protocol: media.protocol.replace(":", "") as "https",
          hostname: media.hostname,
          pathname,
        }))
      : [],
  },
};

export default nextConfig;
