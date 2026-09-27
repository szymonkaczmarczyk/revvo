import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Syncopate } from "next/font/google";
import "./globals.css";

const syncopate = Syncopate({
  variable: "--font-syncopate",
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://revvo.com"),
  applicationName: "Revvo",
  title: {
    default: "Revvo — forum motoryzacyjne z Wirtualnym Garażem",
    template: "%s · Revvo",
  },
  description:
    "Forum motoryzacyjne, na którym Twoją tożsamością jest auto. Build-logi, historia modyfikacji, wyszukiwarka setupów i Garaż Miesiąca.",
};

export const viewport: Viewport = {
  themeColor: "#14161B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${syncopate.variable} ${manrope.variable} ${jetbrains.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <div className="rv-ambient" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
