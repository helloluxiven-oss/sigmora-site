# sigmora-site

The public marketing site for SIGMORA Agentic OS. Static HTML and CSS, no build step,
no backend, no analytics, no cookies.

```
npm run check     # the claim guard — run this before every deploy
npm run serve     # http://localhost:4321
```

## Why this is a separate repository

This repository is public and holds only the marketing site. It is kept separate from
the product source, which is not published, and the two are never merged into one
deployment.

Nothing is shared between them except the assets listed below, copied deliberately and
checked before copying.

## What was copied in, and what was verified

| Asset | Source | Checked |
|---|---|---|
| `assets/icon-192/256/512.png` | Business Guide → SIGMORA Agentic AI | Opened and viewed: an abstract logo mark. No screenshot, no data. |
| Palette and type in `assets/style.css` | the internal `sigmora-use-cases.html` | Appearance only. No figure travelled with it. |
| Connector list in `index.html` | `apps/web/app/lib/connectorCatalog.ts` @ `e9d90df` | Nine entries, all MCP-backed per the catalogue's own header. |

The capabilities one-pager is **not** linked yet — its text carries a "Usage & Credits"
line, TIER 1/2/3 headings that read as a price list, and an ENTERPRISE column that
overstates a single-user product. Revisit before linking it.

The whole source folder was scanned against the same digest guard below before anything
was copied: no hits.

## The figure rule

The internal use-cases page this site is built from carried percentages, per-run
durations and outcome counts. They were illustrative in an internal page and would be
unsourced advertising claims on a public one. All of them were stripped.

The rule now, enforced by `npm run check`:

- **No digits in any illustrative mock-up.** Not "reduced to a few" — zero. Half-measures
  need a judgement call per number; a flat zero is mechanically checkable.
- **No duration, rate or percentage in card copy.**
- **No pricing, trial, licensing or credits vocabulary anywhere.**
- **No name from the internal denylist anywhere**, as cheap insurance against a future paste.

`scripts/check-claims.mjs` asserts all four, plus two things that keep those assertions
honest: that its extractor can actually see the card data (a blind reader reports a clean
page), and that its detectors bite against a known-bad fixture (a regex that matches
nothing passes everything). Both halves have been verified by injecting real violations
into the real pages and watching each section go red.

Verdict comes from the exit code. The script sets `process.exitCode` rather than calling
`process.exit()`, so the printed verdict and the exit code cannot disagree.

## Claims the site deliberately does not make

Taken from the launch brief's own Accuracy notes, and rendered on the page rather than
left out — an absent limitation reads as a limitation that does not exist.

- Retrieval is keyword and frontmatter based, **not** semantic.
- Scheduling runs while the app is tray-resident, **not** as a headless service.
- Single-user and local; **no** multi-tenant layer.
- Connectors are MCP servers the user registers; **no** first-party OAuth clients.
- In active development; **no** public download.

Two further claims from the source material were cut as unsupported by the code:

- **"places the calls"** (the lead-list use case). The only voice in the product is
  browser `speechSynthesis` — reading answers aloud. There is no outbound calling.
- **"connected to your real Gmail, Sheets and Notion"** (social copy). True only via MCP
  servers the user registers themselves.

## Deploying

Vercel serves this directory as-is; there is no framework preset and no build command.
`vercel.json` sets `cleanUrls` so `/use-cases` resolves, plus security headers and a CSP
naming Google Fonts as the only third party.

Run `npm run check` first. It is the only thing standing between a copy edit and an
unsourced advertising claim.
