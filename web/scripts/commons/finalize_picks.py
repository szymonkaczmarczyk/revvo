import json, re, collections
main = json.load(open("commons_picks.json"))
fix = json.load(open("commons_picks_fix.json"))
main.update(fix)
gens = {str(g["id"]): g for g in json.load(open("generacje.json"))}
OVERRIDE = {"757":(1985,1989),"7233":(1976,1981),"9053":(1981,1985),"763":(1981,1986),"776":(1979,1983),"8095":(1983,1987),"8096":(1972,1979),"831":(1987,1991),"832":(1982,1987),"833":(1978,1982)}
BAD2 = re.compile(r"kit car|replica|based|\belf\b|spex|conversion|camper|lowered|slammed|bosozoku", re.I)
per_model = collections.Counter(g["model"] for g in gens.values())

def years_of(gid):
    g = gens[gid]
    y1 = g["year_from"] or g["tmin"]; y2 = g["year_to"] or (y1 + 6 if y1 else None)
    if not y1 and gid in OVERRIDE: y1, y2 = OVERRIDE[gid]
    return (y1, y2) if y1 else None

def title_years(t):
    tt = re.sub(r"\d{4}-\d{1,2}(-\d{1,2})?(?!\d)|\d{1,2}[-.]\d{1,2}[-.]\d{4}", " ", t)
    return [int(y) for y in re.findall(r"(?<!\d)(19[5-9]\d|20[0-2]\d)(?!\d)", tt)]

dropped = collections.Counter()
for gid, e in main.items():
    p = e.get("pick")
    if not p: continue
    yrs = years_of(gid); ty = title_years(p["title"])
    if BAD2.search(p["title"]):
        e["pick"] = None; dropped["niepasujące auto (kit car / przeróbka)"] += 1; continue
    if yrs and per_model[gens[gid]["model"]] > 1 and not any(yrs[0] <= y <= yrs[1] for y in ty):
        e["pick"] = None; dropped["brak rocznika w opisie zdjęcia (model ma kilka generacji)"] += 1; continue
    e["photo_year"] = next((y for y in ty if yrs and yrs[0] <= y <= yrs[1]), None)

# To samo zdjęcie przy różnych generacjach: zostaw tam, gdzie rok zdjęcia jest najbardziej „w środku” zakresu
base = lambda gid: (gens[gid]["model"], re.sub(r"\s*\(.*?lifting\)", "", gens[gid]["name"] if "name" in gens[gid] else gens[gid]["gen"]))
by_url = collections.defaultdict(list)
for gid, e in main.items():
    if e.get("pick"): by_url[e["pick"]["url"]].append(gid)
for url, gids in by_url.items():
    if len({base(g) for g in gids}) <= 1: continue
    def centrality(g):
        y = main[g].get("photo_year"); r = years_of(g)
        return -abs(y - (r[0] + r[1]) / 2) if y and r else -99
    keep = max(gids, key=centrality)
    for g in gids:
        if g != keep and base(g) != base(keep):
            main[g]["pick"] = None; dropped["to samo zdjęcie przy innej generacji"] += 1

json.dump(main, open("commons_final.json", "w"), ensure_ascii=False, indent=1)
have = sum(1 for e in main.values() if e.get("pick"))
print(f"generacji: {len(main)}, ze zdjęciem: {have}, bez: {len(main) - have}")
for k, v in dropped.items(): print(f"  odrzucone — {k}: {v}")
lic = collections.Counter(re.sub(r"\s+\w\w$", "", e["pick"]["license"]) for e in main.values() if e.get("pick"))
print("licencje:", dict(lic))
