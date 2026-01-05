import sharp from 'sharp';
import { createInterface } from 'readline';

// ASCII character sets (ordered by visual density from dark to light)
const ASCII_CHARS_DETAILED = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const ASCII_CHARS_SIMPLE = " .:-=+*#%@";
const ASCII_CHARS_BLOCKS = " ░▒▓█";
const ASCII_CHARS_CUSTOM = " .:-=+*ABCDEFGHIJKLMNOPQRSTUVWXYZ#%@";

function rgbToAnsi(r, g, b) {
    return `\x1b[38;2;${r};${g};${b}m`;
}

async function convertImageToAscii(imagePath, options = {}) {
    const {
        width = 100,
        delay = 0.05,
        charSet = "custom",
        contrast = 1.0,
        brightness = 1.0
    } = options;

    const charSets = {
        detailed: ASCII_CHARS_DETAILED,
        simple: ASCII_CHARS_SIMPLE,
        blocks: ASCII_CHARS_BLOCKS,
        custom: ASCII_CHARS_CUSTOM
    };
    const ASCII_CHARS = charSets[charSet] || ASCII_CHARS_CUSTOM;

    try {
        // Get image metadata first
        const metadata = await sharp(imagePath).metadata();
        
        // Calculate new height to maintain aspect ratio (character height is about 0.55x width)
        const aspectRatio = metadata.height / metadata.width;
        const height = Math.floor(width * aspectRatio * 0.55);
        
        // Process image with sharp
        const imageBuffer = await sharp(imagePath)
            .resize(width, height, { fit: 'fill' })
            .raw()
            .toBuffer({ resolveWithObject: true });
        
        const { data, info } = imageBuffer;
        const imgWidth = info.width;
        const imgHeight = info.height;
        
        // Process and output line by line
        for (let y = 0; y < imgHeight; y++) {
            let line = "";
            for (let x = 0; x < imgWidth; x++) {
                const idx = (y * imgWidth + x) * info.channels;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = info.channels === 4 ? data[idx + 3] : 255;
                
                // If transparency is less than 128 (near transparent), output space
                if (a < 128) {
                    line += " ";
                } else {
                    // Calculate perceived brightness (using weighted formula)
                    let brightnessVal = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
                    
                    // Apply brightness adjustment
                    if (brightness !== 1.0) {
                        brightnessVal = Math.floor(brightnessVal * brightness);
                        brightnessVal = Math.max(0, Math.min(255, brightnessVal));
                    }
                    
                    // Adjust brightness based on transparency
                    const adjustedBrightness = Math.floor(brightnessVal * (a / 255));
                    
                    // Select ASCII character based on brightness
                    let charIndex = Math.floor((adjustedBrightness / 255) * (ASCII_CHARS.length - 1));
                    charIndex = Math.min(charIndex, ASCII_CHARS.length - 1);
                    const char = ASCII_CHARS[charIndex];
                    
                    // Add color and character
                    line += rgbToAnsi(r, g, b) + char;
                }
            }
            
            // Output this line and reset color
            console.log(line + '\x1b[0m');
            
            // Add delay if needed
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        }
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

async function getUserInput() {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (text) => new Promise(resolve => rl.question(text, resolve));

    console.log("=".repeat(50));
    console.log("Colored ASCII Image Converter (Sharp Version)");
    console.log("=".repeat(50));

    // Image path
    let imagePath = await question("\nEnter image path (default: burger.png): ");
    if (!imagePath.trim()) imagePath = "burger.png";

    // Character set selection
    console.log("\nChoose character set style:");
    console.log("  1. Detailed - Most detailed (70+ characters)");
    console.log("  2. Simple - Classic concise (10 characters)");
    console.log("  3. Blocks - Block pixel style (Unicode blocks)");
    console.log("  4. Custom - Custom letter set (A-Z)");

    let charChoice = await question("Enter number (1-4, default: 4): ");
    const charSets = {
        "1": "detailed",
        "2": "simple",
        "3": "blocks",
        "4": "custom"
    };
    const charSet = charSets[charChoice] || "custom";

    // Width
    let widthInput = await question("\nSet ASCII image width (characters, default: 100): ");
    let width = widthInput ? parseInt(widthInput) : 100;
    width = Math.max(20, Math.min(width, 300));

    // Contrast
    let contrastInput = await question("\nSet contrast (0.5-2.0, default: 1.2): ");
    let contrast = contrastInput ? parseFloat(contrastInput) : 1.2;
    contrast = Math.max(0.5, Math.min(contrast, 2.0));

    // Brightness
    let brightnessInput = await question("\nSet brightness (0.5-2.0, default: 1.0): ");
    let brightness = brightnessInput ? parseFloat(brightnessInput) : 1.0;
    brightness = Math.max(0.5, Math.min(brightness, 2.0));

    // Delay
    let delayInput = await question("\nSet output delay per line (seconds) (0-1, default: 0.05): ");
    let delay = delayInput ? parseFloat(delayInput) : 0.05;
    delay = Math.max(0, Math.min(delay, 1.0));

    rl.close();

    return { imagePath, width, delay, charSet, contrast, brightness };
}

// Main function
async function main() {
    const { imagePath, width, delay, charSet, contrast, brightness } = await getUserInput();

    console.log("\n" + "=".repeat(50));
    console.log("Converting image to colored ASCII...");
    console.log("=".repeat(50) + "\n");

    await convertImageToAscii(imagePath, {
        width,
        delay,
        charSet,
        contrast,
        brightness
    });

    console.log("\n" + "=".repeat(50));
    console.log("Conversion complete!");
    console.log("=".repeat(50));
}

// Export for use as module
export { convertImageToAscii };

// Run if called directly
main();
