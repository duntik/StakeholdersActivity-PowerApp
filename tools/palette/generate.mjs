#!/usr/bin/env node
// Regenerates the colour tokens of the app from one seed colour.
//
//   node generate.mjs "#2C6BAC"               DESIGN SYSTEM block + theme.yaml
//   node generate.mjs "#2C6BAC" --categories  stakeholder-categories.csv body
//
// Paste-ready text goes to stdout; the contrast report goes to stderr.
// Exits with code 1 if any text/background pair is below WCAG AA (4.5:1).
//
// Dependency: @material/material-color-utilities is pinned to exactly 0.2.7.
// Newer releases ship a broken ESM build that fails to import under Node.

import {
  Hct,
  TonalPalette,
  SchemeTonalSpot,
  MaterialDynamicColors as M,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';

const AA = 4.5;

// ───────── arguments
const args = process.argv.slice(2);
const wantCategories = args.includes('--categories');
const seedArg = args.find(a => !a.startsWith('--'));
if (!seedArg || !/^#?[0-9a-fA-F]{6}$/.test(seedArg)) {
  console.error('Usage: node generate.mjs "#RRGGBB" [--categories]');
  process.exit(2);
}
const seedHex = ('#' + seedArg.replace('#', '')).toUpperCase();
const seed = Hct.fromInt(argbFromHex(seedHex));

// ───────── helpers
const hex = argb => hexFromArgb(argb).toUpperCase();
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgba = h => `RGBA(${rgb(h).join(', ')}, 1);`;

function luminance(h) {
  const [r, g, b] = rgb(h).map(v => v / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const failures = [];
function check(label, fg, bg) {
  const c = contrast(fg, bg);
  const ok = c >= AA;
  if (!ok) failures.push(label);
  console.error(`  ${ok ? 'ok  ' : 'FAIL'}  ${c.toFixed(2).padStart(5)}  ${fg} on ${bg}  ${label}`);
}
function finish() {
  if (failures.length) {
    console.error(`\nContrast below ${AA}:1 for: ${failures.join('; ')}.`);
    console.error('Choose a different seed colour; do not paste this output.');
    process.exit(1);
  }
  console.error(`\nAll text pairs meet ${AA}:1.`);
}

// ───────── stakeholder categories
if (wantCategories) {
  const names = [
    'Communications', 'Community Engagement', 'Consents and Environment',
    'Supply Chain', 'Corporate Affairs', 'Early Career Attraction',
    'Local Authority', 'Project Delivery', 'Social Value',
  ];
  const rows = ['Name,Colour Hex,Text Colour Hex,Sort Order,Active'];
  console.error(`Contrast (category text on band), seed ${seedHex}:`);
  names.forEach((name, i) => {
    // Hue rotates 40° per category from the seed; chroma 30 keeps bands soft.
    const p = TonalPalette.fromHueAndChroma((seed.hue + 40 * i) % 360, 30);
    const band = hex(p.tone(90));
    const text = hex(p.tone(25));
    check(name, text, band);
    rows.push(`${name},${band},${text},${(i + 1) * 10},Yes`);
  });
  // N/A placeholder: a fixed neutral grey, independent of the seed.
  const naBand = '#ECEDEF';
  const naText = '#44474E';
  check('N/A', naText, naBand);
  rows.push(`N/A,${naBand},${naText},9999,Yes`);
  console.log(rows.join('\n'));
  finish();
  process.exit(0);
}

// ───────── Material 3 roles
const scheme = new SchemeTonalSpot(seed, false, 0);
const role = r => hex(r.getArgb(scheme));

// Primary is taken from a palette with at least chroma 48 so the top bar keeps
// the seed's saturation; TonalSpot alone would mute it to chroma 36.
const strong = TonalPalette.fromHueAndChroma(seed.hue, Math.max(seed.chroma, 48));
const soft = TonalPalette.fromHueAndChroma(seed.hue, 36);

const t = {
  MdPrimary: hex(strong.tone(30)),
  MdOnPrimary: role(M.onPrimary),
  MdPrimaryAction: hex(strong.tone(40)),
  MdPrimaryContainer: role(M.primaryContainer),
  MdOnPrimaryContainer: role(M.onPrimaryContainer),
  MdSecondary: role(M.secondary),
  MdSecondaryContainer: role(M.secondaryContainer),
  MdOnSecondaryContainer: role(M.onSecondaryContainer),
  MdTertiary: role(M.tertiary),
  MdTertiaryContainer: role(M.tertiaryContainer),
  MdOnTertiaryContainer: role(M.onTertiaryContainer),
  MdError: role(M.error),
  MdErrorContainer: role(M.errorContainer),
  MdOnErrorContainer: role(M.onErrorContainer),
  MdSurface: role(M.surface),
  MdOnSurface: role(M.onSurface),
  MdSurfaceVariant: role(M.surfaceVariant),
  MdOnSurfaceVariant: role(M.onSurfaceVariant),
  MdSurfaceContainerLow: role(M.surfaceContainerLow),
  MdSurfaceContainer: role(M.surfaceContainer),
  MdSurfaceContainerHigh: role(M.surfaceContainerHigh),
  MdOutline: role(M.outline),
  MdOutlineVariant: role(M.outlineVariant),
};
const notes = {
  MdPrimary: 'top bars', MdPrimaryAction: 'filled actions',
  MdOnSurface: 'body text', MdOnSurfaceVariant: 'captions',
};
const groups = [
  ['MdPrimary', 'MdOnPrimary', 'MdPrimaryAction', 'MdPrimaryContainer', 'MdOnPrimaryContainer'],
  ['MdSecondary', 'MdSecondaryContainer', 'MdOnSecondaryContainer'],
  ['MdTertiary', 'MdTertiaryContainer', 'MdOnTertiaryContainer'],
  ['MdError', 'MdErrorContainer', 'MdOnErrorContainer'],
  ['MdSurface', 'MdOnSurface', 'MdSurfaceVariant', 'MdOnSurfaceVariant', 'MdSurfaceContainerLow',
    'MdSurfaceContainer', 'MdSurfaceContainerHigh', 'MdOutline', 'MdOutlineVariant'],
];
const tokenLine = k =>
  `${k.padEnd(23)} = ${rgba(t[k]).padEnd(32)}// ${t[k]}${notes[k] ? '  ' + notes[k] : ''}`;

console.error(`Contrast, seed ${seedHex}:`);
check('onPrimary / primary', t.MdOnPrimary, t.MdPrimary);
check('onPrimary / primaryAction', t.MdOnPrimary, t.MdPrimaryAction);
check('onPrimaryContainer / primaryContainer', t.MdOnPrimaryContainer, t.MdPrimaryContainer);
check('onSurface / surface', t.MdOnSurface, t.MdSurface);
check('onSurfaceVariant / surfaceContainerHigh', t.MdOnSurfaceVariant, t.MdSurfaceContainerHigh);
check('onErrorContainer / errorContainer', t.MdOnErrorContainer, t.MdErrorContainer);

const RULE = '// ' + '═'.repeat(75);
const block = `${RULE}
//  DESIGN SYSTEM — Material 3
//
//  Every colour below is derived from ONE seed colour with Google's
//  material-color-utilities. To re-brand the app, run tools/palette/generate.mjs
//  with a new seed and paste its output over this block. Screens never
//  reference these Md* tokens directly — they use the role names further down
//  — so the whole app re-themes from this one file.
//
//  Current seed: ${seedHex}
${RULE}

//  Your organisation's name, shown in the header and on printed reports.
BrandName = "Your Organisation";

//  Applied to every text control. Segoe UI is installed on every Windows machine;
//  replace it with your brand typeface if it is available to all users.
BrandFont = "Segoe UI";

// ───── M3 colour roles ─────
//  Primary uses tone 30 for top bars and tone 40 for filled actions: both carry
//  white text above the 4.5 WCAG AA threshold.
${groups.map(g => g.map(tokenLine).join('\n')).join('\n\n')}

// ───── M3 shape scale, in pixels ─────
ShapeXS = 4; ShapeSm = 8; ShapeMd = 12; ShapeLg = 16; ShapeXL = 28;

// ───── M3 type scale, converted from dp to points at 4:3 ─────
TypeHeadline = 18; TypeTitleLg = 16; TypeTitle = 12;
TypeBody     = 11; TypeLabel   = 9;  TypeLabelSm = 8;

// ───── Role names the screens use ─────
//  Changing the design means changing the right-hand side of these lines.
ClrHeader    = MdPrimary;
ClrAccent    = MdPrimaryAction;
ClrSurface   = MdSurface;
ClrFilterBg  = MdSurfaceContainerLow;
ClrHeadBand  = MdSurfaceContainer;
ClrBorder    = MdOutlineVariant;
ClrGrid      = RGBA(255, 255, 255, 1);
ClrText      = MdOnSurface;
ClrMuted     = MdOnSurfaceVariant;
ClrRed       = MdError;
ClrToday     = MdError;
ClrDisabled  = MdSurfaceVariant;
ClrOnDark    = MdOnPrimary;

//  Marker fill by engagement method.
HexMeeting = "${t.MdPrimaryAction}";   // meetings
HexEvent   = "${t.MdTertiary}";   // public events`;

const theme = `#  Modern theme for the Power Apps modern controls (the data grid and dropdowns).
#
#  Paste:  Themes → Add a theme → Paste theme. Copy from "Themes:" down.
#
#  When Studio offers to apply the theme to classic controls as well, decline.
#  Doing so rewrites the Fill and Color formulas of every pasted classic control
#  with references to the theme; the screens already take their colours from
#  App.Formulas.txt.
#
#  ColorOverrides has no Base slot — the base colour is BasePaletteColor.
#  Generated by tools/palette from the same seed as App.Formulas.txt.

Themes:
  Lookahead:
    Font: "'Segoe UI', 'Open Sans', sans-serif"
    BasePaletteColor: '${hex(strong.tone(40))}'
    HueTorsion: 0
    Vibrancy: 0
    ColorOverrides:
      Lighter30: '${hex(soft.tone(95))}'
      Lighter20: '${hex(soft.tone(90))}'
      Lighter10: '${hex(soft.tone(72))}'
      Darker10: '${hex(strong.tone(35))}'
      Darker20: '${hex(strong.tone(30))}'
      Darker30: '${hex(strong.tone(25))}'
      Darker40: '${hex(strong.tone(20))}'`;

console.log('// >>>>> App.Formulas.txt: replace from the first "═══" line above');
console.log('// >>>>> "DESIGN SYSTEM" down to the HexEvent line with the text below.\n');
console.log(block);
console.log('\n\n# >>>>> src/theme.yaml: replace the whole file with the text below.\n');
console.log(theme);
finish();
