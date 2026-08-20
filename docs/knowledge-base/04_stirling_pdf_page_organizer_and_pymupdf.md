# 知识库 04：类似 Stirling-PDF 的页面可视化管理与 PyMuPDF 实战

## 📌 核心功能目标

参考 Stirling-PDF (50k⭐) 打造极致流畅的 PDF 页面可视化管理工作台：
1. **缩略图画廊**：双击或点击 PDF 瞬间呈现每一页的高清缩略图卡片；
2. **HTML5 原生拖拽排序**：按住页面卡片随意拖拽调换先后顺序；
3. **单页 90°/180°/270° 独立旋转**：专门解决扫描件、手机拍照倒置问题；
4. **单页剔除**：一键删除空白页或多余页面；
5. **一键极速重组保存**：底层 PyMuPDF 无损流式输出全新 PDF。

---

## ⚙️ 核心实现与性能优化

### 1. 毫秒级缩略图提取 (PyMuPDF DPI 72)
```python
import fitz
import base64

doc = fitz.open(pdf_path)
thumbs = []
for page in doc:
    pix = page.get_pixmap(dpi=72)  # 72 DPI 兼顾清晰度与极速渲染
    img_bytes = pix.tobytes("png")
    b64 = base64.b64encode(img_bytes).decode('ascii')
    thumbs.append(f"data:image/png;base64,{b64}")
```

### 2. 页面重组与旋转 (无损合并 + 废弃流清理)
```python
import json
import fitz

with open(ops_file, 'r', encoding='utf-8') as f:
    ops = json.load(f)

src_doc = fitz.open(pdf_path)
dst_doc = fitz.open()

for item in ops:
    orig_idx = int(item['originalIndex'])
    rotate_offset = int(item.get('rotateOffset', 0))
    if 0 <= orig_idx < len(src_doc):
        # 复制单页
        dst_doc.insert_pdf(src_doc, from_page=orig_idx, to_page=orig_idx)
        new_page = dst_doc[-1]
        if rotate_offset != 0:
            new_page.set_rotation((new_page.rotation + rotate_offset) % 360)

# garbage=4 (彻底清理游离对象), deflate=True (流压缩), clean=True (语法净化)
dst_doc.save(out_pdf, garbage=4, deflate=True, clean=True)
```

---

## ⚠️ 跨进程 JSON 参数传递避坑
- 在 Windows 下通过 Node.js `execAsync` 直接将 JSON 字符串作为命令行参数传给 Python 时，PowerShell 和 CMD 会将单引号当作普通字符、剥离双引号，导致 `json.loads` 报 `JSONDecodeError`；
- **稳健解法**：在 Node.js 中将 `pageOperations` 写入临时 `ops_<timestamp>.json` 文件，Python 脚本通过 `json.load(open(sys.argv[3]))` 安全读取，并在 `finally` 块中删除临时文件。\n