const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
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
  static chromiumPdfRenderer = null;

  /**
   * 注册由主进程提供的内置 Chromium PDF 渲染器（无需安装 Office/WPS 即可输出标准高品质 PDF）
   * @param {Function} rendererFn 
   */
  static setChromiumPdfRenderer(rendererFn) {
    this.chromiumPdfRenderer = rendererFn;
  }

  /**
   * Word (.docx / .doc) 转 PDF
   * 多阶梯保真转换策略：
   * 1. 优先使用 Windows 本地 COM 自动化 (MS Word / WPS Office)，100% 原始矢量排版完美保真！
   * 2. 若用户电脑未安装 Office/WPS，自动使用内置 Electron 浏览器打印引擎转为标准 A4 PDF（零安装开箱即用）。
   * 3. 备用尝试 LibreOffice Headless。
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

    // 1. 优先尝试 Windows 原生 COM 自动化 (MS Word / WPS Office)
    if (process.platform === 'win32') {
      try {
        const vbsContent = `
On Error Resume Next
Dim docxPath, outPdf
docxPath = "${resolvedInput.replace(/\\/g, '\\\\')}"
outPdf = "${resolvedOutput.replace(/\\/g, '\\\\')}"

' 1. 尝试 Microsoft Word
Dim word, doc
Set word = CreateObject("Word.Application")
If Err.Number = 0 And Not word Is Nothing Then
    word.Visible = False
    word.DisplayAlerts = False
    Set doc = word.Documents.Open(docxPath, False, True)
    If Err.Number = 0 And Not doc Is Nothing Then
        doc.ExportAsFixedFormat outPdf, 17
        doc.Close False
        word.Quit False
        If Err.Number = 0 Then
            WScript.Quit 0
        End If
    End If
    word.Quit False
End If

Err.Clear

' 2. 尝试 WPS 文字 (KWPS / WPS)
Dim wps
Set wps = CreateObject("KWPS.Application")
If Err.Number <> 0 Or wps Is Nothing Then
    Err.Clear
    Set wps = CreateObject("WPS.Application")
End If

If Err.Number = 0 And Not wps Is Nothing Then
    wps.Visible = False
    wps.DisplayAlerts = False
    Set doc = wps.Documents.Open(docxPath, False, True)
    If Err.Number = 0 And Not doc Is Nothing Then
        doc.ExportAsFixedFormat outPdf, 17
        doc.Close False
        wps.Quit False
        If Err.Number = 0 Then
            WScript.Quit 0
        End If
    End If
    wps.Quit False
End If

WScript.Quit 1
`;
        const tempVbs = path.join(path.dirname(resolvedOutput), `convert_com_${Date.now()}.vbs`);
        // 使用带有 UTF-16LE BOM 写入，确保 cscript 正确解析中文字符路径
        fs.writeFileSync(tempVbs, Buffer.from('\uFEFF' + vbsContent, 'utf16le'));

        try {
          await execAsync(`cscript //Nologo "${tempVbs}"`);
        } finally {
          if (fs.existsSync(tempVbs)) fs.unlinkSync(tempVbs);
        }

        if (fs.existsSync(resolvedOutput)) {
          return {
            success: true,
            engine: 'Windows Native COM (Word/WPS)',
            outputPath: resolvedOutput,
            size: fs.statSync(resolvedOutput).size
          };
        }
      } catch (err) {
        console.log('[OfficeEngine] COM 自动化转换未完成，切入内置引擎:', err.message);
      }
    }

    // 2. 内置零依赖转换：使用 Mammoth 结构解析 + Chromium 渲染输出 PDF
    if (this.chromiumPdfRenderer && mammoth) {
      try {
        const buffer = fs.readFileSync(resolvedInput);
        const result = await mammoth.convertToHtml({ buffer });
        const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: A4; margin: 12mm 12mm 12mm 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #111827;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 16pt; margin-top: 10pt; margin-bottom: 4pt; color: #111827; font-weight: 700; }
    h2 { font-size: 12pt; margin-top: 8pt; margin-bottom: 3pt; color: #1f2937; font-weight: 600; }
    h3 { font-size: 11pt; margin-top: 6pt; margin-bottom: 2pt; color: #374151; font-weight: 600; }
    p { margin-top: 0; margin-bottom: 4pt; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 6pt 0; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th, td { border: 1px solid #d1d5db; padding: 4pt 6pt; font-size: 9.5pt; }
    th { background-color: #f3f4f6; font-weight: 600; }
    img { max-width: 100%; height: auto; display: block; margin: 4pt auto; }
    ul, ol { margin-top: 0; margin-bottom: 4pt; padding-left: 16pt; }
    li { margin-bottom: 2pt; }
    blockquote { border-left: 3px solid #9ca3af; margin: 6pt 0; padding-left: 8pt; color: #4b5563; }
  </style>
</head>
<body>
  ${result.value}
</body>
</html>
`;
        return await this.chromiumPdfRenderer(styledHtml, resolvedOutput);
      } catch (err) {
        console.log('[OfficeEngine] 内置 Chromium 渲染发生异常:', err.message);
      }
    }

    // 3. 回退尝试 LibreOffice Headless
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

    throw new Error('Word 转 PDF 失败：未能通过本地引擎生成 PDF，请检查文件是否损坏');
  }

  /**
   * Word (.docx) 转 Markdown / HTML / TXT
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
