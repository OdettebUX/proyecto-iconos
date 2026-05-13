---
name: lucide-repo-pipeline
description: Add Lucide icons to a repo and publish them through Storybook and the showcase. Use when the user wants an icon from lucide.dev to appear in Storybook and the showcase before publishing to Figma, or when adding bilingual ES/EN + keyword metadata for Figma search.
---

# Lucide → repo → Storybook → showcase (local pipeline)

## Goal

Given one or more Lucide icon names (as on `lucide.dev`), make them **land in the repo** so they are:
- available in `./svgs` (source SVGs),
- visible in Storybook,
- included in the showcase build output.

This skill intentionally does **not** publish to Figma. After this passes, use `lucide-figma-icon-library` to upsert the Component Sets into Figma.

## Inputs (required)

- **Icon names**: kebab-case names from Lucide (e.g. `alarm-clock`, `sparkles`)

## Phase A — Fetch SVGs

Fetch the icon SVG from `lucide.dev` into `./svgs/<icon>.svg`.

How to fetch depends on the repo setup — common approaches:
- A script like `npm run icons:fetch -- <icon-name...>`
- Downloading directly from `https://unpkg.com/lucide-static/icons/<icon-name>.svg`

Acceptance checks:
- SVG file exists under `./svgs/<icon>.svg`
- SVG uses a consistent stroke color (e.g. `stroke="#111827"`) — normalize if needed

## Phase B — Wire into Storybook

Add the icon(s) to whatever Storybook "icons gallery / registry" is the single source of truth in the repo. This typically means:
- Adding the icon component export (e.g. wrapping `lucide-react`'s `<IconName>` with a consistent `IconComponent`)
- Adding the kebab-case name to the `LucideName` union type and the name→component map

Acceptance checks:
- `npm run storybook` renders the new icon(s)
- No broken paths, no unexpected fills, no missing strokes

## Phase B2 — Figma search copy (ES / EN + keywords)

For each new icon, add an entry to the descriptions JSON file (e.g. `scripts/icon-figma-descriptions.json`), keyed by the SVG basename (kebab-case, e.g. `alarm-clock`). Fields:

- `es` — one short sentence in Spanish (what the icon represents).
- `en` — one short sentence in English.
- `keywordsEs` — comma-separated Spanish search terms.
- `keywordsEn` — comma-separated English search terms.

Example entry:
```json
"alarm-clock": {
  "es": "Reloj despertador; hora, cita, recordatorio o rutina matinal.",
  "en": "Alarm clock; time, appointment, reminder, or morning routine.",
  "keywordsEs": "alarma, despertador, reloj, hora, cita, recordatorio, mañana, agenda",
  "keywordsEn": "alarm, clock, wake, time, reminder, schedule, morning, appointment"
}
```

This file is read when generating the Figma `use_figma` payload and baked into `set.description` + `comp.description`. If you skip this step, a generic fallback is written, but **search quality is worse** — always add real copy for new icons.

Acceptance checks:
- The descriptions JSON contains a key for every new `<icon>.svg` in `./svgs/`

## Phase C — Publish in the showcase

Run the showcase build (e.g. `npm run showcase:build`).

Acceptance checks:
- Build succeeds
- The new icon(s) appear in the showcase output

## Hand-off to Figma publishing

Once Phase A, B, B2, and C are green, proceed with `lucide-figma-icon-library`:
- Generate the `use_figma` payload (embed SVG strings; no network calls available in Figma)
- Call `use_figma` targeting the destination Figma `fileKey`

## Key reminders (enforced by the Figma skill)

- Stroke per size: `16→1`, `24→1.5`, `32→2`, `40→3`, `48→3` (Figma `strokeWeight` allows `1.5`).
- Each variant ends as a single `Vector` layer — `figma.flatten` runs **always**, never conditionally.
- Stroke is set **after** `rescale()` (otherwise `rescale` multiplies the stroke and you get values like `2.45`).
- Variant child order in every Component Set is **ascending by Size** (`Size=16` → `Size=48`); reorder via `set.insertChild(i, comp)`.
- `./svgs/` is the **single source of truth**. Any `lucide/*` set in Figma without a matching `./svgs/<name>.svg` is drift and gets removed during sync.
- **Descriptions**: maintain the descriptions JSON when adding icons so Figma search stays useful; the script always writes a description even if the entry is missing (generic fallback).

## Suggested prompt template (repeatable)

> "Add `<icon-name>` from Lucide to the repo so it appears in Storybook and the showcase. Also add the ES/EN + keywords entry in the descriptions JSON. Then we'll publish it to Figma with the other flow."
