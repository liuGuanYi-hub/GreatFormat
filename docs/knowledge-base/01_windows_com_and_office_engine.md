# 知识库 01：Windows COM 自动化与 Office/Word 完美保真转换指南

## 📌 核心背景与问题

在做 Word (`.docx` / `.doc`) 转 PDF 时，常见的方案有：
1. **纯前端/无头解析**（如 `mammoth.js` + Chromium 打印）：将 Word 转为简易 HTML 再转 PDF。
   - **致命缺陷**：无法还原复杂的两栏/多栏简历、嵌套表格、复杂列表与页边距控制，会导致文字丢失、出现空圆点 `•`、表格错位下压。
2. **LibreOffice Headless**：体积庞大（需安装数百 MB 运行库），且对中文特定字体和 Microsoft Office 专有排版样式支持存在偏差。
3. **Windows 原生 COM 自动化 (Microsoft Word / WPS Office)**：**100% 原始矢量排版、像素级保真的黄金标准**。

---

## ⚠️ 踩坑记录：路径空格与编码导致 COM 静默失败

### 1. 踩坑现象
当项目或文件路径中包含空格（例如 `d:\zzd_project\cursor\hanshi  senior4\...`）或复杂中文字符时：
- 使用 `cscript //Nologo convert.vbs` 或命令行直接拼接路径传参，Windows `cscript` 会由于双引号剥离或编码问题发生静默报错退出；
- 导致上层调度引擎误以为本地未安装 Word/WPS，从而**错误地回退到了只支持纯文本的 `mammoth` 网页打印**，造成了用户看到的“转换完排版残缺、文字被吞”的假象。

---

## 🛠️ 最佳实践解决方案：Python `win32com.client` 原生驱动

### 1. 架构设计与代码实现
通过 Python 的 `win32com.client` 封装，利用 Python 强类型的参数传递彻底避免命令行引号剥离：

```python
import sys
import os
import win32com.client
import pythoncom

docx_path = sys.argv[1]
out_pdf = sys.argv[2]

converted = False

# 1. 优先调用 Microsoft Word
try:
    pythoncom.CoInitialize()
    word = win32com.client.DispatchEx('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0  # 禁止任何阻塞式弹窗
    # 打开文档 (ReadOnly=True, ConfirmConversions=False)
    doc = word.Documents.Open(docx_path, False, True, False)
    # 17 = wdExportFormatPDF (标准高质量矢量 PDF 导出)
    doc.ExportAsFixedFormat(out_pdf, 17)
    doc.Close(False)
    word.Quit()
    converted = True
except Exception as e:
    pass

# 2. 备用调用 WPS 文字 (KWPS / WPS)
if not converted or not os.path.exists(out_pdf):
    try:
        pythoncom.CoInitialize()
        wps = win32com.client.DispatchEx('KWPS.Application')
        wps.Visible = False
        wps.DisplayAlerts = 0
        doc = wps.Documents.Open(docx_path, False, True, False)
        doc.ExportAsFixedFormat(out_pdf, 17)
        doc.Close(False)
        wps.Quit()
        converted = True
    except Exception:
        pass

if not os.path.exists(out_pdf) or os.path.getsize(out_pdf) == 0:
    sys.exit(1)
```

### 2. 多阶梯回退保障体系
```
Word .docx 输入
   ├─► 1. Python win32com (MS Word / WPS Office) [100% 原始矢量保真]
   ├─► 2. PowerShell 原生 COM 自动化
   ├─► 3. VBScript COM 自动化
   ├─► 4. LibreOffice Headless
   └─► 5. 兜底: Mammoth + Chromium 打印
```

---

## 🎯 总结要点
1. **路径安全**：Windows 下涉及带有空格或中文的路径，永远优先使用临时脚本文件传参或由 Python `sys.argv` 读取，切勿在 CMD/PowerShell 字符串中直接单双引号硬拼拼接；
2. **弹窗防御**：COM 调用务必显式指定 `Visible = False`、`DisplayAlerts = 0`，以及在 `Open` 时传入 `ConfirmConversions = False`，防止后台挂起；
3. **资源释放**：必须在 `try...finally` 块中确保 `doc.Close(False)` 和 `word.Quit()`，防止后台留下僵尸 `WINWORD.EXE` 进程。\n