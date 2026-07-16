import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(root, "server.js");
const generatedPath = path.join(root, ".server-culture-runtime.js");

let source = await fs.readFile(sourcePath, "utf8");

if (!source.includes('from "./culture-lane/service.js"')) {
  const importAnchor = 'import { existsSync, readFileSync, promises as fs } from "fs";';
  source = source.replace(importAnchor, `${importAnchor}\nimport { handleCultureLaneRequest } from "./culture-lane/service.js";`);
}

if (!source.includes("await handleCultureLaneRequest(req, res, url.pathname)")) {
  const routeAnchor = '  if (req.method === "GET" && url.pathname === "/api/public-config") {';
  const insertion = `  if (await handleCultureLaneRequest(req, res, url.pathname)) {\n    return;\n  }\n\n`;
  source = source.replace(routeAnchor, `${insertion}${routeAnchor}`);
}

await fs.writeFile(generatedPath, source, "utf8");
await import(`${pathToFileURL(generatedPath).href}?v=${Date.now()}`);
