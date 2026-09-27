# Zdjęcia generacji z Wikimedia Commons

1. `python3 commons_find.py [id…]` — wyszukuje zdjęcie dla każdej generacji z `generacje.json` (eksport z bazy),
   filtry: wolna licencja, ≥ 1200 px, rocznik w opisie w zakresie produkcji, bez wnętrz/detali/aut wyścigowych/tuningu.
   Wynik: `commons_picks.json` (lub plik z `OUT=`).
2. `python3 finalize_picks.py` — łączy przebiegi, odrzuca niejednoznaczne dopasowania → `commons_final.json`.
3. Ręczny przegląd tytułów (`commons_final.json`), potem:
   `python3 ../fetch-commons-photos.py commons_final.json` → `content/seed/zdjecia/` + `atrybucje.json`
4. `npm run photos:import` → R2 + baza.

Zasada: lepiej brak zdjęcia niż zdjęcie złej generacji.
