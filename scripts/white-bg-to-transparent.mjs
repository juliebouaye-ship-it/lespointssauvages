// Rend transparent un fond clair uni (photo produit) en fondu progressif,
// de sorte que l'ombre naturelle devienne un degrade doux vers la transparence
// plutot qu'une coupe nette. Fonctionne par distance de couleur au fond
// (echantillonne dans les coins) : les pixels proches du fond deviennent
// transparents, l'objet reste opaque, l'ombre (plus sombre que le fond mais
// pas tres differente) prend une transparence intermediaire -- d'ou le degrade.
//
// Usage : node scripts/white-bg-to-transparent.mjs <source.jpg> <sortie.png> [low] [high]
// low/high = seuils de distance de couleur (0-255). En dessous de low : transparent.
// Au dessus de high : opaque. Entre les deux : degrade.

import sharp from "sharp";
import { writeFileSync } from "node:fs";

const [, , src, out, lowArg, highArg] = process.argv;

if (!src || !out) {
  console.log("Usage: node scripts/white-bg-to-transparent.mjs <source.jpg> <sortie.png> [low] [high]");
  process.exit(1);
}

const low = Number(lowArg ?? 12);
const high = Number(highArg ?? 60);

const image = sharp(src).ensureAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

function pixelAt(x, y) {
  const idx = (y * width + x) * channels;
  return [data[idx], data[idx + 1], data[idx + 2]];
}

// Echantillonne le fond sur des blocs dans chaque coin (evite un pixel isole/bruit).
const sampleSize = 12;
const corners = [
  [sampleSize, sampleSize],
  [width - sampleSize - 1, sampleSize],
  [sampleSize, height - sampleSize - 1],
  [width - sampleSize - 1, height - sampleSize - 1],
];
let sr = 0, sg = 0, sb = 0, n = 0;
for (const [cx, cy] of corners) {
  for (let dx = -sampleSize; dx <= sampleSize; dx += 4) {
    for (let dy = -sampleSize; dy <= sampleSize; dy += 4) {
      const [r, g, b] = pixelAt(cx + dx, cy + dy);
      sr += r; sg += g; sb += b; n += 1;
    }
  }
}
const bg = [sr / n, sg / n, sb / n];
console.log("Couleur de fond detectee:", bg.map((v) => Math.round(v)));

for (let i = 0; i < data.length; i += channels) {
  const dr = data[i] - bg[0];
  const dg = data[i + 1] - bg[1];
  const db = data[i + 2] - bg[2];
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  let alpha = (dist - low) / (high - low);
  if (alpha < 0) alpha = 0;
  if (alpha > 1) alpha = 1;
  data[i + 3] = Math.round(alpha * 255);
}

const finalBuf = await sharp(data, { raw: { width, height, channels } })
  .trim()
  .png({ palette: true, quality: 90, compressionLevel: 9 })
  .toBuffer();

writeFileSync(out, finalBuf);
const meta = await sharp(finalBuf).metadata();
console.log(`${out}: ${finalBuf.length} bytes, ${meta.width}x${meta.height}`);
