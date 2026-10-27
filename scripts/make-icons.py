# Génère les icônes de l'app (PWA + Expo) — python3 scripts/make-icons.py "#BG" "#FG" "TXT" ["#ACCENT"]
import sys, os
from PIL import Image, ImageDraw, ImageFont
bg, fg, txt = sys.argv[1], sys.argv[2], sys.argv[3]
accent = sys.argv[4] if len(sys.argv) > 4 else fg
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = None
for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
    if os.path.exists(f): FONT = f; break
def make(size, pad_ratio=0.0, rounded=True):
    im = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = int(size * 0.22) if rounded else 0
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=bg)
    # filet décoratif
    w = max(2, size // 40)
    inset = int(size * (0.12 + pad_ratio))
    d.rounded_rectangle([inset, inset, size - inset, size - inset], radius=int(size * 0.14), outline=accent, width=w)
    fs = int(size * (0.34 - pad_ratio * 0.6) * (3 / max(3, len(txt))))
    font = ImageFont.truetype(FONT, fs) if FONT else ImageFont.load_default()
    bb = d.textbbox((0, 0), txt, font=font)
    d.text(((size - (bb[2] - bb[0])) / 2 - bb[0], (size - (bb[3] - bb[1])) / 2 - bb[1]), txt, font=font, fill=fg)
    return im
os.makedirs(os.path.join(root, 'public/icons'), exist_ok=True)
make(192).save(os.path.join(root, 'public/icons/icon-192.png'))
make(512).save(os.path.join(root, 'public/icons/icon-512.png'))
make(512, 0.08, rounded=False).save(os.path.join(root, 'public/icons/maskable-512.png'))
make(180, rounded=False).convert('RGB').save(os.path.join(root, 'public/icons/apple-touch-icon.png'))
make(1024, rounded=False).save(os.path.join(root, 'assets/icon.png'))
make(1024, 0.12, rounded=False).save(os.path.join(root, 'assets/android-icon-foreground.png'))
Image.new('RGBA', (1024, 1024), bg).save(os.path.join(root, 'assets/android-icon-background.png'))
make(48).save(os.path.join(root, 'assets/favicon.png'))
make(400, rounded=True).save(os.path.join(root, 'assets/splash-icon.png'))
print('icons ok')
