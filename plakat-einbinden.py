"""Bereitet ein Ankündigungsplakat für die Website vor – mit Copyright-Hinweis im Bild.

Benutzung:  python3 plakat-einbinden.py <Originaldatei> <name>
Beispiel:   python3 plakat-einbinden.py Sommerfest.png sommerfest

Erzeugt in img/events/:
  <name>.jpg        Vorschaubild (360 px breit, Hinweis legt die Website darüber)
  <name>-gross.jpg  Großansicht (max. 1200 px breit) mit fest eingesetztem Copyright-Hinweis
Benötigt: Python 3 mit Pillow (pip install pillow). Ein ausgetauschtes Plakat einfach erneut
mit demselben Namen verarbeiten – die alten Dateien werden überschrieben."""
import sys, os
from PIL import Image, ImageDraw, ImageFont

HINWEIS = "© TG Gold-Weiß Gelsenkirchen 1932 e.V. – Alle Rechte vorbehalten."
ZIEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "img", "events")
SCHRIFTEN = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "C:/Windows/Fonts/arial.ttf",
             "/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial.ttf"]

def schrift(gr):
    for s in SCHRIFTEN:
        if os.path.exists(s): return ImageFont.truetype(s, gr)
    return ImageFont.load_default()

def stempeln(im):
    """Setzt unten einen halbtransparenten Streifen mit dem Hinweis ins Bild."""
    im = im.convert("RGBA"); w, h = im.size
    gr = max(12, round(w * 0.018)); f = schrift(gr)
    tw = ImageDraw.Draw(im).textlength(HINWEIS, font=f)
    while tw > w * 0.92 and gr > 10:
        gr -= 1; f = schrift(gr); tw = ImageDraw.Draw(im).textlength(HINWEIS, font=f)
    sh = round(gr * 2.1)
    lage = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lage)
    d.rectangle([0, h - sh, w, h], fill=(10, 22, 34, 190))
    d.text(((w - tw) / 2, h - sh + (sh - gr) / 2 - gr * 0.08), HINWEIS, font=f, fill=(255, 255, 255, 255))
    return Image.alpha_composite(im, lage).convert("RGB")

def einbinden(quelle, name):
    os.makedirs(ZIEL, exist_ok=True)
    im = Image.open(quelle).convert("RGB")
    vw = 360; im.resize((vw, round(im.height * vw / im.width)), Image.LANCZOS) \
        .save(os.path.join(ZIEL, name + ".jpg"), quality=84, optimize=True, progressive=True)
    gw = min(1200, im.width); gross = im.resize((gw, round(im.height * gw / im.width)), Image.LANCZOS)
    stempeln(gross).save(os.path.join(ZIEL, name + "-gross.jpg"), quality=86, optimize=True, progressive=True)
    print("fertig:", name)

if __name__ == "__main__":
    if len(sys.argv) != 3: print(__doc__); sys.exit(1)
    einbinden(sys.argv[1], sys.argv[2])
