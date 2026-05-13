/**
 * Genera fragmentos de código JS para use_figma (límite ~50k).
 * Uso: node scripts/generate-figma-buildings-chunks.mjs [chunkIndex]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "node_modules/lucide-static/icons");

const BUILDINGS = [
  "anvil",
  "brick-wall",
  "building",
  "building-2",
  "castle",
  "church",
  "dam",
  "factory",
  "fence",
  "graduation-cap",
  "hospital",
  "hotel",
  "house",
  "house-heart",
  "house-plug",
  "house-plus",
  "house-wifi",
  "landmark",
  "school",
  "store",
  "theater",
  "university",
  "utility-pole",
  "warehouse",
];

const HEADER = `
function roundToHalf(x) { return Math.round(x * 2) / 2; }
function insetFor(size) { return roundToHalf((2 * size) / 24); }
const STROKE = { 16: 1, 24: 1.5, 32: 2, 40: 3, 48: 3 };
const SIZES = [16, 24, 32, 40, 48];

function enableCenteringLayout(comp, size) {
  comp.layoutMode = "HORIZONTAL";
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisAlignItems = "CENTER";
  comp.counterAxisAlignItems = "CENTER";
  comp.paddingLeft = 0;
  comp.paddingRight = 0;
  comp.paddingTop = 0;
  comp.paddingBottom = 0;
  comp.itemSpacing = 0;
  comp.resize(size, size);
  const vec = comp.findOne((n) => n.name === "Vector");
  if (vec && "layoutSizingHorizontal" in vec) {
    vec.layoutSizingHorizontal = "FIXED";
    vec.layoutSizingVertical = "FIXED";
  }
}

function normalizeSvg(s) {
  return s
    .replace(/stroke="currentColor"/g, 'stroke="#111827"')
    .replace(/stroke='currentColor'/g, "stroke='#111827'")
    .replace(/stroke-width="[^"]+"/g, 'stroke-width="2"')
    .replace(/stroke-linecap="[^"]*"/g, "")
    .replace(/stroke-linejoin="[^"]*"/g, "");
}

function importSvgToSingleVector(comp, svgString) {
  const frame = figma.createNodeFromSvg(svgString);
  comp.appendChild(frame);
  while (frame.children.length === 1 && (frame.children[0].type === "GROUP" || frame.children[0].type === "FRAME")) {
    const inner = frame.children[0];
    const kids = [...inner.children];
    for (const k of kids) frame.appendChild(k);
    inner.remove();
  }
  const kids = [...frame.children];
  if (kids.length === 0) {
    frame.remove();
    throw new Error("SVG sin hijos tras aplanar grupos");
  }
  const vec = figma.flatten(kids, frame, 0);
  vec.name = "Vector";
  comp.appendChild(vec);
  frame.remove();
  return vec;
}

async function upsertLucideIcon(kebabName, svgRaw) {
  const svg = normalizeSvg(svgRaw);
  let page = figma.root.children.find((p) => p.name === "Lucide");
  if (!page) {
    page = figma.createPage();
    page.name = "Lucide";
  }
  await figma.setCurrentPageAsync(page);

  let container = page.children.find((c) => c.name === "lucide" && c.type === "FRAME");
  if (!container) {
    container = figma.createFrame();
    container.name = "lucide";
    container.layoutMode = "VERTICAL";
    container.primaryAxisSizingMode = "AUTO";
    container.counterAxisSizingMode = "AUTO";
    container.itemSpacing = 32;
    container.paddingLeft = 48;
    container.paddingRight = 48;
    container.paddingTop = 48;
    container.paddingBottom = 48;
    container.fills = [];
    let maxR = 0;
    for (const ch of page.children) {
      if (ch === container) continue;
      const b = "absoluteBoundingBox" in ch ? ch.absoluteBoundingBox : null;
      if (b) maxR = Math.max(maxR, b.x + b.width);
    }
    container.x = maxR + 80;
    container.y = 80;
    page.appendChild(container);
  }

  const setName = "lucide/" + kebabName;
  const existing = page.findAll((n) => n.type === "COMPONENT_SET" && n.name === setName)[0];
  if (existing) existing.remove();

  const variants = [];
  for (const size of SIZES) {
    const inset = insetFor(size);
    const targetBox = size - 2 * inset;
    const comp = figma.createComponent();
    comp.name = "Size=" + size;
    comp.resizeWithoutConstraints(size, size);
    comp.fills = [];

    const vec = importSvgToSingleVector(comp, svg);
    const rb = vec.absoluteRenderBounds;
    if (!rb) throw new Error("sin absoluteRenderBounds: " + kebabName);
    const scale = Math.min(targetBox / rb.width, targetBox / rb.height);
    vec.rescale(scale);
    const rb2 = vec.absoluteRenderBounds;
    if (!rb2) throw new Error("sin bounds tras rescale: " + kebabName);
    vec.x = inset + (targetBox - rb2.width) / 2 - (rb2.x - vec.x);
    vec.y = inset + (targetBox - rb2.height) / 2 - (rb2.y - vec.y);

    vec.strokes = [{ type: "SOLID", color: { r: 0.067, g: 0.094, b: 0.153 } }];
    vec.strokeWeight = STROKE[size];
    vec.strokeAlign = "CENTER";
    vec.constraints = { horizontal: "SCALE", vertical: "SCALE" };

    enableCenteringLayout(comp, size);
    variants.push(comp);
  }

  const combined = figma.combineAsVariants(variants, container);
  combined.name = setName;
  combined.clipsContent = false;
  combined.layoutMode = "HORIZONTAL";
  combined.primaryAxisSizingMode = "AUTO";
  combined.counterAxisSizingMode = "AUTO";
  combined.itemSpacing = 12;
  combined.paddingLeft = 12;
  combined.paddingRight = 12;
  combined.paddingTop = 12;
  combined.paddingBottom = 12;
  combined.fills = [];

  const ordered = [...combined.children].sort((a, b) => {
    const sa = parseInt(String(a.name).replace("Size=", ""), 10);
    const sb = parseInt(String(b.name).replace("Size=", ""), 10);
    return sa - sb;
  });
  for (let i = 0; i < ordered.length; i++) combined.insertChild(i, ordered[i]);

  combined.description =
    "ES: Icono Lucide " +
    kebabName +
    " (categoria buildings). EN: Lucide " +
    kebabName +
    " (buildings).\\nkeywords ES: edificio, lucide, lucide.dev, " +
    kebabName +
    "\\nkeywords EN: building, lucide, lucide.dev, " +
    kebabName;
  for (const ch of combined.children) {
    if (ch.type === "COMPONENT")
      ch.description =
        "lucide, " + kebabName + ", buildings, " + String(ch.name).replace("Size=", "") + "px, ES/EN";
  }
  return combined.id;
}
`.trim();

function escapeTemplate(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const CHUNK_SIZE = 6;
const chunks = chunk(BUILDINGS, CHUNK_SIZE);

const idx = process.argv[2] != null ? parseInt(process.argv[2], 10) : null;
const toGen =
  idx != null && !Number.isNaN(idx) ? [{ index: idx, names: chunks[idx] }] : chunks.map((names, index) => ({ index: index, names }));

for (const { index, names } of toGen) {
  const parts = [HEADER, "const createdIds = [];"];
  for (const name of names) {
    const svgPath = path.join(iconsDir, `${name}.svg`);
    if (!fs.existsSync(svgPath)) throw new Error("Missing " + svgPath);
    const raw = fs.readFileSync(svgPath, "utf8");
    parts.push(`createdIds.push(await upsertLucideIcon(${JSON.stringify(name)}, \`${escapeTemplate(raw)}\`));`);
  }
  parts.push(`return { ok: true, chunk: ${index}, icons: ${JSON.stringify(names)}, createdNodeIds: createdIds };`);
  const code = parts.join("\n");
  fs.writeFileSync(path.join(root, `.figma-chunk-${index}.js`), code, "utf8");
  console.log("chunk", index, "chars", code.length, "icons", names.join(","));
}
