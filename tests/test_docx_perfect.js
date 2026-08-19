const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const docxPath = path.resolve('用于测试的文件夹-不用git/曾子丹_AI应用开发_投递版.docx');
const outPdf = path.resolve('用于测试的文件夹-不用git/曾子丹_AI应用开发_投递版.pdf');

console.log('Docx path exists:', fs.existsSync(docxPath));

// 使用 UTF-8 with BOM 写入，确保 Windows PowerShell 5.1 正确解析中文字符路径
const psCode = `\uFEFF
$inputPath = '${docxPath.replace(/'/g, "''")}'
$outputPath = '${outPdf.replace(/'/g, "''")}'

Write-Host "Real Input Path: $inputPath"

# 1. 尝试 Word.Application
$word = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $doc = $word.Documents.Open($inputPath, $false, $true)
    $doc.ExportAsFixedFormat($outputPath, 17)
    $doc.Close($false)
    $word.Quit()
    Write-Host "SUCCESS: Converted via Microsoft Word"
    exit 0
} catch {
    Write-Host "Word Exception:" $_.Exception.Message
    if ($word) { try { $word.Quit() } catch {} }
}

# 2. 尝试 WPS COM
$wps = $null
try {
    $wps = New-Object -ComObject KWPS.Application -ErrorAction SilentlyContinue
    if (-not $wps) { $wps = New-Object -ComObject WPS.Application }
    if (-not $wps) { $wps = New-Object -ComObject wps.application }
    $wps.Visible = $false
    $doc = $wps.Documents.Open($inputPath, $false, $true)
    $doc.ExportAsFixedFormat($outputPath, 17)
    $doc.Close($false)
    $wps.Quit()
    Write-Host "SUCCESS: Converted via WPS"
    exit 0
} catch {
    Write-Host "WPS Exception:" $_.Exception.Message
    if ($wps) { try { $wps.Quit() } catch {} }
}

exit 1
`;

fs.writeFileSync('test_bom.ps1', psCode, 'utf8');
try {
  const res = execSync('powershell -NoProfile -ExecutionPolicy Bypass -File test_bom.ps1', { encoding: 'utf8' });
  console.log('Result:\n', res);
} catch (e) {
  console.error('Exec error:', e.stdout || e.message);
} finally {
  if (fs.existsSync('test_bom.ps1')) fs.unlinkSync('test_bom.ps1');
}
