const fs = require('fs');
const path = require('path');
const { ensureDirSync, getFileExtension } = require('./utils');

let PDFDocument;
try {
  const pdfLib = require('pdf-lib');
  PDFDocument = pdfLib.PDFDocument;
} catch (e) {
  // pdf-lib not installed yet
}

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  // Sharp not loaded yet
}

class ImageEngine {
  static RAW_FORMATS = ['cr2', 'cr3', 'nef', 'arw', 'dng'];
  static SPECIAL_FORMATS = ['heic', 'heif', 'tga'];
  static SUPPORTED_INPUT_FORMATS = [
    'png', 'jpg', 'jpeg', 'webp', 'avif', 'bmp', 'gif', 'tiff', 'tif', 'ico', 'svg',
    'heic', 'heif', 'tga', 'cr2', 'cr3', 'nef', 'arw', 'dng'
  ];
  static SUPPORTED_OUTPUT_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'tiff', 'bmp', 'gif', 'pdf'];

  /**
   * 单图格式转换与压缩
   */
  static async convertImage(inputPath, outputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入图片不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const srcExt = getFileExtension(inputPath);
    const targetExt = getFileExtension(outputPath);

    // 如果是特殊格式或 RAW 原片，走 FFmpeg / Python 解码
    if (this.SPECIAL_FORMATS.includes(srcExt) || this.RAW_FORMATS.includes(srcExt)) {
      const MediaEngine = require('./media-engine');
      return await MediaEngine.convertSpecialImage(inputPath, outputPath);
    }

    // 如果目标是 PDF，走多图/单图转 PDF
    if (targetExt === 'pdf') {
      return await this.imagesToPdf([inputPath], outputPath, options);
    }

    if (!sharp) {
      throw new Error('Sharp 图像处理引擎未就绪，请运行 npm install 安装依赖');
    }

    let pipeline = sharp(inputPath);

    // 尺寸调整
    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width ? parseInt(options.width, 10) : undefined,
        height: options.height ? parseInt(options.height, 10) : undefined,
        fit: options.fit || 'inside',
        withoutEnlargement: true
      });
    }

    // EXIF 隐私元数据清除处理
    if (options.stripExif !== false) {
      pipeline = pipeline.withMetadata({ orientation: 1 }); // 仅保留方向校正，彻底清除 GPS 及相机元数据
    }

    const quality = options.quality ? Math.min(100, Math.max(1, parseInt(options.quality, 10))) : 82;

    switch (targetExt) {
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, quality: Math.min(100, quality) });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 5 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, effort: 4 });
        break;
      case 'tiff':
        pipeline = pipeline.tiff({ quality });
        break;
      case 'ico':
        return await this.generateIco(inputPath, outputPath, options);
      default:
        throw new Error(`不支持的图片目标格式: ${targetExt}`);
    }

    await pipeline.toFile(outputPath);
    const origSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const ratio = Math.round((1 - newSize / Math.max(1, origSize)) * 100);

    return {
      success: true,
      engine: 'Sharp High-Efficiency Image Optimizer',
      outputPath,
      originalSize: origSize,
      size: newSize,
      savedPercent: `${Math.max(0, ratio)}%`
    };
  }

  /**
   * 生成 Windows .ico 图标
   */
  static async generateIco(inputPath, outputPath, options = {}) {
    if (!sharp) {
      throw new Error('Sharp 图像引擎未就绪');
    }
    const size = options.icoSize || 256;
    const pngBuffer = await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    const icoHeader = Buffer.alloc(6);
    icoHeader.writeUInt16LE(0, 0);
    icoHeader.writeUInt16LE(1, 2);
    icoHeader.writeUInt16LE(1, 4);

    const icoEntry = Buffer.alloc(16);
    icoEntry.writeUInt8(size >= 256 ? 0 : size, 0);
    icoEntry.writeUInt8(size >= 256 ? 0 : size, 1);
    icoEntry.writeUInt8(0, 2);
    icoEntry.writeUInt8(0, 3);
    icoEntry.writeUInt16LE(1, 4);
    icoEntry.writeUInt16LE(32, 6);
    icoEntry.writeUInt32LE(pngBuffer.length, 8);
    icoEntry.writeUInt32LE(22, 12);

    const finalBuffer = Buffer.concat([icoHeader, icoEntry, pngBuffer]);
    fs.writeFileSync(outputPath, finalBuffer);

    return {
      success: true,
      outputPath,
      size: finalBuffer.length
    };
  }

  /**
   * 多图合并为单个 PDF 文件 (高兼容性处理)
   */
  static async imagesToPdf(imagePaths, outputPdfPath, options = {}) {
    if (!imagePaths || imagePaths.length === 0) {
      throw new Error('请至少提供一张图片');
    }

    if (!PDFDocument) {
      throw new Error('pdf-lib 模块未加载，请确认已执行 npm install');
    }

    ensureDirSync(path.dirname(outputPdfPath));
    const pdfDoc = await PDFDocument.create();

    for (const imgPath of imagePaths) {
      if (!fs.existsSync(imgPath)) {
        throw new Error(`图片文件未找到: ${imgPath}`);
      }

      let imageBytes = fs.readFileSync(imgPath);
      const ext = getFileExtension(imgPath);
      let embeddedImage = null;

      // 优先尝试原生嵌入
      if (ext === 'jpg' || ext === 'jpeg') {
        try {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } catch {
          // 如果是渐进式 JPEG 或特殊格式，通过 sharp 转为标准 PNG 嵌入
          if (sharp) {
            const pngBuf = await sharp(imageBytes).png().toBuffer();
            embeddedImage = await pdfDoc.embedPng(pngBuf);
          }
        }
      } else if (ext === 'png') {
        try {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } catch {
          if (sharp) {
            const pngBuf = await sharp(imageBytes).png().toBuffer();
            embeddedImage = await pdfDoc.embedPng(pngBuf);
          }
        }
      } else {
        // webp, avif, bmp, tiff, svg, etc.
        if (sharp) {
          const pngBuf = await sharp(imgPath).png().toBuffer();
          embeddedImage = await pdfDoc.embedPng(pngBuf);
        } else {
          throw new Error(`处理 ${ext} 格式图片需要 sharp 引擎`);
        }
      }

      if (!embeddedImage) {
        throw new Error(`无法解析并嵌入图片: ${path.basename(imgPath)}`);
      }

      const { width, height } = embeddedImage;
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: width,
        height: height
      });
    }

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPdfPath, pdfBytes);

    return {
      success: true,
      outputPath: outputPdfPath,
      pageCount: pdfDoc.getPageCount(),
      size: pdfBytes.length
    };
  }
}

module.exports = ImageEngine;
