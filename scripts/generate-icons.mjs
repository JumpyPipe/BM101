// One-off icon generator for the PWA manifest / apple-touch-icon.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const HEART_PATH =
  "M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z";

// Full-bleed square, background fills to the edge — iOS/Android apply their
// own corner mask, so a pre-rounded icon would double-mask and look wrong.
function iconSvg(size) {
  const scale = (size / 512) * 0.62;
  const offset = (size - 512 * scale) / 2;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#e11d48"/>
      <g transform="translate(${offset}, ${offset}) scale(${scale})">
        <path d="${HEART_PATH}" fill="#ffffff"/>
      </g>
    </svg>
  `;
}

const sizes = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of sizes) {
  await sharp(Buffer.from(iconSvg(size))).png().toFile(join(outDir, file));
  console.log("wrote", file);
}
