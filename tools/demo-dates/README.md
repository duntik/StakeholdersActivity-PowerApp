# Demo date shifter

The demo activities in `seed/engagement-activities-demo.csv` have fixed dates, so
after a few months they fall outside the timeline's three-month window. This script
moves them forward (or back) so the earliest Start Date is the first day of a target
month. Every activity keeps its position relative to the others and its duration.

Requires Node.js 18 or later. No dependencies, no `npm install`.

```bash
cd tools/demo-dates
node shift.mjs ../../seed/engagement-activities-demo.csv              # current month
node shift.mjs ../../seed/engagement-activities-demo.csv --to 2027-01 # a given month
```

- Rewrites the `Start Date` and `End Date` columns (`dd/mm/yyyy`) **in place**;
  all other columns and the file's line endings are left as they are.
- Prints the number of rows shifted, the shift in days and the new date range.
- Run it before importing the demo data into Dataverse.
