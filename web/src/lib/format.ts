const numberFormat = new Intl.NumberFormat("pl-PL");

export const MISSING = "nie podano";

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

export function withUnit(value: number | null | undefined, unit: string) {
  return value == null ? MISSING : `${numberFormat.format(value)} ${unit}`;
}

export function orMissing(value: string | number | null | undefined) {
  return value == null || value === "" ? MISSING : String(value);
}

const dateTimeFormat = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}

export function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form = count === 1 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many;
  return `${formatNumber(count)} ${form}`;
}
