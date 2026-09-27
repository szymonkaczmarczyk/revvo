<div align="center">

<img src="logo/revvo-logo-horizontal-on-dark.png" alt="REVVO Logo" width="380" />

### Forum motoryzacyjne nowej generacji oparte o Wirtualny Garaż

*„Twoje auto mówi, kim jesteś.”*

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-Storage-F38020?style=for-the-badge&logo=cloudflare)](https://www.cloudflare.com/products/r2/)

[Opis projektu](#-o-projekcie) • [Zrzuty ekranu](#-podgląd-aplikacji) • [Kluczowe filary](#-kluczowe-filary) • [Architektura](#-architektura-i-stos-technologiczny) • [Szybki start](#-szybki-start) • [Struktura katalogów](#-struktura-katalogów)

</div>

---

## 📌 O projekcie

**REVVO** to nowoczesna platforma społecznościowa dla entuzjastów motoryzacji, która rozwiązuje największe bolączki tradycyjnych forów dyskusyjnych i grup na Facebooku. 

W tradycyjnych mediach społecznościowych wiedza ginie w chaosie, a każda dyskusja techniczna zaczyna się od niekończących się pytań: *„Jaki silnik? Jaki rocznik? Co było modzone?”*.

W **REVVO** centrum tożsamości użytkownika jest **samochód (lub kolekcja aut)**, a nie anonimowy awatar. Każdy profil to interaktywny **Wirtualny Garaż** z pełnym paszportem pojazdu, osią czasu modyfikacji i rzetelną historią serwisową.

### 🌟 Dlaczego REVVO?

1. **Koniec z anonimowością techniczną** — obok każdego posta i komentarza widoczna jest plakietka pojazdu autora z bezpośrednim odnośnikiem do jego specyfikacji.
2. **Automatyczny kontekst w usterkach** — tworząc wątek w dziale diagnostyki, system automatycznie dołącza snapshot Twojego pojazdu (kod silnika, rocznik, przebieg, ostatnie modyfikacje).
3. **Baza wiedzy oparta o setupy** — szukasz jak leży felga 18×8.5 ET35 albo jak sprawdza się gwint Bilstein B16? Wyszukujesz po konkretnych częściach i oglądasz realne zdjęcia oraz opinie właścicieli.
4. **Zasada zaangażowania** — czytać może każdy, ale żeby pisać i tworzyć społeczność, musisz dodać co najmniej jedno auto do swojego garażu.

---

## 📸 Podgląd aplikacji

### 1. Strona główna z interaktywnym wideo i efektem głębi
*Hero z dynamicznym tłem wideo wyjeżdżającego z garażu auta oraz autorskim efektem głębi (Depth Effect).*

![Strona główna REVVO](docs/screenshots/01-hero-home.png)

---

### 2. Filary platformy i Garaż Miesiąca
*Wyróżniki platformy: Paszport pojazdu, Kontekst wypowiedzi, Wyszukiwarka setupów oraz system grywalizacji Miedziany Płomień z rankingiem najlepszych projektów.*

![Filary REVVO i Garaż Miesiąca](docs/screenshots/02-features-home.png)

---

### 3. Wirtualny Garaż — Paszport i Build-Log pojazdu
*Kompleksowa karta auta: parametry fabryczne zintegrowane z katalogiem, status (Daily, W trakcie budowy, Weekend Toy, Projekt na tor), lista modyfikacji, oś czasu modyfikacji/serwisów i licznik Miedzianych Płomieni.*

![Wirtualny Garaż](docs/screenshots/03-virtual-garage.png)

---

### 4. Forum dyskusyjne z kategoryzacją
*11 wyspecjalizowanych działów tematycznych. Na liście wątków każdy autor oznaczony jest swoim samochodem z garażu.*

![Forum dyskusyjne](docs/screenshots/04-forum-main.png)

---

### 5. Widok wątku z automatycznym snapshotem auta
*Wątek w dziale diagnostycznym z automatycznie zaciągniętą kartą techniczną auta autora oraz drzewiastą dyskusją.*

![Wątek na forum](docs/screenshots/05-forum-thread.png)

---

### 6. Dołącz do społeczności — Rejestracja
*Szybki, minimalistyczny onboarding skupiony wokół pasji motoryzacyjnej.*

![Rejestracja](docs/screenshots/06-auth-register.png)

---

### 7. Kontakt i pomoc
*Dedykowany formularz kontaktowy z wyborem tematów i integracją wsparcia.*

![Kontakt](docs/screenshots/07-contact.png)

---

## ⚡ Kluczowe filary

### 🚗 Wirtualny Garaż (Cyfrowy Paszport & Build-Log)
- **Karta pojazdu:** kod lakieru, silnik, fabryczna moc, modyfikacje pogrupowane w kategorie (silnik, zawieszenie, wydech, koła, wnętrze).
- **Oś czasu (Timeline):** chronologiczny rejestr modyfikacji, napraw, wizyt na torze i sesji zdjęciowych wraz z przebiegiem.
- **Statusy projektu:**
  - 🔵 **Daily** — auto do codziennej jazdy
  - 🟠 **W trakcie budowy** — aktywny projekt garażowy
  - 🟢 **Weekend Toy** — auto weekendowe / klasyk
  - 🔴 **Projekt na tor** — maszyna przygotowana pod track day / motorsport
- **Publiczny link historii serwisowej:** transparentne potwierdzenie historii modyfikacji i dbałości o samochód przy ewentualnej sprzedaży.

### 💬 Forum z natywnym kontekstem technicznym
- **11 wyspecjalizowanych działów:**
  - *Usterki i diagnostyka* (dołącza snapshot auta)
  - *Poradniki DIY* (manuale krok po kroku ze zdjęciami)
  - *Setupy i modyfikacje* (co pasuje, co ociera i jak jeździ)
  - *Build-logi* (dzienniki projektów od zakupu po finał)
  - *Motorsport i track day* (czasy okrążeń, przygotowanie torowe)
  - *Detailing i pielęgnacja* (korekty, powłoki, PPF)
  - *Zakup i sprzedaż* (poradniki zakupowe, weryfikacja)
  - *Klasyki i youngtimery*, *EV i hybrydy*, *Zloty i spoty*, *Kawiarenka*.
- **Drzewiaste komentarze:** czytelna hierarchia odpowiedzi z podglądem auta każdego komentującego.

### 🔥 Miedziany Płomień i Garaż Miesiąca
- Unikalny system uznania społeczności (`#C87A4B` Copper Flame).
- Możliwość „odpalenia płomienia” dla całego projektu lub konkretnego, imponującego wpisu serwisowego na osi czasu.
- Automatyczny algorytm wyłaniający **Garaż Miesiąca** na stronie głównej na podstawie jakości wpisów i zaangażowania społeczności.

---

## 🛠 Architektura i stos technologiczny

| Warstwa | Technologia | Opis |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (App Router)** | Najnowszy Next.js z Cache Components, Turbopack, SSR/SSG dla optymalnego SEO wątków i garaży |
| **Biblioteka UI** | **React 19** | Nowoczesne komponenty serwerowe (RSC) i klienckie, React `<ViewTransition>` |
| **Styling & Design System** | **Tailwind CSS v4** | Autorska paleta REVVO v2 (grafit `#14161B`, miedź `#C87A4B`, kobalt `#5B9BD5`), pełna zgodność z WCAG AA |
| **Typografia** | **Syncopate + Manrope + JetBrains Mono** | Wyrazisty krój display dla nagłówków, czytelny sans dla treści oraz monospace dla danych technicznych |
| **Ikony** | **Lucide React** | Spójny zestaw wektorowy |
| **Backend & API** | **Next.js Server Actions + Route Handlers** | Architektura domenowa (`src/server/...`), przygotowana pod modułową rozbudowę |
| **Baza danych** | **PostgreSQL** | Relacyjna baza danych obsługująca relacje katalogowe, komentarze drzewiaste i indeksy modyfikacji |
| **ORM & Migracje** | **Drizzle ORM** | Type-safe schemat bazy, migracje SQL przez `drizzle-kit` |
| **Storage multimediów** | **Cloudflare R2** | Magazyn S3-compatible o zerowych kosztach egressu dla zdjęć aut i załączników |
| **Przetwarzanie obrazów** | **Sharp** | Kompresja do nowoczesnych formatów WebP/AVIF z automatycznym generowaniem responsywnych wariantów |
| **Zabezpieczenia & Antyspam** | **Cloudflare Turnstile** | Niewidoczna dla użytkownika weryfikacja CAPTCHA przy formularzach |

---

## 📁 Struktura katalogów

```text
Revvo/
├── docs/                     # Dokumentacja projektu oraz zrzuty ekranu
│   └── screenshots/          # Wygenerowane zrzuty ekranu interfejsu (Retina)
├── logo/                     # Oficjalne assety identyfikacji wizualnej (wektory SVG, PNG, WebP)
├── background/               # Materiały tła (wideo MP4 1080p/720p, plakaty WebP)
├── design-system/            # Specyfikacja design systemu, tokeny kolorystyczne i wytyczne UI
├── baza-danych/              # Źródłowy katalog techniczny pojazdów car2db (CSV + SQL)
├── content/                  # Materiały seedujące (zdjęcia pojazdów, rendery)
├── package.json              # Główne skróty npm do uruchamiania poleceń w projekcie
└── web/                      # Główna aplikacja Next.js
    ├── .env.example          # Wzorzec bezpiecznych zmiennych środowiskowych
    ├── drizzle/              # Migracje bazy danych Drizzle ORM
    ├── drizzle.config.ts     # Konfiguracja Drizzle ORM
    ├── next.config.ts        # Konfiguracja Next.js 16 (Cache Components, images, remote patterns)
    ├── scripts/              # Skrypty importu danych (seed, katalog car2db, pobieranie zdjęć)
    └── src/
        ├── app/              # Routing App Router (strona główna, forum, garaże, katalog, auth)
        ├── components/       # Reużywalne komponenty UI (nawigacja, karty, odtwarzacz wideo, plakietki)
        ├── lib/              # Narzędzia pomocnicze, typy danych, mock data
        └── server/           # Logika backendowa (połączenie z bazą db, zapytania katalogu, kategorie)
```

---

## 🚀 Szybki start

### Wymagania wstępne
- **Node.js** w wersji `v20.x` lub nowszej (rekomendowany `v22+`)
- **npm**, **pnpm** lub **yarn**
- Działająca instancja bazy danych **PostgreSQL** (lokalnie, w Dockerze lub usłudze chmurowej typu Neon/Supabase)

### 1. Klonowanie repozytorium
```bash
git clone https://github.com/twoja-organizacja/revvo.git
cd revvo
```

### 2. Konfiguracja zmiennych środowiskowych
Przejdź do katalogu aplikacji webowej i utwórz plik `.env` na podstawie przygotowanego szablonu:
```bash
cp web/.env.example web/.env
```
Następnie uzupełnij plik `web/.env` swoimi danymi (m.in. dane połączenia z bazą PostgreSQL, klucze Cloudflare R2 i losowy ciąg dla `AUTH_SECRET`).

### 3. Instalacja zależności
Zainstaluj zależności aplikacji:
```bash
cd web
npm install
```

### 4. Baza danych: migracje i seedowanie danych
Zastosuj przygotowane migracje tabel w PostgreSQL i zasiej bazę podstawowym katalogiem aut oraz kategoriami forum:
```bash
npm run db:migrate
npm run db:seed
```

> **Wskazówka:** Możesz uruchomić Drizzle Studio w przeglądarce, aby podejrzeć strukturę i zawartość bazy danych:
> ```bash
> npm run db:studio
> ```

### 5. Uruchomienie serwera deweloperskiego
Uruchom serwer developerski Next.js (z katalogu głównego lub z `web/`):
```bash
# Z katalogu głównego projektu:
npm run dev

# Lub bezpośrednio z katalogu web/:
cd web && npm run dev
```

Aplikacja będzie dostępna pod adresem: **[http://localhost:3000](http://localhost:3000)**.

---

## 📜 Dostępne skrypty npm

| Polecenie (w katalogu `web/` lub z roota) | Opis |
|---|---|
| `npm run dev` | Uruchamia serwer developerski Next.js (Turbopack) na porcie 3000 |
| `npm run build` | Buduje zoptymalizowaną wersję produkcyjną aplikacji |
| `npm run start` | Uruchamia zbudowaną aplikację w trybie produkcyjnym |
| `npm run lint` | Sprawdza poprawność kodu przy użyciu ESLint |
| `npm run db:generate` | Generuje nową migrację SQL po modyfikacjach w `schema.ts` |
| `npm run db:migrate` | Aplikuje oczekujące migracje do bazy PostgreSQL |
| `npm run db:seed` | Wypełnia bazę danych katalogiem modeli oraz działami forum |
| `npm run db:studio` | Otwiera graficzny interfejs Drizzle Studio do przeglądania danych |

---

## 🔒 Bezpieczeństwo i prywatność danych

- Wszelkie prywatne dane konfiguracyjne, tokeny sesji i klucze API przechowywane są w `.env` i są **wykluczone z repozytorium** poprzez reguły `.gitignore`.
- Repozytorium zawiera wyłącznie bezpieczny szablon konfiguracyjny `web/.env.example`.
- Hasła użytkowników są bezpiecznie hashowane przy użyciu algorytmu **Argon2id**.
- Wszystkie pliki testowe, raporty pokrycia (`coverage/`) oraz lokalne logi asystentów są odfiltrowane przez `.gitignore`.

---

<div align="center">

Stworzone z pasją do motoryzacji i nowoczesnego web developmentu.

**REVVO © 2026** — Wszelkie prawa zastrzeżone.

</div>
