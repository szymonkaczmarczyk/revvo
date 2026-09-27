import Image from "next/image";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-[100svh] flex-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/video/background-revvo-poster.webp"
          alt=""
          fill
          sizes="50vw"
          preload
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-md font-display text-2xl font-bold uppercase leading-tight tracking-tight text-ink">
            Twoje auto.
            <span className="block text-copper">Twoja tożsamość.</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </main>
  );
}
