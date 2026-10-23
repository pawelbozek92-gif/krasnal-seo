// One-off: removes the baked-in checkerboard from the source logo and exports
// a transparent, tightly cropped PNG (full logo + dwarf mark).
// Usage: node scripts/remove-logo-bg.mjs scripts/logo-source.webp
import sharp from 'sharp';

const src = process.argv[2] ?? 'scripts/logo-source.webp';
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const lum = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
const sat = (i) => Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
const isBg = (p) => { const i = p * 4; return lum(i) > 175 && sat(i) < 28; };

// Flood fill from every border pixel through background-like pixels.
const removed = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const p = stack.pop();
  if (removed[p] || !isBg(p)) continue;
  removed[p] = 1;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}

// Letter counters (inside A, R, O...) are enclosed, so the edge fill misses them.
// The wordmark has no intended white areas: clear every bg-like pixel right of the mark.
const WORDMARK_START_X = 330;
for (let p = 0; p < W * H; p++) if (p % W >= WORDMARK_START_X && isBg(p)) removed[p] = 1;

// Hard-remove filled pixels; soften the anti-aliased fringe next to them.
for (let p = 0; p < W * H; p++) {
  const i = p * 4;
  if (removed[p]) { data[i + 3] = 0; continue; }
  const x = p % W, y = (p / W) | 0;
  let edge = false;
  for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < W && ny < H && removed[ny * W + nx]) { edge = true; break; }
  }
  if (edge && sat(i) < 40) {
    const a = Math.max(0, Math.min(1, (225 - lum(i)) / 150));
    data[i + 3] = Math.round(255 * a);
  }
}

// Bounding box of visible pixels.
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let p = 0; p < W * H; p++) if (data[p * 4 + 3] > 20) {
  const x = p % W, y = (p / W) | 0;
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const img = sharp(data, { raw: { width: W, height: H, channels: 4 } });
const full = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
await img.clone().extract(full).png().toFile('src/assets/brand/logo-full.png');
// The dwarf + chart mark sits left of the wordmark.
let markRight = minX;
for (let x = minX; x < W; x++) {
  let any = false;
  for (let y = minY; y <= maxY; y++) if (data[(y * W + x) * 4 + 3] > 20) { any = true; break; }
  if (any) markRight = x; else if (x - markRight > 12) break;
}
await img.clone().extract({ left: minX, top: minY, width: markRight - minX + 1, height: maxY - minY + 1 }).png().toFile('src/assets/brand/logo-mark.png');
console.log('full', full, 'mark right edge', markRight);
