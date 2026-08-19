#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const ConverterHub = require('./src/core/converter-hub');
const ImageEngine = require('./src/core/image-engine');
const PDFEngine = require('./src/core/pdf-engine');
const pkg = require('./package.json');

const program = new Command();

program
  .name('greatformat')
  .alias('dora')
  .description('💎 GreatFormat (太棒格式) - 疯狂钻石主题原子重组文件转换器')
  .version(pkg.version);

// 1. 查询系统支持能力
program
  .command('capabilities')
  .description('查询当前引擎支持的全部格式与能力矩阵')
  .option('--json', '以 JSON 格式输出')
  .action((options) => {
    const caps = ConverterHub.getCapabilities();
    if (options.json) {
      console.log(JSON.stringify(caps, null, 2));
    } else {
      console.log('💎 GreatFormat 格式能力矩阵:');
      console.log('图片类支持:', caps.images.join(', '));
      console.log('文档类支持:', caps.documents.join(', '));
    }
  });

// 2. 查询单个文件可转换的目标格式
program
  .command('targets <filePath>')
  .description('查询指定文件所支持的目标转换格式')
  .option('--json', '以 JSON 格式输出')
  .action((filePath, options) => {
    const targets = ConverterHub.getTargetFormats(filePath);
    if (options.json) {
      console.log(JSON.stringify({ filePath, targets }, null, 2));
    } else {
      console.log(`💎 [${path.basename(filePath)}] 支持转换为: ${targets.join(', ') || '无'}`);
    }
  });

// 3. 通用文件转换
program
  .command('convert <inputPaths...>')
  .description('转换一个或多个文件到目标格式 (DORARARA!)')
  .requiredOption('-t, --to <format>', '目标格式 (如 pdf, docx, png, webp, ico)')
  .option('-o, --output-dir <dir>', '输出目录')
  .option('--json', '以 JSON 格式输出转换结果')
  .action(async (inputPaths, options) => {
    const results = [];
    for (const inputPath of inputPaths) {
      try {
        if (!options.json) console.log(`⚡ 正在重组: ${path.basename(inputPath)} ➔ .${options.to}...`);
        const res = await ConverterHub.convert(inputPath, options.to, {
          outputDir: options.outputDir
        });
        results.push({ success: true, ...res });
        if (!options.json) console.log(`✨ 这可真是太 Great 了！已输出到: ${res.outputPath}`);
      } catch (err) {
        results.push({ success: false, inputPath, error: err.message });
        if (!options.json) console.error(`💥 重组失败 [${inputPath}]: ${err.message}`);
      }
    }

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    }
  });

// 4. 多图合并转 PDF
program
  .command('images-to-pdf <images...>')
  .description('将多张图片按顺序合并为一个 PDF 文件')
  .requiredOption('-o, --output <outputPdf>', '输出 PDF 文件路径')
  .option('--json', '以 JSON 格式输出')
  .action(async (images, options) => {
    try {
      const res = await ImageEngine.imagesToPdf(images, options.output);
      if (options.json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log(`✨ 成功将 ${images.length} 张图片合并为 PDF: ${options.output}`);
      }
    } catch (err) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: err.message }));
      } else {
        console.error(`💥 图片合并 PDF 失败: ${err.message}`);
      }
    }
  });

// 5. 多 PDF 合并
program
  .command('merge-pdfs <pdfs...>')
  .description('将多个 PDF 文件合并为一个 PDF')
  .requiredOption('-o, --output <outputPdf>', '输出 PDF 文件路径')
  .option('--json', '以 JSON 格式输出')
  .action(async (pdfs, options) => {
    try {
      const res = await PDFEngine.mergePdfs(pdfs, options.output);
      if (options.json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log(`✨ 成功合并 ${pdfs.length} 个 PDF 文件: ${options.output}`);
      }
    } catch (err) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: err.message }));
      } else {
        console.error(`💥 PDF 合并失败: ${err.message}`);
      }
    }
  });

// 6. PDF 拆分
program
  .command('split-pdf <pdfPath>')
  .description('将 PDF 逐页拆分为独立的 PDF 文件')
  .option('-o, --output-dir <dir>', '输出目录')
  .option('--json', '以 JSON 格式输出')
  .action(async (pdfPath, options) => {
    try {
      const outDir = options.outputDir || path.join(path.dirname(pdfPath), `${path.basename(pdfPath, '.pdf')}_split`);
      const res = await PDFEngine.splitPdf(pdfPath, outDir);
      if (options.json) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log(`✨ 成功将 PDF 拆分为 ${res.count} 个单页文件，保存在: ${outDir}`);
      }
    } catch (err) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: err.message }));
      } else {
        console.error(`💥 PDF 拆分失败: ${err.message}`);
      }
    }
  });

program.parse(process.argv);
