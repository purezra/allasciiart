import sharp from "sharp";
import path from "path";
import readline from "readline";

// Braille dot positions
const DOT_BITS = [
  [0x01, 0x08], // row 0: dot1, dot4
  [0x02, 0x10], // row 1: dot2, dot5
  [0x04, 0x20], // row 2: dot3, dot6
  [0x40, 0x80], // row 3: dot7, dot8
];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  const imagePath = path.resolve("assets/dog.png");
  
  // Interactive prompts
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // 1. Dither mode selection
  console.log("\n请选择抖动模式:");
  console.log("(1) Floyd-Steinberg (simple)");
  console.log("(2) Stucki (edge contrast)");
  console.log("(3) Atkinson (high contrast)");
  console.log("(4) Threshold (no dither)");
  let ditherMode = await askQuestion(rl, "输入1,2,3,4以选择 (默认1): ");
  ditherMode = ditherMode.trim() || "1";
  
  // 2. Threshold
  let thresholdInput = await askQuestion(rl, "\n输入Threshold (0-127, 默认60): ");
  const threshold = thresholdInput.trim() ? Math.max(0, Math.min(127, parseInt(thresholdInput) || 60)) : 60;
  
  // 3. Width
  let widthInput = await askQuestion(rl, "\n输入宽度 (30-110, 默认60): ");
  const brailleWidth = widthInput.trim() ? Math.max(30, Math.min(110, parseInt(widthInput) || 60)) : 60;
  
  // 4. Invert
  let invertInput = await askQuestion(rl, "\n是否开启invert (开启为1，不开启为0，默认0): ");
  const invert = invertInput.trim() === "1";
  
  rl.close();
  
  console.log(`\n配置: 抖动模式=${ditherMode}, Threshold=${threshold}, 宽度=${brailleWidth}, Invert=${invert}`);
  console.log("正在处理...\n");
  
  const delayMs = 150; // 0.15s per line
  
  // Load image
  const meta = await sharp(imagePath).metadata();
  const srcW = meta.width ?? 0;
  const srcH = meta.height ?? 0;
  
  // Calculate dimensions for resizing
  const targetPxW = brailleWidth * 2;
  const scale = targetPxW / srcW;
  const targetPxH = Math.max(1, Math.round(srcH * scale));
  
  // Resize and extract raw pixel data
  const { data, info } = await sharp(imagePath)
    .resize(targetPxW, targetPxH, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const w = info.width;
  const h = info.height;
  
  // Prepare arrays for dithering process
  const pixels = [];
  const errorR = new Float32Array(w * h);
  const errorG = new Float32Array(w * h);
  const errorB = new Float32Array(w * h);
  
  // Initialize pixel array with RGB values
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    pixels.push({
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      on: false
    });
  }
  
  // Apply dithering based on mode
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const pixel = pixels[i];
      
      // Calculate current pixel color with error
      let r = clamp(Math.round(pixel.r + errorR[i]), 0, 255);
      let g = clamp(Math.round(pixel.g + errorG[i]), 0, 255);
      let b = clamp(Math.round(pixel.b + errorB[i]), 0, 255);
      
      // Convert to grayscale for dithering
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Apply invert if needed
      const effectiveThreshold = invert ? 255 - threshold : threshold;
      const on = gray > effectiveThreshold;
      const q = on ? 255 : 0;
      
      // Calculate error
      const err = gray - q;
      
      // Distribute error based on dithering mode
      switch (ditherMode) {
        case "1": // Floyd-Steinberg (simple)
          //     *  7/16
          // 3/16 5/16 1/16
          if (x + 1 < w) {
            const right = i + 1;
            errorR[right] += err * 7/16;
            errorG[right] += err * 7/16;
            errorB[right] += err * 7/16;
          }
          if (y + 1 < h) {
            const below = i + w;
            if (x > 0) {
              const belowLeft = below - 1;
              errorR[belowLeft] += err * 3/16;
              errorG[belowLeft] += err * 3/16;
              errorB[belowLeft] += err * 3/16;
            }
            errorR[below] += err * 5/16;
            errorG[below] += err * 5/16;
            errorB[below] += err * 5/16;
            if (x + 1 < w) {
              const belowRight = below + 1;
              errorR[belowRight] += err * 1/16;
              errorG[belowRight] += err * 1/16;
              errorB[belowRight] += err * 1/16;
            }
          }
          break;
          
        case "2": // Stucki (edge contrast)
          //     *  8/42 4/42
          // 2/42 4/42 8/42 4/42 2/42
          // 1/42 2/42 4/42 2/42 1/42
          const stuckiMatrix = [
            [[1, 0], 8/42], [[2, 0], 4/42],
            [[-2, 1], 2/42], [[-1, 1], 4/42], [[0, 1], 8/42], [[1, 1], 4/42], [[2, 1], 2/42],
            [[-2, 2], 1/42], [[-1, 2], 2/42], [[0, 2], 4/42], [[1, 2], 2/42], [[2, 2], 1/42]
          ];
          for (const [[dx, dy], weight] of stuckiMatrix) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const ni = ny * w + nx;
              errorR[ni] += err * weight;
              errorG[ni] += err * weight;
              errorB[ni] += err * weight;
            }
          }
          break;
          
        case "3": // Atkinson (high contrast)
          //     *  1/8 1/8
          // 1/8 1/8 1/8 1/8
          //     1/8
          const atkinsonMatrix = [
            [[1, 0], 1/8], [[2, 0], 1/8],
            [[-1, 1], 1/8], [[0, 1], 1/8], [[1, 1], 1/8],
            [[0, 2], 1/8]
          ];
          for (const [[dx, dy], weight] of atkinsonMatrix) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const ni = ny * w + nx;
              errorR[ni] += err * weight;
              errorG[ni] += err * weight;
              errorB[ni] += err * weight;
            }
          }
          break;
          
        case "4": // Threshold (no dither)
          // No error distribution
          break;
      }
      
      // Store result
      pixel.on = on;
    }
  }
  
  // Compute average color for each Braille character block and pack into Braille
  const bw = Math.ceil(w / 2);
  const bh = Math.ceil(h / 4);
  const lines = [];
  
  for (let by = 0; by < bh; by++) {
    let line = "";
    for (let bx = 0; bx < bw; bx++) {
      let colorSumR = 0;
      let colorSumG = 0;
      let colorSumB = 0;
      let count = 0;
      
      // Gather average color for the character block
      for (let ry = 0; ry < 4; ry++) {
        for (let rx = 0; rx < 2; rx++) {
          const x = bx * 2 + rx;
          const y = by * 4 + ry;
          if (x < w && y < h) {
            const i = y * w + x;
            const idx = i * 4;
            colorSumR += data[idx];
            colorSumG += data[idx + 1];
            colorSumB += data[idx + 2];
            count++;
          }
        }
      }
      
      // Pack pixels into Braille character
      let bits = 0;
      for (let ry = 0; ry < 4; ry++) {
        for (let rx = 0; rx < 2; rx++) {
          const x = bx * 2 + rx;
          const y = by * 4 + ry;
          if (x < w && y < h) {
            const i = y * w + x;
            if (pixels[i].on) {
              bits |= DOT_BITS[ry][rx];
            }
          }
        }
      }
      
      // Calculate average color
      const avgR = count > 0 ? Math.round(colorSumR / count) : 0;
      const avgG = count > 0 ? Math.round(colorSumG / count) : 0;
      const avgB = count > 0 ? Math.round(colorSumB / count) : 0;
      
      // Create colored Braille character using ANSI 24-bit color
      const char = String.fromCharCode(0x2800 + bits);
      line += `\x1b[38;2;${avgR};${avgG};${avgB}m${char}\x1b[0m`;
    }
    lines.push(line);
  }
  
  // Output lines with delay
  for (const line of lines) {
    console.log(line);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

main().catch(console.error);
