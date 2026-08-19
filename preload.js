const { contextBridge, ipcRenderer, shell, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getPathForFile: (file) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch (e) {
      console.warn('[Preload] webUtils.getPathForFile fallback:', e);
    }
    return file.path || '';
  },
  convertFile: (params) => ipcRenderer.invoke('greatformat:convert', params),
  selectDirectory: () => ipcRenderer.invoke('greatformat:select-dir'),
  getCapabilities: () => ipcRenderer.invoke('greatformat:capabilities'),
  openPath: (filePath) => shell.openPath(filePath),
  showItemInFolder: (filePath) => shell.showItemInFolder(filePath)
});
