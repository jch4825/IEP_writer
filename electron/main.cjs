const { app, BrowserWindow, ipcMain, clipboard, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const os = require('os')
const fs = require('fs')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'IEP Writer',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
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

ipcMain.handle('save-txt', async (event, { defaultName, content }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultName || 'IEP.txt',
    filters: [{ name: 'Text', extensions: ['txt'] }],
  })
  if (result.canceled || !result.filePath) return { ok: false }
  fs.writeFileSync(result.filePath, content, 'utf8')
  return { ok: true, path: result.filePath }
})

ipcMain.handle('open-txt', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  const result = await dialog.showOpenDialog(win, {
    filters: [{ name: 'Text', extensions: ['txt'] }],
    properties: ['openFile'],
  })
  if (result.canceled || !result.filePaths[0]) return { ok: false }
  const filePath = result.filePaths[0]
  const content = fs.readFileSync(filePath, 'utf8')
  return { ok: true, content, name: path.basename(filePath) }
})

app.whenReady().then(() => {
  createWindow()
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      console.error('Update check failed:', err)
    })
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
