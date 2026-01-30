
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// 1) اجبر Electron يكتب بياناته في AppData (حل مشكلة Access is denied للكاش/Quota)
app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp')); // غيّر الاسم إذا تريد

// 2) امنع تشغيل أكثر من نسخة (يخفف مشاكل الكاش/Quota)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  return;
}

// (اختياري) إذا حاول المستخدم فتح التطبيق مرة ثانية، ركّز النافذة الحالية
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// إيقاف التسريع المادي لحل مشاكل التعليق والتجميد في الويندوز
app.disableHardwareAcceleration();

// زيادة حد الذاكرة
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  mainWindow.setMenuBarVisibility(false);

  // 3) (اختياري/أنصح به) امسح الكاش بعد اكتمال التحميل بدل قبل التحميل
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.session.clearCache()
      .then(() => console.log('Cache cleared successfully'))
      .catch(err => console.error('clearCache failed:', err));
  });

  // فتح الروابط الخارجية
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('https:') || url.startsWith('http:') ||
      url.startsWith('mailto:') || url.startsWith('tel:') ||
      url.startsWith('sms:') || url.startsWith('whatsapp:')
    ) {
      shell.openExternal(url).catch(err => console.error('Failed to open external url:', err));
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
