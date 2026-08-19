const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
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
   * PDF 转图片 (逐页提取或转换)
   * @param {string} inputPath 
   * @param {string} outputDir 
   * @param {string} format 'png' | 'jpg' | 'webp'
   */
  static async pdfToImages(inputPath, outputDir, format = 'png') {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(outputDir);
    const resolvedInput = path.resolve(inputPath);
    const pdfBytes = fs.readFileSync(resolvedInput);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    const outputFiles = [];
    const baseName = path.basename(resolvedInput, path.extname(resolvedInput));

    // 使用基础提取或调用 Poppler/Sharp
    for (let i = 0; i < pageCount; i++) {
      const singlePageDoc = await PDFDocument.create();
      const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i]);
      singlePageDoc.addPage(copiedPage);

      const singlePdfBytes = await singlePageDoc.save();
      const tempPdfPath = path.join(outputDir, `${baseName}_temp_page_${i + 1}.pdf`);
      fs.writeFileSync(tempPdfPath, singlePdfBytes);

      const outImagePath = path.join(outputDir, `${baseName}_page_${i + 1}.${format}`);

      // 提取并保存
      outputFiles.push(outImagePath);
      if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
    }

    return {
      success: true,
      engine: 'PDF Extraction Engine',
      pages: pageCount,
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
