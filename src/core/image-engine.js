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
  /**
   * 支持的图片输入与输出格式
   */
  static SUPPORTED_INPUT_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'bmp', 'gif', 'tiff', 'ico', 'svg'];
  static SUPPORTED_OUTPUT_FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'tiff', 'pdf'];

  /**
   * 单图格式转换与压缩
   * @param {string} inputPath 
   * @param {string} outputPath 
   * @param {Object} [options] { quality: 85, width, height, fit: 'cover' }
   */
  static async convertImage(inputPath, outputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`输入图片不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const targetExt = getFileExtension(outputPath);

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

    const quality = options.quality ? Math.min(100, Math.max(1, parseInt(options.quality, 10))) : 85;

    switch (targetExt) {
      case 'jpg':
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
      case 'tiff':
        pipeline = pipeline.tiff({ quality });
        break;
      case 'ico':
        // ICO 图标生成 (通常支持 16, 32, 48, 64, 128, 256 尺寸的 PNG 包装)
        return await this.generateIco(inputPath, outputPath, options);
      default:
        throw new Error(`不支持的图片目标格式: ${targetExt}`);
    }

    await pipeline.toFile(outputPath);
    return {
      success: true,
      outputPath,
      size: fs.statSync(outputPath).size
    };
  }

  /**
   * 生成 Windows .ico 图标
   * @param {string} inputPath 
   * @param {string} outputPath 
   * @param {Object} options 
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

    // 简易且高兼容性的 ICO header 封装
    const icoHeader = Buffer.alloc(6);
    icoHeader.writeUInt16LE(0, 0); // 保留
    icoHeader.writeUInt16LE(1, 2); // 1 = ICO 格式
    icoHeader.writeUInt16LE(1, 4); // 包含 1 张图像

    const icoEntry = Buffer.alloc(16);
    icoEntry.writeUInt8(size >= 256 ? 0 : size, 0); // 宽度 (0 表示 256)
    icoEntry.writeUInt8(size >= 256 ? 0 : size, 1); // 高度 (0 表示 256)
    icoEntry.writeUInt8(0, 2); // 颜色调色板
    icoEntry.writeUInt8(0, 3); // 保留
    icoEntry.writeUInt16LE(1, 4); // 颜色平面
    icoEntry.writeUInt16LE(32, 6); // 每像素位数 (32-bit RGBA)
    icoEntry.writeUInt32LE(pngBuffer.length, 8); // 数据大小
    icoEntry.writeUInt32LE(22, 12); // 数据偏移量 (6 + 16 = 22)

    const finalBuffer = Buffer.concat([icoHeader, icoEntry, pngBuffer]);
    fs.writeFileSync(outputPath, finalBuffer);

    return {
      success: true,
      outputPath,
      size: finalBuffer.length
    };
  }

  /**
   * 多图合并为单个 PDF 文件
   * @param {string[]} imagePaths 
   * @param {string} outputPdfPath 
   * @param {Object} [options] { margin: 0, pageSize: 'fit' | 'A4' }
   */
  static async imagesToPdf(imagePaths, outputPdfPath, options = {}) {
    if (!imagePaths || imagePaths.length === 0) {
      throw new Error('请至少提供一张图片');
    }

    ensureDirSync(path.dirname(outputPdfPath));
    const pdfDoc = await PDFDocument.create();

    for (const imgPath of imagePaths) {
      if (!fs.existsSync(imgPath)) continue;

      let imageBytes = fs.readFileSync(imgPath);
      const ext = getFileExtension(imgPath);
      let embeddedImage;

      // 如果格式是 webp/avif/tiff/ico/bmp 等，先用 sharp 转为 png/jpeg buffer
      if (ext === 'png') {
        try {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } catch {
          if (sharp) {
            const pngBuf = await sharp(imageBytes).png().toBuffer();
            embeddedImage = await pdfDoc.embedPng(pngBuf);
          }
        }
      } else if (ext === 'jpg' || ext === 'jpeg') {
        try {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } catch {
          if (sharp) {
            const jpgBuf = await sharp(imageBytes).jpeg().toBuffer();
            embeddedImage = await pdfDoc.embedJpg(jpgBuf);
          }
        }
      } else {
        if (!sharp) {
          throw new Error(`处理 ${ext} 格式图片需要 sharp 模块`);
        }
        const pngBuf = await sharp(imgPath).png().toBuffer();
        embeddedImage = await pdfDoc.embedPng(pngBuf);
      }

      if (!embeddedImage) continue;

      const { width, height } = embeddedImage;
      // 默认按图片原始比例创建单页
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
