# Design system

The app follows [Material 3](https://m3.material.io/) (M3). Its central idea is that colours are not picked one by one but **derived**: a single seed colour produces tonal palettes, and every surface has a paired *on* colour whose contrast is guaranteed by construction.

Everything lives in the `DESIGN SYSTEM` block of `src/App.Formulas.txt`. Screens read role names only, so changing the look of the app means editing one file, not hundreds of controls.

```
seed hex ──► tools/palette ──► Md* tokens (M3 roles) ──► Clr* aliases ──► screens
                          └──► theme.yaml (modern controls)
```

## Colour tokens

Current seed: `#2C6BAC`.

### M3 roles (`Md*`)

| Token | Hex | Use |
|---|---|---|
| `MdPrimary` | `#004880` | Top bars (primary tone 30) |
| `MdOnPrimary` | `#FFFFFF` | Text on `MdPrimary` and `MdPrimaryAction` |
| `MdPrimaryAction` | `#1260A4` | Filled action buttons (primary tone 40) |
| `MdPrimaryContainer` | `#D3E4FF` | Tinted containers |
| `MdOnPrimaryContainer` | `#001C38` | Text on `MdPrimaryContainer` |
| `MdSecondary` | `#545F70` | Secondary accents |
| `MdSecondaryContainer` | `#D7E3F8` | Secondary containers |
| `MdOnSecondaryContainer` | `#101C2B` | Text on secondary containers |
| `MdTertiary` | `#6C5677` | Tertiary accents |
| `MdTertiaryContainer` | `#F4D9FF` | Tertiary containers |
| `MdOnTertiaryContainer` | `#261431` | Text on tertiary containers |
| `MdError` | `#BA1A1A` | Errors, validation, today line |
| `MdErrorContainer` | `#FFDAD6` | Error containers |
| `MdOnErrorContainer` | `#410002` | Text on error containers |
| `MdSurface` | `#F8F9FF` | Page surface |
| `MdOnSurface` | `#191C20` | Body text |
| `MdSurfaceVariant` | `#DFE2EB` | Disabled fills |
| `MdOnSurfaceVariant` | `#43474E` | Captions, secondary text |
| `MdSurfaceContainerLow` | `#F2F3FA` | Filter bar |
| `MdSurfaceContainer` | `#ECEDF4` | Header bands |
| `MdSurfaceContainerHigh` | `#E7E8EE` | Raised containers |
| `MdOutline` | `#73777F` | Strong outlines |
| `MdOutlineVariant` | `#C3C6CF` | Borders and dividers |

### Role aliases (`Clr*`)

Screens never reference `Md*` tokens directly. They use these aliases, so a design change is a change to the right-hand side of these lines.

| Alias | Maps to | Current value |
|---|---|---|
| `ClrHeader` | `MdPrimary` | `#004880` |
| `ClrAccent` | `MdPrimaryAction` | `#1260A4` |
| `ClrSurface` | `MdSurface` | `#F8F9FF` |
| `ClrFilterBg` | `MdSurfaceContainerLow` | `#F2F3FA` |
| `ClrHeadBand` | `MdSurfaceContainer` | `#ECEDF4` |
| `ClrBorder` | `MdOutlineVariant` | `#C3C6CF` |
| `ClrGrid` | literal | `#FFFFFF` |
| `ClrText` | `MdOnSurface` | `#191C20` |
| `ClrMuted` | `MdOnSurfaceVariant` | `#43474E` |
| `ClrRed` | `MdError` | `#BA1A1A` |
| `ClrToday` | `MdError` | `#BA1A1A` |
| `ClrDisabled` | `MdSurfaceVariant` | `#DFE2EB` |
| `ClrOnDark` | `MdOnPrimary` | `#FFFFFF` |

`App.Formulas.txt` also defines `HexMeeting` (`#1260A4`) and `HexEvent` (`#6C5677`) as hex strings for marker fills by engagement method. `btnLoadWindow` on `scrTimeline` reads them when it builds the `MarkerHex` column — public events use `HexEvent`, everything else `HexMeeting` — so regenerating the palette re-colours the markers too. They are hex strings rather than colours because the diamond markers are SVG images, which take colours as text.

## Shape scale

Corner radii in pixels, following the M3 shape scale:

| Token | Value |
|---|---|
| `ShapeXS` | 4 |
| `ShapeSm` | 8 |
| `ShapeMd` | 12 |
| `ShapeLg` | 16 |
| `ShapeXL` | 28 |

Classic `Rectangle` controls have no corner-radius properties, so the current screens are square-cornered. The tokens are for controls that do support radii, such as `GroupContainer` (`RadiusTopLeft` and the other three corners) and the modern controls.

## Type scale

M3 type sizes are specified in dp; canvas apps size text in points. The values below are converted at 4 dp : 3 pt and rounded.

| Token | Points | Typical use |
|---|---|---|
| `TypeHeadline` | 18 | Screen title in the header |
| `TypeTitleLg` | 16 | Organisation name in the header |
| `TypeTitle` | 12 | Section titles |
| `TypeBody` | 11 | Body text, buttons |
| `TypeLabel` | 9 | Navigation buttons, filter captions, helper text |
| `TypeLabelSm` | 8 | Small labels |

## Brand tokens

| Token | Default | Effect |
|---|---|---|
| `BrandName` | `"Your Organisation"` | Shown in every screen header and in the title of printed reports |
| `BrandFont` | `"Segoe UI"` | Applied to every text control. Segoe UI is installed on every Windows machine; use a brand typeface only if it is available to all users. |

The modern controls take their font from `theme.yaml` (`Font: "'Segoe UI', 'Open Sans', sans-serif"`). Change it there as well when changing `BrandFont`.

## How screens consume tokens

- Fills and text colours are role aliases: the header is `Fill: =ClrHeader`, captions are `Color: =ClrMuted`, filled buttons are `Fill: =ClrAccent`.
- Sizes are type tokens: `Size: =TypeLabel`, `Size: =TypeHeadline`.
- Every text control has `Font: =BrandFont`.
- The only literal colours in the screens are white (`RGBA(255, 255, 255, 1)`) for page backgrounds and text on filled buttons, the translucent scrim behind the add-activity modal, and fallback colours used when a record has no category colour.
- Category band colours come from data (`Colour Hex` and `Text Colour Hex` on `SEL Stakeholder Categories`), converted with `ColorValue()`.

## Re-branding

1. Run the palette tool with your brand colour as the seed (Node.js 18 or later):

   ```bash
   cd tools/palette
   npm install
   node generate.mjs "#2C6BAC"
   ```

   The paste-ready text goes to stdout; a contrast report goes to stderr, and the script exits with code 1 if any text/background pair falls below 4.5:1.
2. In `src/App.Formulas.txt`, replace everything from the `// ═══` line above `DESIGN SYSTEM` down to the `HexEvent` line with the first output section. Then set `BrandName` and `BrandFont` again, since they are part of the block.
3. Replace the whole of `src/theme.yaml` with the second output section.
4. In Studio, paste the updated `App.Formulas.txt` over **App > Formulas** (replace all).
5. Paste the updated theme (**Themes > Add a theme > Paste theme**), select it, and again decline applying it to classic controls.
6. Save and publish. No screen needs to be re-pasted.

How each token is derived from the seed is documented in `tools/palette/README.md`.

To change a single role without changing the seed, edit the right-hand side of the `Clr*` alias instead, for example `ClrHeader = MdPrimaryAction;`.

## Accessibility

- **Text contrast.** Every text/background pair used by the app meets WCAG AA (at least 4.5:1). With the current seed: white on `MdPrimary` 9.4:1, white on `MdPrimaryAction` 6.5:1, `MdOnSurface` on `MdSurface` 16.3:1, `MdOnSurfaceVariant` on `MdSurfaceContainer` 8.0:1, `MdError` on white 6.5:1.
- **Filled actions use tone 40, not the raw seed.** A brand colour taken straight from a style guide often fails 4.5:1 with white text. `MdPrimaryAction` is the primary palette at tone 40 and `MdPrimary` at tone 30, both of which carry white text above the threshold for any reasonable seed.
- **Borders are not text.** `MdOutlineVariant` is a decorative divider and is not used for anything that must be read.
- **Accessible labels.** Icons and dropdowns carry `AccessibleLabel` values. `Classic/Button` has no `AccessibleLabel` property; its `Text` is announced instead.

## Category band colours

Each stakeholder category has a row colour and a text colour, stored in Dataverse rather than in the app, so a change reaches every user immediately.

The seed values in `seed/stakeholder-categories.csv` are light tonal containers (tone 90) paired with dark text of the same hue (tone 25), with the hue rotated 40° per category. Every pair is checked for contrast: all are about 8.6:1, the `N/A` row 7.9:1. To produce a matching set for your own seed colour:

```bash
node generate.mjs "#2C6BAC" --categories
```

This prints a replacement body for `seed/stakeholder-categories.csv`; use it before importing, or copy the hex values into the Reference data screen.

| Category | Row | Text |
|---|---|---|
| Communications | `#D3E4FF` | `#1E3D60` |
| Community Engagement | `#E7DEFF` | `#3E3560` |
| Consents and Environment | `#FFD7F4` | `#542E4F` |
| Supply Chain | `#FFDADA` | `#5F2C2F` |
| Corporate Affairs | `#FFDCC4` | `#5A310C` |
| Early Career Attraction | `#F7E297` | `#473A00` |
| Local Authority | `#CDECB3` | `#2A4219` |
| Project Delivery | `#B1EFDB` | `#004437` |
| Social Value | `#B0ECFC` | `#00424E` |
| N/A | `#ECEDEF` | `#44474E` |

Edit them on the **Reference data** screen. The editor validates that both values are six-digit hex codes (`#RRGGBB`), shows a live preview of the label on the band, and refuses a sort order already used by another category. Check the contrast of a new pair before saving; the editor previews it but does not measure it.

Activities with no category, or with an inactive one, are drawn in a separate *Uncategorised* row (`#F7DCDD` with `#7E171C` text, 8.0:1) at the bottom of the timeline.
