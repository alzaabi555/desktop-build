const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const crypto = require('crypto');

// ---------------------------------------------------------
// 🚀 1. إعدادات الأداء والنظام
// ---------------------------------------------------------
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// جعل مسار البيانات في AppData لتجنب مشاكل الصلاحيات
app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

// منع تشغيل أكثر من نسخة (Single Instance Lock)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// تسجيل البروتوكول (Deep Link) لفتح التطبيق من المتصفح
// rasedapp://
const PROTOCOL = 'rasedapp';
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// ---------------------------------------------------------
// 🔄 2. إعدادات التحديث التلقائي
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
      preload: path.join(__dirname, 'preload.js'), // تأكد أن ملف البريلود الجديد موجود هنا
      devTools: false, // اجعله true للتطوير
      sandbox: false 
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  mainWindow.setMenuBarVisibility(false);

  // التعامل مع الروابط الخارجية (فتحها في المتصفح وليس داخل التطبيق)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const allowed = ['https:', 'http:', 'mailto:', 'tel:', 'sms:', 'whatsapp:'];
    const u = new URL(url);
    if (allowed.includes(u.protocol)) {
      shell.openExternal(url).catch(console.error);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------
// 🔗 3. معالجة الروابط العميقة (Deep Links & OAuth Callbacks)
// ---------------------------------------------------------
function handleDeepLink(url) {
  if (!mainWindow || !url) return;

  // 1. إرسال الرابط الخام للواجهة (لمن يريد استخدامه)
  mainWindow.webContents.send('deep-link', url);

  // 2. معالجة خاصة لـ Google OAuth
  // إذا الرابط يحتوي على code= أو error=
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');
    const state = urlObj.searchParams.get('state');

    if (code) {
      // إرسال الكود للواجهة (يتوافق مع preload الخاص بك)
      mainWindow.webContents.send('google-auth-code', { code, state, url });
      
      // إغلاق أي نافذة مصادقة معلقة لو وجدت
      if (pendingAuth?.timeout) clearTimeout(pendingAuth.timeout);
      pendingAuth = null;
    } 
    else if (error) {
      mainWindow.webContents.send('google-auth-error', { error, url });
    }
  } catch (e) {
    console.error('Error parsing deep link:', e);
  }
}

// الاستماع للروابط في الويندوز (argv)
app.on('second-instance', (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  const url = argv.find(arg => arg.startsWith(PROTOCOL + '://'));
  if (url) handleDeepLink(url);
});

// الاستماع للروابط في الماك (open-url)
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// ---------------------------------------------------------
// 🔐 4. دوال المصادقة (IPC Handlers)
// ---------------------------------------------------------
ipcMain.handle('get-app-version', () => app.getVersion());

let pendingAuth = null;

ipcMain.handle('auth:start-google', async (_event, payload) => {
  const { clientId, redirectUri, scopes, state: userState } = payload;
  
  if (!clientId || !redirectUri) throw new Error('Missing params');

  const state = userState || crypto.randomBytes(16).toString('hex');
  const scopeString = Array.isArray(scopes) ? scopes.join(' ') : 'openid email profile';

  // بناء رابط جوجل
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopeString}&state=${state}`;

  // فتح الرابط في المتصفح الخارجي (Chrome/Edge)
  await shell.openExternal(authUrl);

  // إعداد Timeout (اختياري)
  pendingAuth = {
    state,
    timeout: setTimeout(() => {
      pendingAuth = null;
      if (mainWindow) mainWindow.webContents.send('google-auth-error', { error: 'timeout' });
    }, 120000) // دقيقتين
  };

  return { ok: true, state };
});

ipcMain.handle('auth:cancel-google', async () => {
  if (pendingAuth?.timeout) clearTimeout(pendingAuth.timeout);
  pendingAuth = null;
  return { ok: true };
});

// ---------------------------------------------------------
// 🏁 5. بدء التشغيل
// ---------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  // التحقق من التحديثات (للنسخة المحزمة فقط)
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  // التقاط Deep Link عند فتح التطبيق لأول مرة
  const deepUrl = process.argv.find(arg => arg.startsWith(PROTOCOL + '://'));
  if (deepUrl) {
    setTimeout(() => handleDeepLink(deepUrl), 1000); // تأخير بسيط لتجهز الواجهة
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ---------------------------------------------------------
// 📢 6. أحداث التحديث التلقائي (Dialogs)
// ---------------------------------------------------------
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({
    type: 'info',
    title: 'تحديث جديد',
    message: `يوجد إصدار جديد (${info.version}). يتم التحميل...`,
    buttons: ['حسناً']
  });
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['تثبيت الآن', 'لاحقاً'],
    defaultId: 0,
    title: 'اكتمل التحميل',
    message: `تم تحميل الإصدار ${info.version}. هل تريد إعادة التشغيل للتثبيت؟`
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
