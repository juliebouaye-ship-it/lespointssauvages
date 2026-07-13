import { readdirSync, statSync, writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const IMAGES_DIR = fileURLToPath(new URL("../images/", import.meta.url));
const JPEG_MAX_EDGE = 1000;
const JPEG_QUALITY = 78;
const PNG_MAX_WIDTH = 384;

function writeInPlace(path, buffer) {
  const tmpPath = path + ".tmp";
  writeFileSync(tmpPath, buffer);
  renameSync(tmpPath, path);
}

async function optimizeJpeg(path) {
  const buffer = await sharp(path)
    .resize({ width: JPEG_MAX_EDGE, height: JPEG_MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  writeInPlace(path, buffer);
}

async function optimizePng(path) {
  const buffer = await sharp(path)
    .resize({ width: PNG_MAX_WIDTH, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
  writeInPlace(path, buffer);
}

async function main() {
  const files = readdirSync(IMAGES_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
  for (const file of files) {
    const path = join(IMAGES_DIR, file);
    const before = statSync(path).size;
    if (/\.png$/i.test(file)) {
      await optimizePng(path);
    } else {
      await optimizeJpeg(path);
    }
    const after = statSync(path).size;
    console.log(`${file}: ${before} -> ${after} (${Math.round((100 * after) / before)}%)`);
  }
}

main();
