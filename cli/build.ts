import { fileURLToPath } from "node:url";
import { build } from "esbuild";

await build({
  entryPoints: [fileURLToPath(new URL("index.ts", import.meta.url))],
  outfile: fileURLToPath(new URL("dist/index.mjs", import.meta.url)),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  minify: true,
});
