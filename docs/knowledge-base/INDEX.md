# 📚 GreatFormat 核心工程知识库 (Knowledge Base)

本知识库系统性沉淀了 **GreatFormat (太棒格式) - 疯狂钻石全能文件转换器** 在架构设计、Windows COM 自动化、PDF 逆向工程、多媒体流式转码、Stirling-PDF 页面管理、音频工程与 Electron 桌面端打包等核心领域的深度技术实践与避坑经验。

---

## 📑 知识库文章索引目录

| 序号 | 知识库文档 | 核心技术要点 | 关键收获与避坑指南 |
| :---: | :--- | :--- | :--- |
| **01** | [**Windows COM 自动化与 Office/Word 完美保真转换指南**](./01_windows_com_and_office_engine.md) | Python `win32com.client`、Microsoft Word 原生 `ExportAsFixedFormat`、多阶梯回退 | 彻底解决含空格路径导致 COM 静默失败而错误回退到纯文本网页渲染导致的排版残缺问题 |
| **02** | [**PDF 逆向重构 Word (.docx) 与版面保护避坑实录**](./02_pdf_reverse_engineering_and_layout_recovery.md) | `pdf2docx` 版面流拟合、OpenXML 分节符保护 | 根治过度段落清理误删 `sectPr` 导致的工作经历文字丢失与空圆点 `•` 问题 |
| **03** | [**全品类 59+ 格式转换矩阵与多层回退引擎架构**](./03_59_format_matrix_and_fallback_architecture.md) | Sharp + Pillow + FFmpeg + Pandas 混合驱动 | 解决 32-bit BMP 等特殊位深图像解码、动态 GIF 转视频与全双工数据互转 |
| **04** | [**类似 Stirling-PDF 的页面可视化管理与 PyMuPDF 实战**](./04_stirling_pdf_page_organizer_and_pymupdf.md) | PyMuPDF 72 DPI 缩略图画廊、HTML5 拖拽调序、90°/180°/270° 单页旋转 | 毫秒级重组无损保存，临时 JSON 文件解决 Windows 命令行参数引号剥离 |
| **05** | [**番剧原声交互与 Web Audio 短音频平滑播放工程**](./05_audio_engineering_and_voice_interaction.md) | JOJO 4 东方仗助官方正版声优原声（小野友树）、FFmpeg `loudnorm`、S-Curve 渐入渐出 | 解决超短音频被提前淡出截断问题，确保每一句台词饱满洪亮 |
| **06** | [**Electron Builder 绿色便携免安装版打包全流程指南**](./06_electron_portable_build_and_packaging.md) | `electron-builder`、Portable `.exe`、多尺寸 `icon.ico`、国内镜像加速 | 彻底绕开 Windows 非管理员权限下的 `winCodeSign` symlink 报错 |

---

## 💎 架构核心理念
- **100% 纯本地离线 (Offline & Local First)**：绝不上云，保护用户隐私与商业机密；
- **极致保真 (Pixel-Perfect Fidelity)**：优先调用操作系统底层原生软件能力，追求 1:1 像素级对齐；
- **沉浸式交互 (Fun & Soul)**：融合 JOJO 正版声优原声与漫画拟声词，让工具既高效又好玩。\n