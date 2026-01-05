import time
import sys
import random
from PIL import Image, ImageEnhance
from colorama import init, Style

# 初始化colorama以支持Windows彩色输出
init()

# ASCII字符映射(按视觉密度从暗到亮排序)
# 可以选择不同的字符集
ASCII_CHARS_DETAILED = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"
ASCII_CHARS_SIMPLE = " .:-=+*#%@"
ASCII_CHARS_BLOCKS = " ░▒▓█"
ASCII_CHARS_CUSTOM = " .:-=+*ABCDEFGHIJKLMNOPQRSTUVWXYZ#%@"

def rgb_to_ansi(r, g, b):
    """将RGB颜色转换为ANSI转义码"""
    return f'\033[38;2;{r};{g};{b}m'

def apply_dithering(pixels, width, height):
    """应用Floyd-Steinberg抖动算法增强细节"""
    # 创建副本以避免修改原始数据
    dithered = [[list(pixels[x, y]) for x in range(width)] for y in range(height)]
    
    for y in range(height):
        for x in range(width):
            old_pixel = dithered[y][x]
            # 量化亮度
            brightness = int(0.299 * old_pixel[0] + 0.587 * old_pixel[1] + 0.114 * old_pixel[2])
            new_brightness = round(brightness / 255) * 255
            
            # 计算误差
            error = brightness - new_brightness
            
            # 分散误差到相邻像素(Floyd-Steinberg矩阵)
            if x + 1 < width:
                for i in range(3):
                    dithered[y][x + 1][i] = min(255, max(0, dithered[y][x + 1][i] + error * 7 / 16))
            if y + 1 < height:
                if x > 0:
                    for i in range(3):
                        dithered[y + 1][x - 1][i] = min(255, max(0, dithered[y + 1][x - 1][i] + error * 3 / 16))
                for i in range(3):
                    dithered[y + 1][x][i] = min(255, max(0, dithered[y + 1][x][i] + error * 5 / 16))
                if x + 1 < width:
                    for i in range(3):
                        dithered[y + 1][x + 1][i] = min(255, max(0, dithered[y + 1][x + 1][i] + error * 1 / 16))
    
    return dithered

def convert_image_to_ascii(image_path, width=100, delay=0.05, 
                          char_set="custom", use_dithering=False, 
                          contrast=1.0, brightness=1.0):
    """
    将图片转换为彩色ASCII码并逐行输出
    
    参数:
        image_path: 图片路径
        width: ASCII图像宽度(字符数)
        delay: 每行输出间隔时间(秒)
        char_set: 字符集选择 ("detailed", "simple", "blocks", "custom")
        use_dithering: 是否使用抖动算法(增强细节,但更慢)
        contrast: 对比度调整(1.0为原始,>1增强对比度)
        brightness: 亮度调整(1.0为原始,>1增加亮度)
    """
    try:
        # 选择字符集
        char_sets = {
            "detailed": ASCII_CHARS_DETAILED,
            "simple": ASCII_CHARS_SIMPLE,
            "blocks": ASCII_CHARS_BLOCKS,
            "custom": ASCII_CHARS_CUSTOM
        }
        ASCII_CHARS = char_sets.get(char_set, ASCII_CHARS_CUSTOM)
        
        # 打开图片
        img = Image.open(image_path)
        
        # 调整对比度和亮度
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(contrast)
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(brightness)
        
        # 计算新的高度以保持宽高比(字符高度约为宽度的2倍)
        aspect_ratio = img.height / img.width
        height = int(width * aspect_ratio * 0.55)
        
        # 调整图片大小
        img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        # 转换为RGBA模式以保留透明度信息
        img = img.convert('RGBA')
        
        # 获取像素数据
        pixels = img.load()
        
        # 逐行处理并输出
        for y in range(height):
            line = ""
            for x in range(width):
                # 获取像素的RGBA值
                r, g, b, a = pixels[x, y]
                
                # 如果透明度小于128(接近透明),则输出空格
                if a < 128:
                    line += " "
                else:
                    # 计算感知亮度(使用加权公式,更符合人眼感知)
                    brightness_val = int(0.299 * r + 0.587 * g + 0.114 * b)
                    
                    # 根据透明度调整亮度(半透明区域会变暗)
                    brightness_val = int(brightness_val * (a / 255))
                    
                    # 根据亮度选择ASCII字符
                    char_index = int((brightness_val / 255) * (len(ASCII_CHARS) - 1))
                    char_index = min(char_index, len(ASCII_CHARS) - 1)  # 防止越界
                    char = ASCII_CHARS[char_index]
                    
                    # 添加颜色和字符
                    line += rgb_to_ansi(r, g, b) + char
            
            # 输出这一行并重置颜色
            print(line + Style.RESET_ALL)
            sys.stdout.flush()
            time.sleep(delay)
            
    except FileNotFoundError:
        print(f"错误: 找不到图片文件 '{image_path}'")
    except Exception as e:
        print(f"发生错误: {e}")

def get_user_input():
    """获取用户输入的参数"""
    print("=" * 50)
    print("彩色ASCII图像转换器")
    print("=" * 50)
    
    # 图片路径
    image_path = input("\n请输入图片路径 (默认: burger.png): ").strip()
    if not image_path:
        image_path = "burger.png"
    
    # 字符集选择
    print("\n选择字符集风格:")
    print("  1. Detailed - 最细致 (70+字符)")
    print("  2. Simple - 简洁经典 (10字符)")
    print("  3. Blocks - 方块像素风 (Unicode方块)")
    print("  4. Custom - 自定义字母集 (A-Z)")
    
    char_choice = input("请输入数字 (1-4, 默认: 4): ").strip()
    char_sets = {
        "1": "detailed",
        "2": "simple",
        "3": "blocks",
        "4": "custom"
    }
    char_set = char_sets.get(char_choice, "custom")
    
    # 宽度
    width_input = input("\n设置ASCII图像宽度 (字符数, 默认: 100): ").strip()
    try:
        width = int(width_input) if width_input else 100
        width = max(20, min(width, 300))  # 限制在20-300之间
    except ValueError:
        width = 100
    
    # 对比度
    contrast_input = input("\n设置对比度 (0.5-2.0, 默认: 1.2): ").strip()
    try:
        contrast = float(contrast_input) if contrast_input else 1.2
        contrast = max(0.5, min(contrast, 2.0))  # 限制在0.5-2.0之间
    except ValueError:
        contrast = 1.2
    
    # 亮度
    brightness_input = input("\n设置亮度 (0.5-2.0, 默认: 1.0): ").strip()
    try:
        brightness = float(brightness_input) if brightness_input else 1.0
        brightness = max(0.5, min(brightness, 2.0))  # 限制在0.5-2.0之间
    except ValueError:
        brightness = 1.0
    
    # 延迟
    delay_input = input("\n设置每行输出延迟(秒) (0-1, 默认: 0.05): ").strip()
    try:
        delay = float(delay_input) if delay_input else 0.05
        delay = max(0, min(delay, 1.0))  # 限制在0-1之间
    except ValueError:
        delay = 0.05
    
    return image_path, width, delay, char_set, contrast, brightness

if __name__ == "__main__":
    # 获取用户输入
    image_path, width, delay, char_set, contrast, brightness = get_user_input()
    
    print("\n" + "=" * 50)
    print("开始转换图片为彩色ASCII码...")
    print("=" * 50 + "\n")
    
    # 执行转换
    convert_image_to_ascii(
        image_path, 
        width=width,
        delay=delay,
        char_set=char_set,
        contrast=contrast,
        brightness=brightness
    )
    
    print("\n" + "=" * 50)
    print("转换完成!")
    print("=" * 50)