const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pdfPath = path.resolve('用于测试的文件夹-不用git/曾子丹_AI应用开发_投递版.pdf');
const outDocx = path.resolve('用于测试的文件夹-不用git/曾子丹_AI应用开发_投递版_from_pdf.docx');

console.log('Testing PDF -> DOCX conversion...');

const psScript = `\uFEFF
$inputPath = '${pdfPath.replace(/'/g, "''")}'
$outputPath = '${outDocx.replace(/'/g, "''")}'

# 1. 尝试 MS Word COM (PDF Reflow 自动逆向转为 Word .docx)
$word = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open($inputPath, $false, $true, $false, [Type]::Missing, [Type]::Missing, $true)
    # 16 代表 wdFormatDocumentDefault (.docx)
    $doc.SaveAs([ref]$outputPath, [ref]16)
    $doc.Close($false)
    $word.Quit()
    Write-Host "SUCCESS: Converted PDF -> DOCX via Word"
    exit 0
} catch {
    Write-Host "Word PDF Reflow error:" $_.Exception.Message
    if ($word) { try { $word.Quit() } catch {} }
}

# 2. 尝试 WPS COM
$wps = $null
try {
    $wps = New-Object -ComObject KWPS.Application -ErrorAction SilentlyContinue
    if (-not $wps) { $wps = New-Object -ComObject WPS.Application -ErrorAction SilentlyContinue }
    if (-not $wps) { $wps = New-Object -ComObject wps.application -ErrorAction SilentlyContinue }
    $wps.Visible = $false
    $doc = $wps.Documents.Open($inputPath, $false, $true)
    $doc.SaveAs([ref]$outputPath, [ref]16)
    $doc.Close($false)
    $wps.Quit()
    Write-Host "SUCCESS: Converted PDF -> DOCX via WPS"
    exit 0
} catch {
    Write-Host "WPS PDF Reflow error:" $_.Exception.Message
    if ($wps) { try { $wps.Quit() } catch {} }
}

exit 1
`;

fs.writeFileSync('test_pdf_to_docx.ps1', psScript, 'utf8');
try {
  const res = execSync('powershell -NoProfile -ExecutionPolicy Bypass -File test_pdf_to_docx.ps1', { encoding: 'utf8', timeout: 20000 });
  console.log('Result:\n', res);
  console.log('Output file created:', fs.existsSync(outDocx), 'Size:', fs.existsSync(outDocx) ? fs.statSync(outDocx).size : 0);
} catch (e) {
  console.error('Exec error:', e.stdout || e.message);
} finally {
  if (fs.existsSync('test_pdf_to_docx.ps1')) fs.unlinkSync('test_pdf_to_docx.ps1');
}
