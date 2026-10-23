// Generates favicons, app icons and the default Open Graph image from the logo.
// Run after replacing src/assets/brand/logo-*.png:  npm run assets
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const MARK = 'src/assets/brand/logo-mark.png';
const FULL = 'src/assets/brand/logo-full.png';
const NAVY = '#0D2B46';
const ORANGE = '#EE9A2A';

/** Dwarf mark centred on a white square with padding. */
async function icon(size, padding = 0.1) {
  const inner = Math.round(size * (1 - padding * 2));
  const mark = await sharp(MARK).resize(inner, inner, { fit: 'contain', background: '#0000' }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer();
}

/** Minimal .ico container holding PNG images. */
function ico(pngs) {
  const header = Buffer.alloc(6 + pngs.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(buf.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.buf)]);
}

const sizes = { 'favicon-32.png': 32, 'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 };
for (const [file, size] of Object.entries(sizes)) {
  await writeFile(`public/${file}`, await icon(size, size <= 32 ? 0.02 : 0.1));
}
await writeFile(
  'public/favicon.ico',
  ico([
    { size: 16, buf: await icon(16, 0) },
    { size: 32, buf: await icon(32, 0.02) },
    { size: 48, buf: await icon(48, 0.04) },
  ]),
);

// Open Graph 1200×630: logo + tagline on a light background.
const W = 1200, H = 630;
const logo = await sharp(FULL).resize({ width: 820 }).toBuffer();
const logoMeta = await sharp(logo).metadata();
const text = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="${ORANGE}"/>
  <text x="${W / 2}" y="470" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="50" font-weight="800" fill="${NAVY}">Małe zmiany, duże wyniki w Google.</text>
  <text x="${W / 2}" y="530" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="30" fill="#3E4C66">SEO z Wrocławia dla firm B2B z całej Polski</text>
</svg>`);
await sharp({ create: { width: W, height: H, channels: 4, background: '#F4F6FA' } })
  .composite([
    { input: logo, top: 90, left: Math.round((W - logoMeta.width) / 2) },
    { input: text, top: 0, left: 0 },
  ])
  .png({ compressionLevel: 9 })
  .toFile('public/og-default.png');

console.log('Icons and OG image written to public/.');
