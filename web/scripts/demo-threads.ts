export type DemoComment = { id: string; parentId?: string; vehicleSlug: string; body: string; ago: string };

export type DemoThread = {
  id: string;
  body: string[];
  comments: DemoComment[];
  category: "Usterki" | "Poradniki" | "Setupy" | "Build-logi";
  title: string;
  vehicleSlug: string;
  tags: string[];
  ago: string;
  diagnosis?: { label: string; value: string }[];
};

export const CATEGORY_SLUG: Record<DemoThread["category"], string> = {
  Usterki: "usterki",
  Poradniki: "poradniki",
  Setupy: "setupy",
  "Build-logi": "build-logi",
};

export const demoThreads: DemoThread[] = [
  {
    id: "integra-falujace-obroty",
    body: [
      "Cześć, od tygodnia walczę z obrotami na zimnym silniku. Po odpaleniu rano obroty skaczą między 700 a 1300 i tak przez pierwsze 3–4 minuty. Po rozgrzaniu wszystko wraca do normy, na biegu jałowym równo 800.",
      "Co już zrobione: nowy zawór IACV (OEM), wyczyszczona przepustnica i kanały powietrza dodatkowego, nowe uszczelki kolektora. Błędów w ECU brak. Czujnik temperatury płynu jeszcze nie ruszany.",
      "Macie pomysł, od czego zacząć następny krok, zanim zacznę wymieniać części na ślepo?",
    ],
    comments: [
      { id: "c1", vehicleSlug: "honda-civic-type-r-fn2-tomek", ago: "12 min temu",
        body: "Klasyka B-serii: sprawdź czujnik temperatury dla ECU (dwupinowy, nie ten od wskaźnika). Jak kłamie na zimnym, ECU źle steruje IACV. Zmierz opór na zimnym i na ciepłym, wartości są w serwisówce." },
      { id: "c2", parentId: "c1", vehicleSlug: "honda-integra-type-r-dc2-piotr", ago: "8 min temu",
        body: "Dzięki! Zmierzę dziś wieczorem. Na zimnym powinno być ok. 2,5 kΩ, tak?" },
      { id: "c3", parentId: "c2", vehicleSlug: "honda-civic-type-r-fn2-tomek", ago: "5 min temu",
        body: "Mniej więcej, przy 20°C w okolicach 2–3 kΩ. Przy okazji odpowietrz układ chłodzenia - pęcherz powietrza przy czujniku daje dokładnie takie objawy." },
      { id: "c4", vehicleSlug: "honda-nsx-na1-marta", ago: "3 min temu",
        body: "U mnie w NSX podobnie objawiał się nieszczelny wąż podciśnienia przy FITV. Warto przejść wszystkie wężyki podciśnienia z dymem." },
    ],
    category: "Usterki",
    title: "Falujące obroty na zimnym silniku po wymianie IACV",
    vehicleSlug: "honda-integra-type-r-dc2-piotr",
    tags: ["honda", "integra", "b18c"],
    ago: "18 min temu",
    diagnosis: [
      { label: "Silnik", value: "B18C" },
      { label: "Rocznik", value: "1996" },
      { label: "Przebieg", value: "214 300 km" },
      { label: "Ostatnia zmiana", value: "IACV - 18.09.2026" },
    ],
  },
  {
    id: "civic-fn2-b16-montaz",
    body: [
      "Poniżej pełna instrukcja montażu Bilstein B16 PSS10 w Civicu Type R FN2 - z momentami dokręcania i ustawieniem tłumienia, które sprawdziło się u mnie na torze i na co dzień.",
      "Potrzebne: ściągacz sprężyn, klucz dynamometryczny, nasadki 14/17/19 mm, penetrator. Czas: ok. 4 godziny na obie osie przy pierwszym podejściu.",
      "Najczęstszy błąd: dokręcanie tulei wahaczy na wiszącym kole. Zawsze dokręcaj pod obciążeniem, inaczej tuleje pracują skręcone i szybko się niszczą.",
    ],
    comments: [
      { id: "c1", vehicleSlug: "honda-integra-type-r-dc2-piotr", ago: "1 godz. temu",
        body: "Świetny poradnik. Jak wyszła geometria po obniżeniu - musiałeś dawać regulowane tylne wahacze?" },
      { id: "c2", parentId: "c1", vehicleSlug: "honda-civic-type-r-fn2-tomek", ago: "45 min temu",
        body: "Przy −25 mm tył mieści się w fabrycznej regulacji zbieżności. Pochylenie wyszło −1°40′ bez dodatkowych części." },
    ],
    category: "Poradniki",
    title: "Bilstein B16 w Civicu Type R FN2 - montaż krok po kroku (48 zdjęć)",
    vehicleSlug: "honda-civic-type-r-fn2-tomek",
    tags: ["honda", "civic", "bilstein", "poradnik"],
    ago: "2 godz. temu",
  },
  {
    id: "g37-19x95-ocieranie",
    body: [
      "Zebrałam dane od pięciu właścicieli G37 z kołami 19×9.5 na tyle. Offsety od ET15 do ET25, opony 265/35 i 275/35.",
      "Wniosek: przy ET22 i 265/35 wystarcza rolowanie rantów plus pochylenie ok. −1,5°. Przy ET15 bez poszerzenia się nie obejdzie.",
    ],
    comments: [
      { id: "c1", vehicleSlug: "honda-nsx-na1-marta", ago: "4 godz. temu",
        body: "Super zestawienie. Dodałabym jeszcze informację o obniżeniu - na sprężynach i na gwincie wychodzi zupełnie inaczej." },
    ],
    category: "Setupy",
    title: "G37 na 19×9.5 ET22 - ocieranie na tyle, co pomogło?",
    vehicleSlug: "infiniti-g37s-kasia",
    tags: ["infiniti", "g37", "felgi"],
    ago: "5 godz. temu",
  },
  {
    id: "nsx-rok-pozniej",
    body: [
      "Minął rok z NSX-em NA1 jako autem na weekendy. Spisałam wszystkie koszty i prace - może komuś pomoże przy decyzji o zakupie.",
      "Największa pozycja: rozrząd z pompą wody i termostatem. Części OEM z Japonii, czas oczekiwania ok. 3 tygodni.",
      "Dzień toru w Poznaniu: trzy sesje, zero problemów z temperaturą. Auto zaskakująco przewidywalne na limicie.",
    ],
    comments: [
      { id: "c1", vehicleSlug: "honda-civic-type-r-fn2-tomek", ago: "20 godz. temu",
        body: "Dobra robota z dokumentacją. Przy rozrządzie w C30A warto od razu wymienić też uszczelniacze wałków - przy tym przebiegu lubią się pocić." },
      { id: "c2", parentId: "c1", vehicleSlug: "honda-nsx-na1-marta", ago: "18 godz. temu",
        body: "Były wymienione, dopiszę to w osi czasu. Dzięki!" },
      { id: "c3", vehicleSlug: "infiniti-g37s-kasia", ago: "12 godz. temu",
        body: "Marzenie. Ile wyszło łącznie za rok, jeśli możesz zdradzić?" },
    ],
    category: "Build-logi",
    title: "NSX NA1 po roku: rozrząd, koszty części i dzień toru",
    vehicleSlug: "honda-nsx-na1-marta",
    tags: ["honda", "nsx", "klasyk"],
    ago: "wczoraj",
  },
];
