# 知识库 06：Electron Builder 绿色便携免安装版打包全流程指南

## 📌 目标产物

为 Windows 用户提供**单个独立的绿色便携免安装版 `.exe`（Portable）**：
- 双击即开，零解压等待，无需安装；
- 内嵌东方仗助多尺寸专属应用图标。

---

## ⚠️ 踩坑记录：Windows 非管理员权限下的 `winCodeSign` Symlink 报错

### 1. 踩坑现象
在 Windows 执行 `electron-builder --win portable` 时，构建中途报错：
```
ERROR: Cannot create symbolic link : 客户端没有特权 : ...\winCodeSign\...\darwin\...\libcrypto.dylib
```

### 2. 根因
`winCodeSign` 压缩包中包含了针对 macOS/Linux 的跨平台软链接（symlink），而 Windows 普通用户权限禁止创建符号链接。

### 3. 解决方案：禁用免签名阶段的 codeSign 工具
在 `package.json` 的 `build` 配置中显式设置：
```json
"build": {
  "appId": "com.liuguanyi.greatformat",
  "productName": "GreatFormat",
  "forceCodeSigning": false,
  "win": {
    "icon": "src/assets/icon.ico",
    "signAndEditExecutable": false,
    "target": [
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ]
  },
  "portable": {
    "artifactName": "GreatFormat-Portable-${version}.${ext}"
  }
}
```
并且在构建命令中传入：
`electron-builder --win portable -c.win.signAndEditExecutable=false -c.forceCodeSigning=false`

---

## 🛠️ 国内高速镜像源配置 (.npmrc)
```ini
registry=https://registry.npmmirror.com
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

---

## 🎯 输出交付物
- `dist/GreatFormat-Portable-1.0.0.exe` (80.3 MB)：单文件便携免安装版；
- `dist/win-unpacked/GreatFormat.exe`：解包绿色目录，0 延迟秒开；
- `dist/GreatFormat-v1.0.0-Windows-Portable-Green.zip` (126 MB)：便携压缩包。\n