const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ---------------------------------------------------------
// 🚀 1. إعدادات الأداء القصوى (High Performance Mode)
// ---------------------------------------------------------
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192'); // تخصيص ذاكرة حتى 8GB
app.commandLine.appendSwitch('enable-gpu-rasterization'); // تسريع الرسم عبر كرت الشاشة
app.commandLine.appendSwitch('enable-zero-copy'); // تسريع نقل البيانات بين العمليات
app.commandLine.appendSwitch('ignore-gpu-blacklist'); // إجبار استخدام GPU
app.commandLine.appendSwitch('disable-site-isolation-trials'); // تقليل استهلاك الذاكرة

// تحديد مسار بيانات المستخدم لضمان بقاء النسخ الاحتياطية المحلية آمنة
app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

// منع تشغيل أكثر من نسخة من التطبيق في نفس الوقت
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

// إعدادات التحديث التلقائي
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow = null;

// ---------------------------------------------------------
// 🛠️ 2. الدوال المساعدة
// ---------------------------------------------------------
function isHttpUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'),
    backgroundColor: '#f3f4f6',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'preload.js'),
      sandbox: false,
      backgroundThrottling: false, // يمنع بطء التطبيق عند تصغيره
      webSecurity: true,
    },
  });

  // تحميل ملف الواجهة الرئيسي
  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  
  // إخفاء شريط القوائم العلوي (Menu Bar)
  mainWindow.setMenuBarVisibility(false);

  // 🌐 معالجة الروابط الخارجية (مثل فتح واتساب أو المتصفح)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' }; // يمنع فتح نافذة داخل التطبيق ويفتحها في المتصفح الافتراضي
  });

  // منع التنقل داخل نافذة التطبيق لأي رابط خارجي
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isHttpUrl(url)) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

// ---------------------------------------------------------
// 📡 3. نظام IPC (التواصل مع واجهة React)
// ---------------------------------------------------------
// إرسال نسخة التطبيق للواجهة عند الطلب
ipcMain.handle('get-app-version', () => app.getVersion());

// ---------------------------------------------------------
// 🏁 4. دورة حياة التطبيق (Lifecycle)
// ---------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  // التحقق من التحديثات عند التشغيل في النسخة النهائية فقط
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

// إعادة التركيز على النافذة عند محاولة تشغيل نسخة ثانية
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
