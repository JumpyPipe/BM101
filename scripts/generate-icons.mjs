// Icon generator for the PWA manifest / apple-touch-icon / favicon.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");
const appDir = join(__dirname, "..", "app");
mkdirSync(iconsDir, { recursive: true });

const BRAND_TEAL = "#0d9488"; // Tailwind teal-600

// Crescent moon, drawn as two overlapping circles rather than an arc path:
// a white disc, then a second circle painted the same color as the
// background directly on top of it — visually a crescent, and far more
// reliable to rasterize correctly than hand-computed SVG arcs.
// Full-bleed square background — iOS/Android apply their own corner mask,
// so a pre-rounded icon would double-mask and look wrong.
function iconSvg(size) {
  const moonR = size * 0.26;
  const moonCx = size * 0.42;
  const moonCy = size * 0.52;
  const cutR = size * 0.23;
  const cutCx = moonCx + moonR * 0.62;
  const cutCy = moonCy - moonR * 0.55;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BRAND_TEAL}"/>
      <circle cx="${moonCx}" cy="${moonCy}" r="${moonR}" fill="#ffffff"/>
      <circle cx="${cutCx}" cy="${cutCy}" r="${cutR}" fill="${BRAND_TEAL}"/>
      <circle cx="${size * 0.74}" cy="${size * 0.27}" r="${size * 0.028}" fill="#ffffff"/>
      <circle cx="${size * 0.81}" cy="${size * 0.37}" r="${size * 0.016}" fill="#ffffff"/>
    </svg>
  `;
}

const sizes = [
  { dir: iconsDir, file: "icon-192.png", size: 192 },
  { dir: iconsDir, file: "icon-512.png", size: 512 },
  { dir: iconsDir, file: "apple-touch-icon.png", size: 180 },
  { dir: appDir, file: "icon.png", size: 64 }, // Next.js favicon convention
];

for (const { dir, file, size } of sizes) {
  await sharp(Buffer.from(iconSvg(size))).png().toFile(join(dir, file));
  console.log("wrote", join(dir, file));
}
