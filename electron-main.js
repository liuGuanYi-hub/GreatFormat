const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const ConverterHub = require('./src/core/converter-hub');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 860,
    minHeight: 580,
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
    const { inputPath, targetFormat, options = {}, outputDir } = params;
    return await ConverterHub.convert(inputPath, targetFormat, { ...options, outputDir });
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
