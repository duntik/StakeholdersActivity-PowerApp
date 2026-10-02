# Stakeholder Engagement Lookahead

A Power Apps canvas app on Microsoft Dataverse for planning stakeholder engagement: a register of activities, a three-month Gantt-style lookahead, a calendar and a printable board — delivered as plain YAML you paste into Power Apps Studio.

Click **Use this template** to create your own copy of the repository, then follow the [Quick start](#quick-start).

## What it does

| Screen | Purpose |
|---|---|
| **List** (`scrList`, start screen) | Activity register in a modern Data Grid. Presets: *Next 90 days*, *My activities*, *Amber & Red*, *Unassigned*, *All*. Search by activity or stakeholder name, plus the shared filter bar. |
| **Timeline** (`scrTimeline`) | Three-month lookahead with one row per stakeholder category and one lane per activity. Diamonds for single-day activities, bars for multi-day ones, hollow diamonds for dates still to be confirmed, a today line and month navigation. An *Add New Activity* modal writes straight to Dataverse. Counters report truncated results, uncategorised records and clipped rows instead of hiding them. |
| **Calendar** (`scrCalendar`) | Month, week and day views driven by a single gallery. Seven-day weeks including weekends; the **+** in a day cell opens the add form pre-dated to that day. |
| **Print** (`scrPrint`) | A flat layout of the current timeline, with title, date range and active filters, printed or saved as PDF through the browser print dialog. |
| **Reference data** (`scrRefData`) | One editor for all six reference tables. Live colour preview and hex validation for categories, duplicate-name and duplicate-sort-order checks. Categories and projects are deactivated rather than deleted. |

The filter bar (Programme, Project, Stakeholder category, Site, Local authority area, Delivery area) is shared by the List, Timeline and Calendar screens and stays in sync between them.

## Why it is built this way

- **Paste-only delivery.** Every screen is a `.pa.yaml` file in the Power Apps Source Code schema. Nothing needs the Power Platform CLI, a solution import or a component library: create a blank app, paste, publish. Changes are reviewable as text diffs.
- **Dataverse, not SharePoint.** Lookups, global choices, date-only columns, security roles and delegable queries are what a multi-user planning tool needs. Every table display name starts with `SEL ` so the schema is easy to find in a busy environment.
- **One server query per window.** The timeline loads the visible three months once and derives everything else (filters, rows, lanes, print layout) in memory, so changing a filter does not go back to the server.
- **Material 3 design tokens.** All colours come from role tokens in `App.Formulas.txt`, derived from a single seed colour. Screens reference roles such as `ClrHeader` and `ClrText` rather than raw colours, so re-branding is one paste.
- **Honest counters.** A server-side count is compared with what was loaded, so a truncated result is reported rather than looking like missing data.

## Requirements

| Area | Requirement |
|---|---|
| Licensing | A Power Apps Premium licence for every user (Dataverse is a premium connector). In a developer environment, the free Power Apps Developer Plan is sufficient for building and testing. |
| Environment | A Power Platform environment with a Dataverse database. A developer environment is fine for evaluation. |
| Maker permissions | Rights to create tables, choices, a publisher and security roles: **System Administrator**, or **System Customizer** plus **Environment Maker**. |
| User permissions | Each user needs the shared app **and** one of the `SEL` security roles. Sharing the app alone does not grant access to Dataverse data. |
| Tools (optional) | Node.js 18 or later, only for the helper scripts in `tools/`. |

## Quick start

1. Click **Use this template** and create your repository, then clone or download it.
2. Create or choose an environment with Dataverse (a developer environment is enough to evaluate).
3. Create the publisher, tables, global choices and security roles described in [Dataverse setup](docs/01-dataverse-setup.md).
4. Import the reference data and demo activities from `seed/` in the order given in [Dataverse setup](docs/01-dataverse-setup.md). Optionally run `tools/demo-dates/shift.mjs` first so the demo activities fall in the current month.
5. Create a blank **Tablet** canvas app and apply the settings in [Build the app](docs/02-build-the-app.md) — in particular **Modern controls and themes ON**.
6. Add the seven `SEL` tables and the `Users` table as data sources.
7. Paste `src/App.Formulas.txt` into **App > Formulas**, then paste `src/theme.yaml` as a new theme.
8. Paste the five screens in order (`scrList`, `scrTimeline`, `scrCalendar`, `scrPrint`, `scrRefData`), set `App.StartScreen` to `scrList`, then save and publish.
9. Share the app and assign each user an `SEL` security role, as described in [Build the app](docs/02-build-the-app.md#sharing).

## Repository layout

```
README.md
LICENSE
.gitignore
.gitattributes
docs/
  01-dataverse-setup.md      schema, choices, keys, business rules, roles, import
  02-build-the-app.md        app settings, paste order, first run, sharing
  03-design-system.md        Material 3 tokens, how to re-brand
  04-platform-notes.md       Power Fx / canvas / Dataverse constraints the design relies on
src/
  App.Formulas.txt           paste into App > Formulas
  theme.yaml                 paste via Themes > Add a theme > Paste theme
  scrList.pa.yaml            start screen: activity register (Data Grid)
  scrTimeline.pa.yaml        3-month Gantt-style lookahead
  scrCalendar.pa.yaml        month / week / day calendar
  scrPrint.pa.yaml           print layout of the timeline
  scrRefData.pa.yaml         reference-data administration
seed/
  programmes.csv, local-authority-areas.csv, delivery-areas.csv,
  stakeholder-categories.csv, projects.csv, project-sites.csv,
  engagement-activities-demo.csv
tools/
  palette/                   generate.mjs, package.json, README.md — colour tokens from a seed hex
  demo-dates/                shift.mjs — move demo activity dates to the current month
```

## Customising

| What | How |
|---|---|
| Organisation name | Set `BrandName` in `src/App.Formulas.txt`. It appears in every screen header and on printed reports. `BrandFont` sets the typeface for all text controls. |
| Brand colour | Run `node generate.mjs "#RRGGBB"` in `tools/palette` with your brand colour as the seed, paste the output over the `DESIGN SYSTEM` block of `App.Formulas.txt`, replace `theme.yaml` and re-paste both. Add `--categories` for a matching set of category colours. See [Design system](docs/03-design-system.md#re-branding). |
| Stakeholder categories | Edit them in the app on the **Reference data** screen (gear icon in the header): name, row colour, text colour, sort order and active flag. Changes reach every user's timeline immediately. |
| Other reference data | Projects, sites, programmes, local authority areas and delivery areas are edited on the same screen. |
| Demo dates | `node tools/demo-dates/shift.mjs seed/engagement-activities-demo.csv` moves every demo activity so the earliest one starts on the first day of the current month (`--to YYYY-MM` picks another month), keeping durations and spacing. Run it before importing the file. |

## Limitations

- Every user needs a Power Apps Premium licence because the data lives in Dataverse. The Developer Plan covers building and testing in a developer environment only.
- The *My activities* preset compares a related column (`Engagement Lead` full name), which Dataverse cannot delegate. That one view is capped at the app's data row limit; all other presets are delegable.
- There is no direct PDF file export. A real file needs a Power Automate flow; the app uses the browser print dialog, whose *Save as PDF* destination produces the same result.
- Power Apps has no modern Gallery control, so the timeline, calendar and print screens use classic galleries.
- The Reference data screen is not role-gated inside the app. Restrict who can change reference data with the `SEL – Reference Data Admin` security role.
- The timeline loads one three-month window at a time, bounded by the data row limit (2000). The counter warns when a window holds more records than were loaded.

Platform constraints the design relies on are collected in [Platform notes](docs/04-platform-notes.md).

## Contributing

Issues and pull requests are welcome. Please keep every screen file paste-compatible:

- One screen per `.pa.yaml` file, in the Power Apps Source Code schema.
- Every property value starts with `=`; multi-line formulas use `|-` blocks; a plain scalar must not contain `: `.
- Colours go through the role tokens in `App.Formulas.txt`, not literal `RGBA()` values.
- Test a change by pasting it into a blank app before opening a pull request.

## Licence

[MIT No Attribution (MIT-0)](LICENSE). Use it for anything — personal, internal or commercial: copy it, change it, sell it, ship it to clients. No attribution is required and no permission is needed.

The software is provided as is, without warranty of any kind.
