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
// تفعيل تسريع العتاد (GPU Acceleration) وزيادة حدود الذاكرة
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192'); // زيادة الذاكرة إلى 8GB
app.commandLine.appendSwitch('enable-gpu-rasterization'); // استخدام GPU للرسم
app.commandLine.appendSwitch('enable-zero-copy'); // تسريع نقل البيانات
app.commandLine.appendSwitch('ignore-gpu-blacklist'); // إجبار استخدام GPU حتى لو كان قديماً
app.commandLine.appendSwitch('disable-site-isolation-trials'); // تقليل استهلاك الذاكرة للعمليات

// تحديد مسار البيانات لضمان عدم ضياعها عند التحديث
app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

// منع فتح أكثر من نسخة للتطبيق
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
  // فحص حالة رمضان لتحديد الألوان قبل بناء النافذة
  const ramadanActive = isRamadan();
  const themeBgColor = ramadanActive ? '#0f172a' : '#f3f4f6'; // كحلي في رمضان، فضي في الأيام العادية
  const themeSymbolColor = ramadanActive ? '#ffffff' : '#446A8D'; // أيقونات بيضاء في رمضان، زرقاء في الأيام العادية

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'),
    
    // 🎨 منع الوميض الأبيض واستخدام اللون المناسب للفترة
    backgroundColor: themeBgColor, 

    // 🌟 دمج شريط الويندوز مع التطبيق بذكاء
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: themeBgColor,        // اللون يتغير تلقائياً حسب الشهر
      symbolColor: themeSymbolColor, // أيقونات ويندوز تتغير تلقائياً
      height: 35
    },

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // استخدام path.resolve لضمان الوصول للملف في النسخة المجمعة
      preload: path.resolve(__dirname, 'preload.js'),
      sandbox: false, // لضمان عمل الروابط الخارجية وأدوات النظام
      backgroundThrottling: false, // يمنع تهنيج التطبيق عند التصغير
      webSecurity: true,
      zoomFactor: 1.0
    }
  });

  // مسح الكاش لضمان تحميل أحدث نسخة من الواجهة
  mainWindow.webContents.session.clearCache();

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  
  mainWindow.setMenuBarVisibility(false);

  // 🌐 معالجة الروابط الخارجية (واتساب، متصفح، إلخ)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const allowed = ['https:', 'http:', 'mailto:', 'tel:', 'sms:', 'whatsapp:'];
    const u = new URL(url);
    if (allowed.includes(u.protocol)) {
      shell.openExternal(url).catch(console.error);
    }
    return { action: 'deny' };
  });

  // منع التنقل داخل النافذة لأي رابط خارجي
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
// إرجاع رقم الإصدار للواجهة
ipcMain.handle('get-app-version', () => app.getVersion());

// ---------------------------------------------------------
// 🏁 4. دورة حياة التطبيق
// ---------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

 // if (process.env.NODE_ENV === 'production') {
//   autoUpdater.checkForUpdatesAndNotify();
// }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// التعامل مع محاولة فتح نسخة ثانية (التركيز على النافذة الحالية)
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
