const { app, BrowserWindow, ipcMain, clipboard } = require('electron')
const path = require('path')
const os = require('os')

const isDev = process.env.NODE_ENV !== 'production'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'IEP Writer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#F8FAFC',
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

ipcMain.handle('get-system-info', () => {
  const totalRam = os.totalmem()
  const totalRamGB = Math.round(totalRam / (1024 ** 3))
  const model = totalRamGB <= 10 ? 'gemma4:e2b-q3_K_M' : 'gemma4:e2b'
  return { totalRamGB, model, mode: totalRamGB <= 10 ? '절약' : '고품질' }
})

ipcMain.handle('copy-to-clipboard', (_, text) => {
  clipboard.writeText(text)
  return true
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
