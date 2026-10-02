#!/usr/bin/env node
// Moves the demo activities in time so the earliest Start Date falls on the
// first day of a target month (default: the current month). Every activity
// keeps its offset from the others and its own duration.
//
//   node shift.mjs ../../seed/engagement-activities-demo.csv
//   node shift.mjs ../../seed/engagement-activities-demo.csv --to 2027-01
//
// Dates are dd/mm/yyyy in the "Start Date" and "End Date" columns. The file is
// rewritten in place; every other byte of it is left untouched. No dependencies.

import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--') && !/^\d{4}-\d{2}$/.test(a));
const toIdx = args.indexOf('--to');
const toArg = toIdx >= 0 ? args[toIdx + 1] : null;

if (!file || (toIdx >= 0 && !/^\d{4}-(0[1-9]|1[0-2])$/.test(toArg || ''))) {
  console.error('Usage: node shift.mjs <activities.csv> [--to YYYY-MM]');
  process.exit(2);
}

// ───────── dates as whole UTC days
const DAY = 86400000;
const parse = s => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const t = Date.UTC(+m[3], +m[2] - 1, +m[1]);
  const d = new Date(t);
  if (d.getUTCDate() !== +m[1] || d.getUTCMonth() !== +m[2] - 1) return null;
  return t / DAY;
};
const format = n => {
  const d = new Date(n * DAY);
  const p = v => String(v).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
};

let target;
if (toArg) {
  const [y, m] = toArg.split('-').map(Number);
  target = Date.UTC(y, m - 1, 1) / DAY;
} else {
  const now = new Date();
  target = Date.UTC(now.getFullYear(), now.getMonth(), 1) / DAY;
}

// ───────── CSV: split into records of raw fields, keeping quotes and line ends
const text = readFileSync(file, 'utf8');
const records = []; // { fields: string[], eol: string }
{
  let field = '', fields = [], inQuotes = false, i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '""'; i += 2; continue; }
      if (c === '"') inQuotes = false;
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; field += c; i++; continue; }
    if (c === ',') { fields.push(field); field = ''; i++; continue; }
    if (c === '\r' || c === '\n') {
      const eol = c === '\r' && text[i + 1] === '\n' ? '\r\n' : c;
      fields.push(field); records.push({ fields, eol });
      field = ''; fields = []; i += eol.length; continue;
    }
    field += c; i++;
  }
  if (field !== '' || fields.length) { fields.push(field); records.push({ fields, eol: '' }); }
}

const unquote = s => (s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1).replace(/""/g, '"') : s);
const header = records[0].fields.map(f => unquote(f).replace(/^﻿/, '').trim());
const iStart = header.indexOf('Start Date');
const iEnd = header.indexOf('End Date');
if (iStart < 0 || iEnd < 0) {
  console.error('The header must contain "Start Date" and "End Date" columns.');
  process.exit(1);
}

const rows = records.slice(1).filter(r => r.fields.some(f => f.trim() !== ''));
const starts = rows.map(r => parse(unquote(r.fields[iStart] ?? ''))).filter(n => n !== null);
if (!starts.length) {
  console.error('No dd/mm/yyyy Start Date values found.');
  process.exit(1);
}
const earliest = Math.min(...starts);
const shift = target - earliest;

let changed = 0, skipped = 0, latestEnd = -Infinity;
for (const r of rows) {
  let touched = false;
  for (const i of [iStart, iEnd]) {
    const n = parse(unquote(r.fields[i] ?? ''));
    if (n === null) continue;
    r.fields[i] = format(n + shift);
    touched = true;
    if (i === iEnd) latestEnd = Math.max(latestEnd, n + shift);
  }
  touched ? changed++ : skipped++;
}

writeFileSync(file, records.map(r => r.fields.join(',') + r.eol).join(''));

console.log(`File:            ${file}`);
console.log(`Rows:            ${rows.length} (${changed} shifted, ${skipped} without dates)`);
console.log(`Earliest start:  ${format(earliest)} -> ${format(target)}`);
console.log(`Shift:           ${shift >= 0 ? '+' : ''}${shift} days`);
if (latestEnd > -Infinity) console.log(`Latest end now:  ${format(latestEnd)}`);
