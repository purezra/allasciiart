# ASCII Banner 项目

一个终端 ASCII 艺术和盲文 ASCII 艺术生成器集合。

> **重点推荐**: `color.js`、`ascii.js`、`ham.js`

---

## 目录

- [ASCII Banner 项目](#ascii-banner-项目)
  - [目录](#目录)
  - [安装依赖](#安装依赖)
  - [依赖说明](#依赖说明)
  - [使用方法](#使用方法)
    - [1. color.js - 彩色盲文 ASCII 艺术](#1-colorjs---彩色盲文-ascii-艺术)
    - [2. ascii.js - 交互式 ASCII Banner 生成器](#2-asciijs---交互式-ascii-banner-生成器)
    - [3. ham.js - 图片转彩色 ASCII 艺术](#3-hamjs---图片转彩色-ascii-艺术)
    - [4. cli.js - 彩色盲文 Banner 动画](#4-clijs---彩色盲文-banner-动画)
    - [5. banner\_gemini.js - ASCII 文字渐变 Banner](#5-banner_geminijs---ascii-文字渐变-banner)
    - [6. gemini\_time.js - 逐行动画 ASCII Banner](#6-gemini_timejs---逐行动画-ascii-banner)
    - [7. kiro.js - 静态紫色盲文图案](#7-kirojs---静态紫色盲文图案)
    - [8. kiro\_time.js - 逐行动画盲文图案](#8-kiro_timejs---逐行动画盲文图案)
    - [9. tools/png2braille.js - PNG 转盲文工具](#9-toolspng2braillejs---png-转盲文工具)
  - [项目结构](#项目结构)
  - [终端要求](#终端要求)

---

## 安装依赖

```bash
pnpm install
```

或使用 npm:

```bash
npm install
```

---

## 依赖说明

| 包名 | 用途 |
| --- | --- |
| `figlet` | 生成 ASCII 文字 banner |
| `jimp` | 图片处理，用于将图片转换为 ASCII 艺术 |
| `sharp` | 图像处理，用于将图片转换为盲文 ASCII 艺术 |

---

## 使用方法

### 1. color.js - 彩色盲文 ASCII 艺术

将图片转换为带有原始颜色的盲文 ASCII 艺术，支持多种抖动算法。

![彩色盲文效果](https://cdn.nlark.com/yuque/0/2026/png/38517034/1767607924496-8b917466-9bf8-4574-a541-9fb1b438f2f3.png)

```bash
node color.js
```

**交互流程**:

1. **选择抖动模式**
   - `(1) Floyd-Steinberg (simple)` - 经典抖动算法
   - `(2) Stucki (edge contrast)` - 边缘对比度增强
   - `(3) Atkinson (high contrast)` - 高对比度
   - `(4) Threshold (no dither)` - 无抖动二值化
   - 默认: `1`

2. **输入 Threshold (0-127)**
   - 控制二值化的阈值
   - 默认: `60`

3. **输入宽度 (30-110)**
   - 控制输出字符宽度
   - 默认: `60`

4. **是否开启 invert**
   - 开启为 `1`，不开启为 `0`
   - 默认: `0`

**输出速度**: 每行 `0.15` 秒

---

### 2. ascii.js - 交互式 ASCII Banner 生成器

生成带有渐变效果的 ASCII 文字 banner，支持多种样式和颜色配置。

```bash
node ascii.js
```

**交互流程**:

1. **输入文本**
   - 输入要转换的文字
   - 默认: `hello world!`

2. **选择样式**
   - `1. ANSI Shadow` - 带边框的阴影样式

     ![ANSI Shadow](https://cdn.nlark.com/yuque/0/2026/png/38517034/1767608104328-75454dc8-d574-4354-908f-ba9b5d509a41.png)

   - `2. Larry 3D` - 3D 立体效果

     ![Larry 3D](https://cdn.nlark.com/yuque/0/2026/png/38517034/1767608113136-d8076110-c776-48d9-be38-9610ed710446.png)

   - `3. DOS Rebel` - 块状 DOS 风格

     ![DOS Rebel](https://cdn.nlark.com/yuque/0/2026/png/38517034/1767608135380-8fbbfa7f-e565-4496-b04c-5c571c6f7ee4.png)

   - `4. Pagga` - 轻量级 Banner 样式

     ![Pagga](https://cdn.nlark.com/yuque/0/2026/png/38517034/1767608123537-e6566e72-2bfe-4966-b7c7-dd1f3a8c5984.png)

   - 默认: `1`

3. **选择颜色方案**
   - `1. 渐变色` - 蓝 → 红 → 黄 → 绿 平滑渐变
   - `2. 纯色` - 输入十六进制颜色代码（如 `#9046FF`）
   - 默认: `1`

4. **输入间隔时间**
   - 每行打印间隔时间（秒）
   - 默认: `0.15s`，最大: `0.5s`

5. **按 Enter 键生成**

---

### 3. ham.js - 图片转彩色 ASCII 艺术

将图片转换为带有原始颜色的 ASCII 艺术。

```bash
node ham.js
```

**交互流程**:

1. **输入图片路径**
   - 输入要转换的图片路径
   - 默认: `burger.png`

2. **选择字符集**
   - `1. Detailed` - 最详细（70+ 字符）
   - `2. Simple` - 经典简洁（10 字符）
   - `3. Blocks` - 块状像素风格（Unicode 块字符）
   - `4. Custom` - 自定义字母集（A-Z）
   - 默认: `4`

3. **设置宽度**
   - ASCII 图像宽度（字符数）
   - 默认: `100`

4. **设置对比度**
   - 范围: `0.5 - 2.0`
   - 默认: `1.2`

5. **设置亮度**
   - 范围: `0.5 - 2.0`
   - 默认: `1.0`

6. **设置输出延迟**
   - 每行输出延迟（秒）
   - 默认: `0.05s`，最大: `1s`

---

### 4. cli.js - 彩色盲文 Banner 动画

从预生成的盲文文件显示彩色动画 banner。

```bash
node cli.js --mode line --delay 150 --color "#9046FF"
```

**参数说明**:

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `--mode` | 动画模式: `line`(逐行) / `static`(静态) / `sweep`(扫描) / `breathe`(呼吸) | `line` |
| `--delay` | 每行延迟(毫秒) | `150` |
| `--duration` | 动画持续时间(毫秒) | `1600` |
| `--color` | 颜色 (十六进制) | `#9046FF` |

---

### 5. banner_gemini.js - ASCII 文字渐变 Banner

使用 figlet 生成彩色渐变的 ASCII 文字 banner。

```bash
node banner_gemini.js
```

输出 "GEMINI" 文字，使用紫色到蓝色的渐变效果。

---

### 6. gemini_time.js - 逐行动画 ASCII Banner

逐行显示 ASCII 文字 banner，每行 `0.5` 秒。

```bash
node gemini_time.js
```

---

### 7. kiro.js - 静态紫色盲文图案

简单的静态紫色盲文 ASCII 艺术。

```bash
node kiro.js
```

---

### 8. kiro_time.js - 逐行动画盲文图案

逐行动画显示 Kiro 盲文 ASCII 艺术，每行 `0.15` 秒。

```bash
node kiro_time.js
```

---

### 9. tools/png2braille.js - PNG 转盲文工具

将 PNG 图片转换为盲文 ASCII 艺术（无颜色）。

```bash
node tools/png2braille.js <input.png> [brailleWidth]
```

**示例**:

```bash
node tools/png2braille.js assets/dog.png 110 > output.txt
```

**参数**:

- `input.png` - 输入图片路径
- `brailleWidth` - 盲文宽度（可选，默认 `110`）

---

## 项目结构

```
ascii_banner/
├── assets/              # 图片资源
│   ├── dog.png          # 狗图片
│   ├── kiro.png         # Kiro图片
│   └── augus.png        # Augus图片
├── src/                 # 源代码
│   └── banner.js        # Banner显示核心模块
├── tools/               # 工具脚本
│   └── png2braille.js   # PNG转盲文工具
├── ascii.js             # 交互式ASCII Banner生成器
├── cli.js               # CLI入口
├── color.js             # 彩色盲文生成器
├── ham.js               # 图片转ASCII艺术
├── kiro.js              # 静态Kiro图案
├── kiro_time.js         # 逐行动画盲文图案
├── banner_gemini.js     # 渐变ASCII Banner
├── gemini_time.js       # 逐行动画ASCII Banner
└── README.md            # 本文档
```

---

## 终端要求

- 支持 TrueColor (24位颜色) 的终端
- 推荐: Windows Terminal, VSCode Terminal, iTerm2, macOS Terminal 等现代终端
