import readline from 'readline';
import figlet from 'figlet';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

// Gradient color stops [r, g, b]
const gradientStops = [
  [66, 134, 243],   // Blue
  [235, 69, 55],    // Red
  [250, 194, 48],   // Yellow
  [85, 175, 123]    // Green
];

// Interpolate between gradient stops for smooth transition
function getGradientColor(position) {
  // Map position (0-1) to the gradient stops
  const scaledPos = position * (gradientStops.length - 1);
  const index = Math.floor(scaledPos);
  const t = scaledPos - index;
  
  // Get the two colors to interpolate between
  const color1 = gradientStops[Math.min(index, gradientStops.length - 1)];
  const color2 = gradientStops[Math.min(index + 1, gradientStops.length - 1)];
  
  // Linear interpolation
  const r = Math.round(color1[0] + (color2[0] - color1[0]) * t);
  const g = Math.round(color1[1] + (color2[1] - color1[1]) * t);
  const b = Math.round(color1[2] + (color2[2] - color1[2]) * t);
  
  return `\x1b[38;2;${r};${g};${b}m`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(50));
  console.log('ASCII Banner Generator');
  console.log('='.repeat(50));

  // Step 1: Enter text
  const text = await askQuestion('\n请输入要转换的文本 (默认: hello world!): ');
  const inputText = text.trim() || 'hello world!';
  console.log(`输入文本: ${inputText}`);

  // Step 2: Choose style
  console.log('\n请选择样式:');
  console.log('  1. ANSI Shadow');
  console.log('  2. Larry 3D');
  console.log('  3. DOS Rebel');
  console.log('  4. Pagga');

  const styleChoice = await askQuestion('请选择样式 (1-4, 默认: 1): ');
  const styleNum = styleChoice.trim() || '1';
  
  const fontMap = {
    '1': 'ANSI Shadow',
    '2': 'Larry 3D',
    '3': 'DOS Rebel',
    '4': 'Pagga'
  };
  const styleNames = ['ANSI Shadow', 'Larry 3D', 'DOS Rebel', 'Pagga'];
  const selectedFont = fontMap[styleNum] || 'Shadow';
  console.log(`选择样式: ${styleNames[parseInt(styleNum) - 1] || 'ANSI Shadow'}`);

  // Step 3: Choose color scheme
  console.log('\n请选择颜色方案:');
  console.log('  1. 渐变色 (默认)');
  console.log('  2. 纯色');

  const colorChoice = await askQuestion('请选择颜色方案 (1-2, 默认: 1): ');
  const colorNum = colorChoice.trim() || '1';
  
  let solidColor = null;
  if (colorNum === '2') {
    solidColor = await askQuestion('请输入颜色代码 (如 #9046FF): ');
    solidColor = solidColor.trim() || '#9046FF';
    console.log(`选择纯色: ${solidColor}`);
  } else {
    console.log('选择渐变色');
  }

  // Step 4: Enter delay
  const delayInput = await askQuestion('\n请输入每行打印间隔时间秒数 (默认: 0.15, 最大: 0.5): ');
  let delay = parseFloat(delayInput) || 0.15;
  if (delay < 0) delay = 0.15;
  if (delay > 0.5) delay = 0.5;
  console.log(`间隔时间: ${delay}s`);

  // Final Enter
  await askQuestion('\n按 Enter 键开始生成...');

  console.log('\n' + '='.repeat(50));
  console.log('生成中...');
  console.log('='.repeat(50) + '\n');

  // Generate ASCII art
  figlet(inputText, {
    font: selectedFont,
    horizontalLayout: 'default',
    verticalLayout: 'default',
    width: 120,
    whitespaceBreak: true
  }, (err, asciiArt) => {
    if (err) {
      console.error('生成ASCII艺术时出错:', err);
      rl.close();
      return;
    }

    const lines = asciiArt.split('\n');

    // Output with color
    const outputWithDelay = async () => {
      for (const line of lines) {
        if (solidColor) {
          // Solid color
          const rgb = hexToRgb(solidColor);
          console.log(`\x1b[38;2;${rgb}m${line}\x1b[0m`);
        } else {
          // Gradient color - smooth interpolation
          const coloredLine = line.split('').map((char, i) => {
            if (char === ' ') return ' ';
            const pos = i / (line.length || 1);
            return `${getGradientColor(pos)}${char}\x1b[0m`;
          }).join('');
          console.log(coloredLine);
        }
        await sleep(delay * 1000);
      }
    };

    outputWithDelay().then(() => {
      console.log('\n' + '='.repeat(50));
      console.log('生成完成!');
      console.log('='.repeat(50));
      rl.close();
    });
  });
}

main().catch(err => {
  console.error('错误:', err);
  rl.close();
});
