const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 格式化文件体积大小为人类可读字符串
 * @param {number} bytes 
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件后缀名（小写，不带点）
 * @param {string} filePath 
 * @returns {string}
 */
function getFileExtension(filePath) {
  if (!filePath) return '';
  const ext = path.extname(filePath).toLowerCase();
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

/**
 * 生成安全的默认输出文件名
 * @param {string} inputPath 
 * @param {string} targetExt 
 * @param {string} [outputDir] 
 * @returns {string}
 */
function generateOutputPath(inputPath, targetExt, outputDir) {
  const dir = outputDir || path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const ext = targetExt.startsWith('.') ? targetExt : `.${targetExt}`;
  
  let targetPath = path.join(dir, `${baseName}${ext}`);
  
  // 如果输出路径与输入路径相同，添加 _converted 后缀
  if (path.resolve(targetPath) === path.resolve(inputPath)) {
    targetPath = path.join(dir, `${baseName}_converted${ext}`);
  }
  
  return targetPath;
}

/**
 * 创建临时工作目录
 * @param {string} prefix 
 * @returns {string}
 */
function createTempDir(prefix = 'greatformat_') {
  const tempDir = path.join(os.tmpdir(), `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
}

/**
 * 安全清理目录或文件
 * @param {string} targetPath 
 */
function cleanPath(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[Utils] Failed to clean ${targetPath}:`, err.message);
  }
}

/**
 * 确保目录存在
 * @param {string} dirPath 
 */
function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

module.exports = {
  formatFileSize,
  getFileExtension,
  generateOutputPath,
  createTempDir,
  cleanPath,
  ensureDirSync
};
