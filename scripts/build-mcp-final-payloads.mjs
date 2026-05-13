/**
 * Construye payloads MCP (use_figma) con el chunk JS embebido en base64
 * para evitar límites de escape en XML.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const WRAPPER_PREFIX = "const B64 = ";
const WRAPPER_SUFFIX = `;
const src = decodeURIComponent(escape(atob(B64)));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
return await new AsyncFunction("figma", src)(figma);
`;

const fileKey = "NMS8TOZEt2GBnRv1lLaLxf";

const n = fs.readdirSync(root).filter((f) => /^\.figma-chunk-\d+\.js$/.test(f)).length;

for (let i = 0; i < n; i++) {
  const b64 = fs.readFileSync(path.join(root, `.figma-chunk-${i}.b64`), "utf8").trim();
  const code = WRAPPER_PREFIX + JSON.stringify(b64) + WRAPPER_SUFFIX;
  const payload = {
    fileKey,
    code,
    description: `Lucide buildings chunk ${i} (base64)`,
    skillNames: "figma-use",
  };
  fs.writeFileSync(path.join(root, `.mcp-final-${i}.json`), JSON.stringify(payload));
  console.log("chunk", i, "totalChars", code.length);
}
