/**
 * Rased App
 * Developed by: Mohammed Al-Zaabi
 * Copyright © 2026. All rights reserved.
 */
const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ---------------------------------------------------------
// 🌙 دالة استشعار رمضان الذكية الخاصة بـ Electron
// ---------------------------------------------------------
function isRamadan() {
  try {
      const parts = new Intl.DateTimeFormat('en-TN-u-ca-islamic', { month: 'numeric' }).formatToParts(new Date());
      return parseInt(parts.find(p => p.type === 'month')?.value || '0') === 9;
  } catch(e) {
      return false;
  }
}

// ---------------------------------------------------------
// 🚀 1. إعدادات الأداء والنظام (High Performance Mode)
// ---------------------------------------------------------
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192'); 
app.commandLine.appendSwitch('enable-gpu-rasterization'); 
app.commandLine.appendSwitch('enable-zero-copy'); 
app.commandLine.appendSwitch('ignore-gpu-blacklist'); 
app.commandLine.appendSwitch('disable-site-isolation-trials'); 

app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ---------------------------------------------------------
// 🔄 2. إعدادات التحديث التلقائي
// ---------------------------------------------------------
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  const ramadanActive = isRamadan();
  const themeBgColor = ramadanActive ? '#0f172a' : '#f3f4f6'; 
  const themeSymbolColor = ramadanActive ? '#ffffff' : '#446A8D'; 

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'),
    backgroundColor: themeBgColor, 
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: themeBgColor,
      symbolColor: themeSymbolColor,
      height: 35
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'preload.js'),
      sandbox: false,
      backgroundThrottling: false,
      webSecurity: true,
      zoomFactor: 1.0
    }
  });

  mainWindow.webContents.session.clearCache();
  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
 mainWindow.autoHideMenuBar = true;
mainWindow.removeMenu();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      const allowed = ['https:', 'http:', 'mailto:', 'tel:', 'sms:', 'whatsapp:'];
      if (allowed.includes(u.protocol)) {
        shell.openExternal(url).catch(console.error);
      }
    } catch (e) {
      console.error("Invalid URL in open handler", e);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocal = url.startsWith('file://');
    if (!isLocal) {
        event.preventDefault();
        shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------
// 📡 3. قنوات الاتصال (IPC)
// ---------------------------------------------------------
ipcMain.handle('get-app-version', () => app.getVersion());

// ---------------------------------------------------------
// 🏁 4. دورة حياة التطبيق (الإصلاح الجذري هنا)
// ---------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  // تم تعطيل التحديث التلقائي مؤقتاً لتجنب تضارب نسخة المتجر
  // if (process.env.NODE_ENV === 'production') {
  //   autoUpdater.checkForUpdatesAndNotify();
  // }
}); // تم إغلاق القوس بشكل صحيح هنا

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// مستمعي التحديث التلقائي
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({ 
    type: 'info', 
    title: 'تحديث جديد', 
    message: 'يوجد تحديث جديد، يتم تحميله الآن في الخلفية...', 
    buttons: ['حسناً'] 
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({ 
    type: 'question', 
    buttons: ['تثبيت الآن', 'لاحقاً'], 
    title: 'اكتمل التحميل', 
    message: 'تم تحميل التحديث. هل تريد إعادة التشغيل للتثبيت الآن؟' 
  })
  .then(({ response }) => { 
    if (response === 0) autoUpdater.quitAndInstall(); 
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
