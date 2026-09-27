// Dane przykładowe do makiety — auta z katalogu (car2db), zdjęcia z Wikimedia Commons (R2).
// Zostaną zastąpione zapytaniami do PostgreSQL (Drizzle), gdy ruszą konta i garaże.

export type VehicleStatus = "daily" | "build" | "weekend" | "track";

export type Mod = { category: string; part: string };

export type TimelineEntry = {
  date: string;
  title: string;
  kind: "mod" | "service" | "track" | "photo";
  mileageKm?: number;
  note: string;
  flames: number;
};

export type PhotoCredit = { author: string; license: string; licenseUrl: string; sourceUrl: string };

export type Vehicle = {
  slug: string;
  owner: { name: string; verifiedMechanic?: boolean };
  make: string;
  model: string;
  variant: string;
  year: number;
  engine: string;
  powerHp: number;
  paintCode: string;
  mileageKm: number;
  status: VehicleStatus;
  photo?: string;
  photoCredit?: PhotoCredit;
  /** Generacja w katalogu (car_generations.id) i ścieżka do modelu w /katalog */
  generationId?: number;
  catalogPath?: string;
  flames: number;
  mods: Mod[];
  timeline: TimelineEntry[];
};

export const STATUS_LABEL: Record<VehicleStatus, string> = {
  daily: "Daily",
  build: "W trakcie budowy",
  weekend: "Weekend Toy",
  track: "Projekt na tor",
};

const MEDIA = "https://pub-9fd15a1bea4c403d9e48728f2e707eed.r2.dev/catalog/generations";

export const vehicles: Vehicle[] = [
  {
    slug: "honda-nsx-na1-marta",
    owner: { name: "Marta" },
    make: "Honda",
    model: "NSX",
    variant: "NA1 3.0",
    year: 1993,
    engine: "C30A, 3.0 V6 VTEC",
    powerHp: 274,
    paintCode: "R-81 Formula Red",
    mileageKm: 118400,
    status: "weekend",
    photo: `${MEDIA}/9366-7c0acb44d3/1280.webp`,
    photoCredit: {
      author: "Calreyn88",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:1993_Honda_NSX.jpg",
    },
    generationId: 9366,
    catalogPath: "/katalog/honda/nsx",
    flames: 1284,
    mods: [
      { category: "Rozrząd", part: "Pasek + pompa wody OEM (wymiana co 90 tys. km)" },
      { category: "Koła", part: "OEM 15/16\" z odnowionym lakierem" },
      { category: "Zawieszenie", part: "Amortyzatory Bilstein B6" },
    ],
    timeline: [
      {
        date: "2026-08-30",
        title: "Rozrząd i pompa wody",
        kind: "service",
        mileageKm: 118000,
        note: "Pasek, rolki, pompa wody i termostat. Przy okazji nowe paski osprzętu. Silnik bez zarzutu.",
        flames: 188,
      },
      {
        date: "2026-05-12",
        title: "Odnowione felgi i geometria",
        kind: "mod",
        mileageKm: 116900,
        note: "Proszek w oryginalnym kolorze, nowe opony Bridgestone Potenza, geometria wg specyfikacji fabrycznej.",
        flames: 214,
      },
      {
        date: "2025-10-04",
        title: "Dzień toru — Poznań",
        kind: "track",
        mileageKm: 115200,
        note: "Trzy sesje po 20 minut, zero problemów z temperaturą. Najlepsze okrążenie 1:58,9.",
        flames: 402,
      },
    ],
  },
  {
    slug: "honda-integra-type-r-dc2-piotr",
    owner: { name: "Piotr" },
    make: "Honda",
    model: "Integra",
    variant: "Type R DC2",
    year: 1996,
    engine: "B18C, 1.8 VTEC",
    powerHp: 200,
    paintCode: "NH-0 Championship White",
    mileageKm: 214300,
    status: "build",
    photo: `${MEDIA}/6003-ca889f67a4/1280.webp`,
    photoCredit: {
      author: "Mr.choppers",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:1996_Honda_Integra_Type_R_in_White,_front_left.jpg",
    },
    generationId: 6003,
    catalogPath: "/katalog/honda/integra",
    flames: 947,
    mods: [
      { category: "Zawieszenie", part: "Tein Flex Z + górne mocowania Hardrace" },
      { category: "Koła", part: "Enkei RPF1, 15×7 ET38" },
      { category: "Hamulce", part: "Klocki Ferodo DS2500, przewody w oplocie" },
    ],
    timeline: [
      {
        date: "2026-09-18",
        title: "Nowy zawór IACV i czyszczenie przepustnicy",
        kind: "service",
        mileageKm: 214200,
        note: "Obroty dalej falują na zimnym — temat w dziale Usterki.",
        flames: 37,
      },
      {
        date: "2026-06-02",
        title: "Tein Flex Z",
        kind: "mod",
        mileageKm: 212800,
        note: "Obniżenie 30 mm przód / 25 mm tył, tłumienie 8/16 klików. Geometria z lekkim ujemnym pochyleniem.",
        flames: 311,
      },
    ],
  },
  {
    slug: "honda-civic-type-r-fn2-tomek",
    owner: { name: "Tomek", verifiedMechanic: true },
    make: "Honda",
    model: "Civic",
    variant: "Type R FN2",
    year: 2007,
    engine: "K20Z4, 2.0 i-VTEC",
    powerHp: 201,
    paintCode: "R-81 Milano Red",
    mileageKm: 161000,
    status: "track",
    photo: `${MEDIA}/771-aed7ee2946/1280.webp`,
    photoCredit: {
      author: "Vauxford",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:2007_Honda_Civic_Type-R_GT_i-VTEC_2.0_Front.jpg",
    },
    generationId: 771,
    catalogPath: "/katalog/honda/civic",
    flames: 538,
    mods: [
      { category: "Zawieszenie", part: "Bilstein B16 PSS10" },
      { category: "Hamulce", part: "Tarcze 320 mm + klocki Ferodo DS2500" },
      { category: "Napęd", part: "Szpera Quaife ATB" },
    ],
    timeline: [
      {
        date: "2026-09-02",
        title: "Montaż Bilstein B16",
        kind: "mod",
        mileageKm: 160800,
        note: "Pełna instrukcja ze zdjęciami w wątku na forum. Ustawienia: 4/10 przód, 6/10 tył.",
        flames: 190,
      },
    ],
  },
  {
    slug: "infiniti-g37s-kasia",
    owner: { name: "Kasia" },
    make: "Infiniti",
    model: "G37",
    variant: "S Sedan V36",
    year: 2011,
    engine: "VQ37VHR, 3.7 V6",
    powerHp: 333,
    paintCode: "KAD Graphite Shadow",
    mileageKm: 142000,
    status: "daily",
    photo: `${MEDIA}/909-68a5a4f9da/1280.webp`,
    photoCredit: {
      author: "M 93",
      license: "CC BY-SA 3.0 DE",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/de/deed.en",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Infiniti_G37_S_(V36,_Facelift)_%E2%80%93_Frontansicht,_2._September_2012,_D%C3%BCsseldorf.jpg",
    },
    generationId: 909,
    catalogPath: "/katalog/infiniti/g-series",
    flames: 612,
    mods: [
      { category: "Koła", part: "Work Emotion CR Kiwami, 19×9.5 ET22" },
      { category: "Wydech", part: "Tłumiki końcowe Invidia Q300" },
      { category: "Zawieszenie", part: "Sprężyny Eibach Pro-Kit" },
    ],
    timeline: [
      {
        date: "2026-07-21",
        title: "Koła 19×9.5 i rolowanie rantów",
        kind: "mod",
        mileageKm: 141600,
        note: "Z oponami 265/35 R19 tył ocierał na nierównościach — po rolowaniu i −1,5° pochylenia jest czysto.",
        flames: 256,
      },
    ],
  },
];

export function getVehicle(slug: string) {
  return vehicles.find((v) => v.slug === slug);
}

export function vehicleName(v: Vehicle) {
  return `${v.make} ${v.model} ${v.variant}`;
}

export type Comment = {
  id: string;
  parentId?: string;
  vehicleSlug: string;
  body: string;
  ago: string;
  flames: number;
};

export const CATEGORY_SLUG: Record<Thread["category"], string> = {
  Usterki: "usterki",
  Poradniki: "poradniki",
  Setupy: "setupy",
  "Build-logi": "build-logi",
};

export type Thread = {
  id: string;
  /** Pełna treść wątku (akapity) */
  body: string[];
  comments: Comment[];
  category: "Usterki" | "Poradniki" | "Setupy" | "Build-logi";
  title: string;
  excerpt: string;
  vehicleSlug: string;
  tags: string[];
  replies: number;
  flames: number;
  ago: string;
  /** Dział usterek: dane zaciągnięte automatycznie z garażu autora */
  diagnosis?: { label: string; value: string }[];
};

export const threads: Thread[] = [
  {
    id: "integra-falujace-obroty",
    body: [
      "Cześć, od tygodnia walczę z obrotami na zimnym silniku. Po odpaleniu rano obroty skaczą między 700 a 1300 i tak przez pierwsze 3–4 minuty. Po rozgrzaniu wszystko wraca do normy, na biegu jałowym równo 800.",
      "Co już zrobione: nowy zawór IACV (OEM), wyczyszczona przepustnica i kanały powietrza dodatkowego, nowe uszczelki kolektora. Błędów w ECU brak. Czujnik temperatury płynu jeszcze nie ruszany.",
      "Macie pomysł, od czego zacząć następny krok, zanim zacznę wymieniać części na ślepo?",
    ],
    comments: [
      { id: "c1", vehicleSlug: "honda-civic-type-r-fn2-tomek", ago: "12 min temu", flames: 18,
        body: "Klasyka B-serii: sprawdź czujnik temperatury dla ECU (dwupinowy, nie ten od wskaźnika). Jak kłamie na zimnym, ECU źle steruje IACV. Zmierz opór na zimnym i na ciepłym, wartości są w serwisówce." },
      { id: "c2", parentId: "c1", vehicleSlug: "honda-integra-type-r-dc2-piotr", ago: "8 min temu", flames: 4,
        body: "Dzięki! Zmierzę dziś wieczorem. Na zimnym powinno być ok. 2,5 kΩ, tak?" },
      { id: "c3", parentId: "c2", vehicleSlug: "honda-civic-type-r-fn2-tomek", ago: "5 min temu", flames: 9,
        body: "Mniej więcej, przy 20°C w okolicach 2–3 kΩ. Przy okazji odpowietrz układ chłodzenia — pęcherz powietrza przy czujniku daje dokładnie takie objawy." },
      { id: "c4", vehicleSlug: "honda-nsx-na1-marta", ago: "3 min temu", flames: 6,
        body: "U mnie w NSX podobnie objawiał się nieszczelny wąż podciśnienia przy FITV. Warto przejść wszystkie wężyki podciśnienia z dymem." },
    ],
    category: "Usterki",
    title: "Falujące obroty na zimnym silniku po wymianie IACV",
    excerpt:
      "Nowy zawór IACV, przepustnica wyczyszczona, a na zimnym obroty skaczą 700–1300. Po rozgrzaniu spokój. Co sprawdzić w następnej kolejności?",
    vehicleSlug: "honda-integra-type-r-dc2-piotr",
    tags: ["honda", "integra", "b18c"],
    replies: 23,
    flames: 41,
    ago: "18 min temu",
    diagnosis: [
      { label: "Silnik", value: "B18C" },
      { label: "Rocznik", value: "1996" },
      { label: "Przebieg", value: "214 300 km" },
      { label: "Ostatnia zmiana", value: "IACV — 18.09.2026" },
    ],
  },
  {
    id: "civic-fn2-b16-montaz",
    body: [
      "Poniżej pełna instrukcja montażu Bilstein B16 PSS10 w Civicu Type R FN2 — z momentami dokręcania i ustawieniem tłumienia, które sprawdziło się u mnie na torze i na co dzień.",
      "Potrzebne: ściągacz sprężyn, klucz dynamometryczny, nasadki 14/17/19 mm, penetrator. Czas: ok. 4 godziny na obie osie przy pierwszym podejściu.",
      "Najczęstszy błąd: dokręcanie tulei wahaczy na wiszącym kole. Zawsze dokręcaj pod obciążeniem, inaczej tuleje pracują skręcone i szybko się niszczą.",
    ],
    comments: [
      { id: "c1", vehicleSlug: "honda-integra-type-r-dc2-piotr", ago: "1 godz. temu", flames: 12,
        body: "Świetny poradnik. Jak wyszła geometria po obniżeniu — musiałeś dawać regulowane tylne wahacze?" },
      { id: "c2", parentId: "c1", vehicleSlug: "honda-civic-type-r-fn2-tomek", ago: "45 min temu", flames: 15,
        body: "Przy −25 mm tył mieści się w fabrycznej regulacji zbieżności. Pochylenie wyszło −1°40′ bez dodatkowych części." },
    ],
    category: "Poradniki",
    title: "Bilstein B16 w Civicu Type R FN2 — montaż krok po kroku (48 zdjęć)",
    excerpt:
      "Od demontażu kolumn po ustawienie tłumienia. Momenty dokręcania, pułapki przy górnych mocowaniach i geometria po montażu.",
    vehicleSlug: "honda-civic-type-r-fn2-tomek",
    tags: ["honda", "civic", "bilstein", "poradnik"],
    replies: 57,
    flames: 318,
    ago: "2 godz. temu",
  },
  {
    id: "g37-19x95-ocieranie",
    body: [
      "Zebrałam dane od pięciu właścicieli G37 z kołami 19×9.5 na tyle. Offsety od ET15 do ET25, opony 265/35 i 275/35.",
      "Wniosek: przy ET22 i 265/35 wystarcza rolowanie rantów plus pochylenie ok. −1,5°. Przy ET15 bez poszerzenia się nie obejdzie.",
    ],
    comments: [
      { id: "c1", vehicleSlug: "honda-nsx-na1-marta", ago: "4 godz. temu", flames: 7,
        body: "Super zestawienie. Dodałabym jeszcze informację o obniżeniu — na sprężynach i na gwincie wychodzi zupełnie inaczej." },
    ],
    category: "Setupy",
    title: "G37 na 19×9.5 ET22 — ocieranie na tyle, co pomogło?",
    excerpt:
      "Rolowanie, pochylenie czy dystanse? Zebrałam zdjęcia pięciu G37 z tym samym setupem i porównanie offsetów.",
    vehicleSlug: "infiniti-g37s-kasia",
    tags: ["infiniti", "g37", "felgi"],
    replies: 34,
    flames: 205,
    ago: "5 godz. temu",
  },
  {
    id: "nsx-rok-pozniej",
    body: [
      "Minął rok z NSX-em NA1 jako autem na weekendy. Spisałam wszystkie koszty i prace — może komuś pomoże przy decyzji o zakupie.",
      "Największa pozycja: rozrząd z pompą wody i termostatem. Części OEM z Japonii, czas oczekiwania ok. 3 tygodni.",
      "Dzień toru w Poznaniu: trzy sesje, zero problemów z temperaturą. Auto zaskakująco przewidywalne na limicie.",
    ],
    comments: [
      { id: "c1", vehicleSlug: "honda-civic-type-r-fn2-tomek", ago: "20 godz. temu", flames: 22,
        body: "Dobra robota z dokumentacją. Przy rozrządzie w C30A warto od razu wymienić też uszczelniacze wałków — przy tym przebiegu lubią się pocić." },
      { id: "c2", parentId: "c1", vehicleSlug: "honda-nsx-na1-marta", ago: "18 godz. temu", flames: 8,
        body: "Były wymienione, dopiszę to w osi czasu. Dzięki!" },
      { id: "c3", vehicleSlug: "infiniti-g37s-kasia", ago: "12 godz. temu", flames: 5,
        body: "Marzenie. Ile wyszło łącznie za rok, jeśli możesz zdradzić?" },
    ],
    category: "Build-logi",
    title: "NSX NA1 po roku: rozrząd, koszty części i dzień toru",
    excerpt:
      "Pełne zestawienie 12 miesięcy: serwis rozrządu, ceny części OEM, odnowione felgi i jak auto zniosło tor. Z tabelą kosztów.",
    vehicleSlug: "honda-nsx-na1-marta",
    tags: ["honda", "nsx", "klasyk"],
    replies: 89,
    flames: 527,
    ago: "wczoraj",
  },
];

export function getThread(id: string) {
  return threads.find((t) => t.id === id);
}

export const setupExamples = [
  { label: "Civic FN2 + Bilstein B16", count: 42 },
  { label: "Integra DC2 + Tein Flex Z", count: 31 },
  { label: "G37 + koła 19×9.5", count: 27 },
  { label: "S2000 + Öhlins R&T", count: 19 },
];
