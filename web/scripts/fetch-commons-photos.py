"""
Pobiera wybrane zdjęcia generacji z Wikimedia Commons do ../content/seed/zdjecia/gen-<id>.jpg
i zapisuje atrybucje (autor, licencja, źródło) do ../content/seed/zdjecia/atrybucje.json.

Wejście: plik JSON z wyborem zdjęć ({ "<id_generacji>": { "pick": { url, title, page, author, license, license_url } } }).
Użycie:  python3 scripts/fetch-commons-photos.py <picks.json>
Potem:   npm run photos:import
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

UA = {"User-Agent": "REVVO-catalog/0.1 (https://revvo.com; kontakt@revvo.com)"}
OUT = Path(__file__).resolve().parents[2] / "content" / "seed" / "zdjecia"


def main(picks_file: str) -> None:
    picks = json.loads(Path(picks_file).read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    credits_file = OUT / "atrybucje.json"
    credits = json.loads(credits_file.read_text()) if credits_file.exists() else {}

    ok = skipped = failed = 0
    for gen_id, entry in picks.items():
        pick = entry.get("pick")
        if not pick:
            skipped += 1
            continue
        target = OUT / f"gen-{gen_id}.jpg"
        if not target.exists():
            try:
                req = urllib.request.Request(pick["url"], headers=UA)
                target.write_bytes(urllib.request.urlopen(req, timeout=60).read())
                time.sleep(1)  # uprzejme tempo dla serwerów Wikimedii
            except Exception as e:  # noqa: BLE001
                print(f"! gen-{gen_id}: {e}")
                failed += 1
                continue
        credits[gen_id] = {
            "author": pick["author"] or "nieznany autor",
            "license": pick["license"],
            "licenseUrl": pick["license_url"],
            "sourceUrl": pick["page"],
            "title": pick["title"].removeprefix("File:"),
        }
        ok += 1
    credits_file.write_text(json.dumps(credits, ensure_ascii=False, indent=1))
    print(f"Pobrane: {ok}, bez zdjęcia: {skipped}, błędy: {failed} → {OUT}")


if __name__ == "__main__":
    main(sys.argv[1])
