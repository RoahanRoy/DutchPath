/**
 * Generates the PWA icon set from a single inline SVG source.
 *
 *   npm run generate:pwa-icons
 *
 * The mark is an ascending route rising to a gold summit — the lesson map,
 * drawn in the brand navy (--primary) and orange (--accent).
 *
 * Outputs to public/:
 *   icon-192.png / icon-512.png            — manifest icons, purpose "any"
 *   icon-maskable-192/512.png              — Android adaptive icons (safe zone inset)
 *   apple-touch-icon.png                   — iOS home screen (180x180, opaque, unrounded)
 *
 * iOS applies its own squircle mask, so the source must be a full-bleed square
 * with no transparency and no pre-rounded corners.
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * @param scale shrinks the mark toward the centre. Maskable icons must keep all
 *   meaningful content inside the middle 80% circle, so they render at 0.72.
 */
function iconSvg(scale = 1): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="#0b429f"/>
      <stop offset="100%" stop-color="#00174b"/>
    </linearGradient>
    <linearGradient id="route" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff9236"/>
      <stop offset="100%" stop-color="#fe6b00"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g transform="translate(512 512) scale(${scale}) translate(-512 -512)"
     fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 208 758 L 404 562 L 540 698 L 760 420" stroke="url(#route)" stroke-width="120"/>
    <circle cx="772" cy="330" r="104" fill="#FFD700" stroke="none"/>
  </g>
</svg>`;
}

async function render(svg: string, size: number, file: string) {
  const buffer = await sharp(Buffer.from(svg))
    .resize(size, size)
    // Flatten onto the darkest gradient stop: iOS renders home screen icons
    // without an alpha channel and will otherwise composite them onto black.
    .flatten({ background: "#00174b" })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(path.join(PUBLIC_DIR, file), buffer);
  console.log(`  ${file.padEnd(26)} ${size}x${size}  ${(buffer.length / 1024).toFixed(1)} kB`);
}

async function main() {
  console.log("Generating PWA icons into public/ …");

  const standard = iconSvg(1);
  const maskable = iconSvg(0.72);

  await render(standard, 192, "icon-192.png");
  await render(standard, 512, "icon-512.png");
  await render(maskable, 192, "icon-maskable-192.png");
  await render(maskable, 512, "icon-maskable-512.png");
  await render(standard, 180, "apple-touch-icon.png");

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
