# Build the app

This guide turns the files in `src/` into a working canvas app. It assumes the Dataverse schema, security roles and seed data from [Dataverse setup](01-dataverse-setup.md) are already in place.

Everything is done in Power Apps Studio in the browser. No CLI, solution import or component library is needed.

## 1. Create a blank canvas app

1. In [make.powerapps.com](https://make.powerapps.com), select the environment that holds the `SEL` tables.
2. Ideally open the solution that contains the tables, then choose **New > App > Canvas app**. (Creating it from **Create > Blank app > Blank canvas app** also works; the app is then outside the solution.)
3. Name it, for example `Stakeholder Engagement Lookahead`, and choose the **Tablet** format.
4. Studio opens with one empty screen, `Screen1`. Leave it for now; it is deleted at the end.

All coordinates in the screen files are laid out for a **1366 × 768** canvas.

## 2. Required settings

Open **Settings** (gear icon in the command bar).

| Section | Setting | Value | Why |
|---|---|---|---|
| Display | Orientation | Landscape | |
| Display | Size / aspect ratio | 16:9 | Matches the 1366 × 768 layout |
| Display | Scale to fit | On | The fixed layout scales to the window |
| Display | Lock aspect ratio | On | Keeps the timeline geometry intact |
| Updates > New | **Modern controls and themes** | **On** | `ModernDataGrid` and `ModernDropdown` do not exist without it, and the screen paste fails |
| General | Data row limit | `2000` for use (`1` while building, optional) | 2000 is the platform maximum; a limit of 1 makes every non-delegable query visibly fail during development |

Leave **App.OnStart** empty. The app does not use it; screens initialise their own state in `OnVisible`.

## 3. Add data sources

**Data > Add data > Dataverse**, then add:

- `SEL Engagement Activities`
- `SEL Stakeholder Categories`
- `SEL Projects`
- `SEL Project Sites`
- `SEL Programmes`
- `SEL Local Authority Areas`
- `SEL Delivery Areas`
- `Users`

The formulas refer to tables by their **plural display names** exactly as listed. If a table was created with a different name, either rename it in Dataverse or find-and-replace the name in the files before pasting.

## 4. Paste App.Formulas

1. Select **App** at the top of the Tree view.
2. Choose **Formulas** in the property dropdown.
3. Select everything in the formula bar and delete it.
4. Paste the whole of `src/App.Formulas.txt`.

This defines the canvas geometry, the time-window formulas, the design tokens (`Md*`, `Clr*`, `Type*`, `Shape*`, `BrandName`, `BrandFont`) and `ActiveFilterText`. Formulas that refer to filter variables show no errors yet; the variables are created by the screens.

## 5. Paste the theme

1. Open **Themes** in the left rail.
2. Choose **Add a theme > Paste theme**.
3. Paste `src/theme.yaml` from the `Themes:` line to the end.
4. When Studio offers to apply the theme to classic controls as well, **decline**.

Accepting rewrites the `Fill` and `Color` formulas of every classic control with references to the theme, replacing the role tokens the screens already use.

The theme only styles the modern controls (Data Grid and dropdowns) so they match the rest of the app.

## 6. Paste the screens

Repeat for each file, **in this order**:

| # | File | Screen name |
|---|---|---|
| 1 | `src/scrList.pa.yaml` | `scrList` |
| 2 | `src/scrTimeline.pa.yaml` | `scrTimeline` |
| 3 | `src/scrCalendar.pa.yaml` | `scrCalendar` |
| 4 | `src/scrPrint.pa.yaml` | `scrPrint` |
| 5 | `src/scrRefData.pa.yaml` | `scrRefData` |

For each one:

1. **New screen > Blank**.
2. Rename the new screen to the name in the table (double-click it in the Tree view).
3. Select the screen in the Tree view.
4. Open the `.pa.yaml` file in a text editor, copy from the `Screens:` line to the end, and press **Ctrl+V** in Studio.
5. Wait for the paste to finish before moving to the next file.

Navigation formulas refer to other screens (`Navigate(scrTimeline, …)` on the List screen, for example), so errors that name a screen not yet pasted are expected and clear once all five are in. Errors that remain after the last paste are covered in [Troubleshooting](#troubleshooting).

Finally, delete the empty `Screen1`.

## 7. Set the start screen

Select **App** and set `StartScreen` to:

```
scrList
```

`scrList` is the hub every other screen is reached from, and the only screen that does not depend on collections built elsewhere.

## 8. Save and publish

1. **Save** (Ctrl+S). Studio may run the App checker; review any remaining errors.
2. If the Data row limit was set to `1` while building, set it back to `2000`.
3. **Publish** and confirm **Publish this version**.

## First-run checklist

Play the app (F5) and confirm:

- [ ] **List** opens first. The header shows the `BrandName` value, the grid shows activities, and the *Next 90 days* preset is active. If the grid is empty, check that the demo dates are near today (see `tools/demo-dates`) or switch to the *All* preset.
- [ ] Choosing a value in a filter dropdown, then opening **Timeline** or **Calendar**, shows the same filter selected there.
- [ ] **Timeline** shows one coloured row per stakeholder category with activities in the window (**Hide Empty Area's** is ticked by default), the current month first, a red today line, diamonds and bars with labels, and a counter such as `12 of 12 · Oct – Dec 2026` with no warning (the numbers depend on your data).
- [ ] The month arrows move the window and the counter updates.
- [ ] **+ Add New Activity** opens the modal; **Submit** stays disabled until every required field is filled, and a submitted activity appears on the board.
- [ ] **Calendar** shows a month grid with weekends; **Week** and **Day** switch the same grid; the **+** in a day cell opens the add form dated to that day.
- [ ] From the timeline, **Export to PDF** opens **Print** with title, date range and active filters; **Print / Save as PDF** opens the browser print dialog without the toolbar.
- [ ] The gear icon opens **Reference data**; categories show colour swatches and the edit panel previews colours as you type.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `PA2108` *Unknown property* on paste | The property does not exist on that control in this Studio version — most often because **Modern controls and themes** is off, so `ModernDataGrid` / `ModernDropdown` are unknown. | Turn the setting on (Settings > Updates > New), delete the partly pasted controls and paste the screen again. If you edited a file, check that the property exists on that control type (for example, `AccessibleLabel` does not exist on `Classic/Button`). |
| `YamlInvalidSyntax` on paste | A plain (unquoted) YAML value contains `: `, typically a record literal such as `={Value: "x"}` written on one line. | Move the formula into a block scalar: `Property: \|-` followed by the formula on the next lines, indented. Every property value must start with `=`. |
| *Name isn't recognized* on a table name such as `'SEL Projects'` | The data source has not been added, or the table's plural display name differs from the one in the formulas. | Add the data source (step 3). Otherwise rename the table in Dataverse, or remove the data source, fix the name in the files and paste again. |
| *Name isn't recognized* on a screen name | That screen has not been pasted yet, or it was not renamed before pasting. | Paste all five screens; check each screen name exactly matches the table in step 6. |
| Errors on `ClrHeader`, `BrandFont`, `LaneH` and similar | `App.Formulas.txt` was not pasted, or was pasted only in part. | Repeat step 4, replacing the whole Formulas property. |
| Timeline counter shows `⚠ N uncategorised` | N activities in the window have no stakeholder category, or their category is inactive. They appear in a separate *Uncategorised* row at the bottom. | Assign a category to those activities, or reactivate the category on the Reference data screen. After a CSV import, check that the category names in the file match the `SEL Stakeholder Categories` names exactly. |
| Timeline counter shows `result truncated` | More activities fall in the window than the data row limit allows to load. | Set the Data row limit to `2000`. If a three-month window really holds more than 2000 activities, narrow the data with filters. |
| Timeline counter shows `rows clipped` | **Limit Area Height** is ticked and a row has more than three lanes. | Untick **Limit Area Height** to show every lane. |
| Print screen is empty | It was opened directly; it reads collections built by the Timeline screen. | Open the Timeline first, then use its **Export to PDF** button. |
| Classic controls lost their colours after adding the theme | The theme was applied to classic controls. | Undo (Ctrl+Z) straight away, or delete the affected screens and paste them again. |
| Grid shows no rows but the timeline does | The *Next 90 days* preset excludes the data. | Choose *All*, or shift the demo dates with `tools/demo-dates`. |

More background on these constraints is in [Platform notes](04-platform-notes.md).

## Sharing

### Share the app

1. In [make.powerapps.com](https://make.powerapps.com), open **Apps**, select the app and choose **Share**.
2. Enter users or a security group.
3. Leave **Co-owner** unticked for normal users. Tick it only for people who should be able to edit and re-share the app.
4. Under **Data permissions**, assign the appropriate `SEL` security role (where your own role allows you to assign it), then **Share**.

### Assign a security role

Sharing the app grants access to the app, **not** to the Dataverse data behind it. Without a security role, users can open the app but see no data and cannot save.

| Role | For |
|---|---|
| `SEL – Reader` | People who only view the register, timeline and calendar |
| `SEL – Contributor` | People who add and edit activities |
| `SEL – Reference Data Admin` | People who maintain categories, projects, sites and the other reference tables |

If the role cannot be assigned from the Share pane, assign it in the Power Platform admin center: **Environments > your environment > Settings > Users + permissions > Users**, select the user, **Manage security roles**. The roles themselves are defined in [Dataverse setup](01-dataverse-setup.md).

The Reference data screen is visible to every user of the app. Who can actually change reference data is controlled by these roles.

### Licences

Every user needs a Power Apps Premium licence (or another licence that includes Dataverse) to run the app in a production environment. A user without one is told so when the app opens.

### Developer environments

A developer environment is suitable for building and evaluating the app, with these differences:

- Users must be added to the environment manually (Power Platform admin center **> Users > Add user**) before the app can be shared with them; they also need their own Developer Plan or a Premium licence.
- Apps show a banner indicating they run in a developer environment.
- An environment that has no activity is automatically disabled after a period of inactivity (30 days under the current Developer Plan policy) and later deleted if it is not re-enabled. Check Microsoft's current policy before relying on a developer environment for anything long-lived.

For real use, move the solution to a production or sandbox environment.
