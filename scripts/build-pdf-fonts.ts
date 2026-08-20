/**
 * Vendor the IBM Plex TTFs used by server-side PDF rendering (react-pdf embeds TTF/OTF only, not
 * woff/woff2). Decompresses the @fontsource woff2 files into `assets/fonts/ibm-plex/*.ttf`.
 *
 * Run after bumping @fontsource/ibm-plex-*: `pnpm pdf-fonts:build`
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { decompress } from "wawoff2";

const OUT = path.join(process.cwd(), "assets/fonts/ibm-plex");

const sansWeights = [300, 400, 500, 600, 700];
const monoWeights = [400, 500];

const targets = [
  ...sansWeights.map((w) => ({
    src: `node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-${w}-normal.woff2`,
    out: `ibm-plex-sans-${w}.ttf`,
  })),
  ...monoWeights.map((w) => ({
    src: `node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${w}-normal.woff2`,
    out: `ibm-plex-mono-${w}.ttf`,
  })),
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  for (const t of targets) {
    const ttf = await decompress(readFileSync(path.join(process.cwd(), t.src)));
    writeFileSync(path.join(OUT, t.out), ttf);
    console.log(`wrote ${t.out} (${ttf.length} bytes)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
