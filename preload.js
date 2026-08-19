const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  convertFile: (params) => ipcRenderer.invoke('greatformat:convert', params),
  selectDirectory: () => ipcRenderer.invoke('greatformat:select-dir'),
  getCapabilities: () => ipcRenderer.invoke('greatformat:capabilities'),
  openPath: (filePath) => shell.openPath(filePath),
  showItemInFolder: (filePath) => shell.showItemInFolder(filePath)
});
