"""
Dobór zdjęć generacji z katalogu (car2db) przez Wikidatę i kategorie Wikimedia Commons.

Ścieżka dla każdej generacji:
  1. Wikidata: pozycje „car model” danej marki → kategoria Commons modelu (P373),
     a dla kategorii generacji — pozycja z latami produkcji i zdjęciem głównym (P18).
  2. Commons: podkategorie modelu to generacje („Honda Civic (1991)”, „Honda Legend (KA7)”,
     „Honda Life (3rd generation)”). Lata generacji: z nazwy, z Wikidaty albo z roczników w tytułach zdjęć.
  3. Generacja car2db → kategoria (kod nadwozia, rok rozpoczęcia produkcji, numer generacji).
  4. Zdjęcie z kategorii (i jej podkategorii nadwozi): wolna licencja, ≥ 1200 px, bez wnętrz/detali/tuningu,
     rocznik w tytule zgodny z generacją (lifting ≠ przed liftingiem), premia za zdjęcie główne z Wikidaty,
     „Quality image” Commons i czyste ujęcia przód/bok. Jedno zdjęcie = jedna generacja.

Użycie (z katalogu web/scripts/wikidata):
  python3 wikidata_match.py                 → wszystkie generacje z ../commons/generacje.json
  python3 wikidata_match.py 9366 771        → tylko wybrane id
Wynik: wikidata_picks.json (format zgodny z ../fetch-commons-photos.py) + raport.tsv.
Ręczne poprawki po przeglądzie: przeglad.json ({"reject": {id: powód}, "force": {id: "File:…"}}).
Odpowiedzi API są cache'owane w .cache/ (ponowne uruchomienie nie odpytuje serwerów).
"""
from __future__ import annotations

import hashlib
import json
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
UA = {"User-Agent": "REVVO-catalog/0.2 (https://revvo.com; kontakt@revvo.com)"}
COMMONS = "https://commons.wikimedia.org/w/api.php"
SPARQL = "https://query.wikidata.org/sparql"

MIN_WIDTH = 1200
ALLOWED_LICENSE = re.compile(r"^(cc0|public domain|pd\b|cc by(-sa)? ?[1-4]\.0)", re.I)
# Tytuły zdjęć, które nie pokazują całego, seryjnego auta
BAD = re.compile(
    r"interior|innen|interieur|cockpit|dash|engine|motor\b|motorraum|badge|emblem|logo|wheel|rim\b|seat|trunk|boot\b|"
    r"tail ?light|headlight|steering|gauge|detail|brochure|toy|model car|diecast|tomica|lego|scale model|crash|wreck|"
    r"rust|junk|scrap|rear|heck|back\b|race|racing|le mans|\bgt[1-4]\b|gt300|gt500|jgtc|super gt|rally|drift|nascar|"
    r"touring car|btcc|wtcc|jtcc|no\.\s?\d|#\d|concept|prototype|police|polizei|taxi|modified|tuned|tuning|widebody|"
    r"stance|kit car|replica|lowered|slammed|bosozoku|camper|ambulance|limousine|stretch|sticker|livery|night|"
    r"parade|museum display|cutaway|chassis|underbody|test car|mule|mugen|modulo|auto salon|custom|show car",
    re.I,
)
# Podkategorie generacji, z których nie bierzemy zdjęć
BAD_SUBCAT = re.compile(
    r"interior|engine|detail|competition|racing|race|police|tuning|modified|concept|model|toy|badge|wheel|light|"
    r"dashboard|rear|rally|taxi|service|crash|advert|brochure|patent|mule|auto show|motor show|salon|exhibit",
    re.I,
)
# Podkategorie modelu, które nie są generacjami
NOT_GENERATION = re.compile(
    r"competition|police|concept|tuning|mule|auto show|motor show| at the |\bby\b|service|interior|engine|"
    r"hybrid|advert|brochure|toy|model|racing|rally|taxi",
    re.I,
)
REGIONAL = re.compile(r"north america|\busa?\b|\bus\b|china|chinese|india|thailand|brazil|australia|indonesia", re.I)
OTHER_MAKES = ["acura", "isuzu", "nissan", "rover", "mg ", "triumph", "chevrolet", "mercedes", "renault", "mazda",
               "toyota", "subaru", "mitsubishi", "suzuki", "daihatsu", "hyundai", "kia"]
BODY_WORDS = {
    "Sedan": ["sedan", "saloon", "limousine"],
    "Hatchback": ["hatchback", "hatch", "3-door", "5-door", "3door", "5door"],
    "Kombi": ["wagon", "estate", "kombi", "touring", "tourer", "aerodeck", "aero deck", "shuttle"],
    "Coupe": ["coupe", "coupé"],
    "Kabriolet": ["convertible", "cabrio", "cabriolet"],
    "Roadster": ["roadster"],
    "Targa": ["targa"],
    "Minivan": ["minivan", "van", "mpv"],
    "Crossover": ["suv", "crossover"],
    "SUV": ["suv"],
    "Pikap": ["pickup", "pick-up", "truck"],
}
ORDINALS = {"first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8,
            "ninth": 9, "tenth": 10, "eleventh": 11}
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XI": 11}

# Nazwy modeli car2db → nazwy używane w Wikidacie/Commons (gdy się różnią)
ALIASES = {
    ("Honda", "Stepwgn"): ["Honda Step WGN", "Honda Stepwgn", "Honda StepWGN"],
    ("Honda", "Thats"): ["Honda That's"],
    ("Honda", "Edix"): ["Honda Edix", "Honda FR-V"],
    ("Honda", "FR-V"): ["Honda FR-V", "Honda Edix"],
    ("Honda", "Jazz"): ["Honda Jazz", "Honda Fit"],
    ("Honda", "Crosstour"): ["Honda Crosstour", "Honda Accord Crosstour"],
    ("Honda", "Ascot Innova"): ["Honda Ascot Innova"],
    ("Infiniti", "EX-Series"): ["Infiniti EX", "Infiniti EX35", "Infiniti EX37"],
    ("Infiniti", "FX-Series"): ["Infiniti FX", "Infiniti FX35", "Infiniti FX45", "Infiniti FX37", "Infiniti FX50"],
    ("Infiniti", "G-Series"): ["Infiniti G", "Infiniti G20", "Infiniti G35", "Infiniti G37", "Infiniti G25"],
    ("Infiniti", "I-Series"): ["Infiniti I", "Infiniti I30", "Infiniti I35"],
    ("Infiniti", "JX-Series"): ["Infiniti JX", "Infiniti JX35", "Infiniti QX60"],
    ("Infiniti", "M-Series"): ["Infiniti M", "Infiniti M30", "Infiniti M35", "Infiniti M45", "Infiniti M37", "Infiniti M56"],
    ("Infiniti", "QX-Series"): ["Infiniti QX", "Infiniti QX4", "Infiniti QX56"],
}
# Lata produkcji generacji, których car2db nie podaje (tylko do dopasowania)
YEAR_OVERRIDE = {757: (1985, 1989), 7233: (1976, 1981), 9053: (1981, 1985), 763: (1981, 1986), 776: (1979, 1983),
                 8095: (1983, 1987), 8096: (1972, 1979), 831: (1987, 1991), 832: (1982, 1987), 833: (1978, 1982),
                 8124: (2006, 2012)}


# ─────────────────────────────── HTTP + cache ───────────────────────────────

def fetch_json(url: str, params: dict, accept: str = "application/json") -> dict:
    key = hashlib.sha1((url + json.dumps(params, sort_keys=True)).encode()).hexdigest()
    path = CACHE / f"{key}.json"
    if path.exists():
        return json.loads(path.read_text())
    req = urllib.request.Request(url + "?" + urllib.parse.urlencode(params), headers={**UA, "Accept": accept})
    for attempt in range(4):
        try:
            data = json.load(urllib.request.urlopen(req, timeout=60))
            CACHE.mkdir(exist_ok=True)
            path.write_text(json.dumps(data))
            time.sleep(0.1)  # uprzejme tempo dla serwerów Wikimedii
            return data
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                print(f"  ! {e} ({params.get('cmtitle') or params.get('titles', '')[:60]})", file=sys.stderr)
                return {}
            time.sleep(2 * (attempt + 1))
    return {}


def commons(**params) -> dict:
    return fetch_json(COMMONS, {**params, "action": "query", "format": "json", "formatversion": 2})


def sparql(query: str) -> list[dict]:
    data = fetch_json(SPARQL, {"query": query, "format": "json"}, "application/sparql-results+json")
    return [{k: v["value"] for k, v in row.items()} for row in data.get("results", {}).get("bindings", [])]


# ─────────────────────────────── Wikidata ───────────────────────────────

def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def wikidata_items(make: str) -> list[dict]:
    """Wszystkie pozycje „car model” (Q3231690 i podklasy) z etykietą zaczynającą się od marki."""
    q = f"""
    SELECT ?m ?l (SAMPLE(?cc) AS ?cat) (SAMPLE(?img) AS ?image) (MIN(YEAR(?s)) AS ?y1) (MAX(YEAR(?e)) AS ?y2)
           (GROUP_CONCAT(DISTINCT ?a; separator="|") AS ?aliases) WHERE {{
      ?m wdt:P31/wdt:P279* wd:Q3231690 ; rdfs:label ?l .
      FILTER(LANG(?l) = "en" && STRSTARTS(?l, "{make} "))
      OPTIONAL {{ ?m wdt:P373 ?cc }} OPTIONAL {{ ?m wdt:P18 ?img }}
      OPTIONAL {{ ?m wdt:P2031|wdt:P571|wdt:P729 ?s }} OPTIONAL {{ ?m wdt:P2032|wdt:P576|wdt:P730 ?e }}
      OPTIONAL {{ ?m skos:altLabel ?a FILTER(LANG(?a) = "en") }}
    }} GROUP BY ?m ?l"""
    items = []
    for r in sparql(q):
        items.append({
            "qid": r["m"].rsplit("/", 1)[-1],
            "label": r["l"],
            "aliases": [a for a in r.get("aliases", "").split("|") if a],
            "cat": r.get("cat"),
            "image": "File:" + urllib.parse.unquote(r["image"].rsplit("/", 1)[-1]) if r.get("image") else None,
            "y1": int(r["y1"]) if r.get("y1") else None,
            "y2": int(r["y2"]) if r.get("y2") else None,
        })
    return items


# ─────────────────────────────── Commons ───────────────────────────────

def subcats(cat: str) -> list[str]:
    d = commons(list="categorymembers", cmtitle=f"Category:{cat}", cmtype="subcat", cmlimit=500)
    return [m["title"].removeprefix("Category:") for m in d.get("query", {}).get("categorymembers", [])]


def files_in(cat: str) -> list[str]:
    d = commons(list="categorymembers", cmtitle=f"Category:{cat}", cmtype="file", cmlimit=500)
    return [m["title"] for m in d.get("query", {}).get("categorymembers", [])]


def category_exists(cat: str) -> bool:
    d = commons(titles=f"Category:{cat}", prop="categoryinfo")
    pages = d.get("query", {}).get("pages", [])
    return bool(pages) and not pages[0].get("missing") and pages[0].get("categoryinfo", {}).get("size", 0) > 0


def image_info(titles: list[str]) -> dict[str, dict]:
    out = {}
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        d = commons(titles="|".join(chunk), prop="imageinfo|categories", iiprop="url|size|mime|extmetadata",
                    iiurlwidth=2048, iiextmetadatafilter="LicenseShortName|LicenseUrl|Artist",
                    clcategories="Category:Quality images|Category:Valued images sorted by promotion date", cllimit=500)
        for p in d.get("query", {}).get("pages", []):
            ii = (p.get("imageinfo") or [None])[0]
            if not ii:
                continue
            em = ii.get("extmetadata", {})
            out[p["title"]] = {
                "width": ii.get("width", 0), "height": ii.get("height", 1), "mime": ii.get("mime"),
                "url": ii.get("thumburl") or ii.get("url"), "page": ii.get("descriptionurl"),
                "license": em.get("LicenseShortName", {}).get("value", "").strip(),
                "license_url": em.get("LicenseUrl", {}).get("value", ""),
                "author": re.sub(r"<[^>]+>", "", em.get("Artist", {}).get("value", "")).strip(),
                "quality": bool(p.get("categories")),
            }
    return out


# ─────────────────────────────── Roczniki ───────────────────────────────

MONTHS = r"(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|januar|februar|märz|mai|juni|juli|oktober|dezember)"


def title_years(title: str) -> list[int]:
    """Roczniki modelu z tytułu — bez dat wykonania zdjęcia (2020-10-05, 5. Juni 2011, Aug 2009)."""
    t = re.sub(r"\d{4}-\d{1,2}(-\d{1,2})?(?!\d)|\d{1,2}[-./]\d{1,2}[-./]\d{4}|\d{8}", " ", title)
    t = re.sub(rf"\d{{1,2}}\.?\s+{MONTHS}[a-zä]*\.?\s+\d{{4}}", " ", t, flags=re.I)
    t = re.sub(rf"{MONTHS}[a-zä]*\.?,?\s+(19|20)\d\d", " ", t, flags=re.I)
    t = re.sub(r"IMG[_ ]?\d+|DSC\w*|P\d{7}", " ", t)
    return [int(y) for y in re.findall(r"(?<!\d)(19[4-9]\d|20[0-2]\d)(?!\d)", t)]


def category_meta(name: str, root: str, wd_by_cat: dict) -> dict:
    """Lata i numer generacji kategorii: z nazwy, z Wikidaty, a w ostateczności z roczników w tytułach zdjęć."""
    meta = {"name": name, "regional": bool(REGIONAL.search(name.removeprefix(root))), "y1": None, "y2": None,
            "ordinal": None, "image": None, "qid": None, "years_from": None}
    suffix = name.removeprefix(root)
    m = re.search(r"\((19|20)(\d\d)(?:\s*[–-]\s*((?:19|20)\d\d))?", suffix)
    if m:
        meta["y1"] = int(m.group(1) + m.group(2))
        meta["y2"] = int(m.group(3)) if m.group(3) else None
        meta["years_from"] = "nazwa"
    m = re.search(r"(\d+)(st|nd|rd|th) generation|(" + "|".join(ORDINALS) + r") generation", suffix, re.I)
    if m:
        meta["ordinal"] = int(m.group(1)) if m.group(1) else ORDINALS[m.group(3).lower()]
    wd = wd_by_cat.get(name)
    if wd:
        meta["qid"], meta["image"] = wd["qid"], wd["image"]
        if not meta["y1"] and wd["y1"]:
            meta["y1"], meta["y2"], meta["years_from"] = wd["y1"], wd["y2"], "wikidata"
        if not meta["ordinal"]:
            m = re.search(r"(" + "|".join(ORDINALS) + r") generation|(\d+)(st|nd|rd|th) generation", wd["label"], re.I)
            if m:
                meta["ordinal"] = ORDINALS[m.group(1).lower()] if m.group(1) else int(m.group(2))
    if not meta["y1"]:
        ys = [y for f in collect_files(name) for y in title_years(f.removeprefix("File:"))]
        # Tylko roczniki powtarzające się w kilku tytułach — pojedyncze błędnie opisane pliki nie przesuwają zakresu
        threshold = max(2, round(0.04 * len(ys)))
        common = sorted(y for y in set(ys) if ys.count(y) >= threshold)
        if common:
            lo, hi = common[0], common[-1]
            meta["y1"], meta["y2"], meta["years_from"] = lo, meta["y2"] or hi, "tytuły zdjęć"
    return meta


def is_generation_cat(sub: str, root: str) -> bool:
    if not sub.startswith(root) or NOT_GENERATION.search(sub.removeprefix(root)):
        return False
    rest = sub.removeprefix(root).strip()
    return bool(re.fullmatch(r"\(.+\)", rest) or re.fullmatch(r"[A-Z]{1,3}\d[\w/]*(\s*\(.+\))?", rest)
                or re.fullmatch(r"\d+(st|nd|rd|th) generation", rest))


# ─────────────────────────────── Dopasowanie ───────────────────────────────

def gen_years(g: dict) -> tuple[int, int] | None:
    if g["id"] in YEAR_OVERRIDE:
        return YEAR_OVERRIDE[g["id"]]
    y1 = g["year_from"] or g["tmin"]
    if not y1:
        return None
    return y1, g["year_to"] or y1 + 6


def gen_code(g: dict) -> str | None:
    """Kod nadwozia z nazwy generacji car2db („AP1”, „Y51 (lifting)”, „CB5”)."""
    head = re.sub(r"\s*\(.*\)", "", g["gen"]).strip()
    return head if re.fullmatch(r"[A-Z]{1,3}\d{0,2}[A-Z]?\d?", head) and "generacja" not in head else None


def base_name(g: dict) -> str:
    return re.sub(r"\s*\(.*\)", "", g["gen"]).strip()


def gen_ordinal(g: dict) -> int | None:
    m = re.match(r"([IVX]+) generacja", g["gen"])
    return ROMAN.get(m.group(1)) if m else None


def choose_category(g: dict, cands: list[dict]) -> tuple[dict | None, str]:
    code, years, ordinal = gen_code(g), gen_years(g), gen_ordinal(g)
    if code:
        hits = [c for c in cands if re.search(rf"(?<![A-Za-z0-9]){re.escape(code)}(?![0-9])", c["name"])]
        if hits:
            return min(hits, key=lambda c: c["regional"]), f"kod {code}"
    if len(cands) == 1:
        return cands[0], "jedyna kategoria"
    dated = sorted((c for c in cands if c["y1"]), key=lambda c: c["y1"])
    for c in dated:
        nxt = next((d["y1"] for d in dated if d["y1"] > c["y1"] and not d["regional"]), None)
        c["_end"] = min(c["y2"] or 2026, nxt - 1 if nxt else 2026)

    def fit(c):
        """Największa część wspólna lat produkcji, kara za odległy początek (car2db bywa nieprecyzyjne),
        zgodność numeru generacji („II generacja” ↔ „2nd generation”) jako mocny sygnał."""
        sc = None
        if years and c["y1"]:
            y1, y2 = years
            overlap = min(y2, c["_end"]) - max(y1, c["y1"]) + 1
            if overlap > 0 or abs(c["y1"] - y1) <= 2:
                sc = overlap - 0.5 * abs(c["y1"] - y1)
        if ordinal and c["ordinal"]:
            sc = (sc or 0) + (4 if c["ordinal"] == ordinal else -6)
        if sc is not None and c["regional"]:
            sc -= 2
        return sc

    scored = [(fit(c), c) for c in cands]
    scored = [t for t in scored if t[0] is not None]
    if scored:
        sc, best = max(scored, key=lambda t: t[0])
        if best["y1"]:
            return best, f"lata {best['y1']}–{best['_end']} ({best['years_from']})" + (", numer generacji" if best["ordinal"] == ordinal else "")
        return best, f"numer generacji {ordinal}"
    local = [c for c in cands if not c["regional"]]
    if len(local) == 1:
        return local[0], "jedyna kategoria rynku lokalnego"
    return None, "brak pasującej kategorii"


def score_file(title: str, info: dict, g: dict, years: tuple[int, int] | None, meta: dict,
               lifting_start: int | None, model_names: list[str], sibling_models: list[str]) -> tuple[int, str] | None:
    t = title.removeprefix("File:")
    tl = t.lower()
    if info["mime"] not in ("image/jpeg", "image/png") or info["width"] < MIN_WIDTH:
        return None
    if not ALLOWED_LICENSE.match(info["license"]) or BAD.search(t):
        return None
    if any(m in tl for m in OTHER_MAKES if m.strip() != g["make"].lower()):
        return None
    if any(s.lower() in tl for s in sibling_models):
        return None
    s, why = 0, []
    ys = title_years(t)
    if years and ys:
        lo, hi = years
        if not any(lo - 1 <= y <= hi + 1 for y in ys):
            return None
        s += 4; why.append("rocznik")
        if g["facelift"] and all(y < lo for y in ys):
            return None
        if g["facelift"] and min(ys) < lo:
            s -= 3; why.append("raczej przed liftingiem")
        if lifting_start and not g["facelift"] and max(ys) > lifting_start:
            s -= 3; why.append("raczej lifting")
    if meta.get("image") == title:
        s += 3; why.append("zdjęcie główne Wikidaty")
    if info["quality"]:
        s += 3; why.append("Quality image")
    # Seria „… (2015-07-09) 01/02.jpg”: 01 to przód, 02 zwykle tył
    if re.search(r"\(\d{4}-\d{2}-\d{2}\) 0?[2-9]\b", t):
        s -= 4; why.append("seria: raczej tył")
    elif re.search(r"\(\d{4}-\d{2}-\d{2}\)|frontansicht|front[- ]left|front[- ]right|3/4|three.quarter", tl):
        s += 2; why.append("czyste ujęcie")
    elif re.search(r"front", tl):
        s += 1
    if re.search(r"side|profile|seitenansicht|lateral", tl):
        s += 1
    body = BODY_WORDS.get(g["body"], [])
    if body and any(w in tl for w in body):
        s += 2; why.append("nadwozie")
    elif any(w in tl for k, ws in BODY_WORDS.items() if k != g["body"] for w in ws if w not in body):
        s -= 1
    if any(re.search(rf"\b{re.escape(n.lower())}\b", tl) for n in model_names):
        s += 1
    if info["width"] >= 2000:
        s += 1
    if 1.3 <= info["width"] / info["height"] <= 2.2:
        s += 1
    return s, ", ".join(why)


def collect_files(cat: str, depth: int = 1) -> list[str]:
    files = files_in(cat)
    if depth:
        for sub in subcats(cat):
            if not BAD_SUBCAT.search(sub.removeprefix(cat)):
                files += collect_files(sub, depth - 1)
    return list(dict.fromkeys(files))


def main(only: set[str]) -> None:
    gens = json.loads((HERE.parent / "commons" / "generacje.json").read_text())
    review = json.loads((HERE / "przeglad.json").read_text()) if (HERE / "przeglad.json").exists() else {}
    rejected, forced = review.get("reject", {}), review.get("force", {})
    cat_override = review.get("category", {})
    excluded = set(review.get("exclude", []))
    models_by_make: dict[str, set[str]] = {}
    for g in gens:
        models_by_make.setdefault(g["make"], set()).add(g["model"])

    wd = {make: wikidata_items(make) for make in models_by_make}
    results, used = {}, set()
    # Generacje bazowe przed liftingami — lifting dostaje wtedy inne zdjęcie (najlepiej z roczników po liftingu)
    order = sorted(gens, key=lambda g: (g["make"], g["model"], g["facelift"] or "lifting" in g["gen"], g["id"]))
    cat_cache: dict[str, list[dict]] = {}
    for g in order:
        gid = str(g["id"])
        if only and gid not in only:
            continue
        g["facelift"] = g["facelift"] or int("lifting" in g["gen"])
        make, model = g["make"], g["model"]
        names = ALIASES.get((make, model), [f"{make} {model}"])
        key = f"{make}|{model}"
        if key not in cat_cache:
            items = wd[make]
            # Kategoria modelu: dokładna nazwa w Commons → etykieta w Wikidacie → alias w Wikidacie (ostrożnie:
            # aliasy bywają mylące, np. Integra ma alias „Honda Civic”)
            roots = [n for n in names if category_exists(n)]
            for field in ("label", "aliases"):
                if roots:
                    break
                for n in names:
                    for it in items:
                        vals = [it["label"]] if field == "label" else it["aliases"]
                        if it["cat"] and norm(n) in {norm(v) for v in vals}:
                            roots.append(it["cat"])
            roots = list(dict.fromkeys(roots))
            wd_by_cat = {it["cat"]: it for it in items if it["cat"]}
            cands = []
            for root in roots:
                subs = [s for s in subcats(root) if is_generation_cat(s, root)]
                # Poziom niżej: „Honda Odyssey (International)” → „Honda Odyssey RA1/RA5”
                for s in list(subs):
                    deeper = [d for d in subcats(s) if is_generation_cat(d, s) or is_generation_cat(d, root)]
                    if deeper and not re.search(r"\d", s.removeprefix(root)):
                        subs += deeper
                cands += [category_meta(s, root, wd_by_cat) for s in subs]
                if not subs:
                    cands.append(category_meta(root, root, wd_by_cat))
            uniq = {c["name"]: c for c in cands}
            cat_cache[key] = list(uniq.values())
        cands = cat_cache[key]

        entry = {"gen": g, "pick": None, "score": None, "category": None, "wikidata": None, "reason": ""}
        results[gid] = entry
        if gid in rejected:
            entry["reason"] = f"odrzucone w przeglądzie: {rejected[gid]}"
            continue
        # Lifting to ta sama generacja — ta sama kategoria co generacja bazowa
        base_id = next((str(x["id"]) for x in gens if x["make"] == make and x["model"] == model and x["id"] != g["id"]
                        and "lifting" not in x["gen"] and base_name(x) == base_name(g)), None)
        base_cat = results.get(base_id, {}).get("category") if g["facelift"] and base_id else None
        if gid in cat_override:
            name = cat_override[gid]
            meta = next((c for c in cands if c["name"] == name), None) or category_meta(name, name, {})
            why_cat = "kategoria wskazana w przeglądzie"
        elif base_cat:
            meta = next((c for c in cands if c["name"] == base_cat), None) or category_meta(base_cat, base_cat, {})
            why_cat = "jak generacja bazowa"
        else:
            meta, why_cat = choose_category(g, cands)
        entry["reason"] = why_cat
        if not meta:
            print(f"{gid:>6} {make} {model} {g['gen']}: {why_cat}")
            continue
        entry["category"], entry["wikidata"] = meta["name"], meta["qid"]

        years = gen_years(g)
        siblings = [f"{make} {m}" for m in models_by_make[make] if m != model and m.startswith(model + " ")]
        lifting_start = next((x["year_from"] for x in gens if x["model"] == model and "lifting" in x["gen"]
                              and base_name(x) == base_name(g)
                              and x["id"] != g["id"]), None)
        files = [forced[gid]] if gid in forced else collect_files(meta["name"])
        # Wstępny filtr po samym tytule, żeby nie pobierać metadanych setek zdjęć
        files = [f for f in files if re.search(r"\.(jpe?g|png)$", f, re.I) and not BAD.search(f)] if gid not in forced else files
        infos = image_info(files[:400])
        best = None
        for title, info in infos.items():
            if (title in used or title in excluded) and gid not in forced:
                continue
            sc = score_file(title, info, g, years, meta, lifting_start, names, siblings)
            if gid in forced and not sc:
                sc = (0, "wymuszone w przeglądzie")
            if sc and (best is None or sc[0] > best[0]):
                best = (sc[0], sc[1], title, info)
        if not best:
            entry["reason"] += "; brak zdjęcia spełniającego kryteria"
            print(f"{gid:>6} {make} {model} {g['gen']}: {meta['name']} → BRAK")
            continue
        used.add(best[2])
        info = best[3]
        entry["score"] = best[0]
        entry["pick"] = {"title": best[2], "url": info["url"], "page": info["page"], "license": info["license"],
                         "license_url": info["license_url"], "author": info["author"] or "nieznany autor",
                         "width": info["width"], "height": info["height"], "why": best[1]}
        print(f"{gid:>6} {make} {model} {g['gen']}: {meta['name']} ({why_cat}) → {best[2][5:75]} [{best[0]}]")

    out = HERE / ("wikidata_picks.json" if not only else "wikidata_picks_partial.json")
    out.write_text(json.dumps(results, ensure_ascii=False, indent=1))
    with open(HERE / "raport.tsv", "w") as f:
        f.write("id\tmarka\tmodel\tgeneracja\tkategoria Commons\twikidata\tzdjęcie\twynik\tuzasadnienie\n")
        for gid, e in results.items():
            g, p = e["gen"], e["pick"]
            f.write(f"{gid}\t{g['make']}\t{g['model']}\t{g['gen']}\t{e['category'] or ''}\t{e['wikidata'] or ''}\t"
                    f"{p['title'] if p else ''}\t{e['score'] if p else ''}\t{e['reason']}{'; ' + p['why'] if p and p['why'] else ''}\n")
    have = sum(1 for e in results.values() if e["pick"])
    print(f"\nGeneracji: {len(results)}, ze zdjęciem: {have}, bez: {len(results) - have} → {out.name}, raport.tsv")


if __name__ == "__main__":
    main(set(sys.argv[1:]))
