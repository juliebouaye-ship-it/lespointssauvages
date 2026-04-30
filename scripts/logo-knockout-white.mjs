/**
 * Rend transparent le fond blanc "carré" autour du logo : flood-fill depuis les bords
 * sur les pixels très clairs, sans toucher au blanc enfermé dans le cerceau.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const target = path.join(root, "logolps.png");

const buf = fs.readFileSync(target);
const png = PNG.sync.read(buf);
const { width: w, height: h, data } = png;
const stride = 4;

/** Pixels considérés comme "fond" (coins du fichier) — pas les crèmes intérieurs faibles. */
function isOuterWhite(i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return r >= 247 && g >= 247 && b >= 247;
}

const visited = new Uint8Array(w * h);
const queue = [];

function tryEnqueue(x, y) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const idx = y * w + x;
  if (visited[idx]) return;
  const i = idx * stride;
  if (!isOuterWhite(i)) return;
  visited[idx] = 1;
  queue.push(x, y);
}

for (let x = 0; x < w; x++) {
  tryEnqueue(x, 0);
  tryEnqueue(x, h - 1);
}
for (let y = 0; y < h; y++) {
  tryEnqueue(0, y);
  tryEnqueue(w - 1, y);
}

let head = 0;
const neigh = [1, 0, -1, 0, 0, 1, 0, -1];
while (head < queue.length) {
  const x = queue[head++];
  const y = queue[head++];
  for (let k = 0; k < 8; k += 2) {
    tryEnqueue(x + neigh[k], y + neigh[k + 1]);
  }
}

for (let idx = 0; idx < w * h; idx++) {
  if (visited[idx]) {
    const i = idx * stride;
    data[i + 3] = 0;
  }
}

const out = PNG.sync.write(png);
fs.writeFileSync(target, out);
console.log("OK:", target, `${w}x${h}`);
