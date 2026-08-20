const { contextBridge, ipcRenderer, webUtils } = require('electron');

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
  openPath: (filePath) => ipcRenderer.invoke('greatformat:open-path', filePath),
  showItemInFolder: (filePath) => ipcRenderer.invoke('greatformat:show-in-folder', filePath),
  toggleContextMenu: (enable) => ipcRenderer.invoke('greatformat:toggle-context-menu', enable),
  getPdfThumbnails: (filePath) => ipcRenderer.invoke('greatformat:pdf-thumbnails', filePath),
  reorganizePdf: (params) => ipcRenderer.invoke('greatformat:pdf-reorganize', params)
});
