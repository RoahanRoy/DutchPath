#!/usr/bin/env python3
"""
Subset the Material Symbols Outlined icon font to ONLY the icons the app uses.

Why: the full variable font is ~3.7 MB. Shipping all ~3,000 glyphs to mobile
users (who only ever see ~100 icons) tanks load performance. This produces a
~100 KB subset containing just the icons referenced in the source.

How icons are accessed: the app writes the icon *name* as text inside a
`.mso` span, e.g. `<span className="mso">emoji_events</span>`. Material Symbols
maps that name to a glyph via a GSUB ligature (note: the glyph itself may be
named differently — `emoji_events` -> `trophy`). So we must resolve each name
through the font's real ligature table, not assume name == glyph name.

Usage:
    pip install fonttools brotli
    python3 scripts/subset-material-symbols.py

Reads:  scripts/assets/material-symbols-outlined-full.woff2  (full source font)
Writes: public/fonts/material-symbols-outlined.woff2          (served subset)

Re-run this whenever you add a new icon to the UI.
"""
import re
import string
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

ROOT = Path(__file__).resolve().parent.parent
FULL_FONT = ROOT / "scripts/assets/material-symbols-outlined-full.woff2"
OUT_FONT = ROOT / "public/fonts/material-symbols-outlined.woff2"
SCAN_DIRS = ["app", "components", "lib"]

# Match quoted lowercase tokens (icon names live in maps/arrays/literals) and
# literal icon names used as the text child of an `mso` span.
QUOTED = re.compile(r'"([a-z][a-z_]*)"')
MSO_CHILD = re.compile(r'className="[^"]*mso[^"]*"[^>]*>([a-z_]+)<')


def collect_tokens() -> set[str]:
    tokens: set[str] = set()
    for d in SCAN_DIRS:
        for path in (ROOT / d).rglob("*"):
            if path.suffix not in {".ts", ".tsx", ".js", ".jsx"}:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
            tokens.update(QUOTED.findall(text))
            tokens.update(MSO_CHILD.findall(text))
    return tokens


def build_ligature_resolver(font: TTFont):
    cmap = font.getBestCmap()
    lig_subtables = []
    for lookup in font["GSUB"].table.LookupList.Lookup:
        for sub in lookup.SubTable:
            real, rtype = sub, lookup.LookupType
            if lookup.LookupType == 7:  # Extension Substitution — unwrap it
                rtype, real = sub.ExtensionLookupType, sub.ExtSubTable
            if rtype == 4:  # Ligature Substitution
                lig_subtables.append(real.ligatures)

    def resolve(name: str):
        if any(ord(ch) not in cmap for ch in name):
            return None
        glyphs = [cmap[ord(ch)] for ch in name]
        first, rest = glyphs[0], glyphs[1:]
        for ligs in lig_subtables:
            for lig in ligs.get(first, []):
                if list(lig.Component) == rest:
                    return lig.LigGlyph
        return None

    return resolve


def main() -> int:
    if not FULL_FONT.exists():
        sys.exit(f"Full source font not found: {FULL_FONT}")

    font = TTFont(FULL_FONT)
    glyph_order = set(font.getGlyphOrder())
    resolve = build_ligature_resolver(font)

    tokens = collect_tokens()
    keep_glyphs: set[str] = set()
    resolved = 0
    for token in tokens:
        glyph = resolve(token)
        if glyph:
            resolved += 1
            keep_glyphs.add(glyph)
            if glyph + ".fill" in glyph_order:
                keep_glyphs.add(glyph + ".fill")

    # Keep ASCII letters + underscore so the ligature *inputs* survive.
    for ch in string.ascii_letters + "_":
        cp = ord(ch)
        cmap = font.getBestCmap()
        if cp in cmap:
            keep_glyphs.add(cmap[cp])

    opts = Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]      # preserve rlig/rclt ligatures...
    opts.layout_closure = False       # ...but DON'T re-expand to every icon
    opts.glyph_names = True
    opts.name_IDs = ["*"]
    opts.notdef_outline = True

    subsetter = Subsetter(options=opts)
    subsetter.populate(glyphs=keep_glyphs)
    subsetter.subset(font)

    OUT_FONT.parent.mkdir(parents=True, exist_ok=True)
    font.save(OUT_FONT)

    size_kb = OUT_FONT.stat().st_size / 1024
    print(f"Scanned {len(tokens)} tokens, resolved {resolved} icons.")
    print(f"Wrote {OUT_FONT.relative_to(ROOT)} ({size_kb:.0f} KB, "
          f"{len(font.getGlyphOrder())} glyphs).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
