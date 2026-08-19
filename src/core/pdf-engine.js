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
from pdf2docx import Converter
import os

pdf_path = sys.argv[1]
docx_path = sys.argv[2]

cv = Converter(pdf_path)
cv.convert(docx_path, start=0, end=None)
cv.close()
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
      console.warn('[PdfEngine] pdf2docx 转换未完成，尝试備用方式:', err.message);
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
   * 合并多个 PDF 文件
   */
  static async mergePdfs(pdfPaths, outputPath) {
    if (!pdfPaths || pdfPaths.length === 0) {
      throw new Error('未提供待合并的 PDF 文件列表');
    }

    ensureDirSync(path.dirname(outputPath));
    const mergedDoc = await PDFDocument.create();

    for (const filePath of pdfPaths) {
      if (!fs.existsSync(filePath)) continue;
      const pdfBytes = fs.readFileSync(filePath);
      const donorDoc = await PDFDocument.load(pdfBytes);
      const indices = donorDoc.getPageIndices();
      const copiedPages = await mergedDoc.copyPages(donorDoc, indices);
      copiedPages.forEach(p => mergedDoc.addPage(p));
    }

    const mergedBytes = await mergedDoc.save();
    fs.writeFileSync(outputPath, mergedBytes);

    return {
      success: true,
      engine: 'PDF-Lib Merge Engine',
      outputPath,
      pageCount: mergedDoc.getPageCount(),
      size: mergedBytes.length
    };
  }
}

module.exports = PdfEngine;
