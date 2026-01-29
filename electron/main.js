const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
// ✅ 1. استدعاء مكتبة التحديث التلقائي
const { autoUpdater } = require('electron-updater');

// إيقاف التسريع المادي لحل مشاكل التعليق والتجميد في الويندوز (حل جذري)
app.disableHardwareAcceleration();

// زيادة حد الذاكرة لمنع التعليق عند التعامل مع بيانات كبيرة
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// ✅ إعدادات التحديث (تحميل تلقائي وتثبيت عند الإغلاق)
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
      devTools: false, // اجعلها true إذا كنت بحاجة لفحص الأخطاء
      sandbox: false 
    }
  });

  // مسح الكاش لضمان تحميل التحديثات الجديدة في الواجهة
  mainWindow.webContents.session.clearCache().then(() => {
     console.log('Cache cleared successfully');
  });

  // تحميل ملفات التطبيق (النسخة المبنية)
  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  
  mainWindow.setMenuBarVisibility(false);

  // التعامل مع فتح الروابط الخارجية (واتساب، مواقع، الخ)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('sms:') || url.startsWith('whatsapp:')) {
      shell.openExternal(url).catch(err => console.error('Failed to open external url:', err));
    }
    return { action: 'deny' };
  });

  // حماية إضافية لمنع التنقل داخل النافذة الرئيسية
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

  // ✅ 2. التحقق من التحديثات فور تشغيل التطبيق (فقط في النسخة النهائية المجمعة)
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// ✅ 3. الاستماع لحدث اكتمال تحميل التحديث
autoUpdater.on('update-downloaded', () => {
  // سيتم تثبيت التحديث تلقائياً عند إغلاق التطبيق بفضل autoInstallOnAppQuit = true
  // يمكنك هنا إرسال رسالة للواجهة لإخبار المستخدم (اختياري)
  console.log('Update downloaded');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
