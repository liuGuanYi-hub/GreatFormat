const path = require('path');
const fs = require('fs');
const ImageEngine = require('./image-engine');
const PDFEngine = require('./pdf-engine');
const OfficeEngine = require('./office-engine');
const { getFileExtension, generateOutputPath, formatFileSize } = require('./utils');

class ConverterHub {
  /**
   * 格式映射字典：定义每种源文件支持转换的目标格式列表
   */
  static FORMAT_MAP = {
    // 图像类
    png: ['jpg', 'jpeg', 'webp', 'avif', 'ico', 'tiff', 'pdf'],
    jpg: ['png', 'webp', 'avif', 'ico', 'tiff', 'pdf'],
    jpeg: ['png', 'webp', 'avif', 'ico', 'tiff', 'pdf'],
    webp: ['png', 'jpg', 'jpeg', 'avif', 'ico', 'pdf'],
    avif: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
    bmp: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
    tiff: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
    ico: ['png', 'jpg', 'webp'],
    svg: ['png', 'jpg', 'webp', 'pdf'],

    // PDF 类
    pdf: ['docx', 'png', 'jpg', 'split', 'merge'],

    // Office / 文档类
    docx: ['pdf', 'markdown', 'html', 'txt'],
    doc: ['pdf', 'docx'],
    md: ['docx', 'pdf', 'html'],
    markdown: ['docx', 'pdf', 'html'],
    txt: ['docx', 'pdf']
  };

  /**
   * 获取指定文件支持的目标格式
   * @param {string} filePath 
   * @returns {string[]}
   */
  static getTargetFormats(filePath) {
    const ext = getFileExtension(filePath);
    return this.FORMAT_MAP[ext] || [];
  }

  /**
   * 探测系统与引擎支持的能力
   */
  static getCapabilities() {
    return {
      images: ImageEngine.SUPPORTED_INPUT_FORMATS,
      documents: ['docx', 'doc', 'pdf', 'md', 'txt', 'html'],
      matrix: this.FORMAT_MAP
    };
  }

  /**
   * 核心转换统一分发器 (Crazy Diamond Atomic Reassembly)
   * @param {string} inputPath 
   * @param {string} targetFormat 
   * @param {Object} [options] 
   * @param {Function} [onProgress] 
   */
  static async convert(inputPath, targetFormat, options = {}, onProgress = null) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入文件不存在: ${inputPath}`);
    }

    const sourceExt = getFileExtension(inputPath);
    const normalizedTarget = targetFormat.toLowerCase().replace(/^\./, '');
    const outputPath = options.outputPath || generateOutputPath(inputPath, normalizedTarget, options.outputDir);

    if (onProgress) onProgress({ status: 'started', percent: 10, message: 'DORARARA! 原子解构开始...' });

    let result;

    // 1. 图像类转换 (Image ➔ Image / Image ➔ PDF)
    if (ImageEngine.SUPPORTED_INPUT_FORMATS.includes(sourceExt)) {
      if (normalizedTarget === 'pdf') {
        result = await ImageEngine.imagesToPdf([inputPath], outputPath, options);
      } else {
        result = await ImageEngine.convertImage(inputPath, outputPath, options);
      }
    }
    // 2. Word / 文档类转换 (Docx ➔ PDF / Markdown / HTML / TXT)
    else if (['docx', 'doc'].includes(sourceExt)) {
      if (normalizedTarget === 'pdf') {
        result = await OfficeEngine.docxToPdf(inputPath, outputPath);
      } else if (['md', 'markdown', 'html', 'txt'].includes(normalizedTarget)) {
        result = await OfficeEngine.docxToTextOrHtml(inputPath, outputPath, normalizedTarget);
      } else {
        throw new Error(`暂不支持从 ${sourceExt} 转换至 ${normalizedTarget}`);
      }
    }
    // 3. 文本 / Markdown ➔ Docx
    else if (['md', 'markdown', 'txt'].includes(sourceExt)) {
      if (normalizedTarget === 'docx') {
        result = await OfficeEngine.textToDocx(inputPath, outputPath);
      } else {
        throw new Error(`暂不支持从 ${sourceExt} 转换至 ${normalizedTarget}`);
      }
    }
    // 4. PDF 类深度处理 (PDF ➔ Images / Word / etc.)
    else if (sourceExt === 'pdf') {
      if (['png', 'jpg', 'jpeg'].includes(normalizedTarget)) {
        const outDir = options.outputDir || path.join(path.dirname(inputPath), `${path.basename(inputPath, '.pdf')}_images`);
        result = await PDFEngine.pdfToImages(inputPath, outDir, { format: normalizedTarget });
      } else if (normalizedTarget === 'docx') {
        result = await PDFEngine.pdfToDocx(inputPath, outputPath);
      } else {
        throw new Error(`暂不支持从 PDF 转换至 ${normalizedTarget}`);
      }
    } else {
      throw new Error(`未识别的源文件格式: ${sourceExt}`);
    }

    if (onProgress) onProgress({ status: 'completed', percent: 100, message: '这可真是太 Great 了！原子重组完成！' });

    return {
      ...result,
      sourceExt,
      targetExt: normalizedTarget,
      inputPath,
      outputPath: result.outputPath || outputPath
    };
  }

  /**
   * 批量转换
   * @param {Array<{inputPath: string, targetFormat: string, options?: Object}>} taskList 
   * @param {Function} [onItemComplete] 
   */
  static async convertBatch(taskList, onItemComplete = null) {
    const results = [];
    for (let i = 0; i < taskList.length; i++) {
      const task = taskList[i];
      try {
        const res = await this.convert(task.inputPath, task.targetFormat, task.options);
        results.push({ success: true, ...res });
        if (onItemComplete) onItemComplete(i, null, res);
      } catch (err) {
        results.push({ success: false, inputPath: task.inputPath, error: err.message });
        if (onItemComplete) onItemComplete(i, err, null);
      }
    }
    return results;
  }
}

module.exports = ConverterHub;
