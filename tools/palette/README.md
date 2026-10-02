# Palette generator

Regenerates every colour token of the app from one seed colour, using Google's
[material-color-utilities](https://github.com/material-foundation/material-color-utilities)
(Material 3, `SchemeTonalSpot`). It also checks that every text/background pair
meets WCAG AA (4.5:1) and exits with code 1 if one does not.

## Install

Requires Node.js 18 or later.

```bash
cd tools/palette
npm install
```

`@material/material-color-utilities` is pinned to exactly `0.2.7`. Newer releases
ship a broken ESM build that fails to import under Node.

## Run

```bash
node generate.mjs "#2C6BAC"
```

stdout contains two paste-ready sections; the contrast report goes to stderr.

| Output section | Where to paste |
|---|---|
| `DESIGN SYSTEM — Material 3` block | `src/App.Formulas.txt`: replace from the `// ═══` line above `DESIGN SYSTEM` down to the `HexEvent` line, then paste the file into App > Formulas |
| theme | replace `src/theme.yaml`, then Themes > Add a theme > Paste theme |

`BrandName` and `BrandFont` are part of the block; edit them after pasting.

### Stakeholder category colours

```bash
node generate.mjs "#2C6BAC" --categories
```

Prints a `stakeholder-categories.csv` body: nine categories with the hue rotated
40° per category (chroma 30), band at tone 90 and text at tone 25, plus the `N/A`
row. Use it to replace `seed/stakeholder-categories.csv` before importing, or copy
the hex values into the reference-data screen.

## How the colours are derived

| Token | Source |
|---|---|
| `MdPrimary` / `MdPrimaryAction` | tone 30 / 40 of a palette at the seed hue with chroma `max(seed chroma, 48)` |
| all other `Md*` roles | `SchemeTonalSpot(seed)` via `MaterialDynamicColors` |
| theme `BasePaletteColor` | tone 40 of the primary palette |
| theme `Lighter30/20/10` | tones 95 / 90 / 72 of a chroma-36 palette at the seed hue |
| theme `Darker10/20/30/40` | tones 35 / 30 / 25 / 20 of the primary palette |
| `HexMeeting` / `HexEvent` | `MdPrimaryAction` / `MdTertiary` |
