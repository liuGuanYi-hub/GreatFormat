# 知识库 02：PDF 逆向重构 Word (.docx) 与版面保护避坑实录

## 📌 核心背景

将非结构化的流式 PDF 逆向重构成可自由编辑的 Microsoft Word (`.docx`) 是业界最复杂的版面识别工程之一。
主流核心开源算法基于 `pdf2docx`（基于 PyMuPDF 版面流解析与 python-docx 结构重建）。

---

## ⚠️ 踩坑记录：过度后处理导致工作经历文字丢失与空圆点 `•`

### 1. 踩坑现象
在测试 PDF 逆向转 Word 时，转换后的 `.docx` 打开时，用户发现：
- 个人经历部分只剩下一排空圆点 `•`，后面的长段落文字全部丢失；
- 中间的表格向下错位塌陷。

### 2. 根因深度剖析
在早期代码中，为了让生成的文档排版“紧凑”，写了一段后处理逻辑：
```python
# ❌ 错误做法：危险的暴力段落分节清理
doc = docx.Document(docx_path)
for p in doc.paragraphs:
    if not p.text.strip():
        pPr = p._p.get_or_add_pPr()
        for child in list(pPr):
            if child.tag.endswith('sectPr'):
                pPr.remove(child)
```
- **致命原因**：在 Word 的底层 OpenXML 规范中，包含自定义列表（Bullet）、复杂多栏（Columns）和两列网格表格的段落，其 `p.text.strip()` 可能为空（文字实际包含在 Run 或内部 Block 中），并且 `sectPr`（分节符）是控制整页多栏流向和表格锚点的关键 XML 节点！
- 暴力移除 `sectPr` 和属性导致 OpenXML 结构损坏，Word 在解析修复时直接丢弃了整段列表内容，造成了文字被吞！

---

## 🛠️ 最佳实践与解决方案

1. **绝对不要破坏 `pdf2docx` 生成的原始 XML 结构**；
2. 保持纯净的流式重构管道：
```python
from pdf2docx import Converter

cv = Converter(pdf_path)
# parse_table=True, parse_images=True 自动识别多栏与网格
cv.convert(docx_path, start=0, end=None)
cv.close()
```
3. 实测验证：移除暴力裁剪后，39 个段落、2 张核心能力表格、绝缘油时序数据实习经历等 100% 完整复原，文字字字清晰，彻底杜绝空圆点残留。\n