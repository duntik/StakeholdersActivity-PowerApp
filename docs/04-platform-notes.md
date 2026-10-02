# Platform notes

A reference of Power Fx, canvas-app and Dataverse constraints that this app's design
relies on. Read it before modifying the app: several decisions that look odd in the
source (hidden buttons instead of named formulas, a `VariableHeight` gallery,
`Print()` instead of a PDF download) are direct consequences of the rules below.

Each rule states the fact, the reason, and what to do.

Related: [1. Dataverse setup](01-dataverse-setup.md) ·
[2. Build the app](02-build-the-app.md) · [3. Design system](03-design-system.md)

Contents:
[YAML paste format](#yaml-paste-format) ·
[Power Fx language](#power-fx-language) ·
[Collections and named formulas](#collections-and-named-formulas) ·
[Galleries](#galleries) ·
[Controls](#controls) ·
[Delegation](#delegation) ·
[Dataverse](#dataverse) ·
[Export and printing](#export-and-printing) ·
[Themes](#themes) ·
[Method](#method)

---

## YAML paste format

Screens are `.pa.yaml` files in the **Source Code** schema, pasted into Power Apps
Studio.

**Structure.** `Screens:` → screen → `Properties:` / `Children:`. Every control has
`Control:` and a non-empty `Properties:`; every property value is a string starting
with `=`.

```yaml
- lblTitle:
    Control: Label
    Properties:
      Text: ="Lookahead"
      X: =24
```

**Valid YAML is not a valid screen.** A property indented one level too shallow (a
sibling of `Properties:` instead of a child) parses as YAML without complaint, and
Studio then reports `PA1001 Property 'X' not found on type ControlInstance`. When
checking a file, check the shape (each control has `Control` and `Properties`, no
stray keys beside them, all values start with `=`), not just that it parses.

**Formulas containing `: ` must be block scalars.** A record literal, `With({...})`
or an options record is valid Power Fx but invalid plain YAML — the parser reads
`{ Value: R.Name }` as a nested mapping. Use `|-` (not `|`):

```yaml
Items: |-
  =ForAll(t As R, { Value: R.Name })
```

**Other format rules:**

| Rule | Example |
|---|---|
| `Variant` is PascalCase | `Vertical`, `Horizontal`, `VariableHeight`, `ManualLayout` |
| An icon's glyph is a property, not a variant | `Icon: =Icon.Reload` |
| Do not write a version in `Control:` | `ModernDataGrid`, not `ModernDataGrid@1.1.0` — a pinned version binds an old template and newer properties become unknown |
| Order in `Children` is z-order | the last child is drawn on top |
| One screen per file | pasting a multi-screen file replaces all of them; an error in one forces re-pasting the others |

---

## Power Fx language

### Column names: identifiers in `AddColumns`, strings in `SortByColumns`

Power Fx V1 changed some table functions to take column names as identifiers, but
not all of them.

| Function | Column name is |
|---|---|
| `AddColumns`, `DropColumns`, `ShowColumns`, `RenameColumns` | an **identifier**, unquoted |
| `SortByColumns` | a **string**, in double quotes |

```powerfx
AddColumns(src, CategoryName, 'Stakeholder Category'.Name)   // identifier
SortByColumns(t, "StartD", SortOrder.Ascending)              // string
```

Errors: a string in `AddColumns` gives `Expected identifier name`; an identifier in
`SortByColumns` gives `'StartD' isn't recognized`. Do not generalise from one
function to the others — their signatures changed independently.

### Text cannot be compared with `<` or `>`

Relational operators accept Number, Decimal, Date, Time, DateTime and untyped
objects only. To order or compare, use a date or a number (for example `Sort Order`),
not a name.

### Qualify enumerations

Write `TimeUnit.Months`, not `Months`, especially in App > Formulas.

```powerfx
DateAdd(varWindowStart, 3, TimeUnit.Months)
```

### Choices versus lookups in `Patch`

| Column type | Dropdown `Items` | Value to patch |
|---|---|---|
| Choice | `Choices('SEL RAG Values')` | `dd.Selected.Value` — an `OptionSetValue` |
| Lookup | the target table | a **record**: `dd.Selected`, or `LookUp(Table, Name = …)` |

`Choices()` returns records of shape `{Value: OptionSetValue}`. Patching
`dd.Selected` into a Choice column fails with *does not match the expected type
'OptionSetValue'. Found type 'Record'*. Keep `.Value`.

A lookup column cannot be compared to a dropdown's selected record with `=`
(*Incompatible types for comparison*). Compare by name —
`Project.Name = dd.Selected.Name` — and note that this is not delegable (see
[Delegation](#delegation)).

```powerfx
Patch('SEL Engagement Activities', Defaults('SEL Engagement Activities'), {
    Project: LookUp('SEL Projects', Name = ddProject.Selected.Value),   // record
    RAG:     ddRAG.Selected.Value                                       // OptionSetValue
})
```

### `Switch` silently drops a column whose type differs between branches

When `Switch` (or `If`) returns tables, the result type is merged column by column.
A column whose type does not match across branches is **removed from the result
without an error**.

```powerfx
// Act is Yes/No in one branch and a Boolean literal in another:
// ThisItem.Act is "not recognized" while every other column works.
Switch(varRefTable,
    "Categories", ForAll(cats  As C, { Name: C.Name, Act: C.Active }),
    "Programmes", ForAll(progs As G, { Name: G.Name, Act: true })
)

// Fix: coerce to the same type in every branch.
Act: C.Active = true
```

Symptom: exactly one column is missing, and it is the only one of its type. (If the
`Switch` itself were broken, the whole schema would be missing — see the next
section.)

### Break type cycles with a literal

A named formula whose type is inferred from a variable that is in turn set from that
formula stays untyped, and everything using it fails.

```powerfx
// Untyped: TimelineStart reads varTimelineStart, which is set from TimelineStart.
TimelineStart = Coalesce(varTimelineStart, Date(...));

// Typed: the literal 0 fixes the type and breaks the cycle.
TimelineStart = DateAdd(Date(...), Coalesce(varMonthOffset, 0), TimeUnit.Months);
```

---

## Collections and named formulas

### Named formulas do not receive a collection's schema

A named formula in App > Formulas that reads a collection reports *name isn't
recognized* for every column of it. The same applies to user-defined functions:
`ClearCollect` inside a UDF does not expose the collection's schema to the rest of
the app.

**In this app:** App > Formulas holds only constants, geometry, colour tokens and
expressions over global variables. Everything derived from data is built in the
`OnSelect` of two hidden buttons on `scrTimeline` — `btnLoadWindow` (the server query)
and `btnApplyFilters` (client-side derivations) — and triggered with `Select()`.

### Named formulas should read state, not controls

A named formula that reads `ddProgramme.Selected` breaks — on every screen that uses
it — as soon as the control is replaced by a different control type with a
different `Selected` shape. Keep filter state in variables (`varFProgramme`, …) and
let named formulas and every screen read the variables.

### One broken `AddColumns` removes the whole schema

If the first collection in a chain fails to compile — one invalid argument in a
large `AddColumns` is enough — it has **no schema**. Every collection derived from it
and every `ThisItem.<column>` reference downstream then reports its own error. A list
of a hundred errors can be one error.

Fix the **head of the chain** (data source → first collection → derived collections),
re-paste, and only then look at what remains. To find the head: a control whose
`Items` has no error but whose consumers do is already past the break — move
upstream.

---

## Galleries

### `TemplateSize` cannot read `ThisItem` — use `VariableHeight`

`TemplateSize` is one number for the whole gallery. For rows of different heights,
use the `VariableHeight` variant: row height comes from content, `TemplateSize` is
only the minimum.

```yaml
Control: Gallery
Variant: VariableHeight     # Vertical | Horizontal | VariableHeight
```

```powerfx
recRowBg.Height: =ThisItem.H
```

When rows vary in height, any absolute position computed from them (for example on
a print layout) becomes a running sum. `Sum` over an empty table returns blank, so
wrap it: `Coalesce(Sum(...), 0)`.

### A row does not grow to fit its content

The step between items is `TemplateSize + TemplatePadding`. Anything outside the
template rectangle is **clipped**. The minimum `TemplateSize` is 1, and Microsoft's
documentation warns that this can cause controls to drift from their expected X or
Y values. A small `TemplateSize` combined with Y offsets computed per item does not
work: the content is clipped away.

### Let the gallery own the vertical axis

Give each item its own lane and keep children's `Y` constant:

```powerfx
galMarkers.TemplateSize: =LaneH   // one 24 px lane per activity
recBar.Y:                =11      // constant within the lane
recBar.X:                =ThisItem.DayOffset * DayW
```

Children compute only `X` and `Width`. Do not compensate for drift — avoid creating
it.

### `Height` decides what loads

A gallery creates only the items that fit its visible area. `AllItems` contains
those, not the whole `Items` table. A nested gallery that is too short silently
loses items:

```powerfx
galMarkers.Height: =Max(Parent.TemplateHeight, ThisItem.Cnt * LaneH)
```

For an exact count, use `CountRows(<the Items expression>)`, not
`CountRows(gal.AllItems)`.

Galleries nest at most two levels; Microsoft advises avoiding nesting where possible.

---

## Controls

### `Select()` does nothing on a hidden control

`Select(btn)` is ignored when `btn.Visible` is false. Hidden logic buttons must stay
`Visible: =true` and be hidden by z-order instead: 1×1 px, first in `Children`, under
an opaque header rectangle.

### Negative `X` / `Y` are normalised on paste

Studio moves controls with negative coordinates back onto the canvas when a screen is
pasted. Moving a control off-canvas (`X: =-200`) does not hide it.

### `AccessibleLabel` is not on every control

| Control | `AccessibleLabel` |
|---|---|
| `Classic/Icon`, `Classic/DropDown`, `Gallery` | yes |
| `Classic/Button` | **no** — `PA2108 Unknown property 'AccessibleLabel'` |

Properties belong to a control; do not copy them by analogy from another control.
One wrong name repeated on ten buttons is ten diagnostics.

### Dropdown display column: classic versus modern

| Control | How to choose the displayed column |
|---|---|
| `Classic/DropDown` | the **`Value`** property, a sibling of `Items` (set in the property panel). There is no `Items.Value` property; without `Value`, Studio picks a column itself — possibly a colour hex instead of a name. |
| `ModernDropdown`, `ModernCombobox` | **`ItemDisplayText: =ThisItem.Name`** — an expression |

`ItemDisplayText: ="Name"` compiles and renders every item blank: it is a literal
string, not a column reference.

For a single-value modern combobox, set `SelectMultiple: =false` explicitly.

### `ModernDropdown` has no `Placeholder`

`PA2108 Unknown property 'Placeholder' for control type 'ModernDropdown'`. There is
no placeholder property; use a label or an explicit blank first item.

### `ModernDataGridColumn.Text` only sees `ThisItem`

Studio: *This property restricts access to values outside of ThisItem to ensure good
performance.* Inside a column's `Text`:

| Allowed | Not allowed |
|---|---|
| `ThisItem.*`, including a lookup's column (`ThisItem.Project.Name`) | `Switch`, `Coalesce` |
| `Text(ThisItem.'Start Date', "dd mmm yyyy")` | global choice enumerations (`'SEL RAG Values'`) |
| `ThisItem.RAG` — a Choice column renders as its label | variables, collections |

Prepare values before the grid (in `Items`), not in the column.

### Grid columns render in reverse declaration order

The last `ModernDataGridColumn` in `Children` appears first (leftmost), as with
z-order elsewhere. Declare columns right-to-left, and verify on screen, not in the
file.

Turning on text wrapping in a grid column disables row virtualisation.

### `Reset()` function versus `Reset` property

| | `Reset(ctrl)` function | `Reset` property |
|---|---|---|
| Use | in a behaviour formula, to return a control to its `Default` now | bound to a variable; the control resets while it is true |
| Caveat | works on controls of the current screen | toggling the variable true then false inside one formula does not reliably reach the control |

When an action must clear inputs immediately, call the function:

```powerfx
Reset(txtRefName); Reset(txtRefCol); Reset(chkRefAct)
```

Dropdowns whose `Default` reads a variable need no `Reset` at all — clearing the
variable is enough.

### Other control facts

- `Classic/CheckBox` has `OnCheck` / `OnUncheck`, no `OnChange`.
- A modern text input's `OnChange` fires on loss of focus, not per keystroke. For
  live search, read `txt.Text` directly in `Items`.
- `Gallery.Selected` changes by itself when `Items` or the data source refreshes.
  Store the selection in a variable before navigating: `Set(CurrentItem, Self.Selected)`.

---

## Delegation

**Set the data row limit to 1 while building** (Settings → General). Any
non-delegable query then returns one row and shows up immediately, instead of
silently truncating at 500 or 2000 rows on real data. Set it back (this app uses
2000) before publishing.

| Construct | Delegable on Dataverse? | Do instead |
|---|---|---|
| `Distinct(...)` | no — silently truncated | `Sort(Filter(Table, …), Name)` on the table itself |
| Filter on a related table's column, e.g. `Project.Name = "PRJ-A"` | no | compare the lookup column itself, or filter a collection already loaded |
| `In` on a related column | no | `In` only on base-table columns |
| `Choices()` for a lookup | no | bind `Items` to the target table |
| `ForAll`, `Collect`, `ClearCollect`, `GroupBy`, collections | no | keep the server query a simple `Filter` |
| `If`, `Text()`, `Value()`, `&`, `Len`, `Left`, `Mid`, `Lower`, `Upper` inside a filter | no | precompute outside the query |
| `<`, `<=`, `>`, `>=`, `=` on dates and numbers | yes | — |
| `StartsWith(Column, txt.Text)` | yes | do not add an `IsBlank(txt.Text) \|\|` guard: `StartsWith(x, "")` is already true, and the extra branch triggers a delegation warning |

**`CountRows` on a Dataverse table returns a cached value.** For an exact server
count, use `CountIf(Table, condition)`.

**`With`, `Set` and `UpdateContext` materialise a table into a collection without any
warning.** A filter written against a `With` variable runs on the client.

Put the entity's column on the **left** of a comparison:
`'Business unit'.Name = LookUp(...)`, not the reverse.

**In this app:** the only server query is the delegable date-overlap `Filter` in
`btnLoadWindow`. All six filter dropdowns then filter the loaded collection on the
client, so no filter can break delegation. The ceiling is the data row limit: at most
2000 activities in one three-month window. The "My activities" preset on the
register compares a related column (`'Engagement Lead'.'Full Name'`) and is not
delegable.

---

## Dataverse

**Do not filter on calculated or formula columns.** Dataverse evaluates them per
candidate row, cannot use an index, and throttles such queries
(`FilteringOnCalculatedColumns`, `ComputedColumnCauseTimeout`). This is why `End Date`
is always filled instead of using an "end date or start date" calculated column.

Also avoid in queries: leading wildcards (`EndsWith`, `"%text"`), sorting on Choice
columns (joins to localised labels), and conditions on Text columns longer than 850
characters (not indexable).

**Business Required is client-side only.** When a row is saved through web services,
only *System Required* columns are enforced. Imports, Power Automate, the Web API and
`Patch()` save blanks without error. For a server-side guarantee, use a business rule
with **Scope = Entity** — see
[Dataverse setup](01-dataverse-setup.md#16-business-rules-scope-entity).

**Date Only + Time Zone Independent** is set when the column is created and cannot be
changed afterwards.

---

## Export and printing

**`Download()` takes only a URL.** Its signature is `Download(Address)` — the URL of
a web resource. `PDF()` returns a **blob**, so `Download(PDF(...))` cannot work. The
error, *The URL passed to the function is not valid*, points at the URL rather than at
the type mismatch.

**`PDF()` is experimental.** It is off by default (Settings → Upcoming features →
Experimental). When off, it returns nothing and only `Download()` complains. It also
does **not support nested galleries**, accepts only a screen, container or vertical
gallery, takes options as strings, and renders on the user's device:

```powerfx
PDF(cntPrintArea, { Size: "A3", Orientation: "Landscape", Margin: "25mm" })
```

Ways to get a file:

| Approach | Notes |
|---|---|
| `Print()` | opens the browser print dialog; "Save as PDF" is a destination. No flow, no experimental feature. **This app uses it.** |
| Power Automate flow | pass the `PDF()` blob to a flow that saves it and returns a URL, then `Download(flow.Run(...).path)` |

Because `PDF()` cannot render nested galleries, the print layout lives on its own
screen (`scrPrint`) with sibling galleries and absolute positions.

---

## Themes

**A custom theme is YAML, pasted via Themes → Add a theme → Paste theme.** The base
colour is `BasePaletteColor`; `ColorOverrides` holds only the seven steps around it.
There is no `Base` slot, although the documentation's prose lists one:
`Property 'Base' not found on type ...ColorOverrides`.

```yaml
Themes:
  Lookahead:
    BasePaletteColor: '#3A5BA0'
    ColorOverrides:
      Lighter30: '#DCE4F5'
      Darker30: '#1C2E52'
```

When documentation prose and its own example disagree, the example is usually right.

**Applying a modern theme to classic controls overwrites their formulas.** Studio
offers to apply the theme to classic controls too; accepting sets `Fill`, `Color` and
similar properties to theme references, replacing the explicit values from the YAML.
Decline. If it was accepted, re-paste the affected screens.

See [3. Design system](03-design-system.md) for this app's colour tokens.

---

## Method

1. **Fix the head of the data chain first.** A long error list usually has one cause
   upstream. Find the first collection or query that fails, fix it, re-paste, then
   re-read the list.
2. **A pasted file and Studio's error text outrank inferences from documentation.**
   A paste with zero errors proves the properties in it exist; an error message is a
   fact about your environment. A conclusion drawn from documentation is a hypothesis.
   Equally, a property the documentation does not mention may still exist. When one
   property in a block is rejected, the others were accepted.
3. **When one function rejects another's output, read the receiving function's
   signature.** The error message and the source function's documentation can both
   point the wrong way; the receiver's parameter types settle it (`Download` expects a
   URL, `PDF` returns a blob).

Also: make the narrowest change that fixes a symptom. A runtime problem in one
control is not a reason to rewrite a construct that compiles cleanly.
