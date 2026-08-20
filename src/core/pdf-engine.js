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
   * 合并多个 PDF 文件
   */
  static async mergePdfs(pdfPaths, outputPath) {
    if (!pdfPaths || pdfPaths.length === 0) {
      throw new Error('未提供待合并的 PDF 文件列表');
    }

    ensureDirSync(path.dirname(outputPath));
    const mergedDoc = await PDFDocument.create();

    for (const pdfPath of pdfPaths) {
      const bytes = fs.readFileSync(pdfPath);
      const doc = await PDFDocument.load(bytes);
      const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      for (const page of pages) {
        mergedDoc.addPage(page);
      }
    }

    const mergedBytes = await mergedDoc.save();
    fs.writeFileSync(outputPath, mergedBytes);

    return {
      success: true,
      engine: 'PDF-Lib Merger',
      outputPath,
      size: fs.statSync(outputPath).size
    };
  }
}

module.exports = PdfEngine;
