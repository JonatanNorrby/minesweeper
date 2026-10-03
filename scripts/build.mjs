import { readFile, writeFile } from "node:fs/promises";

const logic = await readFile(new URL("../logic.mjs", import.meta.url), "utf8");
const ui = await readFile(new URL("../ui.js", import.meta.url), "utf8");
const bundle = "// Generated from logic.mjs and ui.js by scripts/build.mjs. Do not edit directly.\n\n"
  + logic.replace(/^export /gm, "").trimEnd() + "\n\n" + ui.trimStart();
await writeFile(new URL("../game.js", import.meta.url), bundle);
