# REVVO — Web Application (Next.js 16)

Aplikacja frontendowa i API serwisu **REVVO**, zbudowana w oparciu o Next.js 16 (App Router), React 19 oraz Tailwind CSS v4.

Główna dokumentacja projektu, zrzuty ekranu, opis architektury oraz instrukcja wdrożenia znajdują się w głównym pliku [README.md](../README.md).

## Szybkie uruchomienie

1. Skonfiguruj zmienne środowiskowe:
   ```bash
   cp .env.example .env
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```
3. Aplikuj migracje i zasil bazę danych:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```

Aplikacja wystartuje pod adresem [http://localhost:3000](http://localhost:3000).
