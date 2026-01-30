
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');

let mainWindow = null;

// ----------------------------------------------------
// 0) مسارات/إعدادات عامة
// ----------------------------------------------------

// اجبر Electron يكتب بياناته في AppData (حل مشاكل الكاش/Quota)
app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

// امنع تشغيل أكثر من نسخة
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  return;
}

// إيقاف التسريع المادي (حسب تجربتك مع ويندوز)
app.disableHardwareAcceleration();

// زيادة حد الذاكرة
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// ----------------------------------------------------
// 1) Deep Link: تسجيل البروتوكول rasedapp://
// ----------------------------------------------------
const PROTOCOL = 'rasedapp';

// تسجيل التطبيق كبروتوكول افتراضي
// مهم خصوصًا في dev defaultApp
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Helper: إرسال deep link للواجهة
function sendDeepLink(url) {
  try {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('deep-link', url);
    }
  } catch (e) {
    console.error('sendDeepLink failed:', e);
  }
}

// macOS: event open-url
app.on('open-url', (event, url) => {
  event.preventDefault();
  sendDeepLink(url);
});

// Windows/Linux: deep link يأتي في argv عند التشغيل أو عند second-instance
function extractDeepLinkFromArgv(argv) {
  const prefix = `${PROTOCOL}://`;
  return argv.find(a => typeof a === 'string' && a.startsWith(prefix)) || null;
}

app.on('second-instance', (_event, argv) => {
  // ركّز النافذة الحالية
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }

  const url = extractDeepLinkFromArgv(argv);
  if (url) sendDeepLink(url);
});

// ----------------------------------------------------
// 2) نافذة التطبيق الرئيسية
// ----------------------------------------------------
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

  // ملاحظة: لا تمسح الكاش هنا (خصوصًا لو عندك OAuth/جلسات)
  // لو تحتاج لاحقًا، اعمله بزر داخل الإعدادات وليس عند الإقلاع.

  // فتح الروابط الخارجية فقط (بحذر)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);

      // اسمح فقط بالبروتوكولات الآمنة المعروفة
      const allowed = ['https:', 'http:', 'mailto:', 'tel:', 'sms:'];
      if (allowed.includes(u.protocol)) {
        shell.openExternal(url).catch(console.error);
      }
    } catch {
      // تجاهل أي URL غير صالح
    }
    return { action: 'deny' };
  });

  // منع أي تنقل خارجي داخل نافذتك (يبقى كل شيء داخل file://)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocal = url.startsWith('file://');
    if (!isLocal) {
      event.preventDefault();
      // اختياري: افتح خارجيًا لو تحب
      shell.openExternal(url).catch(console.error);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ----------------------------------------------------
// 3) IPC: خدمات للـ preload/renderer
// ----------------------------------------------------
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// Google OAuth: نفتح المتصفح الخارجي وننتظر deep link يعود
let pendingAuth = null; // { state, createdAt, timeout }

ipcMain.handle('auth:start-google', async (_event, payload) => {
  // payload: { clientId, redirectUri, scopes, state, prompt?, accessType? }
  const clientId = payload?.clientId;
  const redirectUri = payload?.redirectUri;
  const scopes = Array.isArray(payload?.scopes) ? payload.scopes : ['openid', 'email', 'profile'];
  const state = String(payload?.state || crypto.randomBytes(16).toString('hex'));
  const prompt = payload?.prompt;
  const accessType = payload?.accessType;

  if (!clientId || !redirectUri) {
    throw new Error('Missing clientId or redirectUri');
  }

  // جهّز رابط OAuth (Authorization Code + PKCE غير مضاف هنا لتبسيط المثال)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state
  });

  if (prompt) params.set('prompt', prompt);
  if (accessType) params.set('access_type', accessType);

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // خزّن حالة انتظار (اختياري)
  if (pendingAuth?.timeout) clearTimeout(pendingAuth.timeout);
  pendingAuth = {
    state,
    createdAt: Date.now(),
    timeout: setTimeout(() => {
      pendingAuth = null;
      try {
        if (mainWindow) {
          mainWindow.webContents.send('google-auth-error', {
            error: 'timeout',
            url: authUrl,
            via: 'external-browser'
          });
        }
      } catch {}
    }, 2 * 60 * 1000) // 2 دقائق
  };

  // افتح المتصفح الخارجي
  await shell.openExternal(authUrl);

  // نرجع state للواجهة (اختياري)
  return { ok: true, state, url: authUrl, via: 'external-browser' };
});

ipcMain.handle('auth:cancel-google', async () => {
  if (pendingAuth?.timeout) clearTimeout(pendingAuth.timeout);
  pendingAuth = null;
  return { ok: true };
});

// ----------------------------------------------------
// 4) عند الإقلاع: التقط deep link من argv (Windows/Linux)
// ----------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  // إذا التطبيق بدأ عبر deep link
  const deep = extractDeepLinkFromArgv(process.argv);
  if (deep) {
    // تأخير بسيط حتى تجهز الواجهة
    setTimeout(() => sendDeepLink(deep), 800);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
