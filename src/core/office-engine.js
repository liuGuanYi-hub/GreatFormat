const fs = require('fs');
const path = require('path');
const { exec, execSync } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { ensureDirSync } = require('./utils');

let mammoth;
try {
  mammoth = require('mammoth');
} catch (e) {
  console.warn('[OfficeEngine] mammoth module loading:', e.message);
}

let docx;
try {
  docx = require('docx');
} catch (e) {
  console.warn('[OfficeEngine] docx module loading:', e.message);
}

class OfficeEngine {
  /**
   * Word (.docx / .doc) 转 PDF
   * 优先使用 Windows 本地 COM 自动化（MS Word / WPS Office），排版 100% 保真且毫秒级极速完成！
   * 备用回退到 LibreOffice headless。
   * @param {string} inputPath 
   * @param {string} outputPath 
   */
  static async docxToPdf(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Word 文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);

    // 1. 尝试 Windows 原生 COM 自动化 (MS Word / WPS)
    if (process.platform === 'win32') {
      try {
        const psScript = `
$inputPath = '${resolvedInput.replace(/'/g, "''")}'
$outputPath = '${resolvedOutput.replace(/'/g, "''")}'

# 尝试 MS Word
$word = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open($inputPath, $false, $true)
    # 17 represents wdExportFormatPDF
    $doc.SaveAs([ref]$outputPath, [ref]17)
    $doc.Close($false)
    $word.Quit()
    exit 0
} catch {
    if ($word) { try { $word.Quit() } catch {} }
}

# 尝试 WPS 文字
$wps = $null
try {
    $wps = New-Object -ComObject KWPS.Application
    if (-not $wps) { $wps = New-Object -ComObject WPS.Application }
    $wps.Visible = $false
    $doc = $wps.Documents.Open($inputPath, $false, $true)
    $doc.ExportPdf($outputPath)
    $doc.Close($false)
    $wps.Quit()
    exit 0
} catch {
    if ($wps) { try { $wps.Quit() } catch {} }
}

exit 1
`;
        const tempPs = path.join(path.dirname(resolvedOutput), `convert_${Date.now()}.ps1`);
        fs.writeFileSync(tempPs, psScript, 'utf8');

        await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs}"`);
        if (fs.existsSync(tempPs)) fs.unlinkSync(tempPs);

        if (fs.existsSync(resolvedOutput)) {
          return {
            success: true,
            engine: 'Windows COM (Word/WPS)',
            outputPath: resolvedOutput,
            size: fs.statSync(resolvedOutput).size
          };
        }
      } catch (err) {
        console.log('[OfficeEngine] 本地 COM 转换未完成，尝试 LibreOffice 回退:', err.message);
      }
    }

    // 2. 回退尝试 LibreOffice Headless
    try {
      const outDir = path.dirname(resolvedOutput);
      const cmd = `soffice --headless --convert-to pdf --outdir "${outDir}" "${resolvedInput}"`;
      await execAsync(cmd);
      
      const expectedOutput = path.join(outDir, `${path.basename(resolvedInput, path.extname(resolvedInput))}.pdf`);
      if (fs.existsSync(expectedOutput) && expectedOutput !== resolvedOutput) {
        fs.renameSync(expectedOutput, resolvedOutput);
      }

      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'LibreOffice Headless',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      console.log('[OfficeEngine] LibreOffice 未安装或调用失败:', err.message);
    }

    throw new Error('Word 转 PDF 失败：请确保系统已安装 Microsoft Office、WPS 或 LibreOffice');
  }

  /**
   * Word (.docx) 转 Markdown / HTML
   * @param {string} inputPath 
   * @param {string} outputPath 
   * @param {'markdown' | 'html' | 'txt'} format 
   */
  static async docxToTextOrHtml(inputPath, outputPath, format = 'markdown') {
    if (!mammoth) {
      throw new Error('Mammoth 解析库未加载，请运行 npm install');
    }

    ensureDirSync(path.dirname(outputPath));
    const buffer = fs.readFileSync(inputPath);

    if (format === 'markdown') {
      const result = await mammoth.convertToMarkdown({ buffer });
      fs.writeFileSync(outputPath, result.value, 'utf8');
    } else if (format === 'html') {
      const result = await mammoth.convertToHtml({ buffer });
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>GreatFormat Export</title><style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;padding:1rem;line-height:1.6;}</style></head><body>${result.value}</body></html>`;
      fs.writeFileSync(outputPath, fullHtml, 'utf8');
    } else {
      const result = await mammoth.extractRawText({ buffer });
      fs.writeFileSync(outputPath, result.value, 'utf8');
    }

    return {
      success: true,
      outputPath,
      size: fs.statSync(outputPath).size
    };
  }

  /**
   * 纯文本 / Markdown 转 Word (.docx)
   * @param {string} inputPath 
   * @param {string} outputPath 
   */
  static async textToDocx(inputPath, outputPath) {
    if (!docx) {
      throw new Error('Docx 构建库未就绪');
    }

    ensureDirSync(path.dirname(outputPath));
    const content = fs.readFileSync(inputPath, 'utf8');
    const lines = content.split(/\r?\n/);

    const doc = new docx.Document({
      sections: [{
        properties: {},
        children: lines.map(line => {
          if (line.startsWith('# ')) {
            return new docx.Paragraph({
              text: line.replace(/^#\s+/, ''),
              heading: docx.HeadingLevel.HEADING_1
            });
          }
          if (line.startsWith('## ')) {
            return new docx.Paragraph({
              text: line.replace(/^##\s+/, ''),
              heading: docx.HeadingLevel.HEADING_2
            });
          }
          return new docx.Paragraph({
            children: [new docx.TextRun(line)]
          });
        })
      }]
    });

    const buffer = await docx.Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    return {
      success: true,
      outputPath,
      size: buffer.length
    };
  }
}

module.exports = OfficeEngine;
