import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Braille dot positions (Unicode braille encoding):
 * Dots are numbered:
 * 1 4
 * 2 5
 * 3 6
 * 7 8
 *
 * Bit mapping in Unicode for braille patterns:
 * dot1=0x01, dot2=0x02, dot3=0x04, dot4=0x08,
 * dot5=0x10, dot6=0x20, dot7=0x40, dot8=0x80
 */
const DOT_BITS = [
  [0x01, 0x08], // row 0: dot1, dot4
  [0x02, 0x10], // row 1: dot2, dot5
  [0x04, 0x20], // row 2: dot3, dot6
  [0x40, 0x80], // row 3: dot7, dot8
];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function isOn(pixels, w, h, x, y) {
  if (x < 0 || y < 0 || x >= w || y >= h) return false;
  // pixels is Uint8Array of 0/1
  return pixels[y * w + x] === 1;
}

/**
 * Convert a binary bitmap to an outline bitmap (hollow):
 * A pixel is outline if it's ON and any 4-neighbor is OFF.
 */
function outline(binary, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (binary[idx] !== 1) continue;
      const nOff =
        !isOn(binary, w, h, x, y - 1) ||
        !isOn(binary, w, h, x, y + 1) ||
        !isOn(binary, w, h, x - 1, y) ||
        !isOn(binary, w, h, x + 1, y);
      if (nOff) out[idx] = 1;
    }
  }
  return out;
}

/**
 * Pack 2x4 pixels into one braille character.
 */
function packBraille(pixels, w, h, bx, by) {
  let bits = 0;
  for (let ry = 0; ry < 4; ry++) {
    for (let rx = 0; rx < 2; rx++) {
      const x = bx * 2 + rx;
      const y = by * 4 + ry;
      const on = (x < w && y < h) ? pixels[y * w + x] === 1 : false;
      if (on) bits |= DOT_BITS[ry][rx];
    }
  }
  return String.fromCharCode(0x2800 + bits);
}

/**
 * Main: read PNG and output braille lines.
 */
async function pngToBrailleLines(inputPath, {
  // target braille width in characters (each char = 2px wide)
  brailleWidth = 110,
  // threshold for binarization (0~255)
  threshold = 60,
  // treat alpha below this as background
  alphaCutoff = 10,
  // add padding around
  pad = 2,
  // hollow outline
  makeOutline = true,
} = {}) {
  const img = sharp(inputPath).ensureAlpha();

  // Read metadata to preserve aspect ratio.
  const meta = await img.metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  if (!srcW || !srcH) throw new Error("Failed to read image size.");

  // We resize in pixel-space, but brailleWidth chars => pixel width = brailleWidth*2
  const targetPxW = brailleWidth * 2;
  const scale = targetPxW / srcW;
  const targetPxH = Math.max(1, Math.round(srcH * scale));

  const { data, info } = await img
    .resize(targetPxW, targetPxH, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const bin = new Uint8Array(w * h);

  // RGBA -> binary mask
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < alphaCutoff) {
        bin[y * w + x] = 0;
        continue;
      }
      // luminance
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b);
      // dark pixel => ON (because your banner is bright dots on dark bg, we invert by lum threshold)
      // If你的 PNG 是亮字暗底：lum < threshold -> ON 可能不对；这里用 "alpha>cutoff 且 lum < threshold" 表示“暗色为前景”
      // 对于你这张图（紫点在黑底），紫点 lum 不低，所以我们改成：lum > threshold => ON
      bin[y * w + x] = lum > threshold ? 1 : 0;
    }
  }

  // Hollow outline
  const finalPixels = makeOutline ? outline(bin, w, h) : bin;

  // Pack to braille chars
  const bw = Math.ceil(w / 2);
  const bh = Math.ceil(h / 4);

  const emptyLine = " ".repeat(bw + pad * 2);
  const lines = [];
  for (let i = 0; i < pad; i++) lines.push(emptyLine);

  for (let by = 0; by < bh; by++) {
    let line = " ".repeat(pad);
    for (let bx = 0; bx < bw; bx++) {
      line += packBraille(finalPixels, w, h, bx, by);
    }
    line += " ".repeat(pad);
    lines.push(line);
  }

  for (let i = 0; i < pad; i++) lines.push(emptyLine);
  return lines;
}

/**
 * CLI usage:
 * node tools/png2braille.js assets/kiro.png > src/kiro_braille.txt
 */
async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node tools/png2braille.js <input.png> [brailleWidth]");
    process.exit(1);
  }
  const brailleWidth = process.argv[3] ? Number(process.argv[3]) : 110;

  const lines = await pngToBrailleLines(path.resolve(input), {
    brailleWidth,
    threshold: 50,     // 你这张图紫点较亮：阈值偏低一点更稳
    alphaCutoff: 5,
    pad: 1,
    makeOutline: true, // 空心轮廓
  });

  process.stdout.write(lines.join("\n") + "\n");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { pngToBrailleLines };
