const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { ensureDirSync } = require('./utils');

class DataEngine {
  static DATA_FORMATS = ['json', 'csv', 'yaml', 'yml', 'xml', 'tsv'];
  static SPREADSHEET_FORMATS = ['xlsx', 'xls', 'csv', 'tsv'];

  /**
   * 表格互转与数据格式转换 (Excel ↔ CSV ↔ JSON ↔ YAML ↔ HTML ↔ PDF)
   */
  static async convertDataOrSpreadsheet(inputPath, outputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);
    const sourceExt = path.extname(inputPath).slice(1).toLowerCase();
    const targetExt = path.extname(outputPath).slice(1).toLowerCase();

    // 1. 如果是 Excel 转 PDF，优先尝试 Windows 原生 COM (Excel / WPS 表格)
    if (['xlsx', 'xls'].includes(sourceExt) && targetExt === 'pdf' && process.platform === 'win32') {
      try {
        const vbs = `
On Error Resume Next
Dim inPath, outPath
inPath = "${resolvedInput.replace(/\\/g, '\\\\')}"
outPath = "${resolvedOutput.replace(/\\/g, '\\\\')}"

Dim xl, wb
Set xl = CreateObject("Excel.Application")
If Err.Number = 0 And Not xl Is Nothing Then
    xl.Visible = False
    xl.DisplayAlerts = False
    Set wb = xl.Workbooks.Open(inPath, False, True)
    If Err.Number = 0 And Not wb Is Nothing Then
        wb.ExportAsFixedFormat 0, outPath
        wb.Close False
        xl.Quit
        If Err.Number = 0 Then WScript.Quit 0
    End If
    xl.Quit
End If

Err.Clear
Dim et
Set et = CreateObject("KET.Application")
If Err.Number <> 0 Or et Is Nothing Then
    Err.Clear
    Set et = CreateObject("ET.Application")
End If
If Err.Number = 0 And Not et Is Nothing Then
    et.Visible = False
    et.DisplayAlerts = False
    Set wb = et.Workbooks.Open(inPath, False, True)
    If Err.Number = 0 And Not wb Is Nothing Then
        wb.ExportAsFixedFormat 0, outPath
        wb.Close False
        et.Quit
        If Err.Number = 0 Then WScript.Quit 0
    End If
    et.Quit
End If
WScript.Quit 1
`;
        const tempVbs = path.join(path.dirname(resolvedOutput), `convert_excel_${Date.now()}.vbs`);
        fs.writeFileSync(tempVbs, Buffer.from('\uFEFF' + vbs, 'utf16le'));
        try {
          await execAsync(`cscript //Nologo "${tempVbs}"`);
        } finally {
          if (fs.existsSync(tempVbs)) fs.unlinkSync(tempVbs);
        }

        if (fs.existsSync(resolvedOutput)) {
          return {
            success: true,
            engine: 'Windows Native Excel/WPS COM',
            outputPath: resolvedOutput,
            size: fs.statSync(resolvedOutput).size
          };
        }
      } catch (e) {
        console.warn('[DataEngine] Excel COM 转换未完成，切入 Python 引擎:', e.message);
      }
    }

    // 2. 使用 Python pandas / openpyxl / json / yaml 进行跨格式高保真数据转换
    const pyScript = `
import sys
import os
import json
import pandas as pd

in_path = sys.argv[1]
out_path = sys.argv[2]
src_ext = sys.argv[3].lower()
tgt_ext = sys.argv[4].lower()

# 读取数据为 DataFrame 或 dict
df = None
data_obj = None

if src_ext in ['xlsx', 'xls']:
    df = pd.read_excel(in_path)
elif src_ext == 'csv':
    df = pd.read_csv(in_path)
elif src_ext == 'tsv':
    df = pd.read_csv(in_path, sep='\\t')
elif src_ext == 'json':
    with open(in_path, 'r', encoding='utf-8') as f:
        data_obj = json.load(f)
    try:
        df = pd.DataFrame(data_obj)
    except:
        pass
elif src_ext in ['yaml', 'yml']:
    import yaml
    with open(in_path, 'r', encoding='utf-8') as f:
        data_obj = yaml.safe_load(f)
    try:
        df = pd.DataFrame(data_obj)
    except:
        pass

# 写入目标格式
if tgt_ext == 'xlsx':
    if df is not None:
        df.to_excel(out_path, index=False)
    elif data_obj is not None:
        pd.DataFrame([data_obj] if isinstance(data_obj, dict) else data_obj).to_excel(out_path, index=False)
elif tgt_ext == 'csv':
    if df is not None:
        df.to_csv(out_path, index=False, encoding='utf-8-sig')
elif tgt_ext == 'tsv':
    if df is not None:
        df.to_csv(out_path, sep='\\t', index=False, encoding='utf-8-sig')
elif tgt_ext == 'json':
    if df is not None:
        df.to_json(out_path, orient='records', force_ascii=False, indent=2)
    elif data_obj is not None:
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(data_obj, f, ensure_ascii=False, indent=2)
elif tgt_ext in ['yaml', 'yml']:
    import yaml
    content = data_obj if data_obj is not None else (df.to_dict(orient='records') if df is not None else {})
    with open(out_path, 'w', encoding='utf-8') as f:
        yaml.safe_dump(content, f, allow_unicode=True, sort_keys=False)
elif tgt_ext == 'html':
    if df is not None:
        html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
table {{ border-collapse: collapse; width: 100%; font-family: -apple-system, sans-serif; }}
th, td {{ border: 1px solid #d1d5db; padding: 6px 10px; font-size: 13px; text-align: left; }}
th {{ background-color: #f3f4f6; font-weight: 600; }}
tr:nth-child(even) {{ background-color: #f9fafb; }}
</style></head>
<body>{df.to_html(index=False, classes='table')}</body></html>"""
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
`;

    const tempPy = path.join(path.dirname(resolvedOutput), `convert_data_${Date.now()}.py`);
    fs.writeFileSync(tempPy, pyScript, 'utf8');

    try {
      await execAsync(`python "${tempPy}" "${resolvedInput}" "${resolvedOutput}" "${sourceExt}" "${targetExt}"`);
      if (fs.existsSync(resolvedOutput)) {
        return {
          success: true,
          engine: 'Pandas & OpenPyXL Data Engine',
          outputPath: resolvedOutput,
          size: fs.statSync(resolvedOutput).size
        };
      }
    } catch (err) {
      throw new Error(`数据格式转换失败: ${err.message}`);
    } finally {
      if (fs.existsSync(tempPy)) fs.unlinkSync(tempPy);
    }

    throw new Error('数据格式转换未生成输出文件');
  }

  /**
   * PPT / 演示文稿转 PDF / 逐页图片
   */
  static async convertPresentation(inputPath, outputPath, options = {}) {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`演示文稿文件不存在: ${inputPath}`);
    }

    ensureDirSync(path.dirname(outputPath));
    const resolvedInput = path.resolve(inputPath);
    const resolvedOutput = path.resolve(outputPath);
    const targetExt = path.extname(outputPath).slice(1).toLowerCase();

    if (process.platform === 'win32') {
      try {
        const vbs = `
On Error Resume Next
Dim inPath, outPath
inPath = "${resolvedInput.replace(/\\/g, '\\\\')}"
outPath = "${resolvedOutput.replace(/\\/g, '\\\\')}"

Dim ppt, pres
Set ppt = CreateObject("PowerPoint.Application")
If Err.Number = 0 And Not ppt Is Nothing Then
    Set pres = ppt.Presentations.Open(inPath, True, False, False)
    If Err.Number = 0 And Not pres Is Nothing Then
        ${targetExt === 'pdf' ? 'pres.SaveAs outPath, 32' : 'pres.SaveAs outPath, 17'}
        pres.Close
        ppt.Quit
        If Err.Number = 0 Then WScript.Quit 0
    End If
    ppt.Quit
End If

Err.Clear
Dim wpp
Set wpp = CreateObject("KWPP.Application")
If Err.Number <> 0 Or wpp Is Nothing Then
    Err.Clear
    Set wpp = CreateObject("WPP.Application")
End If
If Err.Number = 0 And Not wpp Is Nothing Then
    Set pres = wpp.Presentations.Open(inPath, True, False, False)
    If Err.Number = 0 And Not pres Is Nothing Then
        ${targetExt === 'pdf' ? 'pres.SaveAs outPath, 32' : 'pres.SaveAs outPath, 17'}
        pres.Close
        wpp.Quit
        If Err.Number = 0 Then WScript.Quit 0
    End If
    wpp.Quit
End If
WScript.Quit 1
`;
        const tempVbs = path.join(path.dirname(resolvedOutput), `convert_ppt_${Date.now()}.vbs`);
        fs.writeFileSync(tempVbs, Buffer.from('\uFEFF' + vbs, 'utf16le'));
        try {
          await execAsync(`cscript //Nologo "${tempVbs}"`);
        } finally {
          if (fs.existsSync(tempVbs)) fs.unlinkSync(tempVbs);
        }

        if (fs.existsSync(resolvedOutput)) {
          return {
            success: true,
            engine: 'Windows Native PowerPoint/WPS COM',
            outputPath: resolvedOutput,
            size: fs.statSync(resolvedOutput).size
          };
        }
      } catch (e) {
        console.warn('[DataEngine] PPT COM 转换未完成:', e.message);
      }
    }

    throw new Error('演示文稿转换失败：请确保本机已安装 PowerPoint 或 WPS Office');
  }
}

module.exports = DataEngine;
