import fs from "node:fs";
import path from "node:path";

const reset = "\x1b[0m";
const hideCursor = "\x1b[?25l";
const showCursor = "\x1b[?25h";
const clearBelow = "\x1b[J";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function rgb(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return [r, g, b];
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function scaleRgb([r, g, b], k) {
  return [clamp(Math.round(r * k), 0, 255), clamp(Math.round(g * k), 0, 255), clamp(Math.round(b * k), 0, 255)];
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function supportsColor() {
  if (!process.stdout.isTTY) return false;
  // 简化：Windows Terminal / VSCode / 大多数现代终端都支持 truecolor
  return true;
}

function isBlankBraille(ch) {
  // braille blank is U+2800
  return ch === "\u2800" || ch === " ";
}

/**
 * Apply color effect to a braille line.
 * mode:
 * - "solid": fixed color
 * - "sweep": moving highlight from left->right
 * - "breathe": brightness breathing
 */
function colorizeLine(line, {
  baseRgb,
  mode,
  t,
  sweepWidth = 18,
  sweepStrength = 1.8,
  breatheMin = 0.65,
  breatheMax = 1.25,
} = {}) {
  if (!supportsColor()) return line;

  const n = Math.max(1, line.length - 1);

  let breatheK = 1.0;
  if (mode === "breathe") {
    const s = (Math.sin(t * 2 * Math.PI) + 1) / 2; // 0..1
    breatheK = breatheMin + (breatheMax - breatheMin) * s;
  }

  // sweep center in [0..n]
  const sweepCenter = (t % 1) * n;

  let out = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (isBlankBraille(ch)) {
      out += ch;
      continue;
    }

    let k = 1.0;

    if (mode === "sweep") {
      const d = Math.abs(i - sweepCenter);
      const w = sweepWidth;
      // gaussian-ish bump
      const bump = Math.exp(-(d * d) / (2 * w * w));
      k = 1.0 + (sweepStrength - 1.0) * bump;
    } else if (mode === "breathe") {
      k = breatheK;
    }

    const [r, g, b] = scaleRgb(baseRgb, k);
    out += rgb(r, g, b) + ch + reset;
  }
  return out;
}

/**
 * Load braille lines from file (pre-generated).
 */
function loadBrailleLines(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return text.replace(/\r\n/g, "\n").split("\n").filter((l, idx, arr) => {
    // keep empty lines inside banner; just trim trailing file newline
    return !(idx === arr.length - 1 && l === "");
  });
}

/**
 * Public API:
 * showKiroBanner({
 *   brailleFile: "src/kiro_braille.txt",
 *   color: "#9046FF",
 *   mode: "line" | "static" | "sweep" | "breathe",
 *   lineDelayMs: 150,
 *   fps: 30,
 *   durationMs: 1600
 * })
 */
export async function showKiroBanner({
  brailleFile,
  color = "#9046FF",
  mode = "line",        // "line": 逐行打印；"static": 一次性；"sweep"/"breathe": 动画
  lineDelayMs = 150,
  fps = 30,
  durationMs = 1600,
} = {}) {
  const baseRgb = hexToRgb(color);
  const lines = loadBrailleLines(path.resolve(brailleFile));

  // 非 TTY 或不想花哨：降级静态输出
  if (!process.stdout.isTTY || mode === "static") {
    for (const line of lines) {
      process.stdout.write(supportsColor() ? (rgb(...baseRgb) + line + reset) : line);
      process.stdout.write("\n");
    }
    return;
  }

  if (mode === "line") {
    for (const line of lines) {
      const colored = supportsColor() ? (rgb(...baseRgb) + line + reset) : line;
      process.stdout.write(colored + "\n");
      await sleep(lineDelayMs);
    }
    return;
  }

  // Animated modes: render in-place
  const start = Date.now();
  const frameMs = Math.max(16, Math.round(1000 / fps));

  process.stdout.write(hideCursor);

  // Print initial block, remember top by moving cursor up later
  for (const _ of lines) process.stdout.write("\n");
  // Move cursor up by lines count
  process.stdout.write(`\x1b[${lines.length}A`);

  try {
    while (Date.now() - start < durationMs) {
      const elapsed = Date.now() - start;
      const t = (elapsed / durationMs); // 0..1 over duration

      for (let row = 0; row < lines.length; row++) {
        // move to line start, clear to end
        process.stdout.write("\r\x1b[2K");

        const colored = colorizeLine(lines[row], {
          baseRgb,
          mode,
          t: mode === "sweep" ? (elapsed / durationMs) : (elapsed / 1000), // breathe uses seconds
        });
        process.stdout.write(colored + "\n");
      }

      // move cursor back up to top of banner for next frame
      process.stdout.write(`\x1b[${lines.length}A`);
      await sleep(frameMs);
    }

    // Final settle: print one last static frame and move cursor below banner
    for (let row = 0; row < lines.length; row++) {
      process.stdout.write("\r\x1b[2K");
      const finalLine = supportsColor() ? (rgb(...baseRgb) + lines[row] + reset) : lines[row];
      process.stdout.write(finalLine + "\n");
    }
  } finally {
    process.stdout.write(showCursor);
    process.stdout.write(clearBelow);
  }
}
