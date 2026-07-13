// Detoure une photo en ovale, bord doux (anti-alias court) vers la transparence.
// PNG avec alpha reel (pas de fond fige) : le CSS `filter: drop-shadow` sur le
// site suit alors la vraie silhouette ovale plutot qu'un rectangle invisible.
// Usage : node scripts/oval-cutout.mjs <source.jpg> <sortie.png> [cx%] [cy%] [rx%] [ry%] [feather%]
// Defauts calibres pour un cerceau a broder centre dans le cadre, resserres
// pour rester dans les zones claires (tissu/cerceau) et eviter le fond sombre.

import sharp from "sharp";
import { writeFileSync } from "node:fs";

const [, , src, out, cxArg, cyArg, rxArg, ryArg, featherArg] = process.argv;

if (!src || !out) {
  console.log("Usage: node scripts/oval-cutout.mjs <source.jpg> <sortie.png> [cx%] [cy%] [rx%] [ry%] [feather%]");
  process.exit(1);
}

const cxPct = Number(cxArg ?? 50);
const cyPct = Number(cyArg ?? 50);
const rxPct = Number(rxArg ?? 39);
const ryPct = Number(ryArg ?? 43);
const featherPct = Number(featherArg ?? 1.2);

const img = sharp(src);
const { width, height } = await img.metadata();

const cx = (cxPct / 100) * width;
const cy = (cyPct / 100) * height;
const rx = (rxPct / 100) * width;
const ry = (ryPct / 100) * height;
const feather = Math.round((featherPct / 100) * Math.min(width, height));

const svgMask = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" /></svg>`;
const maskBuffer = await sharp(Buffer.from(svgMask)).blur(feather).toColourspace("b-w").toBuffer();

const masked = await img.ensureAlpha().composite([{ input: maskBuffer, blend: "dest-in" }]).png().toBuffer();

const finalBuf = await sharp(masked)
  .resize({ height: 1800, withoutEnlargement: true })
  .trim()
  .png({ palette: true, quality: 90, compressionLevel: 9 })
  .toBuffer();

writeFileSync(out, finalBuf);
const meta = await sharp(finalBuf).metadata();
console.log(`${out}: ${finalBuf.length} bytes, ${meta.width}x${meta.height}`);
