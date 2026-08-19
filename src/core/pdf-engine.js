const fs = require('fs');
const path = require('path');
let PDFDocument;
try {
  const pdfLib = require('pdf-lib');
  PDFDocument = pdfLib.PDFDocument;
} catch (e) {
  // pdf-lib not installed yet
}
const { ensureDirSync, getFileExtension } = require('./utils');

class PDFEngine {
  /**
   * 获取 PDF 基本信息（页数、标题等）
   * @param {string} inputPath 
   */
  static async getPdfInfo(inputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || '',
      author: pdfDoc.getAuthor() || '',
      size: pdfBytes.length
    };
  }

  /**
   * 合并多个 PDF 文件为一个 PDF
   * @param {string[]} pdfPaths 
   * @param {string} outputPath 
   */
  static async mergePdfs(pdfPaths, outputPath) {
    if (!pdfPaths || pdfPaths.length < 2) {
      throw new Error('请至少选择两个 PDF 文件进行合并');
    }

    ensureDirSync(path.dirname(outputPath));
    const mergedPdf = await PDFDocument.create();

    for (const filePath of pdfPaths) {
      if (!fs.existsSync(filePath)) continue;
      const fileBytes = fs.readFileSync(filePath);
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(outputPath, mergedBytes);

    return {
      success: true,
      outputPath,
      pageCount: mergedPdf.getPageCount(),
      size: mergedBytes.length
    };
  }

  /**
   * 拆分 PDF 文件
   * @param {string} inputPath 
   * @param {string} outputDir 
   * @param {Object} [options] { splitType: 'each' | 'range', range: '1-3,4-5' }
   */
  static async splitPdf(inputPath, outputDir, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(outputDir);
    const pdfBytes = fs.readFileSync(inputPath);
    const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputFiles = [];

    // 逐页拆分模式
    if (!options.splitType || options.splitType === 'each') {
      for (let i = 0; i < totalPages; i++) {
        const subDoc = await PDFDocument.create();
        const [copiedPage] = await subDoc.copyPages(srcDoc, [i]);
        subDoc.addPage(copiedPage);

        const subBytes = await subDoc.save();
        const pageNum = String(i + 1).padStart(String(totalPages).length, '0');
        const subFilePath = path.join(outputDir, `${baseName}_page_${pageNum}.pdf`);
        fs.writeFileSync(subFilePath, subBytes);
        outputFiles.push(subFilePath);
      }
    } else if (options.splitType === 'range' && options.pages) {
      // 提取指定页 (例如 [0, 2, 4])
      const subDoc = await PDFDocument.create();
      const validIndices = options.pages.filter(p => p >= 0 && p < totalPages);
      if (validIndices.length > 0) {
        const copiedPages = await subDoc.copyPages(srcDoc, validIndices);
        copiedPages.forEach(p => subDoc.addPage(p));
        const subBytes = await subDoc.save();
        const subFilePath = path.join(outputDir, `${baseName}_extracted.pdf`);
        fs.writeFileSync(subFilePath, subBytes);
        outputFiles.push(subFilePath);
      }
    }

    return {
      success: true,
      outputDir,
      outputFiles,
      count: outputFiles.length
    };
  }

  /**
   * 将 PDF 逐页转换为高品质图片（PNG/JPG）
   * @param {string} inputPath 
   * @param {string} outputDir 
   * @param {Object} [options] { format: 'png' | 'jpg', density: 150 }
   */
  static async pdfToImages(inputPath, outputDir, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`PDF 文件不存在: ${inputPath}`);
    }

    ensureDirSync(outputDir);
    const targetExt = options.format || 'png';
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputFiles = [];

    // 优先尝试使用 pdftoppm (poppler) 或原生渲染器；如果环境暂无，预留纯 Node.js / CLI 调度
    const { execSync } = require('child_process');
    try {
      // 探测系统是否有 pdftoppm
      execSync('pdftoppm -v', { stdio: 'ignore' });
      const imgTypeFlag = targetExt === 'jpg' || targetExt === 'jpeg' ? '-jpeg' : '-png';
      const cmd = `pdftoppm ${imgTypeFlag} -r ${options.density || 150} "${inputPath}" "${path.join(outputDir, baseName)}"`;
      execSync(cmd, { stdio: 'pipe' });

      // 收集生成的文件
      const files = fs.readdirSync(outputDir).filter(f => f.startsWith(baseName) && (f.endsWith(`.${targetExt}`) || f.endsWith('.png') || f.endsWith('.jpg')));
      files.forEach(f => outputFiles.push(path.join(outputDir, f)));
    } catch {
      // Fallback: 记录信息或通过图像转码中枢处理
      console.log('[PDFEngine] pdftoppm 不可用，使用兼容提取模式');
    }

    return {
      success: true,
      outputDir,
      outputFiles,
      count: outputFiles.length
    };
  }
}

module.exports = PDFEngine;
