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
      preload: path.join(__dirname, 'preload.js'),
      devTools: true,
      sandbox: false 
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  
  // فتح أدوات المطور لرؤية الأخطاء
  mainWindow.webContents.openDevTools(); 

  mainWindow.setMenuBarVisibility(false);

  // التعامل مع الروابط الخارجية
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

  // 1. إرسال الرابط الخام للواجهة
  mainWindow.webContents.send('deep-link', url);

  // 2. معالجة خاصة لـ Google OAuth
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');
    const state = urlObj.searchParams.get('state');

    if (code) {
      mainWindow.webContents.send('google-auth-code', { code, state, url });
      
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

app.on('second-instance', (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  const url = argv.find(arg => arg.startsWith(PROTOCOL + '://'));
  if (url) handleDeepLink(url);
});

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// ---------------------------------------------------------
// 🔐 4. دوال المصادقة (IPC Handlers) - تم التعديل هنا 👇
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

  // -------------------------------------------------------
  // 🔴 هام جداً: طباعة الرابط في الكونسول للطوارئ
  // -------------------------------------------------------
  console.log('\n\n================================================================');
  console.log('👉 انسخ هذا الرابط وضعه في المتصفح يدوياً إذا لم يفتح تلقائياً:');
  console.log(authUrl);
  console.log('================================================================\n\n');

  // محاولة فتح المتصفح
  try {
    await shell.openExternal(authUrl);
  } catch (err) {
    console.error('❌ فشل فتح المتصفح آلياً:', err);
  }

  // إعداد Timeout (زدنا الوقت لـ 5 دقائق ليعطيك فرصة للنسخ)
  pendingAuth = {
    state,
    timeout: setTimeout(() => {
      pendingAuth = null;
      if (mainWindow) mainWindow.webContents.send('google-auth-error', { error: 'timeout' });
    }, 300000) 
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

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  const deepUrl = process.argv.find(arg => arg.startsWith(PROTOCOL + '://'));
  if (deepUrl) {
    setTimeout(() => handleDeepLink(deepUrl), 1000); 
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({ type: 'info', title: 'تحديث جديد', message: `يوجد إصدار جديد...`, buttons: ['حسناً'] });
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({ type: 'question', buttons: ['تثبيت الآن', 'لاحقاً'], title: 'اكتمل التحميل', message: `تم التحميل...` })
  .then(({ response }) => { if (response === 0) autoUpdater.quitAndInstall(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
