const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ---------------------------------------------------------
// 🚀 تحسينات الأداء وحل مشاكل التعليق
// ---------------------------------------------------------
// إيقاف التسريع المادي لحل مشاكل التعليق والتجميد في الويندوز (حل جذري)
app.disableHardwareAcceleration();

// زيادة حد الذاكرة لمنع التعليق عند التعامل مع بيانات كبيرة
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// ---------------------------------------------------------
// 🔄 إعدادات التحديث التلقائي
// ---------------------------------------------------------
autoUpdater.autoDownload = true; // تحميل التحديث تلقائياً بمجرد اكتشافه
autoUpdater.autoInstallOnAppQuit = true; // تثبيت التحديث عند إغلاق التطبيق

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'), // تأكد من وجود الأيقونة في المسار الصحيح
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false, // اجعلها true أثناء التطوير فقط
      sandbox: false 
    }
  });

  // مسح الكاش لضمان تحميل التحديثات الجديدة في الواجهة وعدم تعليق النسخ القديمة
  mainWindow.webContents.session.clearCache().then(() => {
     console.log('Cache cleared successfully');
  });

  // تحميل ملفات التطبيق
  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  
  // إخفاء شريط القوائم العلوي (File, Edit...) لمظهر أكثر احترافية
  mainWindow.setMenuBarVisibility(false);

  // ---------------------------------------------------------
  // 🔗 التعامل مع الروابط الخارجية (واتساب، مواقع، إيميل)
  // ---------------------------------------------------------
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // السماح بفتح هذه البروتوكولات في المتصفح الافتراضي للجهاز
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('sms:') || url.startsWith('whatsapp:')) {
      shell.openExternal(url).catch(err => console.error('Failed to open external url:', err));
    }
    return { action: 'deny' }; // منع فتح نافذة جديدة داخل التطبيق
  });

  // حماية إضافية لمنع التنقل داخل النافذة الرئيسية لمواقع خارجية
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
// 🏁 عند بدء تشغيل التطبيق
// ---------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  // التحقق من التحديثات فقط في النسخة النهائية (المحزمة exe)
  // هذا يمنع ظهور أخطاء أثناء البرمجة (Localhost)
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// ---------------------------------------------------------
// 📢 أحداث التحديث التلقائي (الرسائل المنبثقة)
// ---------------------------------------------------------

// 1. عند اكتشاف تحديث وبدء التحميل
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'تحديث جديد متوفر',
    message: `يوجد إصدار جديد (${info.version}) يتم تحميله الآن في الخلفية.\nيمكنك متابعة عملك بشكل طبيعي.`,
    buttons: ['حسناً']
  });
});

// 2. عند انتهاء التحميل وجاهزية التثبيت
autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['أعد التشغيل وثبت الآن', 'ليس الآن (عند الإغلاق)'],
    defaultId: 0,
    title: 'التحديث جاهز',
    message: `تم تحميل الإصدار ${info.version} بنجاح.\nهل تريد إعادة تشغيل التطبيق الآن لتثبيت التحديث؟`,
    detail: 'إذا اخترت "ليس الآن"، سيتم تثبيت التحديث تلقائياً بمجرد إغلاقك للتطبيق.'
  }).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall(); // إعادة التشغيل والتثبيت فوراً
    }
  });
});

// 3. التعامل مع الأخطاء (يسجل في الكونسول فقط لتجنب إزعاج المستخدم)
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
