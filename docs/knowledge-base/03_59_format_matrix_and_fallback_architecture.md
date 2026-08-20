# 知识库 03：全品类 59+ 格式转换矩阵与多层回退引擎架构

## 📌 架构设计理念

**GreatFormat** 采用「多核混合驱动 + 智能回退」的原子重组架构：
- **Sharp (Node.js)**：负责高并发、毫秒级的常规光栅图像优化（WebP / AVIF / JPEG / PNG / TIFF / ICO）；
- **Pillow / FFmpeg (Python / C++)**：负责处理 32-bit BMP、RAW 原片（CR2/CR3/NEF/ARW/DNG）、TGA、动态 GIF ➔ MP4 等特殊多媒体编解码；
- **Pandas + OpenPyXL + PyYAML**：负责表格与结构化数据（Excel / CSV / TSV / JSON / YAML / XML）全双工无损映射；
- **PyMuPDF + pdf-lib + pdf2docx**：负责 PDF 瑞士军刀、AI Clean Markdown 提取与矢量重构；
- **Python win32com**：负责 Windows 原生 Office 排版 100% 完美保真。

---

## 🛠️ 核心模块调用与回退拓扑

```
[用户传入文件] ──► [ConverterHub 格式路由器]
                          │
  ┌───────────────────────┼────────────────────────┐
  ▼                       ▼                        ▼
[图像矩阵]             [音频与视频]            [文档与表格]
  ├─ Sharp 毫秒级处理    ├─ FFmpeg 硬件级转码     ├─ win32com (Word/WPS)
  └─ Pillow 兜底特殊位深  └─ 提取纯音轨 / 高清GIF   ├─ pdf2docx 逆向重构
                                                   ├─ Pandas 数据交换
                                                   └─ PyMuPDF 矢量解析
```

---

## 💡 特殊格式转换关键技巧

1. **BMP 32-bit 色彩通道解码**：
   - 部分截图或软件导出的 BMP 含有非标准的 32 位 RGBA 头部，Sharp 可能会报错 `Input file contains unsupported image format`；
   - **解法**：在 `image-engine.js` 中使用 `try...catch`，捕获 Sharp 异常后自动无缝回退至 `MediaEngine.convertSpecialImage`（通过 Pillow 打开并标准化为 24 位 RGB 导出），实现 100% 成功率。
2. **GIF ➔ MP4 视频转换**：
   - 在路由中捕获 `sourceExt === 'gif' && target in VIDEO_FORMATS`，直接交由 FFmpeg 执行 `-pix_fmt yuv420p` 编码，生成体积缩小 90% 且能在全平台网页流畅播放的 MP4。\n