// Detoure une photo en ovale, fondue directement dans une couleur de fond
// (au lieu d'une transparence : evite l'effet "halo sale" quand un fond sombre
// s'estompe en semi-transparence sur une page claire).
// Usage : node scripts/oval-cutout.mjs <source.jpg> <sortie.jpg> [bgColor] [cx%] [cy%] [rx%] [ry%] [feather%]
// Defauts calibres pour un cerceau a broder centre dans le cadre, bg = --bg du site.

import sharp from "sharp";
import { writeFileSync } from "node:fs";

const [, , src, out, bgArg, cxArg, cyArg, rxArg, ryArg, featherArg] = process.argv;

if (!src || !out) {
  console.log("Usage: node scripts/oval-cutout.mjs <source.jpg> <sortie.jpg> [bgColor] [cx%] [cy%] [rx%] [ry%] [feather%]");
  process.exit(1);
}

const bgColor = bgArg || "#f9f5f2";
const cxPct = Number(cxArg ?? 50);
const cyPct = Number(cyArg ?? 51.5);
const rxPct = Number(rxArg ?? 47.5);
const ryPct = Number(ryArg ?? 50.5);
const featherPct = Number(featherArg ?? 3.8);

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

// Fusionne directement sur la couleur de fond reelle -- a alpha=0 le pixel EST
// deja la couleur de la page, donc plus aucune zone "trouble" en transparence.
const flattened = await sharp(masked)
  .flatten({ background: bgColor })
  .toBuffer();

const finalBuf = await sharp(flattened)
  .resize({ height: 1000, withoutEnlargement: true })
  .jpeg({ quality: 88, mozjpeg: true })
  .toBuffer();

writeFileSync(out, finalBuf);
const meta = await sharp(finalBuf).metadata();
console.log(`${out}: ${finalBuf.length} bytes, ${meta.width}x${meta.height}`);
