// banner_gemini.js
import figlet from "figlet";

const sleep = ms => new Promise(r => setTimeout(r, ms));

function supportsTruecolor() {
  return (
    process.env.COLORTERM?.includes("truecolor") ||
    process.env.TERM_PROGRAM ||
    process.platform === "win32" // Windows Terminal / VSCode 基本都支持
  );
}

function rgb(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}
const reset = "\x1b[0m";

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function gradientLine(line, c1, c2) {
  const n = Math.max(1, line.length - 1);
  let out = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === " ") {
      out += ch;
      continue;
    }
    const t = i / n;
    const r = lerp(c1[0], c2[0], t);
    const g = lerp(c1[1], c2[1], t);
    const b = lerp(c1[2], c2[2], t);
    out += rgb(r, g, b) + ch + reset;
  }
  return out;
}

async function main() {
  const text = "GEMINI";
  const font = "ANSI Shadow";

  const banner = figlet.textSync(text, { font });
  const lines = banner.split("\n");

  const c1 = [144, 70, 255]; // #9046FF
  const c2 = [80, 160, 255];

  for (const line of lines) {
    const output = supportsTruecolor()
      ? gradientLine(line, c1, c2)
      : line;

    process.stdout.write(output + "\n");
    await sleep(250); // ⭐ 每行 0.5 秒
  }
}

main();
