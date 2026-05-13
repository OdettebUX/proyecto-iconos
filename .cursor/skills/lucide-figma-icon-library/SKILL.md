---
name: lucide-figma-icon-library
description: Generate and maintain a Lucide icon library in Figma via the Figma MCP. Use when the user asks to create/update Lucide icons in Figma, create Component Sets with size variants, enforce Auto Layout (no absolute positioning), keep stroke/inset rules consistent between Figma and code, or add bilingual ES/EN descriptions with keywords for Figma search.
---

# Lucide → Figma icon library (Component Sets)

## Goal

Make the Lucide icon workflow **repeatable end-to-end**:
- **Pick an icon from** `lucide.dev` (by name)
- **Add it to the repo** (SVGs + Storybook + showcase) using the local pipeline skill
- **Publish it to Figma** as `lucide/<icon-name>` Component Sets with size variants and a single `Vector` layer
- **Publish searchable descriptions** (Spanish + English + keywords) on every Component Set and every size variant

In Figma, create or update an icon library where:
- Each icon is a **Component Set** named `lucide/<icon-name>`.
- Variants are named **`Size=<n>`** (default sizes: `16,24,32,40,48`).
- The **Component Set uses Auto Layout** (horizontal row), so nothing depends on absolute positioning.
- **Variant components are ordered left → right by ascending `Size`** (`16, 24, 32, 40, 48`). Figma does not infer this from names; call `set.insertChild(i, comp)` after updates so every set matches (older sets often showed `48…16`).
- Stroke and safe-area inset are applied consistently.
- No duplicates: if a set already exists, update it in-place.

## When to use

Use this skill when the user says things like:
- "add a new icon and also have it in Figma"
- "full flow: lucide → storybook → showcase → figma"
- "generate Figma components from lucide"
- "component set with size variants"
- "no absolute positioning / use auto layout"
- "component description / searchable in Figma / keywords"

## Defaults

- **Page**: `Lucide`
- **Prefix**: `lucide/`
- **Sizes**: `[16, 24, 32, 40, 48]`
- **Color**: `#111827`
- **Component Set Auto Layout**:
  - `layoutMode: "HORIZONTAL"`
  - `primaryAxisSizingMode: "AUTO"`
  - `counterAxisSizingMode: "AUTO"`
  - `itemSpacing: 12`
  - `padding: 12`
  - `fills: []`

## Descriptions (Figma searchability ES / EN)

Every Lucide icon must be **findable later** via Figma search (Assets panel, quick search, libraries).

- **Component Set** (`lucide/<name>`): set `set.description` to a short **Spanish** paragraph, a short **English** paragraph, and **keyword lines** in both languages (comma-separated). Include the technical kebab-case name and `lucide` / `lucide.dev` so text search matches.
- **Each variant** (`Size=16` … `Size=48`): set `comp.description` to a **one-line** bilingual keyword string plus `· <n>px · lucide` so size-specific searches still hit the right variant.

Maintain a JSON file keyed by SVG basename (e.g. `alarm-clock`). Fields: `es`, `en`, `keywordsEs`, `keywordsEn`.
If an icon is missing from that file, write a **generic** ES/EN block + keywords from the icon name (always publish something searchable).

## Rendering rules (match code + Figma)

### Stroke per size (explicit table)

Strokes follow this fixed table (px):

| Size | Stroke |
|------|--------|
| 16   | 1      |
| 24   | 1.5    |
| 32   | 2      |
| 40   | 3      |
| 48   | 3      |

Notes:
- Figma `strokeWeight` accepts non-integer values, so `1.5` at size 24 is intentional.
- For non-standard sizes, fall back to linear interpolation between 1 and 3, rounded to nearest 0.5, clamped to `[1, 3]`.
- **Stroke is the LAST mutation per variant.** Apply it AFTER `figma.flatten(...)` AND AFTER `node.rescale(...)`. Order: `import → ungroup → flatten → center+scale → setStrokeWeight`.

### Safe-area inset (per size)

```
inset = roundToHalf((2 * size) / 24)   // 24px → 2px
```

### Fit + center

For each variant, the icon node must be scaled and centered inside:
- `targetBox = size - 2 * inset`

Use `absoluteRenderBounds` to compute scale-to-fit and then translate to center.

> **Important:** when a component is still floating (not yet added to the canvas tree), `absoluteRenderBounds` is unreliable. Because of this, **always enable Auto Layout CENTER/CENTER on the variant component** after setting the stroke. See `enableCenteringLayout` below.

### Variant component: Auto Layout CENTER/CENTER (mandatory)

After all per-variant mutations (scale → stroke → constraints), call `enableCenteringLayout` on every variant COMPONENT:

```js
function enableCenteringLayout(comp, size) {
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";   // keep width = size
  comp.counterAxisSizingMode = "FIXED";   // keep height = size
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.paddingLeft = 0;
  comp.paddingRight = 0;
  comp.paddingTop = 0;
  comp.paddingBottom = 0;
  comp.itemSpacing = 0;
  comp.resize(size, size);  // re-lock after layout mode change
  // Keep the Vector at its scaled size (not stretched by layout).
  const vec = comp.findOne((n) => n.name === "Vector");
  if (vec && "layoutSizingHorizontal" in vec) {
    vec.layoutSizingHorizontal = "FIXED";
    vec.layoutSizingVertical = "FIXED";
  }
}
```

This is the **final step** in the per-variant pipeline. It:
- Activates Figma's native centering so the Vector is always centered horizontally and vertically, even when `absoluteRenderBounds` was inaccurate during creation.
- Locks the component to its exact `size × size` dimensions with `FIXED` sizing modes.
- Prevents the Vector from stretching by keeping it `FIXED` within the layout.

### Vector constraints (Scale on both axes)

After centering and applying the stroke (but before `enableCenteringLayout`), set the `Vector` constraints to **`SCALE`** on both axes:

```js
vec.constraints = { horizontal: "SCALE", vertical: "SCALE" };
```

Both `SCALE` constraints and `enableCenteringLayout` are required and complementary: constraints handle proportional scaling on manual resize; auto layout handles native centering on creation.

### Single vector layer (always flatten)

After `figma.createNodeFromSvg`:
1. **Ungroup** every wrapper `GROUP` / `FRAME` until only drawable siblings remain at the SVG root.
2. **Always** call `figma.flatten(siblings, parent, 0)` — even when there is only a single `VECTOR` — so every variant ends up with **exactly one** `VectorNode` named **`Vector`**. Never short-circuit.
3. **Center + scale** the flattened vector using `node.rescale(scale)` then translate to center.
4. **Then, and only then, set `strokeWeight`** from the per-size table.

## Repeatable workflow (end-to-end)

### Phase 1 — Add icon from Lucide into the repo

1. Fetch the SVG into `./svgs/<icon>.svg` (from `lucide.dev`)
2. Add the icon to the Storybook source of truth and verify it renders correctly
3. Add bilingual description entry: `es`, `en`, `keywordsEs`, `keywordsEn`
4. Verify showcase build passes

### Phase 2 — Publish/update in Figma (Component Set upsert)

Prerequisites:
- Destination **Figma `fileKey`**

Steps:
1. Embed the SVG strings in the `use_figma` script (no `fetch` / remote URLs available inside Figma plugin sandbox)
2. Call `use_figma` with JavaScript that:
   - `ensurePage("Lucide")` + `await figma.setCurrentPageAsync(page)`
   - Find/create a container frame named `lucide`
   - For each icon, create variant components for each size:
     - `figma.createComponent()` sized to `size × size`, `fills=[]`
     - `figma.createNodeFromSvg(svg)` → ungroup wrappers → **always** `figma.flatten(...)` → single `VectorNode` named `Vector`
     - Scale + center the `Vector` into `targetBox(size, inset(size))`
     - Set stroke weight from the per-size table
     - Set `Vector.constraints = { horizontal: "SCALE", vertical: "SCALE" }`
     - **Call `enableCenteringLayout(comp, size)`** — this is the last step
   - `figma.combineAsVariants(variants, container)` → rename to `lucide/<icon>`
   - Set Component Set to Auto Layout
   - **Reorder** children so canvas order is always `Size=16 … Size=48`
   - Set `set.description` and `comp.description` from the descriptions JSON
3. Always `return` created/mutated node IDs and a summary

## Updating existing sets (no duplicates)

If `lucide/<icon>` already exists:
- Ensure it is auto layout.
- For each expected `Size=<n>`: clear children, re-import SVG, ungroup, flatten, re-apply stroke, refit/center.
- Reorder by ascending `Size`.
- Refresh `set.description` and each `comp.description`.

## Sync rule: `./svgs/` is the single source of truth

Anything under `lucide/*` in Figma without a matching `./svgs/<name>.svg` is drift and must be removed.

When syncing:
1. Build `SOURCE = Set of filenames in ./svgs (without .svg, prefixed "lucide/")`.
2. Traverse **every page** (use `await figma.setCurrentPageAsync(page)` per page).
3. Delete each `COMPONENT_SET` whose name starts with `lucide/` but is not in `SOURCE`.

## Common pitfalls (do not regress)

- **Stroke set before `rescale()`** → fractional strokes (e.g. `2.45`). Always: `flatten → center+scale → setStrokeWeight`.
- **`figma.flatten` skipped** for single-path icons → nested groups break stroke uniformity. Always flatten unconditionally.
- **Variant order not normalized** → some sets render `48 → 16`. Always call `set.insertChild(i, comp)` in ascending size order.
- **Cross-page duplicates not pruned** → `lucide/<x>` may exist on a non-current page. Iterate all pages when syncing.
- **Vector constraints left as default** → icon stays glued to top-left on resize. Always set `SCALE / SCALE`.
- **Vector not centered (floating-node bug)** → `absoluteRenderBounds` is unreliable on floating components. Always call `enableCenteringLayout(comp, size)` as the very last step.

## Suggested prompt template

> "Add icon `<icon-name>` from Lucide. I want: 1) visible in Storybook, 2) published in the showcase, 3) upserted in Figma as `lucide/<icon-name>` with variants `Size=16,24,32,40,48`, a single `Vector` layer, and ES/EN descriptions + keywords on the Component Set and each variant. My fileKey is `<fileKey>`."
