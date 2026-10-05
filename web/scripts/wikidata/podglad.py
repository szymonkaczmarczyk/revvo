"""
Arkusze podglądu wybranych zdjęć (do ręcznego przeglądu przed importem).

Użycie: python3 podglad.py [wikidata_picks.json] [id…]
Wynik: .podglad/arkusz-01.jpg, arkusz-02.jpg… (siatka 4×4 miniatur z id i nazwą generacji).
Odrzucone zdjęcia wpisz do przeglad.json → "reject", podmienione → "force", i uruchom wikidata_match.py ponownie.
"""
import io
import json
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
OUT = HERE / ".podglad"
UA = {"User-Agent": "REVVO-catalog/0.2 (https://revvo.com; kontakt@revvo.com)"}
W, H, COLS, ROWS = 480, 300, 4, 4


def thumb(url: str) -> Image.Image:
    # Miniatura 640 px z serwera Commons zamiast pełnego pliku
    small = url.replace("/2048px-", "/640px-")
    cache = OUT / "cache" / (str(abs(hash(small))) + ".jpg")
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(small, headers=UA)
        cache.write_bytes(urllib.request.urlopen(req, timeout=60).read())
        time.sleep(0.2)
    return Image.open(io.BytesIO(cache.read_bytes())).convert("RGB")


def main(picks_file: str, only: set[str]) -> None:
    picks = json.loads(Path(picks_file).read_text())
    rows = [(gid, e) for gid, e in picks.items() if e.get("pick") and (not only or gid in only)]
    OUT.mkdir(exist_ok=True)
    per = COLS * ROWS
    for n in range(0, len(rows), per):
        sheet = Image.new("RGB", (COLS * W, ROWS * (H + 34)), "#14161B")
        draw = ImageDraw.Draw(sheet)
        for i, (gid, e) in enumerate(rows[n:n + per]):
            x, y = (i % COLS) * W, (i // COLS) * (H + 34)
            try:
                im = thumb(e["pick"]["url"])
                im.thumbnail((W - 8, H))
                sheet.paste(im, (x + 4, y + 30))
            except Exception as err:  # noqa: BLE001
                draw.text((x + 8, y + 60), f"błąd: {err}", fill="#F87171")
            g = e["gen"]
            draw.text((x + 6, y + 4), f"{gid} {g['model']} {g['gen']} {g['year_from'] or ''}-{g['year_to'] or ''}",
                      fill="#E5E7EB")
            draw.text((x + 6, y + 17), e["pick"]["title"][5:80], fill="#9CA3AF")
        path = OUT / f"arkusz-{n // per + 1:02d}.jpg"
        sheet.save(path, quality=80)
        print(path)


if __name__ == "__main__":
    args = sys.argv[1:]
    file = args.pop(0) if args and args[0].endswith(".json") else str(HERE / "wikidata_picks.json")
    main(file, set(args))
