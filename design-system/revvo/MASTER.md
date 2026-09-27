# REVVO — Design System (MASTER)

> **LOGIKA:** Budując konkretną stronę, najpierw sprawdź `design-system/revvo/pages/[nazwa-strony].md`.
> Jeśli istnieje, jego reguły **nadpisują** ten plik. W przeciwnym razie obowiązuje MASTER.

**Projekt:** REVVO — forum motoryzacyjne oparte o Wirtualny Garaż
**Wygenerowano:** 2026-09-27 skillem `ui-ux-pro-max` (kategoria: Automotive, styl: Motion-Driven, wzorzec: Hero-Centric).
**Paleta:** v2 (2026-09-27) — paleta Claude, zatwierdzona przez właściciela (wstępna paleta z briefu była poglądowa).
Kolory miedzi i kobaltu wyprowadzone z próbek logo (miedź w logo: cień `#8C401B` → mediana `#AE5B2E` → światło `#CE7A4B`;
kobalt w logo: `#114771` → `#20628F` → `#3485B4`), cały zestaw sprawdzony pod kątem kontrastu (WCAG 2.2 AA).
Aplikacja jest **dark-only** (grafit jako baza) — brak trybu jasnego w MVP.

---

## 1. Kolory (Design Tokens) — paleta v2

### Powierzchnie (skala grafitu — głębia przez jasność, nie cień)

| Token | Hex | Użycie |
|-------|-----|--------|
| `--rv-bg` | `#14161B` | Tło strony, dół scrimu wideo w hero |
| `--rv-surface` | `#1A1D24` | Karty wpisów, sidebar, panele, nawigacja |
| `--rv-surface-2` | `#232730` | Hover kart, inputy, zakładki |
| `--rv-surface-3` | `#2C313C` | Modale, dropdowny, popovery, tooltipy |
| `--rv-border` | `rgba(255,255,255,0.08)` | Separatory, ramki kart |
| `--rv-border-strong` | `rgba(255,255,255,0.14)` | Ramki inputów, przyciski drugorzędne |

### Marka

| Token | Hex | Użycie |
|-------|-----|--------|
| `--rv-copper` | `#C87A4B` | **CTA** („Utwórz wątek”), Miedziany Płomień, badge rangi, aktywna zakładka |
| `--rv-copper-hover` | `#D98F62` | Hover CTA |
| `--rv-copper-press` | `#AE5B2E` | Stan wciśnięty, obramowania akcentowe |
| `--rv-on-copper` | `#14161B` | Tekst/ikony na miedzi |
| `--rv-cobalt` | `#1B6CA8` | Wypełnienia: chipy tagów `#bmw`, obrys awatara zweryfikowanego mechanika, zaznaczenia |
| `--rv-cobalt-text` | `#5B9BD5` | Linki, plakietka auta przy nicku („Piotr • BMW E36 328i”), focus ring |
| `--rv-cobalt-text-hover` | `#7FB2E0` | Hover linków |

### Tekst

| Token | Hex | Użycie |
|-------|-----|--------|
| `--rv-text` | `#E5E7EB` | Treść |
| `--rv-text-muted` | `#9CA3AF` | Daty, liczniki, metadane |
| `--rv-text-disabled` | `#6B7280` | Tylko stany wyłączone (nie dla treści) |

### Semantyka i statusy projektu

| Token | Hex | Użycie |
|-------|-----|--------|
| `--rv-success` | `#4ADE80` | Potwierdzenia |
| `--rv-warning` | `#FBBF24` | Ostrzeżenia |
| `--rv-danger` | `#F87171` | Błędy walidacji, akcje destrukcyjne |
| `--rv-status-daily` | `#5B9BD5` | Status „Daily” |
| `--rv-status-build` | `#E0A458` | Status „W trakcie budowy” |
| `--rv-status-weekend` | `#4ADE80` | Status „Weekend Toy” |
| `--rv-status-track` | `#F87171` | Status „Projekt na tor” |

Badge statusu: tekst w kolorze statusu + tło tego koloru z alpha 12% + ramka alpha 30% (kolor nie jest jedynym nośnikiem — zawsze z etykietą).

### Kontrast (tło `#14161B` / karta `#1A1D24` / `#232730`)

| Para | Wynik | Werdykt |
|------|-------|---------|
| `#E5E7EB` | 14.6 / 13.6 / 12.1 | ✅ AAA |
| `#9CA3AF` | 7.1 / 6.6 / 5.9 | ✅ AA |
| `#C87A4B` jako tekst | 5.5 / 5.1 / 4.5 | ✅ AA |
| `#5B9BD5` (linki) | 6.1 / 5.7 / 5.1 | ✅ AA |
| `#1B6CA8` jako tekst | 3.2 / 3.0 / 2.7 | ❌ → nigdy jako tekst; tylko wypełnienie |
| `#14161B` na miedzi (CTA) | 5.5 (hover 6.9) | ✅ AA |
| Biały na miedzi | 3.3 | ❌ → nie stosować |
| Biały na kobalcie (chip) | 5.6 | ✅ AA |
| Statusy (`#E0A458`, `#4ADE80`, `#F87171`) | ≥ 5.4 na każdej powierzchni | ✅ AA |

```css
:root {
  --rv-bg: #14161B;
  --rv-surface: #1A1D24;
  --rv-surface-2: #232730;
  --rv-surface-3: #2C313C;
  --rv-border: rgba(255, 255, 255, 0.08);
  --rv-border-strong: rgba(255, 255, 255, 0.14);

  --rv-copper: #C87A4B;
  --rv-copper-hover: #D98F62;
  --rv-copper-press: #AE5B2E;
  --rv-on-copper: #14161B;
  --rv-cobalt: #1B6CA8;
  --rv-cobalt-text: #5B9BD5;
  --rv-cobalt-text-hover: #7FB2E0;

  --rv-text: #E5E7EB;
  --rv-text-muted: #9CA3AF;
  --rv-text-disabled: #6B7280;

  --rv-success: #4ADE80;
  --rv-warning: #FBBF24;
  --rv-danger: #F87171;
  --rv-status-daily: #5B9BD5;
  --rv-status-build: #E0A458;
  --rv-status-weekend: #4ADE80;
  --rv-status-track: #F87171;
}
```

---

## 2. Typografia

Skill zaproponował parę *Kinetic Motion* (Syncopate + Space Mono, „best for automotive”). Syncopate zostaje jako
krój **display**, ale Space Mono jako tekst ciągły na forum jest zbyt męczący — zamieniony na czytelny sans.
Wszystkie kroje mają podzbiór `latin-ext` (polskie znaki).

| Rola | Krój | Użycie |
|------|------|--------|
| Display | **Syncopate** 700 | Hero, nagłówki sekcji, wordmark „REVVO” — tylko krótkie, wersalikowe teksty |
| UI / treść | **Manrope** 400–700 | Posty, komentarze, nawigacja, formularze (16px / line-height 1.6) |
| Dane techniczne | **JetBrains Mono** 400–600 | Specyfikacja auta (moc, kod lakieru, przebieg), liczby tabelaryczne |

Ładowanie przez `next/font/google` z `subsets: ['latin', 'latin-ext']`, `display: 'swap'`.

---

## 3. Spacing, promienie, cienie

| Token | Wartość |
|-------|---------|
| `--space-xs/sm/md/lg/xl/2xl/3xl` | 4 / 8 / 16 / 24 / 32 / 48 / 64 px |
| `--radius-sm/md/lg` | 6 / 10 / 16 px |
| `--shadow-card` | `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)` |
| `--shadow-glow-copper` | `0 0 0 1px rgba(200,122,75,0.4), 0 8px 32px rgba(200,122,75,0.18)` |

Na ciemnym tle głębię budujemy jaśniejszą powierzchnią + subtelną ramką, nie samym cieniem.

---

## 4. Komponenty (specyfikacja)

- **Przycisk główny (CTA):** tło `--rv-copper`, tekst `--rv-on-copper`, 600, `radius-md`, min. wysokość 44px; hover → `--rv-copper-hover` (200ms); focus → ring 2px `--rv-cobalt-text` z offsetem.
- **Przycisk drugorzędny:** przezroczysty, ramka `--rv-border`, tekst `--rv-text`; hover → tło `--rv-surface-2`.
- **Karta wpisu:** tło `--rv-surface`, ramka `--rv-border`, `radius-lg`; hover → `--rv-surface-2` (bez skalowania, by nie przesuwać layoutu).
- **Input:** tło `--rv-surface-2`, ramka `--rv-border-strong`; focus → ramka `--rv-cobalt` + ring `--rv-cobalt-text`; label zawsze widoczny nad polem, błąd pod polem.
- **Tag marki/modelu (`#bmw`):** chip, tło `--rv-cobalt` (lub kobalt 20% alpha + tekst `--rv-cobalt-text`), radius pełny.
- **Plakietka auta przy nicku:** miniatura 20–24px + `Nick • Marka Model Wersja`, nazwa auta w `--rv-cobalt-text`, cała plakietka jest linkiem do garażu.
- **Miedziany Płomień:** ikona płomienia (Lucide `Flame`) + licznik w `--rv-copper`; stan aktywny wypełniony, mikroanimacja „zapłonu” ≤ 300ms.
- **Status projektu:** Daily / W trakcie budowy / Weekend Toy / Projekt na tor — badge wg tokenów `--rv-status-*` (§1).
- **Awatar zweryfikowanego mechanika:** obrys 2px `--rv-cobalt`.

Ikony: **Lucide** (SVG), zero emoji jako ikon.

---

## 5. Styl i ruch

**Styl:** Motion-Driven (umiarkowanie) — płynne przejścia, wejścia przy scrollu, mikrointerakcje.

- Hover/stan: 150–250ms; wejścia sekcji: 300–500ms; `ease-out` przy wejściu, `ease-in` przy wyjściu.
- Animujemy wyłącznie `transform` i `opacity`.
- **Przejście do garażu z miniatury auta** (wymóg właściciela): shared-element transition — miniatura auta z komentarza „przelatuje” i rozszerza się w hero garażu (View Transitions API / Framer Motion `layoutId`), w trakcie ładowania skeleton karty pojazdu z efektem shimmer w odcieniu miedzi.
- `prefers-reduced-motion`: bez parallaxy i shared-element, tylko crossfade.

**Wzorzec strony głównej:** Hero-Centric — pełnoekranowe wideo tła (`background-revvo.mp4`) + logo + jeden główny CTA,
potem pasek wartości („Twoje auto = Twoja tożsamość”), Garaż Miesiąca, najnowsze wątki.

- Wideo jest **jasne (dzienne)** → obowiązkowy scrim: gradient od `rgba(20,22,27,0.35)` u góry do `#14161B` (`--rv-bg`) na dole, by tekst miał kontrast ≥ 4.5:1 i by hero płynnie przechodził w grafit.
- Wideo to 8-sekundowa narracja: brama garażu się otwiera, auto wyjeżdża. Nie zapętlamy (skok z ostatniej klatki na pierwszą byłby widoczny) — `autoplay muted playsinline` **bez `loop`**, odtwarzamy raz i zatrzymujemy na ostatniej klatce (auto przed garażem), na której pojawia się CTA. Opcjonalnie przycisk „odtwórz ponownie”.
- Pliki: `background-revvo-1080p.mp4` (4 MB) dla ekranów ≥ 768px, `background-revvo-720p.mp4` (1.8 MB) dla mobile, `poster` = `background-revvo-poster-start.webp`; przy `prefers-reduced-motion` pokazujemy tylko `background-revvo-poster.webp` (klatka końcowa).

---

## 6. Anty-wzorce (NIE stosować)

- ❌ Emoji jako ikony
- ❌ Biały tekst na miedzi w zwykłym rozmiarze; kobalt `#1B6CA8` jako kolor tekstu na graficie
- ❌ Fioletowo-różowe gradienty „AI”, neony
- ❌ Hover ze skalowaniem przesuwającym layout
- ❌ Placeholder zamiast labela w formularzach
- ❌ Brak widocznego focusa
- ❌ Poziomy scroll na mobile

---

## 7. Checklista przed oddaniem UI

- [ ] Ikony wyłącznie z Lucide (SVG)
- [ ] `cursor-pointer` na wszystkim, co klikalne; cele dotyku ≥ 44×44px
- [ ] Kontrast tekstu ≥ 4.5:1 (tabela powyżej)
- [ ] Widoczny focus (ring `--rv-cobalt-text`)
- [ ] `prefers-reduced-motion` respektowane (wideo → poster)
- [ ] Responsywność: 375 / 768 / 1024 / 1440 px
- [ ] Brak treści ukrytej pod przyklejoną nawigacją
- [ ] Obrazy w WebP/AVIF, zarezerwowane wymiary (CLS < 0.1)
