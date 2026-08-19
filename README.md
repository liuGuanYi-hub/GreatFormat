# 💎 GreatFormat (太棒格式)

> **「这可真是太 Great 了！」—— 东方仗助**  
> **Crazy Diamond · 纯本地离线原子重组文件转换器**

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-purple.svg)
![Theme](https://img.shields.io/badge/Theme-JOJO4%20Crazy%20Diamond-ff69b4.svg)
![Tech](https://img.shields.io/badge/Tech-Electron%20%7C%20Node.js-green.svg)

</div>

---

## 🌟 核心理念与替身能力

**GreatFormat** 的灵感来源于《JOJO的奇妙冒险：不灭钻石》主角 **东方仗助** 及其替身 **「疯狂钻石」（Crazy Diamond）**。

疯狂钻石能够将触碰到的物体在原子层面进行破坏、修复与形态重塑。**GreatFormat** 将这一能力带入文件领域：把文件拆解为底层数据流，并在你的本地计算机上瞬间重构为目标格式！

- 🔒 **100% 本地离线运行**：数据绝不上云，彻底告别商业工具站的隐私泄露隐患与上传带宽限制。
- ⚡ **毫秒级极速重构**：Word 转换直接调用 Windows 原生 Office/WPS COM 组件自动化，排版 100% 完美保真。
- 🎨 **JOJO 4 杜王町动态交互**：东方仗助情绪与状态机联动（待机 Ready ➔ 拖拽替身出击 ➔ 转换中 `DORARARA!` 连打 ➔ 成功 `这可真是太 Great 了！`）。
- 🤖 **原生 CLI 与 Agent 接入**：不仅有现代化的桌面图形界面，还支持命令行调用，可无缝对接各类 AI Agent（Claude, Codex, Cursor 等）。

---

## 🚀 核心转换能力矩阵 (第一阶段 MVP)

| 核心领域 | 支持格式与能力 | 底层处理机制 |
| :--- | :--- | :--- |
| **图片互转与压缩** | PNG ↔ JPG ↔ WebP ↔ AVIF ↔ ICO ↔ TIFF 互转<br>批量压缩、分辨率微调、Windows 多尺寸 ICO 图标生成 | `Sharp` 高性能图像处理引擎 |
| **多图合并为 PDF** | 支持将 PNG/JPG/WebP/AVIF 等多图一键打包合并为单份清晰 PDF | `pdf-lib` 纯本地流式合成 |
| **PDF 深度处理** | PDF 逐页拆分、多 PDF 合并、PDF 逐页导出高清图片（PNG/JPG） | `pdf-lib` + 图像提取渲染器 |
| **Word ↔ PDF** | Word (.docx/.doc) 转 PDF<br>排版、字体、表格 100% 保真还原 | Windows 本地 COM 自动化 (MS Word/WPS) + LibreOffice 回退 |
| **Word ↔ 文本/Markdown** | Word (.docx) 提取并导出为 Markdown、HTML、TXT<br>Markdown / TXT 生成标准 Word (.docx) | `Mammoth` 语义解析器 + `docx` 构建器 |

---

## 💻 快速开始

### 1. 克隆与安装依赖
```bash
# 克隆仓库
git clone https://github.com/liuGuanYi-hub/GreatFormat.git
cd GreatFormat

# 安装依赖
npm install
```

### 2. 启动桌面端应用
```bash
npm start
# 或
npm run desktop
```

---

## 🛠️ CLI 命令行用法 (适合脚本与 Agent 自动化)

你可以直接通过命令行执行极速文件原子重组：

```bash
# 1. 查询系统支持能力
node cli.js capabilities

# 2. 查询指定文件可转换的目标格式
node cli.js targets example.docx

# 3. 单个/批量转换文件到指定格式 (例如图片转 WebP, Word 转 PDF)
node cli.js convert photo.png --to webp
node cli.js convert report.docx --to pdf --output-dir ./dist

# 4. 多张图片合并为一个 PDF
node cli.js images-to-pdf page1.jpg page2.png page3.webp --output album.pdf

# 5. 合并多个 PDF 文件
node cli.js merge-pdfs doc1.pdf doc2.pdf --output merged.pdf

# 6. 将 PDF 逐页拆分
node cli.js split-pdf manual.pdf --output-dir ./pages
```

---

## 📂 项目工程结构

```
GreatFormat/
├── src/
│   ├── core/                   # 核心转换引擎层
│   │   ├── converter-hub.js    # 统一路由与任务调度中枢
│   │   ├── image-engine.js     # 图像转换、压缩与图片合并 PDF 引擎
│   │   ├── pdf-engine.js       # PDF 拆分、合并与页面提取引擎
│   │   ├── office-engine.js    # Word/Office 极速保真与格式解析引擎
│   │   └── utils.js            # 工具函数库
│   ├── renderer/               # JOJO 4 疯狂钻石主题渲染层
│   │   ├── index.html          # 现代化桌面交互界面
│   │   ├── style.css           # 杜王町紫粉霓虹与暗黑玻璃拟态风格
│   │   └── app.js              # 仗助情绪状态机与拖拽队列管理
│   └── assets/                 # 视觉与图标素材
├── electron-main.js            # Electron 主进程与安全 IPC
├── preload.js                  # 上下文桥接隔离
├── cli.js                      # 命令行接口 (CLI / Agent)
├── package.json                # 项目依赖与脚本
├── LICENSE                     # MIT 开源许可证
└── README.md                   # 项目说明文档
```

---

## 📜 开源协议

本项目采用 [MIT License](LICENSE) 协议开源。
个人免费使用与学习交流，欢迎 Star 🌟 与 PR 贡献！
