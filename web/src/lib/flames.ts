export type FlameTarget = "vehicle" | "post" | "comment" | "entry";

export const flameKey = (type: FlameTarget, id: string) => `${type}:${id}`;
