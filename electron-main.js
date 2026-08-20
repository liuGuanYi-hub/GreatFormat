const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const ConverterHub = require('./src/core/converter-hub');
const OfficeEngine = require('./src/core/office-engine');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f5f5f7',
    title: 'GreatFormat 太棒格式 - 疯狂钻石主题转换器',
    icon: path.join(__dirname, 'src/assets/icon.ico'),
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));
  mainWindow.setMenuBarVisibility(false);
}

// 使用内置 Chromium 打印引擎将 HTML 无损转为高品质 PDF (无需安装任何 Office 软件)
async function renderHtmlToPdf(htmlContent, outputPdfPath) {
  const printWin = new BrowserWindow({
    show: false,
    width: 1024,
    height: 1400,
    webPreferences: {
      nodeIntegration: false
    }
  });

  try {
    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    const pdfBuffer = await printWin.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        top: 0.4,
        bottom: 0.4,
        left: 0.4,
        right: 0.4
      }
    });
    fs.writeFileSync(outputPdfPath, pdfBuffer);
    return {
      success: true,
      engine: 'Built-in Electron Engine',
      outputPath: outputPdfPath,
      size: pdfBuffer.length
    };
  } finally {
    if (!printWin.isDestroyed()) {
      printWin.destroy();
    }
  }
}

// 注册 IPC 通信事件
function registerIpcHandlers() {
  // 设置 Office 引擎的内置 PDF 渲染器回调
  OfficeEngine.setChromiumPdfRenderer(renderHtmlToPdf);

  // 转换文件
  ipcMain.handle('greatformat:convert', async (event, params) => {
    try {
      const { inputPath, targetFormat, options = {}, outputDir } = params;
      console.log(`[Main] [Converting] input="${inputPath}", target="${targetFormat}", outDir="${outputDir || 'default'}"`);
      const result = await ConverterHub.convert(inputPath, targetFormat, { ...options, outputDir });
      console.log(`[Main] [Success] Great! Reassembly completed via ${result.engine || 'native engine'}.`);
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

  // 打开转换后文件
  ipcMain.handle('greatformat:open-path', async (event, filePath) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        await shell.openPath(filePath);
        return { success: true };
      }
      if (filePath && fs.existsSync(path.dirname(filePath))) {
        await shell.openPath(path.dirname(filePath));
        return { success: true };
      }
      return { success: false, error: '文件不存在' };
    } catch (e) {
      console.error('[Main] openPath error:', e);
      return { success: false, error: e.message };
    }
  });

  // 在文件夹中显示文件
  ipcMain.handle('greatformat:show-in-folder', async (event, filePath) => {
    try {
      if (filePath && fs.existsSync(filePath)) {
        shell.showItemInFolder(filePath);
        return { success: true };
      }
      if (filePath && fs.existsSync(path.dirname(filePath))) {
        await shell.openPath(path.dirname(filePath));
        return { success: true };
      }
      return { success: false, error: '文件不存在' };
    } catch (e) {
      console.error('[Main] showItemInFolder error:', e);
      return { success: false, error: e.message };
    }
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
