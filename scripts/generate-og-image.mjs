/**
 * Generate OG social preview image (1200×630)
 * Run: node scripts/generate-og-image.mjs
 */
import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

// Create a dark OG image with BulletForge branding
const width = 1200;
const height = 630;

const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#171717"/>
    </linearGradient>
    <linearGradient id="red-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#dc2626"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)"/>

  <!-- Subtle grid pattern -->
  <g stroke="#1a1a1a" stroke-width="0.5" opacity="0.5">
    ${Array.from({length: 25}, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="${height}"/>`).join('')}
    ${Array.from({length: 13}, (_, i) => `<line x1="0" y1="${i * 50}" x2="${width}" y2="${i * 50}"/>`).join('')}
  </g>

  <!-- Crosshair decorative elements -->
  <circle cx="600" cy="315" r="200" fill="none" stroke="#ef4444" stroke-width="1" opacity="0.15"/>
  <circle cx="600" cy="315" r="250" fill="none" stroke="#ef4444" stroke-width="0.5" opacity="0.08"/>

  <!-- Red accent line at top -->
  <rect x="0" y="0" width="${width}" height="4" fill="url(#red-grad)"/>

  <!-- BF Logo mark -->
  <rect x="80" y="170" width="80" height="80" rx="16" fill="#ef4444" opacity="0.15"/>
  <text x="120" y="228" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="48" fill="#ef4444">BF</text>

  <!-- Title -->
  <text x="190" y="210" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="56" fill="#fafafa">BulletForge</text>

  <!-- Subtitle -->
  <text x="190" y="255" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="24" fill="#a3a3a3">Ballistics &amp; Reloading Simulator</text>

  <!-- Feature pills -->
  <g font-family="ui-monospace, monospace" font-size="16" font-weight="600">
    <rect x="80" y="310" width="180" height="36" rx="18" fill="#ef4444" opacity="0.15"/>
    <text x="170" y="334" text-anchor="middle" fill="#ef4444">RK4 Physics Engine</text>

    <rect x="280" y="310" width="180" height="36" rx="18" fill="#ef4444" opacity="0.15"/>
    <text x="370" y="334" text-anchor="middle" fill="#ef4444">G1 &amp; G7 Drag</text>

    <rect x="480" y="310" width="160" height="36" rx="18" fill="#ef4444" opacity="0.15"/>
    <text x="560" y="334" text-anchor="middle" fill="#ef4444">60+ Bullets</text>

    <rect x="660" y="310" width="180" height="36" rx="18" fill="#ef4444" opacity="0.15"/>
    <text x="750" y="334" text-anchor="middle" fill="#ef4444">15 Cartridges</text>

    <rect x="860" y="310" width="170" height="36" rx="18" fill="#ef4444" opacity="0.15"/>
    <text x="945" y="334" text-anchor="middle" fill="#ef4444">Atmospheric</text>
  </g>

  <!-- Tagline -->
  <text x="80" y="420" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="22" fill="#737373">Free. In your browser. No $150 desktop app.</text>

  <!-- URL -->
  <text x="80" y="540" font-family="ui-monospace, monospace" font-weight="700" font-size="28" fill="#ef4444">bulletforge.io</text>

  <!-- Bottom accent -->
  <rect x="0" y="${height - 4}" width="${width}" height="4" fill="url(#red-grad)"/>
</svg>`;

await sharp(Buffer.from(svg))
  .resize(width, height)
  .png()
  .toFile(resolve(publicDir, "og-image.png"));

console.log("✅ Generated og-image.png (1200×630)");
