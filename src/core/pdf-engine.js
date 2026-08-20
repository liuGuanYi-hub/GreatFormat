const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { PDFDocument } = require('pdf-lib');
const { ensureDirSync } = require('./utils');

class PdfEngine {
  /**
   * PDF 逆向转 Word (.docx)
   * 使用高精度版面分析与段落结构逆向重构引擎
   * @param {string} inputPath 
   * @param {string} outputPath 
   */
  static async pdfToDocx(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    // 1. 优先使用 Python 高精度 pdf2docx 引擎进行版面重构与文字表格逆向还原
    try {
      const pyScript = `
import sys
import os
from pdf2docx import Converter

pdf_path = sys.argv[1]
docx_path = sys.argv[2]

cv = Converter(pdf_path)
cv.convert(docx_path, start=0, end=None)
cv.close()

# 规整清理意外产生的空段落分节符与超大下边距，保证完美紧凑排版
try:
    import docx
    from docx.shared import Pt
    doc = docx.Document(docx_path)
    for p in doc.paragraphs:
        if not p.text.strip():
            pPr = p._p.get_or_add_pPr()
            for child in list(pPr):
                if child.tag.endswith('sectPr'):
                    pPr.remove(child)
    for s in doc.sections:
        if s.bottom_margin.pt > 45:
            s.bottom_margin = Pt(25.5)
        if s.top_margin.pt > 45:
            s.top_margin = Pt(29.75)
    doc.save(docx_path)
except Exception as e:
    pass
`;
      const tempPy = path.join(path.dirname(resolvedOutput), `convert_pdf_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}"`);
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);

      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'High-Precision Layout Reassembly (pdf2docx)',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      console.warn('[PdfEngine] pdf2docx 转换未完成，尝试 Windows 原生 COM 方案:', err.message);
    }

    // 2. 备用尝试 Windows 原生 Word / WPS PDF Reflow
    if (process.platform === 'win32') {
      try {
        const vbsContent = `
On Error Resume Next
Dim pdfPath, docxPath
pdfPath = "${resolvedInput.replace(/\\/g, '\\\\')}"
docxPath = "${resolvedOutput.replace(/\\/g, '\\\\')}"

Dim word, doc
Set word = CreateObject("Word.Application")
If Err.Number = 0 And Not word Is Nothing Then
    word.Visible = False
    word.DisplayAlerts = False
    Set doc = word.Documents.Open(pdfPath, False, True)
    If Err.Number = 0 And Not doc Is Nothing Then
        doc.SaveAs docxPath, 16
        doc.Close False
        word.Quit False
        If Err.Number = 0 Then
            WScript.Quit 0
        End If
    End If
    word.Quit False
End If
WScript.Quit 1
`;
        const tempVbs = path.join(path.dirname(resolvedOutput), `pdf_reflow_${Date.now()}.vbs`);
        fs.writeFileSync(tempVbs, Buffer.from('\uFEFF' + vbsContent, 'utf16le'));
        try {
          await execAsync(`cscript //Nologo "${tempVbs}"`);
        } finally {
          if (fs.existsSync(tempVbs)) fs.unlinkSync(tempVbs);
        }

        if (fs.existsSync(resolvedOutput)) {
          return {
            success: true,
            engine: 'Windows Native Word Reflow',
            outputPath: resolvedOutput,
            size: fs.statSync(resolvedOutput).size
          };
        }
      } catch (e) {
        console.warn('[PdfEngine] Native reflow failed:', e.message);
      }
    }

    throw new Error('PDF 转 Word 失败：未能通过排版解析引擎提取内容，请确认文件是否受密码保护');
  }

  /**
   * PDF 转图片 (使用 PyMuPDF 高清逐页渲染)
   * @param {string} inputPath 
   * @param {string} outputDir 
   * @param {Object} options 
   */
  static async pdfToImages(inputPath, outputDir, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    const format = (options.format || 'png').toLowerCase().replace(/^\./, '');
    ensureDirSync(outputDir);
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutputDir = path.resolve(outputDir);
    const baseName = path.basename(resolvedInput, path.extname(resolvedInput));

    // 使用 PyMuPDF 高速渲染高质量光栅图像 (DPI 150)
    try {
      const pyScript = `
import sys
import os
import fitz

pdf_path = sys.argv[1]
out_dir = sys.argv[2]
fmt = sys.argv[3]
base_name = sys.argv[4]

doc = fitz.open(pdf_path)
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    out_file = os.path.join(out_dir, f"{base_name}_page_{i+1}.{fmt}")
    pix.save(out_file)
`;
      const tempPy = path.join(resolvedOutputDir, `render_pdf_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutputDir}" "${format}" "${baseName}"`);
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);

      // 扫描生成的文件
      const files = fs.readdirSync(resolvedOutputDir)
        .filter(f => f.startsWith(baseName) && f.endsWith(`.${format}`))
        .map(f => path.join(resolvedOutputDir, f));

      if (files.length > 0) {
        return {
          success: true,
          engine: 'PyMuPDF Vector Rasterizer',
          pages: files.length,
          outputPath: files[0], // 主输出文件为第一页图片
          outputFiles: files
        };
      }
    } catch (err) {
      console.warn('[PdfEngine] PyMuPDF 渲染异常:', err.message);
    }

    throw new Error('PDF 转图片失败：未能成功渲染页面');
  }

  /**
   * PDF 提取表格转 Excel (.xlsx)
   */
  static async pdfToExcel(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    try {
      const pyScript = `
import sys
import fitz
import pandas as pd

pdf_path = sys.argv[1]
out_excel = sys.argv[2]

doc = fitz.open(pdf_path)
all_tables = []

for page in doc:
    # PyMuPDF 表格查找提取能力
    tabs = page.find_tables()
    for tab in tabs:
        df = tab.to_pandas()
        if not df.empty:
            all_tables.append(df)

if not all_tables:
    # 回退：按行提取纯文本转单列表格
    lines = []
    for page in doc:
        lines.extend([line for line in page.get_text().splitlines() if line.strip()])
    df = pd.DataFrame(lines, columns=['Content'])
    df.to_excel(out_excel, index=False)
else:
    with pd.ExcelWriter(out_excel) as writer:
        for idx, df in enumerate(all_tables):
            sheet_name = f"Table_{idx+1}"[:31]
            df.to_excel(writer, sheet_name=sheet_name, index=False)
`;
      const tempPy = path.join(path.dirname(resolvedOutput), `extract_table_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}"`);
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);

      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'PyMuPDF Table Extractor & Pandas',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`PDF 表格提取失败: ${err.message}`);
    }

    throw new Error('PDF 转 Excel 未生成输出文件');
  }

  /**
   * 拆分 PDF 文件
   */
  static async splitPdf(inputPath, outputDir) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(outputDir);
    const resolvedInput = path.resolve(inputPath);
    const baseName = path.basename(resolvedInput, '.pdf');
    const existingBytes = fs.readFileSync(resolvedInput);
    const srcDoc = await PDFDocument.load(existingBytes);
    const pageCount = srcDoc.getPageCount();
    const outputFiles = [];

    for (let i = 0; i < pageCount; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);

      const outPath = path.join(outputDir, `${baseName}_page_${i + 1}.pdf`);
      const bytes = await newDoc.save();
      fs.writeFileSync(outPath, bytes);
      outputFiles.push(outPath);
    }

    return {
      success: true,
      engine: 'PDF-Lib Splitter',
      pages: pageCount,
      outputPath: outputFiles[0] || outputDir,
      outputFiles
    };
  }

  /**
   * PDF 转 Clean Markdown（保留结构树、代码块、LaTeX 与整齐表格，对接 LLM/RAG 知识库）
   */
  static async pdfToCleanMarkdown(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    try {
      const pyScript = `
import sys
import fitz

pdf_path = sys.argv[1]
out_md = sys.argv[2]

doc = fitz.open(pdf_path)
md_lines = []

for page_idx, page in enumerate(doc):
    md_lines.append(f"\\n<!-- Page {page_idx + 1} -->\\n")
    
    # 1. 尝试提取表格
    tabs = page.find_tables()
    tab_rects = []
    for tab in tabs:
        tab_rects.append(tab.bbox)
        df = tab.to_pandas()
        if not df.empty:
            md_lines.append(df.to_markdown(index=False))
            md_lines.append("\\n")

    # 2. 提取并清洗文本段落
    blocks = page.get_text("blocks")
    for b in blocks:
        # b: (x0, y0, x1, y1, text, block_no, block_type)
        if b[6] == 0:  # 文本块
            text = b[4].strip()
            if not text:
                continue
            # 过滤掉落在表格区域内的重复文本
            bx = (b[0], b[1], b[2], b[3])
            is_in_table = False
            for tr in tab_rects:
                if bx[0] >= tr[0] - 5 and bx[1] >= tr[1] - 5 and bx[2] <= tr[2] + 5 and bx[3] <= tr[3] + 5:
                    is_in_table = True
                    break
            if not is_in_table:
                # 智能标题识别
                if len(text.splitlines()) == 1 and len(text) < 50 and not text.endswith('。'):
                    md_lines.append(f"\\n### {text}\\n")
                else:
                    md_lines.append(text + "\\n")

with open(out_md, 'w', encoding='utf-8') as f:
    f.write("\\n".join(md_lines))
`;
      const tempPy = path.join(path.dirname(resolvedOutput), `pdf_to_md_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}"`);
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);

      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'PyMuPDF AI-Ready Markdown Engine',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`PDF 转 Clean Markdown 失败: ${err.message}`);
    }

    throw new Error('PDF 转 Clean Markdown 未生成输出文件');
  }

  /**
   * PDF 智能极限压缩 (重打包、垃圾清理与流压缩)
   */
  static async compressPdf(inputPath, outputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    try {
      const pyScript = `
import sys
import fitz

pdf_path = sys.argv[1]
out_pdf = sys.argv[2]
level = sys.argv[3] if len(sys.argv) > 3 else "medium"

doc = fitz.open(pdf_path)
# deflate=True, garbage=4 清除未引用对象, clean=True 规范流内容
doc.save(out_pdf, garbage=4, deflate=True, clean=True)
`;
      const tempPy = path.join(path.dirname(resolvedOutput), `compress_pdf_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      const level = options.compressionLevel || 'medium';
      await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}" "${level}"`);
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);

      if (fs.existsSync(resolvedOutput)) {
        const origSize = fs.statSync(resolvedInput).size;
        const newSize = fs.statSync(resolvedOutput).size;
        const ratio = Math.round((1 - newSize / Math.max(1, origSize)) * 100);

        return {
          success: true,
          engine: 'PyMuPDF Lossless & Stream Deflater',
          outputPath: resolvedOutput,
          originalSize: origSize,
          size: newSize,
          savedPercent: `${Math.max(0, ratio)}%`
        };
      }
    } catch (err) {
      throw new Error(`PDF 压缩失败: ${err.message}`);
    }

    throw new Error('PDF 压缩未生成输出文件');
  }

  /**
   * 为 PDF 添加防泄密倾斜文字水印
   */
  static async watermarkPdf(inputPath, outputPath, watermarkText = 'CONFIDENTIAL') {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    try {
      const pyScript = `
import sys
import fitz

pdf_path = sys.argv[1]
out_pdf = sys.argv[2]
wm_text = sys.argv[3]

doc = fitz.open(pdf_path)
for page in doc:
    rect = page.rect
    # 注入半透明防泄密水印 (支持中文字体)
    page.insert_text(
        fitz.Point(rect.width * 0.15, rect.height * 0.5),
        wm_text,
        fontsize=36,
        rotate=0,
        color=(0.7, 0.7, 0.7),
        fill_opacity=0.35,
        fontname="china-ss"
    )
doc.save(out_pdf, garbage=3, deflate=True)
`;
      const tempPy = path.join(path.dirname(resolvedOutput), `watermark_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}" "${watermarkText}"`);
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);

      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'PyMuPDF Watermark Stamper',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`PDF 添加水印失败: ${err.message}`);
    }

    throw new Error('PDF 水印处理未生成输出文件');
  }

  /**
   * PDF 密码加密保护 (AES-256)
   */
  static async encryptPdf(inputPath, outputPath, password = '') {
    if (!password) throw new Error('加密密码不能为空');
    if (!fs.existsSync(inputPath)) throw new Error(`PDF 文件不存在: ${inputPath}`);

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    try {
      const pyScript = `
import sys
import fitz

pdf_path = sys.argv[1]
out_pdf = sys.argv[2]
pwd = sys.argv[3]

doc = fitz.open(pdf_path)
# 使用 AES-256 加密保存
doc.save(out_pdf, encryption=fitz.PDF_ENCRYPT_AES_256, user_pw=pwd, owner_pw=pwd)
`;
      const tempPy = path.join(path.dirname(resolvedOutput), `encrypt_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}" "${password}"`);
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);

      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'PyMuPDF AES-256 Encryption',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`PDF 加密失败: ${err.message}`);
    }

    throw new Error('PDF 加密未生成输出文件');
  }

  /**
   * PDF 密码解密移除保护
   */
  static async decryptPdf(inputPath, outputPath, password = '') {
    if (!fs.existsSync(inputPath)) throw new Error(`PDF 文件不存在: ${inputPath}`);

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    try {
      const pyScript = `
import sys
import fitz

pdf_path = sys.argv[1]
out_pdf = sys.argv[2]
pwd = sys.argv[3] if len(sys.argv) > 3 else ""

doc = fitz.open(pdf_path)
if doc.is_encrypted:
    if not doc.authenticate(pwd):
        sys.exit(2)
doc.save(out_pdf, encryption=fitz.PDF_ENCRYPT_NONE)
`;
      const tempPy = path.join(path.dirname(resolvedOutput), `decrypt_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      try {
        await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}" "${password}"`);
      } catch (e) {
        if (e.code === 2) throw new Error('解密失败：提供的密码不正确');
        throw e;
      } finally {
        if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);
      }

      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'PyMuPDF Decryption Stripper',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`PDF 解密失败: ${err.message}`);
    }

    throw new Error('PDF 解密未生成输出文件');
  }

  /**
   * 获取 PDF 每一页的高清预览缩略图 (用于可视化页面管理)
   * @param {string} inputPath 
   * @returns {Promise<Array<{ pageIndex: number, width: number, height: number, thumbnail: string }>>}
   */
  static async renderPdfThumbnails(inputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    const resolvedInput = path.resolve(inputPath);
    try {
      const pyScript = `
import sys
import json
import base64
import fitz

pdf_path = sys.argv[1]
doc = fitz.open(pdf_path)
pages_data = []

# 缩放矩阵 (缩略图宽度约 300px，既清晰又加载极速)
zoom = 0.5
mat = fitz.Matrix(zoom, zoom)

for i in range(len(doc)):
    page = doc[i]
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_bytes = pix.tobytes("png")
    b64_str = "data:image/png;base64," + base64.b64encode(img_bytes).decode('utf-8')
    pages_data.append({
        "pageIndex": i,
        "pageNumber": i + 1,
        "width": page.rect.width,
        "height": page.rect.height,
        "rotation": page.rotation,
        "thumbnail": b64_str
    })

print(json.dumps(pages_data))
`;
      const tempPy = path.join(path.dirname(resolvedInput), `thumb_${Date.now()}.py`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');

      const { stdout } = await execAsync(`python "${tempPy}" "${resolvedInput}"`, { maxBuffer: 1024 * 1024 * 30 });
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);

      return JSON.parse(stdout);
    } catch (err) {
      throw new Error(`生成 PDF 缩略图失败: ${err.message}`);
    }
  }

  /**
   * 根据可视化重排配置生成新 PDF (支持页码顺序重排、单页 90°/180°/270° 旋转与删页)
   * @param {string} inputPath 
   * @param {string} outputPath 
   * @param {Array<{ originalIndex: number, rotateOffset: number }>} pageOperations 
   */
  static async reorganizePdf(inputPath, outputPath, pageOperations = []) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }
    if (!pageOperations || pageOperations.length === 0) {
      throw new Error('未指定重排页面操作');
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    try {
      const pyScript = `
import sys
import json
import fitz

pdf_path = sys.argv[1]
out_pdf = sys.argv[2]
ops_file = sys.argv[3]

with open(ops_file, 'r', encoding='utf-8') as f:
    ops = json.load(f)

src_doc = fitz.open(pdf_path)
dst_doc = fitz.open()

for item in ops:
    orig_idx = int(item['originalIndex'])
    rotate_offset = int(item.get('rotateOffset', 0))
    if 0 <= orig_idx < len(src_doc):
        dst_doc.insert_pdf(src_doc, from_page=orig_idx, to_page=orig_idx)
        new_page = dst_doc[-1]
        if rotate_offset != 0:
            new_page.set_rotation((new_page.rotation + rotate_offset) % 360)

dst_doc.save(out_pdf, garbage=4, deflate=True, clean=True)
`;
      const tempPy = path.join(path.dirname(resolvedOutput), `reorganize_${Date.now()}.py`);
      const tempJson = path.join(path.dirname(resolvedOutput), `ops_${Date.now()}.json`);
      fs.writeFileSync(tempPy, pyScript, 'utf8');
      fs.writeFileSync(tempJson, JSON.stringify(pageOperations), 'utf8');

      try {
        await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}" "${tempJson}"`);
      } finally {
        if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);
        if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson);
      }

      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'PyMuPDF Page Organizer',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size,
          pages: pageOperations.length
        };
      }
    } catch (err) {
      throw new Error(`PDF 页面重排失败: ${err.message}`);
    }

    throw new Error('PDF 页面重排未生成输出文件');
  }
}

module.exports = PdfEngine;
