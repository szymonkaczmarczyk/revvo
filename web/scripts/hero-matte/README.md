# Maska auta dla hero („auto przed napisem”)

Wideo hero jest „spakowane”: 1920×1584 = klatka 1920×1080 + pod nią pasek z maską auta (wycinek CROP 1002×504
z pozycji x=780, y=420). Warstwa WebGL (`src/components/hero-car-layer.ts`) rysuje z tego samego `<video>`
tylko piksele auta nad nagłówkiem. Stałe `CROP`/`PACKED` w kodzie muszą zgadzać się z poniższymi.

Odtworzenie (macOS 14+, Swift, ffmpeg):

```bash
# 1. klatki
ffmpeg -i ../../../background/background-revvo.mp4 -q:v 2 frames/f%03d.jpg
# 2. wycinek z autem (Vision lepiej oddziela auto od domu na wycinku)
python3 -c "from PIL import Image; [Image.open(f'frames/f{n:03d}.jpg').crop((780,420,1782,924)).save(f'crop/c{n:03d}.png') for n in range(1,193)]"
# 3. maski (Apple Vision, VNGenerateForegroundInstanceMaskRequest)
swiftc -O car-mask.swift -o car-mask && ./car-mask masks crop/*.png
# 4. pakowanie (1080p; dla 720p dodaj scale=1280:1056 na końcu filtra)
ffmpeg -i ../../../background/background-revvo.mp4 -framerate 24 -i masks/c%03d.png \
  -filter_complex "[1:v]format=gray,format=yuv420p[m];[0:v]hqdn3d=2:2:6:6,pad=1920:1584:0:0:black[b];[b][m]overlay=0:1080" \
  -an -c:v libx264 -preset veryslow -b:v 5000k -movflags +faststart background-revvo-packed-1080p.mp4
```

## Reguły maski i nagłówka (wersja 4 — aktualna)

- Klatki 1–86: maska pusta. Vision łapie wtedy całą ścianę domu, co zasłaniało napis przy wczytywaniu strony;
  auto jest jeszcze w garażu.
- Auto w pełni kryjące. Eksperyment z półprzezroczystymi szybami (v3) odrzucony: napis wyglądał jak namalowany na aucie.
- Nagłówek (≥ 1024 px i proporcje ≥ 3:2) skalowany i pozycjonowany w układzie wideo (`TITLE` w `hero-video.tsx`):
  1. linia 78 px wideo, góra na y = 526, lewa krawędź na x = 240, 2. linia 0,774 em. Wartości wyliczone z metryk
  Syncopate Bold i obrysu auta w ostatniej klatce:
  - „TWOJE AUTO MÓ” widoczne, krawędź auta między „Ó” i „W”, „WI,” za autem,
  - „KIM JESTEŚ.” kończy się ok. 140 px przed przodem auta.
  Sprawdzone pomiarem litera po literze na 1280×800, 1440×900, 1920×1080 i 2560×1440.
