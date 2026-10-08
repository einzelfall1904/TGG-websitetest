"""Lädt alle Fotos (tg-gold-weiss.de und Unsplash) nach ./fotos und stellt die Seiten auf lokale Bilder um.
Benutzung:  python3 bilder-herunterladen.py   (einmalig, mit Internet)"""
import re, glob, os, urllib.request
os.makedirs("fotos", exist_ok=True)
pat = re.compile(r'https://tg-gold-weiss\.de/wp-content/uploads/[^"\')\s]+\.(?:jpg|jpeg|png)|https://images\.unsplash\.com/photo-[^"\'\s]+')
for f in glob.glob("*.html"):
    s = open(f, encoding="utf-8").read()
    for u in set(pat.findall(s)):
        n = "fotos/" + (u.split("/uploads/")[1].replace("/", "_") if "/uploads/" in u else u.split("/")[3].split("?")[0] + ".jpg")
        if not os.path.exists(n):
            try: urllib.request.urlretrieve(u, n); print("ok", n)
            except Exception as e: print("Fehler", u, e); continue
        s = s.replace(u, n)
    open(f, "w", encoding="utf-8").write(s)
print("Fertig – die Website nutzt jetzt lokale Fotos.")
