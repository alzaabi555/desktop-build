/**
 * Rased App
 * Developed by: Mohammed Al-Zaabi
 * Copyright © 2026. All rights reserved.
 */

const { app, BrowserWindow, shell, ipcMain, dialog, session } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ---------------------------------------------------------
// 🌙 دالة استشعار رمضان الذكية الخاصة بـ Electron
// ---------------------------------------------------------
function isRamadan() {
  try {
    const parts = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      month: 'numeric'
    }).formatToParts(new Date());

    return parseInt(parts.find(p => p.type === 'month')?.value || '0') === 9;
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------
// 🚀 1. إعدادات الأداء والنظام
// ---------------------------------------------------------
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-site-isolation-trials');

// ---------------------------------------------------------
// 🎙️ إعدادات المايكروفون والوسائط داخل Electron
// ---------------------------------------------------------

// تفعيل Media Stream داخل Chromium/Electron
app.commandLine.appendSwitch('enable-media-stream');

// تجاوز نافذة السماح التجريبية للمايكروفون داخل Electron
// مفيد جدًا للاختبار داخل تطبيق exe
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');

// السماح بتشغيل الصوت بدون تفاعل إضافي من المستخدم
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// تحسين التقاط الصوت في بعض البيئات
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');

// محاولة إبقاء WebAudio و Media نشطة
app.commandLine.appendSwitch('disable-background-media-suspend');

// منع تعليق الصفحة في الخلفية قدر الإمكان
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// ملاحظة:
// هذه الإعدادات تساعد المايكروفون و getUserMedia.
// أما SpeechRecognition نفسه فقد يعتمد على دعم Chromium/Electron الداخلي.

// ---------------------------------------------------------
// 📁 مسار بيانات التطبيق
// ---------------------------------------------------------
app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

// ---------------------------------------------------------
// 🔒 منع تشغيل أكثر من نسخة
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 🪟 إنشاء نافذة التطبيق
// ---------------------------------------------------------
function createWindow() {
  const ramadanActive = isRamadan();
  const themeBgColor = ramadanActive ? '#0f172a' : '#f3f4f6';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'),
    backgroundColor: themeBgColor,

    // إلغاء إطار ويندوز الافتراضي
    frame: false,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'preload.js'),
      sandbox: false,
      backgroundThrottling: false,
      webSecurity: true,
      zoomFactor: 1.0,

      // مهم للوسائط
      enableWebSQL: false
    }
  });

  // تنظيف الكاش عند التشغيل
  mainWindow.webContents.session.clearCache();

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));

  mainWindow.autoHideMenuBar = true;
  mainWindow.removeMenu();

  // ---------------------------------------------------------
  // 🧪 تشخيص حالة المايكروفون و SpeechRecognition داخل النافذة
  // ---------------------------------------------------------
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Rased window loaded.');

    // اختبار داخلي يظهر في console إذا فتحت DevTools
    mainWindow.webContents.executeJavaScript(`
      console.log('SpeechRecognition:', window.SpeechRecognition);
      console.log('webkitSpeechRecognition:', window.webkitSpeechRecognition);
      console.log('mediaDevices:', navigator.mediaDevices);
      console.log('getUserMedia:', navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    `).catch(err => {
      console.error('Diagnostic script error:', err);
    });

    // افتح DevTools مؤقتًا للاختبار إذا أردت
    // احذف التعليق من السطر التالي أثناء الاختبار فقط
    // mainWindow.webContents.openDevTools();
  });

  // ---------------------------------------------------------
  // 🌐 فتح الروابط الخارجية خارج التطبيق
  // ---------------------------------------------------------
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      const allowed = ['https:', 'http:', 'mailto:', 'tel:', 'sms:', 'whatsapp:'];

      if (allowed.includes(u.protocol)) {
        shell.openExternal(url).catch(console.error);
      }
    } catch (e) {
      console.error('Invalid URL in open handler', e);
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
// 📡 3. قنوات الاتصال IPC
// ---------------------------------------------------------
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close', () => {
  if (mainWindow) mainWindow.close();
});

// فتح الروابط الخارجية من React عبر preload إن كانت مستخدمة
ipcMain.on('open-external', (_event, url) => {
  if (typeof url === 'string') {
    shell.openExternal(url).catch(console.error);
  }
});

// ---------------------------------------------------------
// 🏁 4. دورة حياة التطبيق
// ---------------------------------------------------------
app.whenReady().then(() => {
  // ---------------------------------------------------------
  // 🎙️ صلاحيات المايكروفون والكاميرا والصوت
  // ---------------------------------------------------------

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    console.log('Permission request:', permission, details);

    const allowedPermissions = [
      'media',
      'audioCapture',
      'videoCapture',
      'microphone',
      'camera'
    ];

    if (allowedPermissions.includes(permission)) {
      callback(true);
      return;
    }

    callback(false);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    console.log('Permission check:', permission, requestingOrigin, details);

    const allowedPermissions = [
      'media',
      'audioCapture',
      'videoCapture',
      'microphone',
      'camera'
    ];

    if (allowedPermissions.includes(permission)) {
      return true;
    }

    return false;
  });

  // ---------------------------------------------------------
  // 🎙️ ضبط إضافي لصلاحيات mediaDevices
  // ---------------------------------------------------------
  session.defaultSession.setDevicePermissionHandler((details) => {
    console.log('Device permission request:', details);

    if (
      details.deviceType === 'audioinput' ||
      details.deviceType === 'videoinput'
    ) {
      return true;
    }

    return false;
  });

  // ---------------------------------------------------------
  // إنشاء النافذة
  // ---------------------------------------------------------
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  }
});

// ---------------------------------------------------------
// 🔄 مستمعي التحديث التلقائي
// ---------------------------------------------------------
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
    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
``
