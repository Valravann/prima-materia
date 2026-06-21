from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 256
CENTER = SIZE // 2
BLACK = (24, 24, 28, 255)
BLUE = (35, 39, 70, 255)
BROWN = (111, 91, 74, 255)
TRANSPARENT = (0, 0, 0, 0)

ROOT = Path(__file__).resolve().parents[1]
SOL_DIR = ROOT / "assets" / "dice" / "sol"
SYZ_DIR = ROOT / "assets" / "dice" / "syzygy"

SOL_NAMES = [
    "fortune",
    "safety",
    "freedom",
    "connection",
    "body",
    "mind",
    "nature",
    "society",
    "knowledge",
    "spirit",
    "calm",
    "self",
]

SYZ_NAMES = ["within", "against", "from", "toward", "over", "between"]


def canvas():
    return Image.new("RGBA", (SIZE, SIZE), TRANSPARENT)


def save(img: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def line(draw, pts, width=14, fill=BLACK, joint="curve"):
    draw.line(pts, fill=fill, width=width, joint=joint)


def circle_outline(draw, xy, width=12, fill=BLACK):
    draw.ellipse(xy, outline=fill, width=width)


def circle_fill(draw, xy, fill=BLACK):
    draw.ellipse(xy, fill=fill)


def polygon(draw, pts, fill=BLACK):
    draw.polygon(pts, fill=fill)


def arc_points(cx, cy, r, start_deg, end_deg, steps=64):
    pts = []
    for i in range(steps + 1):
        t = start_deg + (end_deg - start_deg) * (i / steps)
        rad = math.radians(t)
        pts.append((cx + math.cos(rad) * r, cy + math.sin(rad) * r))
    return pts


def wave_points(x0, y0, width, amp, cycles=1.5, points=48):
    pts = []
    for i in range(points + 1):
        x = x0 + width * i / points
        phase = (i / points) * cycles * math.tau
        y = y0 + math.sin(phase) * amp
        pts.append((x, y))
    return pts


def draw_fortune(img):
    d = ImageDraw.Draw(img)
    pts = []
    for i in range(180):
        t = i / 179 * 4.8 * math.pi
        r = 10 + 6.2 * t
        x = CENTER - 10 + math.cos(t) * r
        y = CENTER - 6 + math.sin(t) * r
        pts.append((x, y))
    line(d, pts, width=13)


def draw_safety(img):
    d = ImageDraw.Draw(img)
    pts = [(CENTER, 42), (54, 212), (202, 212), (CENTER, 42)]
    line(d, pts, width=12)


def draw_freedom(img):
    d = ImageDraw.Draw(img)
    outer = arc_points(CENTER + 10, CENTER, 76, 60, 300)
    inner = arc_points(CENTER + 24, CENTER, 52, 62, 298)
    line(d, outer, width=13)
    line(d, inner, width=13)


def draw_connection(img):
    d = ImageDraw.Draw(img)
    pts = []
    for i in range(180):
        t = i / 179 * math.tau
        x = CENTER + math.sin(t) * 78
        y = CENTER + math.sin(2 * t) * 42
        pts.append((x, y))
    line(d, pts, width=13)


def draw_body(img):
    d = ImageDraw.Draw(img)
    circle_fill(d, (88, 30, 168, 110), fill=BLUE)
    line(d, [(128, 106), (128, 214)], width=14)
    line(d, [(82, 144), (174, 144)], width=14)
    line(d, [(96, 214), (160, 214)], width=14)


def draw_mind(img):
    d = ImageDraw.Draw(img)
    line(d, [(64, 64), (192, 64), (192, 192), (64, 192), (64, 64)], width=11)
    line(d, [(128, 64), (128, 192)], width=11)
    line(d, [(64, 128), (192, 128)], width=11)


def draw_nature(img):
    d = ImageDraw.Draw(img)
    line(d, [(128, 62), (128, 208)], width=13)
    line(d, [(128, 132), (74, 78)], width=13)
    line(d, [(128, 132), (182, 78)], width=13)


def draw_society(img):
    d = ImageDraw.Draw(img)
    circle_fill(d, (64, 90, 102, 128))
    circle_fill(d, (154, 90, 192, 128))
    circle_fill(d, (109, 152, 147, 190))


def draw_knowledge(img):
    d = ImageDraw.Draw(img)
    circle_outline(d, (100, 100, 156, 156), width=10)
    line(d, [(128, 42), (128, 18)], width=8)
    line(d, [(128, 214), (128, 238)], width=8)
    line(d, [(42, 128), (18, 128)], width=8)
    line(d, [(214, 128), (238, 128)], width=8)
    line(d, [(67, 67), (49, 49)], width=8)
    line(d, [(189, 67), (207, 49)], width=8)
    line(d, [(67, 189), (49, 207)], width=8)
    line(d, [(189, 189), (207, 207)], width=8)


def draw_spirit(img):
    d = ImageDraw.Draw(img)
    pts = [
        (150, 26),
        (122, 54),
        (132, 92),
        (96, 122),
        (86, 168),
        (110, 208),
        (150, 228),
        (182, 210),
        (196, 172),
        (188, 134),
        (170, 98),
        (158, 70),
        (164, 48),
    ]
    polygon(d, pts)


def draw_calm(img):
    d = ImageDraw.Draw(img)
    for y in (90, 128, 166):
        line(d, wave_points(46, y, 164, 12, cycles=1.2), width=10)


def draw_self(img):
    d = ImageDraw.Draw(img)
    circle_outline(d, (54, 54, 202, 202), width=12)
    circle_outline(d, (84, 84, 172, 172), width=10)


def draw_within(img):
    d = ImageDraw.Draw(img)
    circle_outline(d, (52, 52, 204, 204), width=12)
    circle_fill(d, (108, 108, 148, 148))


def draw_against(img):
    d = ImageDraw.Draw(img)
    line(d, [(92, 40), (92, 216)], width=14)
    line(d, [(164, 40), (164, 216)], width=14)


def draw_from(img):
    d = ImageDraw.Draw(img)
    circle_fill(d, (44, 98, 88, 142), fill=BLUE)
    line(d, [(84, 120), (200, 120)], width=12)
    polygon(d, [(200, 120), (162, 92), (162, 148)], fill=BLACK)


def draw_toward(img):
    d = ImageDraw.Draw(img)
    circle_fill(d, (108, 186, 148, 226))
    line(d, [(128, 204), (128, 56)], width=12)
    polygon(d, [(128, 30), (102, 72), (154, 72)], fill=BLACK)


def draw_over(img):
    d = ImageDraw.Draw(img)
    line(d, [(56, 104), (200, 104)], width=12)
    circle_fill(d, (110, 146, 146, 182), fill=BROWN)


def draw_between(img):
    d = ImageDraw.Draw(img)
    line(d, [(42, 128), (214, 128)], width=12)
    circle_fill(d, (108, 108, 148, 148), fill=BLUE)


def build_sheet(paths, dest, cols=4):
    cell = 160
    rows = math.ceil(len(paths) / cols)
    img = Image.new("RGBA", (cols * cell, rows * cell), (255, 255, 255, 255))
    for idx, path in enumerate(paths):
        icon = Image.open(path).convert("RGBA")
        icon.thumbnail((110, 110))
        x = (idx % cols) * cell + (cell - icon.width) // 2
        y = (idx // cols) * cell + 18
        img.alpha_composite(icon, (x, y))
    img.save(dest)


def main():
    drawers = [
        draw_fortune,
        draw_safety,
        draw_freedom,
        draw_connection,
        draw_body,
        draw_mind,
        draw_nature,
        draw_society,
        draw_knowledge,
        draw_spirit,
        draw_calm,
        draw_self,
    ]
    sol_paths = []
    for idx, (name, drawer) in enumerate(zip(SOL_NAMES, drawers), start=1):
        img = canvas()
        drawer(img)
        path = SOL_DIR / f"{idx:02d}-{name}.png"
        save(img, path)
        sol_paths.append(path)

    syz_drawers = [
        draw_within,
        draw_against,
        draw_from,
        draw_toward,
        draw_over,
        draw_between,
    ]
    syz_paths = []
    for idx, (name, drawer) in enumerate(zip(SYZ_NAMES, syz_drawers), start=1):
        img = canvas()
        drawer(img)
        path = SYZ_DIR / f"{idx:02d}-{name}.png"
        save(img, path)
        syz_paths.append(path)

    build_sheet(sol_paths, ROOT / "assets" / "dice" / "sol-sheet.png")
    build_sheet(syz_paths, ROOT / "assets" / "dice" / "syzygy-sheet.png", cols=3)


if __name__ == "__main__":
    main()
