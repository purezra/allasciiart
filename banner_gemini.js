// banner_gemini.js
import figlet from "figlet";

function supportsTruecolor() {
  // 简化判断：大多数现代终端都行；你也可以加更严谨检测
  return process.env.COLORTERM?.includes("truecolor") || process.env.TERM_PROGRAM;
}

function rgb(r, g, b) {
  return `\x1b[38;2;${r};${g};${b}m`;
}
const reset = "\x1b[0m";

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function gradientLine(line, c1, c2) {
  const n = Math.max(1, line.length - 1);
  let out = "";
  for (let i = 0; i < line.length; i++) {
    const t = i / n;
    const r = lerp(c1[0], c2[0], t);
    const g = lerp(c1[1], c2[1], t);
    const b = lerp(c1[2], c2[2], t);
    const ch = line[i];
    out += ch === " " ? ch : (rgb(r, g, b) + ch + reset);
  }
  return out;
}

const text = "GEMINI"; // 想输出啥就写啥
const font = "ANSI Shadow";

figlet(text, { font }, (err, data) => {
  if (err) throw err;

  const lines = data.split("\n");
  // 紫到蓝的渐变示例
  const c1 = [144, 70, 255]; // #9046FF
  const c2 = [80, 160, 255];

  const colored = lines.map(line =>
    supportsTruecolor() ? gradientLine(line, c1, c2) : line
  ).join("\n");

  console.log(colored);
});
