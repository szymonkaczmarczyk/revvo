import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { AccountMenu } from "./account-menu";
import { SiteHeaderBar } from "./site-header-bar";

const mobileLink = "flex min-h-12 items-center rounded-md px-3 text-base font-medium hover:bg-white/5";

function GuestActions() {
  return (
    <>
      <Link
        href="/logowanie"
        className="hidden min-h-11 items-center rounded-md px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-white/5 sm:inline-flex"
      >
        Zaloguj się
      </Link>
      <Link
        href="/rejestracja"
        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-copper px-4 text-sm font-bold text-on-copper transition-[background-color,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:bg-copper-hover active:translate-y-0 active:bg-copper-press"
      >
        <Plus className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Załóż garaż</span>
        <span className="sm:hidden">Dołącz</span>
      </Link>
    </>
  );
}

async function AccountActions() {
  const user = await getCurrentUser();
  if (!user) return <GuestActions />;
  return <AccountMenu name={user.name} email={user.email} />;
}

async function MobileAccountLinks() {
  const user = await getCurrentUser();
  if (user) return null;
  return (
    <li className="sm:hidden">
      <Link href="/logowanie" className={`${mobileLink} text-cobalt-text`}>
        Zaloguj się
      </Link>
    </li>
  );
}

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <SiteHeaderBar
      overlay={overlay}
      account={
        <Suspense fallback={<div className="rv-skeleton h-11 w-28 rounded-md sm:w-56" aria-hidden="true" />}>
          <AccountActions />
        </Suspense>
      }
      mobileAccount={
        <Suspense>
          <MobileAccountLinks />
        </Suspense>
      }
    />
  );
}
