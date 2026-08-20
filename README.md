# 💎 GreatFormat (太棒格式)

> **「这可真是太 Great 了！」—— 东方仗助**  
> **Crazy Diamond · 纯本地离线原子级文件重构与全能格式转换器**

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-purple.svg)
![Theme](https://img.shields.io/badge/Theme-JOJO4%20Crazy%20Diamond-ff69b4.svg)
![Formats](https://img.shields.io/badge/Formats-59%2B%20Supported-success.svg)
![Offline](https://img.shields.io/badge/Privacy-100%25%20Local%20Offline-brightgreen.svg)
![Voice](https://img.shields.io/badge/Audio-Authentic%20Anime%20Voices-orange.svg)

<br><br>

### 📸 软件界面效果全览 (Preview)

![GreatFormat 主界面预览](docs/images/screenshot_main.png)

<br>

<table align="center">
  <tr>
    <td align="center" width="50%">
      <b>⚡ 多文件批量原子重构</b><br><br>
      <img src="docs/images/screenshot_tasks.png" alt="任务队列与格式选择" width="100%">
    </td>
    <td align="center" width="50%">
      <b>⚙️ 高级参数 & Windows 右键集成</b><br><br>
      <img src="docs/images/screenshot_settings.png" alt="高级预设与系统集成" width="100%">
    </td>
  </tr>
</table>

</div>

---

## 🌟 核心理念与替身能力

**GreatFormat** 的灵感来源于《JOJO的奇妙冒险：不灭钻石》主角 **东方仗助** 及其替身 **「疯狂钻石」（Crazy Diamond）**。

疯狂钻石拥有将物体在原子层面进行拆解、破坏并完美复原的能力。**GreatFormat** 将此能力赋予本地文件处理：将各类格式底层拆解为数据流，并在你的本地计算机上瞬间完成高保真重组！

- 🔒 **100% 纯本地离线运行**：数据绝不上云，彻底杜绝敏感商业文档、个人照片与简历的隐私泄露风险。
- ⚡ **59+ 种全品类格式互转**：音视频、图片、RAW/HEIC、文档、表格、PPT、数据与配置跨界全覆盖。
- 🤖 **AI & RAG 专属 Clean Markdown 提取**：智能识别多级标题树、过滤表格重复文本、还原规范表格与公式，完美适配大模型知识库。
- 🗜️ **极限文件压缩与微信 25MB 限制模式**：PDF 矢量流无损压缩、图片质量智能优化与目标体积精准压制。
- 🛡️ **PDF 瑞士军刀工具箱**：AES-256 高强密码加密/解密、防泄密倾斜文字水印、PDF 逆向高精度转 Word / 表格提取转 Excel。
- ⚡ **Windows 资源管理器右键集成**：无需预先打开软件，在电脑任意文件夹右键选中文件即可一键转换。
- 💎 **JOJO 4 东方仗助正版声效与立绘点击彩蛋**：官方正版声优原声配音、平滑渐入渐出（Fade In/Out）音量控制、立绘点击眨眼动效与 5 套经典彩蛋台词互动。

---

## 🚀 六大杀手级核心特性

### 1. 🔄 59+ 种全品类格式支持矩阵

| 分类 | 支持格式清单 | 转换能力与底层引擎 |
| :--- | :--- | :--- |
| **文档与图书** | `docx`, `doc`, `pdf`, `rtf`, `odt`, `html`, `txt`, `md` | Windows COM / Chromium PDF 无损排版引擎 + Mammoth |
| **表格与数据** | `xlsx`, `xls`, `csv`, `tsv`, `json`, `yaml`, `yml`, `xml` | Pandas + OpenPyXL + PyYAML 高精度跨格式数据交换 |
| **演示文稿** | `pptx`, `ppt` | 原生 COM 自动化导出 PDF 及逐页高清幻灯片渲染 |
| **标准图像** | `png`, `jpg`, `jpeg`, `webp`, `avif`, `tiff`, `ico`, `bmp` | Sharp 极速图像引擎、多尺寸 Windows 图标生成 |
| **专业摄影 RAW** | `cr2`, `cr3`, `nef`, `arw`, `dng` | 相机底片无损解码、EXIF 隐私清理与导出标准图像 |
| **苹果/现代图片**| `heic`, `heif`, `tga` | FFmpeg / Libheif 高保真色彩还原与解码 |
| **音频互转** | `mp3`, `wav`, `flac`, `aac`, `ogg`, `opus`, `wma`, `ac3`, `aiff`, `m4a` | FFmpeg 高保真转码、比特率自定义（128k/192k/320k） |
| **视频与动图** | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `ts`, `3gp`, `gif` | 视频转码、无损提取音频音轨、视频截取转高质量 GIF |

---

### 2. 🤖 AI & RAG 专属 Clean Markdown 提取
- **复杂 PDF ➔ Clean Markdown (`clean-md`)**：
  - 自动识别多级标题树、过滤冗余分块、完美还原 Markdown 表格与段落排版；
  - 专为大语言模型（LLM）、检索增强生成（RAG）知识库与笔记软件（Obsidian/Notion）优化。

---

### 3. 🗜️ 极致文件压缩与目标大小模式
- **PDF 智能极限压缩 (`compress`)**：重打包内容流、清除未引用的废弃对象，体积缩减 50%~80%；
- **图像智能微损/无损优化**：支持质量滑块（30%~100%）、自适应色板优化与一键抹除 EXIF 拍摄定位隐私元数据；
- **目标体积模式**：支持一键压制在微信限制（≤ 25MB）或邮件限制（≤ 50MB）范围内。

---

### 4. 🛠️ PDF 瑞士军刀高级工具箱
- **防泄密倾斜文字水印 (`watermark`)**：为 PDF 页面注入自定义半透明防泄密文字水印（如“内部机密 严禁外传”）；
- **AES-256 密码加密保护 (`encrypt`)**：为 PDF 注入高强度密码保护；
- **密码解密移除保护 (`decrypt`)**：快速清除已知密码的 PDF 权限限制；
- **表格提取转 Excel (`pdfToExcel`)**：基于版面分析自动提取 PDF 中的网格表格并转为 `.xlsx`；
- **逆向转 Word (`pdfToDocx`)**：完美逆向还原段落结构，保持严格排版保真。

---

### 5. ⚡ Windows 资源管理器右键深度集成
- 在「⚙️ 高级预设」中提供一键开关：「在 Windows 资源管理器右键菜单中显示【用 GreatFormat 转换】」；
- 开启后，在电脑任意文件夹中**鼠标右键选中文件即可直接唤起 GreatFormat 进行原子重组**！

---

### 6. 💎 东方仗助官方番剧配音与立绘点击彩蛋

全套声音均使用**JOJO 第 4 部动画与游戏官方正版声优原声（小野友树）**，采用正弦平滑渐入渐出（Fade-In / Fade-Out）曲线，听感舒适温和、绝不炸耳：

| 交互场景 | 气泡日语台词与中文含义 | 专属官方原声配音 | 漫画拟声词 |
| :--- | :--- | :--- | :--- |
| **初始待机 (IDLE)** | *「よっ！アンジェロ！ファイルをドラッグ＆ドロップしてくれ！」*<br>（哟！安杰罗！把需要重组的文件拖进来吧！） | `yo_angelo.mp3` | よっ！ |
| **文件拖入 (DRAG)** | *「クレイジー・ダイヤモンド！スタンド出現！」*<br>（替身出击！疯狂钻石准备拆解与重构！） | `crazy_diamond.mp3` | ゴゴゴゴ |
| **原子重组 (CONVERTING)** | *「ドララララララララララララッ！！DORARARARA！！」*<br>（ドラララ！疯狂钻石正在高速原子重组中！） | `dorarara.mp3` | ドラララ！ |
| **转换成功 (SUCCESS)** | *「グレートですよ、こいつはァ！完璧に直ったぜ！」*<br>（这可真是太 Great 了！所有文件已完美重构完毕！） | `great_desuyo.mp3` | グレート！ |
| **转换受阻 (ERROR)** | *「な、何だとォ！？この仗助サマの髪型をケナしたなァ！？」*<br>（可恶！遇到了阻碍！点击查看详细排查信息） | `josuke_rage.mp3` *(官方暴怒质问)* | ドドドド |
| **点击彩蛋 1: 自信名台词** | *「グレートだぜ…！この仗助サマに任せな！」*<br>（太 Great 了……！一切交给我仗助吧！） | `gureto_daze.mp3` | グレート！ |
| **点击彩蛋 2: 极致爽快感** | *「新年元旦の朝に新しいパンツを穿いたような爽快な気分だぜ！」*<br>（就像是新年元旦早晨换上了新内裤一样，浑身舒爽痛快啊！） | `underwear_quote_clean.mp3` | スッキリ！ |
| **点击彩蛋 3: 迎难而上** | *「オレのスタンド、クレイジー・ダイヤモンドはプレッシャーを跳ね返すぜ！」*<br>（替身出击！疯狂钻石可以抵御一切压力！） | `pressure_action.mp3` | ズギューン！ |
| **点击彩蛋 4: 完美修复赞叹** | *「グレートですよ、こいつはァ！完璧に直ったぜ！」*<br>（这可真是太 Great 了！所有文件已被完美修复！） | `great_desuyo.mp3` | グレート！ |
| **点击彩蛋 5: 杜王町日常** | *「よっ！アンジェロ！何か直したいファイルでもあるのか？」*<br>（哟！安杰罗！有什么需要我来修复重构的文件吗？） | `yo_angelo.mp3` | よっ！ |

---

## 💻 快速开始

### 1. 克隆与安装依赖
```bash
# 克隆仓库
git clone https://github.com/liuGuanYi-hub/GreatFormat.git
cd GreatFormat

# 安装 Node.js 依赖
npm install

# 安装 Python 高精度处理依赖 (用于 PDF 逆向、AI Markdown 与压缩)
pip install pymupdf pdf2docx pandas openpyxl pyyaml pillow
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
# 1. 查询系统支持能力与 59 种格式清单
node cli.js capabilities

# 2. 查询指定文件可转换的目标格式
node cli.js targets document.pdf

# 3. 单个/批量转换文件到指定格式 (例如 Word 转 PDF, 音频转 MP3)
node cli.js convert report.docx --to pdf --output-dir ./dist
node cli.js convert record.wav --to mp3
node cli.js convert photo.raw --to webp

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
│   ├── core/                   # 核心原子转换引擎矩阵
│   │   ├── converter-hub.js    # 统一路由调度中枢 (59 种格式全路由)
│   │   ├── media-engine.js     # 音视频转码、提取音频与特殊格式解码 (FFmpeg)
│   │   ├── data-engine.js      # Excel 表格、PPT 演示文稿与数据格式互转 (Pandas)
│   │   ├── image-engine.js     # 图像转换、压缩、EXIF 清理与多尺寸 ICO (Sharp)
│   │   ├── pdf-engine.js       # PDF 逆向 Word、Excel 提取、Clean-MD、压缩与加密水印
│   │   ├── office-engine.js    # Word/Office 2 页紧凑保真渲染 (Chromium/COM)
│   │   └── utils.js            # 工具函数库
│   ├── renderer/               # 桌面端渲染层 (Crazy Diamond UI)
│   │   ├── index.html          # 双栏现代界面与高级预设抽屉
│   │   ├── style.css           # 仗助呼吸光晕、眨眼动画与玻璃拟态
│   │   └── app.js              # 状态机调度、平滑音频控制与彩蛋互动
│   └── assets/                 # 东方仗助高清立绘、图标与正版原声音频
│       ├── audio/              # 官方番剧 1:1 独立原声音频切片
│       ├── icon.ico            # Windows 多尺寸桌面图标
│       ├── icon.png            # 东方仗助 512x512 高清头像
├── docs/                       # 核心技术文档与架构知识库
│   └── knowledge-base/         # 深度技术实践与踩坑经验知识库 (6 篇专栏)
│       ├── 01_windows_com_and_office_engine.md
│       ├── 02_pdf_reverse_engineering_and_layout_recovery.md
│       ├── 03_59_format_matrix_and_fallback_architecture.md
│       ├── 04_stirling_pdf_page_organizer_and_pymupdf.md
│       ├── 05_audio_engineering_and_voice_interaction.md
│       ├── 06_electron_portable_build_and_packaging.md
│       └── INDEX.md            # 知识库全景检索索引
├── electron-main.js            # Electron 主进程与 Windows 注册表右键菜单集成
├── preload.js                  # 安全上下文桥接隔离
├── cli.js                      # 命令行接口 (CLI / Agent)
├── package.json                # 项目依赖配置
├── LICENSE                     # MIT 开源许可证
└── README.md                   # 项目说明文档
```

---

## 📚 核心工程知识库 (Knowledge Base)

本项目将开发过程中的**核心架构设计、高保真排版算法、音视频转码避坑与桌面端构建经验**系统性沉淀为 6 篇深度专栏，欢迎查阅：

- 📖 [**GreatFormat 核心技术知识库全景导航 (INDEX.md)**](docs/knowledge-base/INDEX.md)
  1. [Windows COM 自动化与 Office/Word 完美保真转换指南](docs/knowledge-base/01_windows_com_and_office_engine.md)
  2. [PDF 逆向重构 Word (.docx) 与版面保护避坑实录](docs/knowledge-base/02_pdf_reverse_engineering_and_layout_recovery.md)
  3. [全品类 59+ 格式转换矩阵与多层回退引擎架构](docs/knowledge-base/03_59_format_matrix_and_fallback_architecture.md)
  4. [类似 Stirling-PDF 的页面可视化管理与 PyMuPDF 实战](docs/knowledge-base/04_stirling_pdf_page_organizer_and_pymupdf.md)
  5. [番剧原声交互与 Web Audio 短音频平滑播放工程](docs/knowledge-base/05_audio_engineering_and_voice_interaction.md)
  6. [Electron Builder 绿色便携免安装版打包全流程指南](docs/knowledge-base/06_electron_portable_build_and_packaging.md)

---

## 📜 开源协议

本项目采用 [MIT License](LICENSE) 协议开源。
个人免费使用与学习交流，欢迎 Star 🌟 与 PR 贡献！
