"use client";

import { useEffect } from "react";
import { publishFlames } from "./flame-store";

export function FlameSync({ signedIn, lit, own }: { signedIn: boolean; lit: string[]; own: string[] }) {
  useEffect(() => {
    publishFlames({ signedIn, lit, own });
  }, [signedIn, lit, own]);
  return null;
}
