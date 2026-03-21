/**
 * QR code SVG generator.
 * Thin wrapper around qrcode-generator for BulletForge share URLs.
 */
import qrcode from "qrcode-generator";

/**
 * Generate a QR code as an SVG data URI.
 * @param data - The string to encode (typically a share URL)
 * @param cellSize - Pixel size of each QR module (default 4)
 * @param margin - Margin in modules (default 2)
 * @returns SVG markup string
 */
export function generateQRSvg(data: string, cellSize = 4, margin = 2): string {
  const qr = qrcode(0, "M"); // Auto-detect version, medium error correction
  qr.addData(data);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const totalSize = (moduleCount + margin * 2) * cellSize;

  const rects: string[] = [];
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        const x = (col + margin) * cellSize;
        const y = (row + margin) * cellSize;
        rects.push(`<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}"/>`);
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`,
    `<rect width="${totalSize}" height="${totalSize}" fill="#fff"/>`,
    `<g fill="#000">`,
    ...rects,
    `</g>`,
    `</svg>`,
  ].join("");
}

/**
 * Generate a QR code as a data URI suitable for an img src.
 */
export function generateQRDataURI(data: string, cellSize = 3, margin = 2): string {
  const svg = generateQRSvg(data, cellSize, margin);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
