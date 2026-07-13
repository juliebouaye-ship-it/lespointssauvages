// Prepare box gallery photos for upload to Supabase Storage (bucket box-motifs).
// 1) Depose tes photos brutes dans box-photos/incoming/
// 2) npm run box-photos:prep
// 3) Uploade les fichiers generes dans box-photos/ready/ sur Supabase Storage.

import { mkdirSync, readdirSync, statSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const INCOMING_DIR = join(ROOT, "box-photos", "incoming");
const READY_DIR = join(ROOT, "box-photos", "ready");
const MAX_EDGE = 1200;
const JPEG_QUALITY = 82;

function writeAtomic(path, buffer) {
  const tmpPath = path + ".tmp";
  writeFileSync(tmpPath, buffer);
  renameSync(tmpPath, path);
}

async function main() {
  mkdirSync(INCOMING_DIR, { recursive: true });
  mkdirSync(READY_DIR, { recursive: true });

  const files = readdirSync(INCOMING_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
  if (!files.length) {
    console.log(`Aucune photo trouvee dans ${INCOMING_DIR}`);
    console.log("Depose tes photos brutes dedans puis relance : npm run box-photos:prep");
    return;
  }

  for (const file of files) {
    const inputPath = join(INCOMING_DIR, file);
    const outputPath = join(READY_DIR, file);
    const before = statSync(inputPath).size;

    const image = sharp(inputPath).rotate().resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    });

    const buffer = /\.png$/i.test(file)
      ? await image.png({ compressionLevel: 9, palette: true }).toBuffer()
      : await image.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

    writeAtomic(outputPath, buffer);
    const after = statSync(outputPath).size;
    console.log(`${file}: ${before} -> ${after} (${Math.round((100 * after) / before)}%)`);
  }

  console.log(`\nPret : uploade les fichiers de ${READY_DIR} sur Supabase Storage (bucket box-motifs).`);
}

main();
