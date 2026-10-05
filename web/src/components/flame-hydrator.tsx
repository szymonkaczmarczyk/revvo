import { getCurrentUser } from "@/server/auth/session";
import { viewerFlameState } from "@/server/flames";
import { FlameSync } from "./flame-sync";

export async function FlameHydrator({ keys }: { keys: string[] }) {
  const user = await getCurrentUser();
  if (!user) return <FlameSync signedIn={false} lit={[]} own={[]} />;
  const { lit, own } = await viewerFlameState(user.id, keys);
  return <FlameSync signedIn lit={lit} own={own} />;
}
