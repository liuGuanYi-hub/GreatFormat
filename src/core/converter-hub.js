const path = require('path');
const fs = require('fs');
const ImageEngine = require('./image-engine');
const PDFEngine = require('./pdf-engine');
const OfficeEngine = require('./office-engine');
const MediaEngine = require('./media-engine');
const DataEngine = require('./data-engine');
const { getFileExtension, generateOutputPath, formatFileSize } = require('./utils');

class ConverterHub {
  /**
   * 格式映射字典：定义每种源文件支持转换的目标格式列表（50+ 格式全能矩阵）
   */
  static FORMAT_MAP = {
    // 图像类 (Images & RAW & Vectors)
    png: ['jpg', 'jpeg', 'webp', 'avif', 'ico', 'tiff', 'bmp', 'gif', 'pdf'],
    jpg: ['png', 'webp', 'avif', 'ico', 'tiff', 'bmp', 'gif', 'pdf'],
    jpeg: ['png', 'webp', 'avif', 'ico', 'tiff', 'bmp', 'gif', 'pdf'],
    webp: ['png', 'jpg', 'jpeg', 'avif', 'ico', 'tiff', 'bmp', 'gif', 'pdf'],
    avif: ['png', 'jpg', 'jpeg', 'webp', 'ico', 'tiff', 'pdf'],
    bmp: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'tiff', 'pdf'],
    tiff: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'pdf'],
    tif: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'pdf'],
    gif: ['png', 'jpg', 'webp', 'mp4', 'pdf'],
    ico: ['png', 'jpg', 'webp'],
    svg: ['png', 'jpg', 'webp', 'ico', 'pdf'],
    heic: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
    heif: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
    tga: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
    cr2: ['jpg', 'png', 'webp', 'tiff'],
    cr3: ['jpg', 'png', 'webp', 'tiff'],
    nef: ['jpg', 'png', 'webp', 'tiff'],
    arw: ['jpg', 'png', 'webp', 'tiff'],
    dng: ['jpg', 'png', 'webp', 'tiff'],

    // PDF 全能工具箱
    pdf: ['docx', 'xlsx', 'png', 'jpg', 'webp', 'txt', 'html', 'split'],

    // Office 文档与演示类
    docx: ['pdf', 'html', 'txt', 'md', 'epub'],
    doc: ['pdf', 'docx', 'html', 'txt', 'md'],
    rtf: ['pdf', 'docx', 'html', 'txt', 'md'],
    odt: ['pdf', 'docx', 'html', 'txt', 'md'],
    pptx: ['pdf', 'png', 'jpg'],
    ppt: ['pdf', 'png', 'jpg'],
    xlsx: ['pdf', 'csv', 'tsv', 'json', 'html'],
    xls: ['pdf', 'xlsx', 'csv', 'json', 'html'],
    csv: ['xlsx', 'json', 'yaml', 'tsv', 'html'],
    tsv: ['xlsx', 'csv', 'json', 'html'],

    // 纯文本、Markdown 与电子书
    md: ['docx', 'pdf', 'html', 'txt', 'epub'],
    markdown: ['docx', 'pdf', 'html', 'txt', 'epub'],
    txt: ['docx', 'pdf', 'html', 'md', 'epub'],
    epub: ['txt', 'md', 'html', 'pdf', 'docx'],
    mobi: ['txt', 'md', 'html', 'pdf', 'epub'],

    // 结构化数据
    json: ['xlsx', 'csv', 'yaml', 'xml'],
    yaml: ['json', 'csv', 'xlsx'],
    yml: ['json', 'csv', 'xlsx'],
    xml: ['json', 'yaml'],

    // 音频格式互转
    mp3: ['wav', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wma', 'ac3'],
    wav: ['mp3', 'flac', 'm4a', 'aac', 'ogg', 'opus', 'wma', 'ac3'],
    flac: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus', 'wma'],
    m4a: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'opus'],
    aac: ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'opus'],
    ogg: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'opus'],
    opus: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'],
    wma: ['mp3', 'wav', 'flac', 'm4a', 'aac'],
    ac3: ['mp3', 'wav', 'flac', 'aac'],
    aiff: ['mp3', 'wav', 'flac', 'm4a'],

    // 视频格式互转与提取音频
    mp4: ['mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'gif', 'mp3', 'wav', 'aac', 'm4a', 'flac'],
    mkv: ['mp4', 'avi', 'mov', 'wmv', 'webm', 'gif', 'mp3', 'wav', 'aac', 'flac'],
    avi: ['mp4', 'mkv', 'mov', 'wmv', 'webm', 'gif', 'mp3', 'wav', 'aac'],
    mov: ['mp4', 'mkv', 'avi', 'wmv', 'webm', 'gif', 'mp3', 'wav', 'aac'],
    wmv: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'gif', 'mp3', 'wav'],
    flv: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'mp3', 'wav'],
    webm: ['mp4', 'mkv', 'mov', 'gif', 'mp3', 'wav', 'ogg'],
    m4v: ['mp4', 'mkv', 'mov', 'mp3', 'aac'],
    ts: ['mp4', 'mkv', 'mp3', 'wav'],
    '3gp': ['mp4', 'mp3', 'aac']
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
      audio: MediaEngine.AUDIO_FORMATS,
      video: MediaEngine.VIDEO_FORMATS,
      documents: ['docx', 'doc', 'pdf', 'md', 'txt', 'html', 'pptx', 'ppt', 'xlsx', 'xls', 'csv', 'epub'],
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

    // 1. 音频格式转换 (Audio ➔ Audio)
    if (MediaEngine.AUDIO_FORMATS.includes(sourceExt)) {
      result = await MediaEngine.convertAudio(inputPath, outputPath, options);
    }
    // 2. 视频格式转换与提取音频 / 动图 (Video ➔ Video / Audio / GIF)
    else if (MediaEngine.VIDEO_FORMATS.includes(sourceExt)) {
      result = await MediaEngine.convertVideo(inputPath, outputPath, options);
    }
    // 3. 图像类转换 (Image ➔ Image / Image ➔ PDF / RAW / Special)
    else if (ImageEngine.SUPPORTED_INPUT_FORMATS.includes(sourceExt)) {
      if (normalizedTarget === 'pdf') {
        result = await ImageEngine.imagesToPdf([inputPath], outputPath, options);
      } else {
        result = await ImageEngine.convertImage(inputPath, outputPath, options);
      }
    }
    // 4. Excel 表格 / 数据交换类 (xlsx / xls / csv / tsv / json / yaml / xml)
    else if (DataEngine.SPREADSHEET_FORMATS.includes(sourceExt) || DataEngine.DATA_FORMATS.includes(sourceExt)) {
      result = await DataEngine.convertDataOrSpreadsheet(inputPath, outputPath, options);
    }
    // 5. PPT 演示文稿 (PPTX / PPT ➔ PDF / 逐页图片)
    else if (['pptx', 'ppt'].includes(sourceExt)) {
      result = await DataEngine.convertPresentation(inputPath, outputPath, options);
    }
    // 6. Word / RTF / ODT 文档类 (Docx ➔ PDF / Markdown / HTML / TXT)
    else if (['docx', 'doc', 'rtf', 'odt'].includes(sourceExt)) {
      if (normalizedTarget === 'pdf') {
        result = await OfficeEngine.docxToPdf(inputPath, outputPath);
      } else if (['md', 'markdown', 'html', 'txt'].includes(normalizedTarget)) {
        result = await OfficeEngine.docxToTextOrHtml(inputPath, outputPath, normalizedTarget);
      } else {
        throw new Error(`暂不支持从 ${sourceExt} 转换至 ${normalizedTarget}`);
      }
    }
    // 7. 纯文本 / Markdown ➔ Docx / PDF
    else if (['md', 'markdown', 'txt'].includes(sourceExt)) {
      if (normalizedTarget === 'docx') {
        result = await OfficeEngine.textToDocx(inputPath, outputPath);
      } else if (normalizedTarget === 'pdf') {
        const tempDocx = path.join(path.dirname(outputPath), `temp_${Date.now()}.docx`);
        try {
          await OfficeEngine.textToDocx(inputPath, tempDocx);
          result = await OfficeEngine.docxToPdf(tempDocx, outputPath);
        } finally {
          if (fs.existsSync(tempDocx)) fs.unlinkSync(tempDocx);
        }
      } else {
        result = await DataEngine.convertDataOrSpreadsheet(inputPath, outputPath, options);
      }
    }
    // 8. PDF 全能工具箱 (PDF ➔ Images / Word / Excel / Split / Clean-MD / Compress / Watermark / Crypt)
    else if (sourceExt === 'pdf') {
      if (['png', 'jpg', 'jpeg', 'webp'].includes(normalizedTarget)) {
        const outDir = options.outputDir || path.join(path.dirname(inputPath), `${path.basename(inputPath, '.pdf')}_images`);
        result = await PDFEngine.pdfToImages(inputPath, outDir, { format: normalizedTarget });
      } else if (normalizedTarget === 'docx') {
        result = await PDFEngine.pdfToDocx(inputPath, outputPath);
      } else if (['xlsx', 'xls'].includes(normalizedTarget)) {
        result = await PDFEngine.pdfToExcel(inputPath, outputPath);
      } else if (['clean-md', 'clean_md', 'md', 'markdown'].includes(normalizedTarget)) {
        const finalMdPath = outputPath.endsWith('.md') ? outputPath : outputPath + '.md';
        result = await PDFEngine.pdfToCleanMarkdown(inputPath, finalMdPath);
      } else if (['compress', 'compressed'].includes(normalizedTarget)) {
        const compPath = outputPath.endsWith('.pdf') ? outputPath.replace(/\.pdf$/, '_compressed.pdf') : outputPath + '.pdf';
        result = await PDFEngine.compressPdf(inputPath, compPath, options);
      } else if (normalizedTarget === 'watermark') {
        const wmPath = outputPath.endsWith('.pdf') ? outputPath.replace(/\.pdf$/, '_watermarked.pdf') : outputPath + '.pdf';
        result = await PDFEngine.watermarkPdf(inputPath, wmPath, options.watermarkText || 'CONFIDENTIAL');
      } else if (normalizedTarget === 'encrypt') {
        const encPath = outputPath.endsWith('.pdf') ? outputPath.replace(/\.pdf$/, '_encrypted.pdf') : outputPath + '.pdf';
        result = await PDFEngine.encryptPdf(inputPath, encPath, options.password || '123456');
      } else if (normalizedTarget === 'decrypt') {
        const decPath = outputPath.endsWith('.pdf') ? outputPath.replace(/\.pdf$/, '_decrypted.pdf') : outputPath + '.pdf';
        result = await PDFEngine.decryptPdf(inputPath, decPath, options.password || '');
      } else if (normalizedTarget === 'split') {
        const outDir = options.outputDir || path.join(path.dirname(inputPath), `${path.basename(inputPath, '.pdf')}_pages`);
        result = await PDFEngine.splitPdf(inputPath, outDir);
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
