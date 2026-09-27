import json, re, time, urllib.parse, urllib.request, sys
UA={"User-Agent":"REVVO-catalog/0.1 (kontakt@revvo.com)"}
API="https://commons.wikimedia.org/w/api.php"
ALLOWED=re.compile(r"^(cc0|public domain|pd|cc by(-sa)? ?[1-4]\.0|cc by(-sa)? ?[1-4]\.0 .*|cc by-sa [1-4]\.0|cc by [1-4]\.0)", re.I)
BAD=re.compile(r"interior|engine|motor\b|dash|badge|emblem|logo|wheel|rim\b|seat|trunk|boot|tail ?light|headlight|steering|gauge|cockpit|detail|brochure|toy|model car|diecast|tomica|lego|crash|wreck|rust|rear\b|heck|interieur|innenraum|race|racing|le mans|\bgt[1-4]\b|gt300|gt500|jgtc|super gt|rally|drift|nascar|touring car|btcc|wtcc|jtcc|no\.\s?\d|#\d|concept|prototype|police|taxi|modified|tuned|widebody|stance", re.I)
ALIAS={"G-Series":["G35","G37","G20","G25"],"M-Series":["M35","M37","M45","M56","M30"],"FX-Series":["FX35","FX45","FX37","FX50"],"EX-Series":["EX35","EX37","EX25"],"JX-Series":["JX35"],"QX-Series":["QX4","QX56"],"I-Series":["I30","I35"]}
def api(params):
    params.update(format="json", formatversion=2)
    req=urllib.request.Request(API+"?"+urllib.parse.urlencode(params), headers=UA)
    for i in range(3):
        try: return json.load(urllib.request.urlopen(req, timeout=30))
        except Exception as e: time.sleep(2)
    return {}
def search(q):
    d=api(dict(action="query", generator="search", gsrsearch=q, gsrnamespace=6, gsrlimit=30, prop="imageinfo", iiprop="url|size|extmetadata|mime", iiurlwidth=1600))
    return d.get("query",{}).get("pages",[])
def score(p, years, names):
    t=p["title"]; ii=(p.get("imageinfo") or [{}])[0]; em=ii.get("extmetadata",{})
    lic=em.get("LicenseShortName",{}).get("value","")
    if ii.get("mime") not in ("image/jpeg","image/png"): return None
    if ii.get("width",0)<1200 or not ALLOWED.match(lic.strip()): return None
    if BAD.search(t): return None
    tl=t.lower()
    if not any(n.lower() in tl for n in names): return None
    s=0
    # daty wykonania zdjęcia (2020-10-05, 12-08-2022, 2009-06) nie są rocznikiem modelu
    tt=re.sub(r"\d{4}-\d{1,2}(-\d{1,2})?(?!\d)|\d{1,2}[-.]\d{1,2}[-.]\d{4}", " ", t)
    tt=re.sub(r"(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-zä]*\.?,?\s+(19|20)\d\d", " ", tt, flags=re.I)
    ys=[int(y) for y in re.findall(r"(?<!\d)(19[5-9]\d|20[0-2]\d)(?!\d)", tt)]
    if years and ys:
        if all(years[0]-1<=y<=years[1]+1 for y in ys): s+=4
        else: return None
    if re.search(r"side|profile|seitenansicht|lateral|seite", tl): s+=3
    if re.search(r"front|3/4|three.quarter", tl): s+=1
    w,h=ii.get("width",0),ii.get("height",1)
    if w/h>1.25: s+=1
    return s, dict(title=t, url=ii.get("thumburl") or ii.get("url"), page=ii.get("descriptionurl"), license=lic,
                   license_url=em.get("LicenseUrl",{}).get("value",""), author=re.sub("<[^>]+>","",em.get("Artist",{}).get("value","")).strip(),
                   width=w, height=h)
import os
gens=json.load(open("generacje.json"))
# Znane lata produkcji dla generacji, którym car2db ich nie podaje (tylko do wyszukiwania)
OVERRIDE={757:(1985,1989),7233:(1976,1981),9053:(1981,1985),763:(1981,1986),776:(1979,1983),8095:(1983,1987),8096:(1972,1979),831:(1987,1991),832:(1982,1987),833:(1978,1982)}
only=set(sys.argv[1:])
res={}
for g in gens:
    if only and str(g["id"]) not in only: continue
    y1=g["year_from"] or g["tmin"]; y2=g["year_to"] or (y1+6 if y1 else None)
    if not y1 and g["id"] in OVERRIDE: y1,y2=OVERRIDE[g["id"]]
    years=(y1,y2) if y1 else None
    names=[f'{g["make"]} {a}' for a in ALIAS.get(g["model"],[g["model"]])]
    qs=[]
    for n in names:
        if years:
            mid=(years[0]+years[1])//2
            for y in sorted(set([mid, years[0]+1, years[1]-1]))[:3]:
                if years[0]<=y<=years[1]: qs.append(f'intitle:"{n}" intitle:{y}')
        qs.append(f'intitle:"{n}"')
    best=None
    for q in qs:
        for p in search(q):
            sc=score(p, years, names)
            if sc and (best is None or sc[0]>best[0]): best=sc
        if best and best[0]>=7: break
        time.sleep(0.3)
    res[g["id"]]=dict(gen=g, pick=best[1] if best else None, score=best[0] if best else None)
    print(g["id"], g["make"], g["model"], g["gen"], years, "->", (best[1]["title"][:70], best[0], best[1]["license"]) if best else "BRAK", flush=True)
json.dump(res, open(os.environ.get("OUT","commons_picks.json"),"w"), ensure_ascii=False, indent=1)
