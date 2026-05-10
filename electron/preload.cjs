const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  saveTxt: (data) => ipcRenderer.invoke('save-txt', data),
  openTxt: () => ipcRenderer.invoke('open-txt'),
})
