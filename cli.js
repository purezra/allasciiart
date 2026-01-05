import { showKiroBanner } from "./src/banner.js";

function getArg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v ?? fallback;
}

const mode = getArg("--mode", "line"); // line | static | sweep | breathe
const delay = Number(getArg("--delay", "150"));
const duration = Number(getArg("--duration", "1600"));
const color = getArg("--color", "#9046FF");

await showKiroBanner({
  brailleFile: "src/kiro_braille.txt",
  color,
  mode,
  lineDelayMs: delay,
  durationMs: duration,
});
