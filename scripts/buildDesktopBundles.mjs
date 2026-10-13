// Empacota o que o tsc não consegue entregar pronto ao Electron: o preload precisa ser um
// único CommonJS (sandbox não carrega arquivos locais) e a janela, um único script de navegador.
import { build } from "esbuild";
import { cpSync } from "node:fs";

const rendererSource = "src/desktop/renderer";
const desktopOutput = "dist/desktop";

await build({
  entryPoints: ["src/desktop/preload/preload.ts"],
  outfile: `${desktopOutput}/preload.cjs`,
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron"],
  target: "node22",
});

await build({
  entryPoints: [`${rendererSource}/app.ts`],
  outfile: `${desktopOutput}/renderer/app.js`,
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "chrome130",
});

for (const asset of ["index.html", "styles.css"]) {
  cpSync(`${rendererSource}/${asset}`, `${desktopOutput}/renderer/${asset}`);
}
