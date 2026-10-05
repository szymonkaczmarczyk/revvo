export function todayInPoland() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}
