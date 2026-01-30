// electron/main.js

// 1. ✅ تمت إضافة ipcMain هنا
const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ---------------------------------------------------------
// 🔗 Deep Link (rasedapp://) for Windows/macOS
// ---------------------------------------------------------
const PROTOCOL = 'rasedapp';

function registerProtocol() {
  // أثناء التطوير: نمرر execPath + مسار سكربت التشغيل
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    // أثناء الإنتاج (بعد التثبيت)
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

function extractDeepLink(argv) {
  const prefix = `${PROTOCOL}://`;
  return argv.find((a) => typeof a === 'string' && a.startsWith(prefix));
}

// ---------------------------------------------------------
// 🚀 تحسينات الأداء وحل مشاكل التعليق
// ---------------------------------------------------------
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// ---------------------------------------------------------
// 🔄 إعدادات التحديث التلقائي
// ---------------------------------------------------------
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

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
      sandbox: false,
    },
  });

  mainWindow.webContents.session.clearCache().then(() => {
    console.log('Cache cleared successfully');
  });

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));

  mainWindow.setMenuBarVisibility(false);

  // ---------------------------------------------------------
  // 🔗 التعامل مع الروابط الخارجية
  // ---------------------------------------------------------
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('https:') ||
      url.startsWith('http:') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('sms:') ||
      url.startsWith('whatsapp:')
    ) {
      shell.openExternal(url).catch((err) =>
        console.error('Failed to open external url:', err)
      );
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
// 🏁 Single instance + Deep link handling (Windows/Linux)
// ---------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // على Windows: عند فتح rasedapp:// وهو يعمل، النظام يشغّل instance ثانية،
  // والـ primary يستقبل argv هنا.
  app.on('second-instance', (event, argv) => {
    const url = extractDeepLink(argv);
    if (url) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('deep-link', url);
      }
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // ---------------------------------------------------------
  // 🏁 عند بدء تشغيل التطبيق
  // ---------------------------------------------------------
  app.whenReady().then(() => {
    registerProtocol();

    // 2. ✅ هذا هو الكود الجديد: الرد على طلب الرياكت لمعرفة رقم الإصدار
    ipcMain.handle('get-app-version', () => {
      return app.getVersion(); // يعيد الرقم الموجود في package.json
    });

    createWindow();

    // إذا فتح التطبيق “أول مرة” عبر deep link وهو كان مغلق
    const firstUrl = extractDeepLink(process.argv);
    if (firstUrl && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('deep-link', firstUrl);
      });
    }

    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

// ---------------------------------------------------------
// 📢 أحداث التحديث التلقائي
// ---------------------------------------------------------
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'تحديث جديد متوفر',
    message: `يوجد إصدار جديد (${info.version}) يتم تحميله الآن في الخلفية.\nيمكنك متابعة عملك بشكل طبيعي.`,
    buttons: ['حسناً'],
  });
});

autoUpdater.on('update-downloaded', (info) => {
  dialog
    .showMessageBox({
      type: 'question',
      buttons: ['أعد التشغيل وثبت الآن', 'ليس الآن (عند الإغلاق)'],
      defaultId: 0,
      title: 'التحديث جاهز',
      message: `تم تحميل الإصدار ${info.version} بنجاح.\nهل تريد إعادة تشغيل التطبيق الآن لتثبيت التحديث؟`,
      detail:
        'إذا اخترت "ليس الآن"، سيتم تثبيت التحديث تلقائياً بمجرد إغلاقك للتطبيق.',
    })
    .then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
});

// ---------------------------------------------------------
// 🚪 عند إغلاق النوافذ
// ---------------------------------------------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
