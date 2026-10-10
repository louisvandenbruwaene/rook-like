"""Team colours for the stone portraits.

Every portrait in art/stones/<piece>.png gets one detail in its team's colour: a blue copy in art/stones/you/ and a
red copy in art/stones/opponent/. Only the pixels of that detail change: each one takes the shade of the team's colour
closest to it in brightness, so the shading stays as drawn. The script checks that no other pixel changed.
The portraits in art/stones/ themselves are the untouched PixelLab originals: the script only reads them.

Run it from anywhere after changing a portrait: python3 art/team_colours.py   (needs Pillow and numpy)
"""

import colorsys
from pathlib import Path

import numpy as np
from PIL import Image

FOLDER = Path(__file__).parent / 'stones'

# The stone colours of art.js, dark to light: SPIKE_COLOURS.dark, the body gradient, SPIKE_COLOURS.light.
TEAMS = {
    'you': ['#123a6e', '#1f5bb0', '#3b8be8', '#7cc0ff', '#bfe0ff'],
    'opponent': ['#6e1a12', '#b02d1f', '#ec5440', '#ff9a84', '#ffd0c4'],
}


def is_red(h, s, v):
    return (h >= 335 or h <= 18) and s > 0.3 and v > 0.15


def hue_between(low, high, min_saturation=0.25):
    return lambda h, s, v: low <= h <= high and s > min_saturation and v > 0.12


# For each piece: the box the detail lies in (x0, y0, x1, y1, inclusive) and which pixels in it belong to it,
# by hue (0-360), saturation and value (0-1). A detail drawn in black (Beatrice's hat band) takes the middle shade.
# prettier-ignore
DETAILS = {
    'pawn':                  ((18, 36, 56, 58), is_red),                                  # his shoulder sleeves
    'knight':                ((0, 0, 63, 63), is_red),                                    # mane and plume
    'bishop':                ((0, 40, 63, 63), hue_between(262, 312)),                    # his robes
    'rook':                  ((0, 42, 63, 63), lambda h, s, v: s < 0.22 and v > 0.18),    # his grey tunic
    'queen':                 ((14, 55, 24, 63), hue_between(285, 345)),                   # her sleeve cuff
    'king':                  ((23, 15, 41, 23), is_red),                                  # the crown's gems
    'venom_veronica':        ((8, 32, 27, 47), hue_between(290, 360, 0.12)),              # her tongue
    'experienced_edna':      ((24, 44, 40, 63), lambda h, s, v: (h >= 320 or h <= 8) and s > 0.25),  # her blouse
    'empress_edna':          ((0, 44, 63, 63), hue_between(262, 312)),                    # her robe
    'brittle_bernard':       ((0, 37, 63, 63), hue_between(195, 250, 0.3)),               # his doublet
    'buzzy_beatrice':        ((21, 8, 41, 10), lambda h, s, v: v < 0.1),                  # her hat band
    'his_hovering_holiness': ((0, 37, 63, 63), is_red),                                   # his cape
}

# Hairy Harambe has no coloured detail of his own, so a small gem is set into his gold pendant:
# [x, y, shade] with shade an index into the team's colours.
# prettier-ignore
HARAMBE_GEM = [
    [33, 53, 1],
    [32, 54, 1], [33, 54, 3], [34, 54, 2],
    [31, 55, 0], [32, 55, 2], [33, 55, 2], [34, 55, 2], [35, 55, 0],
    [32, 56, 0], [33, 56, 1], [34, 56, 0],
    [33, 57, 0],
]


def rgb(hex_colour):
    return [int(hex_colour[i:i + 2], 16) for i in (1, 3, 5)]


def detail_mask(pixels, box, belongs):
    """The pixels of the detail: inside the box, opaque, and of its colour."""
    x0, y0, x1, y1 = box
    mask = np.zeros(pixels.shape[:2], bool)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            r, g, b, a = pixels[y, x] / 255
            if a < 0.5:
                continue
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            mask[y, x] = belongs(h * 360, s, v)
    return mask


def brightness(colour):
    return np.asarray(colour, float)[..., :3] @ [0.299, 0.587, 0.114]


def paint(pixels, mask, shades):
    """Every pixel of the mask takes the team shade closest to it in brightness, or the middle shade if it is black."""
    shade_rgb = [rgb(shade) for shade in shades]
    shade_brightness = brightness(shade_rgb)
    out = pixels.copy()
    for y, x in zip(*np.nonzero(mask)):
        own = brightness(pixels[y, x])
        index = len(shades) // 2 if own < 20 else int(np.argmin(abs(shade_brightness - own)))
        out[y, x, :3] = shade_rgb[index]
    return out


def team_copy(piece, pixels, shades):
    if piece == 'hairy_harambe':
        out = pixels.copy()
        mask = np.zeros(pixels.shape[:2], bool)
        for x, y, shade in HARAMBE_GEM:
            out[y, x] = [*rgb(shades[shade]), 255]
            mask[y, x] = True
        return out, mask
    box, belongs = DETAILS[piece]
    mask = detail_mask(pixels, box, belongs)
    return paint(pixels, mask, shades), mask


def main():
    for team, shades in TEAMS.items():
        (FOLDER / team).mkdir(exist_ok=True)
    for piece in [*DETAILS, 'hairy_harambe']:
        pixels = np.array(Image.open(FOLDER / f'{piece}.png').convert('RGBA'))
        for team, shades in TEAMS.items():
            out, mask = team_copy(piece, pixels, shades)
            changed = np.any(out != pixels, axis=2)
            assert not np.any(changed & ~mask), f'{piece}: a pixel outside its detail changed'
            Image.fromarray(out).save(FOLDER / team / f'{piece}.png')
        print(f'{piece:24} {int(mask.sum()):4} pixels in team colour')


if __name__ == '__main__':
    main()
