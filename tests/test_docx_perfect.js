const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const docxPath = path.resolve('用于测试的文件夹-不用git/曾子丹_AI应用开发_投递版.docx');
const outPdf = path.resolve('用于测试的文件夹-不用git/曾子丹_AI应用开发_投递版.pdf');

console.log('Testing docx path:', docxPath);
console.log('Docx exists:', fs.existsSync(docxPath));

// 生成 vbs 脚本
const vbsContent = `
On Error Resume Next

Dim docxPath, outPdf
docxPath = "${docxPath.replace(/\\/g, '\\\\')}"
outPdf = "${outPdf.replace(/\\/g, '\\\\')}"

Dim word, doc, success
success = False

' 1. 尝试 Microsoft Word
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
            WScript.Echo "SUCCESS_WORD"
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
            WScript.Echo "SUCCESS_WPS"
            WScript.Quit 0
        End If
    End If
    wps.Quit False
End If

WScript.Echo "FAIL: " & Err.Description
WScript.Quit 1
`;

// 写入 UTF-16LE 或者带有 GBK 兼容 / utf8 的 vbs
// VBScript 默认读取当前 ANSI 编码，或者我们用 UTF-16LE 写入
const tempVbs = path.join(path.dirname(outPdf), `temp_convert_${Date.now()}.vbs`);
fs.writeFileSync(tempVbs, Buffer.from('\uFEFF' + vbsContent, 'utf16le'));

try {
  const res = execSync(`cscript //Nologo "${tempVbs}"`, { encoding: 'utf8' });
  console.log('Result Output:\n', res);
  console.log('PDF Exists after convert:', fs.existsSync(outPdf));
  if (fs.existsSync(outPdf)) {
    console.log('Output PDF size:', fs.statSync(outPdf).size);
  }
} catch (e) {
  console.error('Execution Failed:\n', e.stdout || e.message);
} finally {
  if (fs.existsSync(tempVbs)) fs.unlinkSync(tempVbs);
}
