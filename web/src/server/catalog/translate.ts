/**
 * Normalizacja i poprawki tłumaczeń katalogu car2db (baza-danych/).
 * Zrzut jest „po polsku”, ale maszynowo tłumaczony z rosyjskiego — stąd m.in. „Rządny” (= rzędowy),
 * „Wariatorem” (= CVT), „Pełna wtyczka” (= 4×4 dołączany), „drugi” jako jednostka (= sekunda).
 */

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const capitalize = (s: string) => (s ? s[0].toLocaleUpperCase("pl-PL") + s.slice(1) : s);

/* ── Generacje: „9 pokolenia [odnowiony]” → „IX generacja (lifting)” ── */
export function translateGeneration(raw: string): { name: string; facelift: number } {
  const m = raw.trim().match(/^(.*?)\s*(?:\[(\d+\s*)?odnowiony\])?$/i)!;
  const base = m[1].trim();
  const lifting = raw.includes("odnowiony") ? Number(m[2]?.trim() || 1) : 0;
  const gen = base.match(/^(\d+)\s+pokolenia$/i);
  const name = gen ? `${ROMAN[Number(gen[1])] ?? gen[1]} generacja` : base;
  const suffix = lifting === 0 ? "" : lifting === 1 ? " (lifting)" : ` (${lifting}. lifting)`;
  return { name: name + suffix, facelift: lifting };
}

/* ── Nadwozia ── */
const BODY_TYPES: [RegExp, string][] = [
  [/\bsedan\b/i, "Sedan"],
  [/\bhatchback\b/i, "Hatchback"],
  [/\bliftback\b/i, "Liftback"],
  [/\bkombi\b/i, "Kombi"],
  [/\bcoupe\b/i, "Coupe"],
  [/\bcabrio\b/i, "Kabriolet"],
  [/\broadster\b/i, "Roadster"],
  [/\btarga\b/i, "Targa"],
  [/\bhardtop\b/i, "Hardtop"],
  [/\bminivan\b/i, "Minivan"],
  [/\bcrossover\b/i, "Crossover"],
  [/\bsuv\b/i, "SUV"],
  [/\bpickup\b/i, "Pikap"],
];

export function bodyTypeOf(text: string): string | null {
  for (const [re, name] of BODY_TYPES) if (re.test(text)) return name;
  return null;
}

/** „US-spec Sedan 4-drzwi” → „Sedan 4-drzwiowy (wersja USA)” */
export function translateSerie(raw: string): string {
  let s = raw.trim();
  let market = "";
  const spec = s.match(/^(US|JP)-spec\s+/i);
  if (spec) {
    market = spec[1].toUpperCase() === "US" ? " (wersja USA)" : " (wersja japońska)";
    s = s.slice(spec[0].length);
  }
  s = s
    .replace(/(\d)-drzwi\b/g, "$1-drzwiowy")
    .replace(/\bcabrio\b/gi, "kabriolet")
    .replace(/\bpickup\b/gi, "pikap")
    .replace(/\bsuv\b/gi, "SUV");
  return capitalize(s) + market;
}

/* ── Specyfikacje: nazwy grup i parametrów ── */
export const SPEC_NAMES: Record<number, string> = {
  1: "Nadwozie",
  2: "Typ nadwozia",
  4: "Liczba miejsc",
  5: "Długość",
  6: "Szerokość",
  7: "Wysokość",
  8: "Rozstaw osi",
  9: "Rozstaw kół – przód",
  10: "Rozstaw kół – tył",
  11: "Silnik",
  12: "Typ silnika",
  13: "Pojemność skokowa",
  14: "Moc",
  15: "Obroty mocy maksymalnej",
  16: "Maksymalny moment obrotowy",
  17: "Układ zasilania",
  19: "Układ cylindrów",
  20: "Liczba cylindrów",
  22: "Paliwo",
  23: "Układ napędowy",
  24: "Skrzynia biegów",
  26: "Liczba biegów",
  27: "Napęd",
  29: "Hamulce przednie",
  30: "Hamulce tylne",
  31: "Osiągi i eksploatacja",
  32: "Prędkość maksymalna",
  33: "Przyspieszenie 0–100 km/h",
  34: "Masa własna",
  35: "Pojemność zbiornika paliwa",
  37: "Norma emisji spalin",
  38: "Prześwit",
  39: "Liczba zaworów na cylinder",
  40: "Zawieszenie i hamulce",
  41: "Zawieszenie przednie",
  42: "Zawieszenie tylne",
  44: "Pojemność bagażnika (maks.)",
  45: "Pojemność bagażnika (min.)",
  46: "Doładowanie",
  47: "Średnica cylindra",
  48: "Skok tłoka",
  50: "Zużycie paliwa – miasto",
  51: "Zużycie paliwa – trasa",
  52: "Zużycie paliwa – cykl mieszany",
  57: "Średnica zawracania",
  58: "Dopuszczalna masa całkowita",
  62: "Zasięg",
  1564: "Obroty maksymalnego momentu",
  1565: "Ładowność",
  1566: "Intercooler",
  1567: "Masa przyczepy z hamulcem",
  1568: "Nacisk na oś przód / tył",
  1569: "Wysokość załadunku",
  1570: "Wymiary przestrzeni ładunkowej (dł. × szer. × wys.)",
  1571: "Pojemność przestrzeni ładunkowej",
};

const UNITS: Record<string, string> = {
  moc: "KM",
  drugi: "s",
  litr: "l",
  "N*m": "Nm",
  cm3: "cm³",
  "obr/min": "obr/min",
  mm: "mm",
  kg: "kg",
  "km/h": "km/h",
  km: "km",
  m: "m",
};

export function translateUnit(raw: string | null): string | null {
  if (!raw || raw === "NULL") return null;
  return UNITS[raw] ?? raw;
}

/* ── Wartości ── */
const VALUE_MAP: Record<number, Record<string, string>> = {
  2: { Suv: "SUV", hardtop: "Hardtop", Cabrio: "Kabriolet", Pickup: "Pikap" },
  12: { benzyna: "Benzyna", Hybryda: "Hybryda", Diesel: "Diesel", Gaz: "LPG / CNG", Elektro: "Elektryczny" },
  17: {
    "rozproszony wtrysk": "Wtrysk wielopunktowy",
    "bezpośredni wtrysk": "Wtrysk bezpośredni",
    "Common Rail": "Common Rail",
    wtryskiwacz: "Wtrysk",
    "Mono wtrysk": "Wtrysk jednopunktowy",
    gaźnik: "Gaźnik",
  },
  19: { "V-kształcie": "Widlasty (V)", Rządny: "Rzędowy" },
  22: { "Olej napędowy": "Olej napędowy (ON)", Gaz: "LPG / CNG", "95, 92": "PB95 / PB92", "95": "PB95", "92": "PB92", "98": "PB98", "80": "PB80" },
  24: { automatyczny: "Automatyczna", Mechaniczna: "Manualna", Wariatorem: "Bezstopniowa (CVT)", robot: "Zautomatyzowana" },
  27: { Przedni: "Przedni (FWD)", Tylny: "Tylny (RWD)", Pełna: "4×4 stały (AWD)", "Pełna wtyczka": "4×4 dołączany" },
  29: { Hamulce: "Tarczowe", "tarczowe wentylowane": "Tarczowe wentylowane" },
  30: { Hamulce: "Tarczowe", "tarczowe wentylowane": "Tarczowe wentylowane", Bębnowe: "Bębnowe" },
  46: { Turbo: "Turbo", Biturbo: "Biturbo", kompresor: "Kompresor" },
  1566: { istnieje: "Tak" },
};

const SUSPENSION: Record<string, string> = {
  "do Podwójne wahacze": "podwójne wahacze poprzeczne",
  Niezależna: "niezależne",
  "Stabilizator przechyłów": "stabilizator",
  "Kolumny Macphersona": "kolumny McPherson",
  "wiele poprzeczny": "wielowahaczowe",
  sprężynowa: "sprężyny śrubowe",
  "Sprężyny śrubowe": "sprężyny śrubowe",
  Amortyzatory: "amortyzatory",
  "Belka skrętna": "belka skrętna",
  "De-Dion": "oś De Dion",
  Belka: "belka",
  Zależna: "zależne",
  "Pół-niezależne": "półniezależne",
  "Drążek skrętny": "drążki skrętne",
  "Amortyzacja turystyczne": "drążki skrętne",
  "Na wzdłużnych wahaczy": "wahacze wzdłużne",
  "Dwóch dźwignię": "dwa wahacze",
  Dźwignię: "wahacz",
  "Na poprzecznych dźwignię": "wahacze poprzeczne",
  "Kilka dźwigni i cięgien": "wahacze i drążki reakcyjne",
  Most: "sztywny most",
  "Pneumatyczny element sprężysty": "miechy pneumatyczne",
};

const EURO: Record<string, string> = { I: "1", II: "2", III: "3", IV: "4", V: "5", VI: "6" };

/** „od 1 250 do 3 500” → „1 250–3 500”, „do 6 200” → „6 200” */
function translateRange(v: string) {
  const both = v.match(/^od\s+([\d\s]+?)\s+do\s+([\d\s]+)$/);
  if (both) return `${both[1].trim()}–${both[2].trim()}`;
  const one = v.match(/^(?:od|do)\s+([\d\s]+)$/);
  return one ? one[1].trim() : v;
}

export function translateSpecValue(specId: number, raw: string, rawUnit: string | null): string {
  const v = raw.trim();
  if (VALUE_MAP[specId]?.[v]) return VALUE_MAP[specId][v];
  if (specId === 41 || specId === 42) {
    const parts = v.split(",").map((p) => SUSPENSION[p.trim()] ?? p.trim().toLowerCase());
    return capitalize([...new Set(parts)].join(", "));
  }
  if (specId === 37) return v.replace(/^EURO\s+([IVX]+)$/i, (_, r: string) => `Euro ${EURO[r.toUpperCase()] ?? r}`);
  if (specId === 4 && rawUnit && /^\d+$/.test(rawUnit)) return `${v}–${rawUnit}`; // zakres miejsc zapisany w kolumnie unit
  if ([15, 62, 1564].includes(specId)) return translateRange(v);
  return v;
}
