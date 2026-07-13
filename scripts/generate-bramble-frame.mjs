// Genere un cadre decoratif "ronces" (SVG) qui encercle une photo ovale.
// Vigne organique (spline Catmull-Rom fermee) + epines + feuilles + baies,
// dans les couleurs de la charte (rose/vert/or/muted). Purement genere,
// pas de dependance externe.
// Usage : node scripts/generate-bramble-frame.mjs > images/bramble-frame.svg

const cx = 130;
const cy = 200;
const rx = 108;
const ry = 168;

function wobble(theta) {
  return 8 * Math.sin(3 * theta) + 4.5 * Math.sin(7 * theta + 1.3) + 2.5 * Math.sin(11 * theta + 0.4);
}

function pointAt(theta) {
  const w = wobble(theta);
  const x = cx + (rx + w) * Math.cos(theta);
  const y = cy + (ry + w) * Math.sin(theta);
  return [x, y];
}

const N = 64;
const pts = [];
for (let i = 0; i < N; i++) {
  pts.push(pointAt((i / N) * Math.PI * 2));
}

// Catmull-Rom -> Bezier cubique, boucle fermee.
function catmullRomPath(points) {
  const n = points.length;
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  d += "Z";
  return d;
}

const vinePath = catmullRomPath(pts);

// Epines : petits triangles le long de la vigne, orientes vers l'exterieur.
let thorns = "";
for (let i = 0; i < N; i += 3) {
  const theta = (i / N) * Math.PI * 2;
  const [x, y] = pointAt(theta);
  const nx = Math.cos(theta);
  const ny = Math.sin(theta) * (ry / rx);
  const norm = Math.hypot(nx, ny);
  const ux = nx / norm;
  const uy = ny / norm;
  const tx = -uy;
  const ty = ux;
  const len = 9 + 6 * Math.abs(Math.sin(i * 2.3));
  const tipX = x + ux * len;
  const tipY = y + uy * len;
  const baseW = 2.6;
  const b1x = x + tx * baseW;
  const b1y = y + ty * baseW;
  const b2x = x - tx * baseW;
  const b2y = y - ty * baseW;
  thorns += `<path d="M ${b1x.toFixed(1)} ${b1y.toFixed(1)} L ${tipX.toFixed(1)} ${tipY.toFixed(1)} L ${b2x.toFixed(1)} ${b2y.toFixed(1)} Z" fill="#7d6152" />`;
}

// Feuilles : forme pointue, orientee tangentiellement, quelques-unes autour de la boucle.
const leafAngles = [12, 68, 128, 188, 246, 304];
let leaves = "";
leafAngles.forEach((deg, i) => {
  const theta = (deg * Math.PI) / 180;
  const [x, y] = pointAt(theta);
  const nx = Math.cos(theta);
  const ny = Math.sin(theta) * (ry / rx);
  const norm = Math.hypot(nx, ny);
  const ux = nx / norm;
  const uy = ny / norm;
  const tx = -uy;
  const ty = ux;
  const baseX = x + ux * 4;
  const baseY = y + uy * 4;
  const len = i % 2 === 0 ? 34 : 28;
  const wid = 12;
  const tipX = baseX + ux * len;
  const tipY = baseY + uy * len;
  const midX = baseX + ux * (len * 0.5);
  const midY = baseY + uy * (len * 0.5);
  const c1x = midX + tx * wid;
  const c1y = midY + ty * wid;
  const c2x = midX - tx * wid;
  const c2y = midY - ty * wid;
  leaves += `<path d="M ${baseX.toFixed(1)} ${baseY.toFixed(1)} Q ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${baseX.toFixed(1)} ${baseY.toFixed(1)} Z" fill="#5a7356" opacity="0.92" />`;
  leaves += `<path d="M ${baseX.toFixed(1)} ${baseY.toFixed(1)} L ${tipX.toFixed(1)} ${tipY.toFixed(1)}" stroke="#3f5240" stroke-width="1" fill="none" opacity="0.6" />`;
});

// Roses : petite fleur a 5 petales + coeur, comme sur le logo. Deux tons de
// rose alternes sur les petales pour donner du relief, coeur dore.
function rose(px, py, size, rotationDeg) {
  const petalColors = ["#b8706b", "#a85f5a"];
  let out = `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rotationDeg.toFixed(1)})">`;
  for (let p = 0; p < 5; p++) {
    const ang = (p / 5) * 360;
    const color = petalColors[p % 2];
    out += `<g transform="rotate(${ang.toFixed(1)})"><ellipse cx="0" cy="${-(size * 0.62).toFixed(1)}" rx="${(size * 0.46).toFixed(1)}" ry="${(size * 0.6).toFixed(1)}" fill="${color}" opacity="0.95" /></g>`;
  }
  out += `<circle cx="0" cy="0" r="${(size * 0.32).toFixed(1)}" fill="#b8924a" />`;
  out += "</g>";
  return out;
}

const roseAngles = [40, 100, 220, 280];
let roses = "";
roseAngles.forEach((deg, i) => {
  const theta = (deg * Math.PI) / 180;
  const [x, y] = pointAt(theta);
  const nx = Math.cos(theta);
  const ny = Math.sin(theta) * (ry / rx);
  const norm = Math.hypot(nx, ny);
  const ux = nx / norm;
  const uy = ny / norm;
  const px = x + ux * 15;
  const py = y + uy * 15;
  const size = i % 2 === 0 ? 15 : 12.5;
  roses += rose(px, py, size, deg + 15 * i);
});

const svg = `<svg viewBox="0 0 258 400" xmlns="http://www.w3.org/2000/svg" role="presentation" aria-hidden="true">
  <path d="${vinePath}" fill="none" stroke="#7d6152" stroke-width="2.4" stroke-linejoin="round" opacity="0.9" />
  ${thorns}
  ${leaves}
  ${roses}
</svg>`;

process.stdout.write(svg);
