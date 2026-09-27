/** Działy forum REVVO (źródło dla seeda tabeli forum_categories). */
export const FORUM_CATEGORIES = [
  {
    slug: "usterki",
    name: "Usterki i diagnostyka",
    description:
      "Coś stuka, świeci albo nie odpala? Wątek automatycznie dołącza dane Twojego auta z garażu — silnik, rocznik, przebieg i ostatnie zmiany.",
    icon: "Stethoscope",
    attachVehicleSnapshot: true,
  },
  {
    slug: "poradniki",
    name: "Poradniki DIY",
    description: "Instrukcje krok po kroku ze zdjęciami: serwis, wymiany, montaż części i narzędzia.",
    icon: "BookOpenCheck",
  },
  {
    slug: "setupy",
    name: "Setupy i modyfikacje",
    description: "Zawieszenie, koła, hamulce, silnik. Co pasuje, co ociera i jak jeździ — na przykładach z garaży.",
    icon: "Wrench",
  },
  {
    slug: "build-logi",
    name: "Build-logi",
    description: "Dzienniki projektów od zakupu do efektu końcowego. Tu rodzą się kandydaci do Garażu Miesiąca.",
    icon: "Hammer",
  },
  {
    slug: "motorsport",
    name: "Motorsport i track day",
    description: "Tory, KJS-y, drifty, czasy okrążeń, przygotowanie auta i sprzętu na dzień torowy.",
    icon: "Flag",
  },
  {
    slug: "detailing",
    name: "Detailing i pielęgnacja",
    description: "Mycie, korekta lakieru, powłoki, PPF i wnętrze. Przed i po — najlepiej na zdjęciach.",
    icon: "Sparkles",
  },
  {
    slug: "zakup-i-sprzedaz",
    name: "Zakup i sprzedaż",
    description: "Na co uważać przy zakupie modelu, wyceny, oględziny i publiczna historia serwisowa z garażu.",
    icon: "HandCoins",
  },
  {
    slug: "klasyki",
    name: "Klasyki i youngtimery",
    description: "Renowacje, oryginalne części, rejestracja na żółte tablice i utrzymanie starszych aut.",
    icon: "Clock",
  },
  {
    slug: "ev-hybrydy",
    name: "EV i hybrydy",
    description: "Zasięgi, ładowanie, baterie, koszty eksploatacji i modyfikacje aut zelektryfikowanych.",
    icon: "Zap",
  },
  {
    slug: "zloty",
    name: "Zloty i spoty",
    description: "Wydarzenia, wspólne wyjazdy, spoty fotograficzne i relacje ze zlotów.",
    icon: "MapPin",
  },
  {
    slug: "kawiarenka",
    name: "Kawiarenka",
    description: "Luźne rozmowy o motoryzacji i wszystkim wokół niej.",
    icon: "Coffee",
  },
] as const;
