# Zdjęcia generacji: Wikidata → kategorie Wikimedia Commons

Następca wyszukiwania pełnotekstowego z `../commons/`. Zamiast szukać zdjęć po tytułach, dopasowuje
generację car2db do **kategorii generacji w Commons** (np. „Honda Civic (1991)”, „Honda Legend (KA7)”),
korzystając z Wikidaty (kategoria modelu P373, lata produkcji, zdjęcie główne P18). Działa dla każdej marki —
przy rozszerzaniu katalogu wystarczy nowy eksport `generacje.json` (i ewentualnie aliasy nazw w `ALIASES`).

1. `python3 wikidata_match.py [id…]` → `wikidata_picks.json` + `raport.tsv`
   (kategoria, pozycja Wikidaty, wybrane zdjęcie, wynik i uzasadnienie dla każdej generacji).
2. `python3 podglad.py` → arkusze miniatur w `.podglad/` do ręcznego przeglądu.
   Błędne dopasowania wpisz do `przeglad.json` (`reject`: odrzuć, `force`: wskaż konkretny plik) i powtórz krok 1
   (odpowiedzi API są w `.cache/`, więc ponowny przebieg trwa sekundy).
3. `python3 ../fetch-commons-photos.py wikidata_picks.json` → `content/seed/zdjecia/` + `atrybucje.json`
   (usuń wcześniej pliki `gen-<id>.jpg` generacji, którym zmieniasz zdjęcie).
4. `npm run photos:import` → R2 (WebP 1280/640) + `car_generations.image_url` / `image_credit`.

Kryteria zdjęcia: wolna licencja (CC0, CC BY, CC BY-SA, domena publiczna), ≥ 1200 px, całe seryjne auto
(bez wnętrz, detali, tyłu, aut wyścigowych, tuningu, innych marek i rebadge'ów), rocznik w tytule zgodny
z generacją (lifting → zdjęcie po liftingu). Premie: zdjęcie główne z Wikidaty, „Quality image”, czyste ujęcie
przód/bok, zgodne nadwozie. Jedno zdjęcie trafia tylko do jednej generacji.

Zasada bez zmian: lepiej brak zdjęcia niż zdjęcie złej generacji.

Eksport `../commons/generacje.json` z bazy:

```sql
select g.id, mk.name as make, m.name as model, g.name as gen, g.year_from, g.year_to, g.facelift,
       (select s.body_type from car_series s where s.generation_id = g.id limit 1) as body,
       null::int as tmin
from car_generations g join car_models m on m.id = g.model_id join car_makes mk on mk.id = m.make_id;
```
