const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
})
