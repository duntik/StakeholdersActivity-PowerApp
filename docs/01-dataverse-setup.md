# 1. Dataverse setup

This guide creates everything the app needs in Microsoft Dataverse: a solution,
four global choices, six reference tables, the main activity table, keys, business
rules, security roles and the seed data.

Work through the sections in order. Choices come before tables, and reference
tables come before the main table, because the main table has lookups to them.

Next step: [2. Build the app](02-build-the-app.md).

---

## 1.1 Solution and publisher

1. Go to **make.powerapps.com**, pick the target environment, open **Solutions** →
   **New solution**.
2. Display name: `Stakeholder Engagement Lookahead`.
3. Publisher: pick an existing publisher whose prefix is `sel`, or create one with
   **New publisher** → Prefix **`sel`**.
4. Version: `1.0.0.0`.

Prefix rules:

- Type `sel` **without** an underscore. Dataverse adds the underscore itself when it
  builds logical names (`sel_engagementactivity`, `sel_stakeholdercategory`, …).
- 2–8 characters, letters and digits only, first character a letter, stored in lower
  case.

> **The prefix is irreversible.** It is baked into the logical name of every table,
> column and choice. Changing it later means recreating every object.
>
> The canvas app is not affected by the prefix: all Power Fx refers to tables and
> columns by **display name**. A different prefix needs no change to the YAML. Display
> names, however, must match this guide exactly.

Create **every** object below with **+ New** from inside this solution. Objects
created elsewhere land in the Default solution and will not travel with the solution
between environments.

---

## 1.2 Global choices

Solution → **+ New** → **More** → **Choice**.

The names are plural on purpose, so a choice name never collides with a column of
the same name in Power Fx (`'SEL RAG Values'.Red` versus `ThisItem.RAG`).

Do **not** type numeric values for the options; let Dataverse generate them. Power Fx
refers to options by label (`'SEL Engagement Methods'.'Public Event'`), so only the
spelling and order of the labels matter.

| Display name | Logical name | Options, in order |
|---|---|---|
| `SEL RAG Values` | `sel_ragvalues` | Red, Amber, Green |
| `SEL Engagement Levels` | `sel_engagementlevels` | Inform, Consult, Involve, Collaborate, Empower |
| `SEL Engagement Methods` | `sel_engagementmethods` | Meeting, Public Event, Site Visit, Email, Newsletter, Phone Call, Workshop, Drop-in Session |
| `SEL Engagement Phases` | `sel_engagementphases` | Pre-Application, Application, Pre-Construction, Construction, Operational |

Labels the app depends on by name:

- `SEL Engagement Methods`.**`Public Event`** — public events are drawn in a different
  marker colour on the timeline.
- `SEL RAG Values`.**`Red` / `Amber` / `Green`** — RAG badges and the "Amber & Red"
  preset on the register.

The other labels can be changed freely to suit your organisation.

---

## 1.3 Reference tables

Solution → **+ New** → **Table**.

Rules that apply to **every** table in this guide:

- **Display name starts with `SEL `.** This keeps the project's tables together in a
  busy environment.
- **Check the plural name.** Power Fx refers to a table by its **plural display
  name**. Dataverse pre-fills the plural field; the default is correct for every
  table here, but the field is editable — if it differs, every formula in the app
  turns red.
- **Primary column display name is exactly `Name`** (logical `sel_name`) for all six
  reference tables. Formulas read it as `.Name`.
- **Ownership: Organization.** Reference data is shared by everyone (see
  [1.8 Ownership and security](#18-ownership-and-security)). Ownership is chosen in
  **Advanced options** when the table is created and cannot be changed afterwards.

| Display name (singular) | Plural — used in formulas | Logical name |
|---|---|---|
| `SEL Programme` | `'SEL Programmes'` | `sel_programme` |
| `SEL Local Authority Area` | `'SEL Local Authority Areas'` | `sel_localauthorityarea` |
| `SEL Delivery Area` | `'SEL Delivery Areas'` | `sel_deliveryarea` |
| `SEL Stakeholder Category` | `'SEL Stakeholder Categories'` | `sel_stakeholdercategory` |
| `SEL Project` | `'SEL Projects'` | `sel_project` |
| `SEL Project Site` | `'SEL Project Sites'` | `sel_projectsite` |
| `SEL Engagement Activity` | `'SEL Engagement Activities'` | `sel_engagementactivity` |

Every name contains a space, so formulas always quote it in single quotes.

### SEL Programme

| Display name | Type | Required | Notes |
|---|---|---|---|
| `Name` | Text (100) | primary | e.g. `Programme A` |

### SEL Local Authority Area

| Display name | Type | Required | Notes |
|---|---|---|---|
| `Name` | Text (100) | primary | e.g. `Council 1` |

### SEL Delivery Area

| Display name | Type | Required | Notes |
|---|---|---|---|
| `Name` | Text (100) | primary | e.g. `Area North` |

### SEL Stakeholder Category

The most important reference table: each category is one row on the timeline, and
this table sets the row order and colours.

| Display name | Type | Required | Notes |
|---|---|---|---|
| `Name` | Text (100) | primary | e.g. `Communications` |
| `Colour Hex` | Text (9) | Business Required | row background, format `#D3E4FF` |
| `Text Colour Hex` | Text (9) | Optional | row label colour |
| `Sort Order` | Whole Number | Business Required | top-to-bottom order; use steps of 10 |
| `Active` | Yes/No | Business Required | default **Yes**; inactive categories are hidden, not deleted |

### SEL Project

| Display name | Type | Required | Notes |
|---|---|---|---|
| `Name` | Text (100) | primary | short code, e.g. `PRJ-A` |
| `Full Name` | Text (250) | Optional | full project name |
| `Programme` | Lookup → `SEL Programme` | Optional | |
| `Local Authority Area` | Lookup → `SEL Local Authority Area` | Optional | default for new activities |
| `Active` | Yes/No | Optional | default **Yes** |

### SEL Project Site

| Display name | Type | Required | Notes |
|---|---|---|---|
| `Name` | Text (150) | primary | e.g. `Site A1` |
| `Project` | Lookup → `SEL Project` | Optional | |

### The `N/A` row

Every reference table contains a row named **`N/A`** (the seed files include it).
It is the placeholder that business rules write into empty lookups, so that a record
never has a blank value in a column the filters use. Do not delete it. In
`SEL Stakeholder Categories` give it a high `Sort Order` (the seed uses `9999`) so it
sits at the bottom of the timeline.

---

## 1.4 Main table: SEL Engagement Activities

- Display name `SEL Engagement Activity`, plural `SEL Engagement Activities`,
  logical `sel_engagementactivity`.
- **Ownership: User or team** (set in **Advanced options** at creation; it cannot be
  changed later).
- Primary column: display name **`Activity`** (logical `sel_activity`), Text (250).
  This is the label shown next to each marker.

| Display name | Type | Required (Dataverse) | Notes |
|---|---|---|---|
| `Activity` | Text (250) | **Business Required** | primary column; marker label |
| `Project` | Lookup → `SEL Project` | Optional | |
| `Programme` | Lookup → `SEL Programme` | Optional | stored on the activity so it can be filtered directly |
| `Project Site` | Lookup → `SEL Project Site` | Optional | |
| `Stakeholder Category` | Lookup → `SEL Stakeholder Category` | **Business Required** | sets the timeline row and its colour |
| `Stakeholder Name` | Text (250) | Optional | |
| `Stakeholder Group` | Text (250) | Optional | |
| `Local Authority Area` | Lookup → `SEL Local Authority Area` | Optional | |
| `Delivery Area` | Lookup → `SEL Delivery Area` | Optional | |
| `Engagement Lead` | Lookup → **User** (`systemuser`) | Optional | drives the "My activities" and "Unassigned" presets |
| `Engagement Manager` | Text (150) | Optional | free text |
| `Start Date` | Date and Time → **Date Only**, **Time Zone Independent** | **Business Required** | |
| `End Date` | Date and Time → **Date Only**, **Time Zone Independent** | **Business Required** | equals `Start Date` for a single-day activity |
| `Engagement Level` | Choice → `SEL Engagement Levels` | Optional | |
| `Engagement Method` | Choice → `SEL Engagement Methods` | Optional | `Public Event` changes the marker colour |
| `Engagement Phase` | Choice → `SEL Engagement Phases` | Optional | |
| `RAG` | Choice → `SEL RAG Values` | Optional | |
| `Date TBC` | Yes/No | Optional | default **No**; a TBC activity is drawn as a hollow diamond |

For each Choice column, select **Sync this choice with** → the existing global
choice listed above; do not create a local choice.

The Add New Activity form in the app asks for more fields than Dataverse requires
(Project, Site, Local Authority Area, Delivery Area, Engagement Lead, Engagement
Method and others are marked `*` in the form). That is a form-level check only — see
[1.6](#16-business-rules-scope-entity).

### Start Date and End Date: Date Only, Time Zone Independent

When creating each column:

1. Data type **Date and time** → Format **Date only**.
2. Expand **Advanced options** → Behavior **Time zone independent**.
3. Check before **Save**.

> **Behavior cannot be changed after the column is saved.** A User local date column
> shifts by the viewer's time-zone offset, and an activity can appear a day early or
> late on the timeline. If the behaviour is wrong, delete the column and recreate it.

### Why End Date is always filled

A single-day activity has `End Date = Start Date`; it is never left blank. The
timeline loads its three-month window with one query on two plain date columns:

```powerfx
Filter('SEL Engagement Activities',
    'Start Date' <  DateAdd(varWindowStart, 3, TimeUnit.Months),
    'End Date'   >= varWindowStart
)
```

- It is an **interval overlap** test, so an activity that starts before the window
  and runs into it is still shown.
- Both comparisons are delegable and can use an index.
- Do **not** add a calculated column such as "End Date or Start Date" for this.
  Filtering on a calculated column cannot use an index and Dataverse throttles such
  queries (see [Platform notes](04-platform-notes.md#dataverse)).

The diamond-versus-bar decision is simply `'End Date' = 'Start Date'`.

---

## 1.5 Alternate keys

Each reference table gets an alternate key on `Name`. The key enforces unique names
(the app looks records up by name) and lets imports and integrations match rows by
name.

Table → **Keys** → **New key**:

| Table | Key display name | Columns |
|---|---|---|
| `SEL Programme` | `Name Key` | `Name` |
| `SEL Local Authority Area` | `Name Key` | `Name` |
| `SEL Delivery Area` | `Name Key` | `Name` |
| `SEL Stakeholder Category` | `Name Key` | `Name` |
| `SEL Project` | `Name Key` | `Name` |
| `SEL Project Site` | `Name Key` | `Name` |

`SEL Engagement Activities` has no alternate key: two activities can legitimately
share a name (for example a recurring board meeting).

Key creation runs as a background job. Wait until the key status is **Active**
before importing data; a key cannot be created while duplicate names exist.

---

## 1.6 Business rules (scope Entity)

### Why scope Entity matters

**Business Required is enforced only by forms.** Data imports, Power Automate flows,
the Web API and `Patch()` from a canvas app save a blank value in a Business Required
column without any error. Only *System Required* columns are enforced by the server.

A business rule with **Scope = Entity** is compiled into a synchronous server-side
plug-in that runs on every create and update, whatever the source. It is the only
no-code way to guarantee a value is present.

This matters for the app because a record with a blank lookup is not just
incomplete: it **disappears as soon as a user picks any value in the matching
filter**, because a blank never equals `PRJ-A`. There is no error and no trace. A
blank `Stakeholder Category` puts the record in the timeline's "Uncategorised" row.

### Rules to create

Table `SEL Engagement Activity` → **Business rules** → **New business rule**. For each
rule: set **Scope** (top right) to **Entity**, then **Save** → **Validate** →
**Activate**.

| Rule name | Condition | Action |
|---|---|---|
| `SEL – End Date defaults to Start Date` | `End Date` does not contain data | Set Field Value: `End Date` = field `Start Date` |
| `SEL – End Date cannot precede Start Date` | `Start Date` is greater than `End Date` | Show Error Message on `End Date` |
| `SEL – Stakeholder Category defaults to N/A` | `Stakeholder Category` does not contain data | Set Field Value: `Stakeholder Category` = record `N/A` |
| `SEL – Delivery Area defaults to N/A` | `Delivery Area` does not contain data | Set Field Value: `Delivery Area` = record `N/A` |

The same "defaults to N/A" pattern can be added for `Project`, `Programme`,
`Project Site` and `Local Authority Area` if records reach the table from sources
other than the app.

Notes:

- Create the reference tables' `N/A` rows (import the seed files) **before** the N/A
  rules — the rule needs an existing record to point at.
- Business rules **do not run retroactively**. After activating them, fix existing
  records once with a bulk edit (an Excel Online view or a simple flow).
- The app's form already defaults `End Date` to `Start Date` and blocks a submit
  where `End Date` precedes `Start Date`; the rules cover every other write path.

**Acceptance test:** import one CSV row with no `End Date` and no
`Stakeholder Category`. The created record must have `End Date = Start Date` and
`Stakeholder Category = N/A`.

---

## 1.7 Auditing

Table `SEL Engagement Activity` → **Properties** → **Advanced options** → enable
**Audit changes to its data**. Auditing must also be enabled for the environment
(Power Platform admin center → Environment → **Settings** → **Audit and logs**).

Without it there is no record of who moved an activity's date.

---

## 1.8 Ownership and security

| Table | Ownership | Reason |
|---|---|---|
| `SEL Engagement Activities` | User or team | access can be scoped by owner, team and business unit |
| All six reference tables | Organization | shared lists; one copy for everyone |

Create three security roles inside the solution: Solution → **+ New** →
**Security** → **Security role**. Start each from a copy of **Basic User** so users
can sign in and open the app.

Privilege levels: **Org** = organisation, **BU** = business unit, **User** = own
records. Organisation-owned tables only offer None or Org.

| Table | Privilege | `SEL – Reader` | `SEL – Contributor` | `SEL – Reference Data Admin` |
|---|---|---|---|---|
| `SEL Engagement Activities` | Read | Org | Org | Org |
| | Create | – | User | – |
| | Write | – | BU | – |
| | Delete | – | User | – |
| | Append | – | BU | – |
| | Append To | – | BU | – |
| Six reference tables | Read | Org | Org | Org |
| | Create | – | – | Org |
| | Write | – | – | Org |
| | Delete | – | – | Org |
| | Append | – | – | Org |
| | Append To | – | Org | Org |
| User (`systemuser`) | Read | Org | Org | Org |
| | Append To | – | Org | – |

Notes:

- **Append** on the activity plus **Append To** on the target table is what allows
  a lookup to be set (`Project`, `Engagement Lead`, …).
- `SEL – Reference Data Admin` is usually combined with `SEL – Contributor`.
- **Write on `SEL Stakeholder Categories` changes the timeline for everyone** — row
  colours, order and visibility. Treat the Reference Data Admin role as a privilege
  to change the interface, and assign it to few people.
- The reference-data screen is not yet hidden by role inside the app. Users without
  the Reference Data Admin role can open it but their saves fail; restrict it here.
- Adjust the activity levels to your organisation: for example, Write at User level
  so contributors edit only their own activities.

---

## 1.9 Import the seed data

The `seed/` folder contains CSV files for **Import** → **Import data from Excel**
(or the import wizard reached from the table's **Import** menu). All values are
synthetic placeholders (`PRJ-A`, `Council 1`, `Site A1`) — replace them with real
reference data before go-live.

### Order

Lookups resolve against rows that already exist, so reference tables go first:

| # | File | Table | Lookups in the file |
|---|---|---|---|
| 1 | `programmes.csv` | `SEL Programmes` | – |
| 2 | `local-authority-areas.csv` | `SEL Local Authority Areas` | – |
| 3 | `delivery-areas.csv` | `SEL Delivery Areas` | – |
| 4 | `stakeholder-categories.csv` | `SEL Stakeholder Categories` | – |
| 5 | `projects.csv` | `SEL Projects` | Programme, Local Authority Area |
| 6 | `project-sites.csv` | `SEL Project Sites` | Project |
| 7 | `engagement-activities-demo.csv` | `SEL Engagement Activities` | Project, Programme, Project Site, Stakeholder Category, Local Authority Area, Delivery Area |

File 7 is optional demo data, so the timeline has something to show on first run.
Delete it when real data arrives.

CSV headers match the column display names exactly. The demo file does not include
`Stakeholder Group`, `Engagement Lead`, `Engagement Manager`, `Engagement Level`,
`Engagement Phase` or `Date TBC`; those stay blank.

### Map lookups explicitly

In the mapping step, check every lookup column: it must be mapped to the target
table and matched on its **`Name`** column (the primary name).

> **An unmapped or mismatched lookup imports as blank, without an error.** In the app
> such records show up in the timeline's **Uncategorised** row (blank
> `Stakeholder Category`) or vanish as soon as a filter is applied (blank `Project`,
> `Delivery Area`, …). If the timeline shows an unexpected Uncategorised count after an
> import, check the lookup mapping first.

Choice columns (`Engagement Method`, `RAG`) are matched on label; the CSV values match
the option labels in [1.2](#12-global-choices).

### Date format

Dates in `engagement-activities-demo.csv` use **dd/mm/yyyy** (`17/09/2026`). The
import parses dates in the **importing user's** format. Before importing either:

- set your personal settings to **English (United Kingdom)** (Settings → Personalization
  settings → Formats), or
- convert the date columns to your own locale's format (or to ISO `yyyy-mm-dd`).

With a US locale, `03/09/2026` is read as 9 March, and days above 12 fail to import.

### Demo dates

The demo activities have fixed dates. If they lie in the past, the three-month
timeline opens empty. `tools/demo-dates/shift.mjs` (Node.js) moves every date in the
demo file by the same offset so that the earliest activity falls in the current
month. Run it before importing file 7; see the comment at the top of the script for
usage.

---

## Checklist

- [ ] Solution and publisher with prefix `sel`
- [ ] Four global choices
- [ ] Six reference tables (Organization owned, primary column `Name`)
- [ ] `SEL Engagement Activities` (User or team owned), Start/End Date as Date Only,
      Time zone independent
- [ ] Alternate keys on `Name`, status Active
- [ ] Seed files 1–6 imported, including the `N/A` rows
- [ ] Four business rules, Scope Entity, activated
- [ ] Auditing on
- [ ] Three security roles assigned
- [ ] Demo activities imported (optional), dates shifted if needed

Continue with [2. Build the app](02-build-the-app.md).
