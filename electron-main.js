const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const ConverterHub = require('./src/core/converter-hub');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 740,
    minWidth: 880,
    minHeight: 600,
    backgroundColor: '#0c0a17',
    title: 'GreatFormat 太棒格式 - 疯狂钻石主题转换器',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));
  mainWindow.setMenuBarVisibility(false);
}

// 注册 IPC 通信事件
function registerIpcHandlers() {
  // 转换文件
  ipcMain.handle('greatformat:convert', async (event, params) => {
    try {
      const { inputPath, targetFormat, options = {}, outputDir } = params;
      console.log(`[Main] [Converting] input="${inputPath}", target="${targetFormat}", outDir="${outputDir || 'default'}"`);
      const result = await ConverterHub.convert(inputPath, targetFormat, { ...options, outputDir });
      console.log(`[Main] [Success] Great! Reassembly completed.`);
      return { success: true, ...result };
    } catch (err) {
      console.error(`[Main] [Error] Failed: ${err.message}`);
      return {
        success: false,
        error: err.message || '未知错误',
        stack: err.stack
      };
    }
  });

  // 选择输出目录
  ipcMain.handle('greatformat:select-dir', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // 获取支持格式能力
  ipcMain.handle('greatformat:capabilities', async () => {
    return ConverterHub.getCapabilities();
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
