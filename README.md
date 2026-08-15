# Critical Minerals & Rare Earths — Market Intelligence Dashboard

An interactive BI dashboard for the Kaggle dataset
[`sergionefedov/critical-minerals-and-rare-earths-20152026`](https://www.kaggle.com/datasets/sergionefedov/critical-minerals-and-rare-earths-20152026).

Built with **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui-style
components + Recharts**. Ships as a fully static site — no backend server required.

## Quick start

```bash
npm install
npm run dev       # http://localhost:3000
```

## Production build

```bash
npm run build      # outputs a static site to ./out
npx serve out       # preview the static build locally
```

`next.config.ts` is set to `output: "export"`, so `npm run build` produces a
plain static `out/` folder (HTML/CSS/JS + JSON data files) that can be hosted
anywhere — no Node.js server, no database, no environment variables required
at runtime.

## Deploying

**Vercel (recommended, zero config):**
1. Push this folder to a GitHub repo.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Next.js and deploys the `npm run build` output. Done.

**Self-hosting (any static host):**
Run `npm run build`, then upload the contents of `out/` to any static file
host — Nginx, Apache, GitHub Pages, Cloudflare Pages, an S3 bucket, etc.
There is nothing dynamic to configure; it's plain files.

## Refreshing the data

The dashboard reads pre-computed JSON files from `public/data/`. If you get
an updated export of the source CSVs, drop the three files into `scripts/`
(`critical_minerals_supply_master.csv`, `data_dictionary.csv`,
`minerals_reference.csv`) and re-run:

```bash
pip install pandas numpy scipy
python3 scripts/prepare_data.py
```

This regenerates every JSON file under `public/data/` — KPIs, rankings,
correlations, volatility, anomalies, statistical tests, and the insights
engine — from the raw CSVs. Nothing in the UI hardcodes numbers; everything
traces back to this script.

## Architecture notes

- **All heavy computation happens ahead of time in Python**
  (`scripts/prepare_data.py`), not in the browser — the client renders
  pre-aggregated JSON rather than crunching the full dataset. `records.json`
  (the raw row-level data) is included separately for the Data Explorer and
  for client-side filtering.
- **Global filters** (year range, mineral, country, end use, rare-earth toggle,
  search) drive the Data Explorer live; other pages primarily show full-dataset
  precomputed views, since re-running scipy-grade statistical tests in the
  browser on every filter change isn't a good trade for a dataset this size.
- **shadcn/ui components were hand-authored** rather than pulled via the
  `shadcn` CLI, because this build environment's network egress doesn't reach
  `ui.shadcn.com`. They're the same Radix-primitive-based components the CLI
  would generate; nothing about the resulting app differs from a normal
  `shadcn init` project, and the `shadcn` CLI will work normally on your own
  machine if you ever want to add more components.
- **No external fonts** are fetched at build time (system font stack instead),
  so the build has zero dependency on Google Fonts being reachable — useful
  for self-hosted/offline builds. Swap in `next/font/google` if you'd like a
  custom typeface.

## Known data characteristics (see the in-app "Data Quality & Methodology" page)

- Source figures for price, production, and reserves are labeled **"Simulated"**
  in the source data dictionary — treat them as realistic-but-synthetic, not
  live market prices.
- No mineral in this dataset actually *declined* in price from 2015–2026 (the
  smallest gain was +5%) — the dashboard reports this honestly rather than
  mislabeling the smallest gainer as a "decliner."
- All 7 rare-earth minerals show an identical +80.0% full-period price change,
  flagged in the UI as a likely data-generation artifact rather than a real
  market signal.
- Data is annual only (no daily/weekly granularity), which is why trend
  analysis uses a 3-year moving average rather than the 7/30/90-period windows
  common in daily financial data.

## Project structure

```
src/
  app/                   # one folder per route (App Router)
  components/ui/         # hand-authored shadcn-style primitives
  components/dashboard/  # sidebar, filter bar, charts, KPI cards, etc.
  lib/                   # types, formatting, client-side analytics, data context
scripts/
  prepare_data.py        # the entire data pipeline: clean -> validate -> compute -> JSON
  *.csv                  # source data (Kaggle export)
public/data/              # generated JSON consumed by the app (output of prepare_data.py)
```
