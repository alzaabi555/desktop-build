
const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// ---------------------------------------------------------
// 🔗 Deep Link (rasedapp://) for Windows/macOS
// ---------------------------------------------------------
const PROTOCOL = 'rasedapp';

function registerProtocol() {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }
}

function extractDeepLink(argv) {
  const prefix = `${PROTOCOL}://`;
  return argv.find((a) => typeof a === 'string' && a.startsWith(prefix));
}

// ---------------------------------------------------------
// ✅ Helpers
// ---------------------------------------------------------
function sendToRenderer(channel, payload) {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload);
    }
  } catch (e) {
    console.error(`Failed to send IPC "${channel}"`, e);
  }
}

function safeClose(win) {
  try {
    if (win && !win.isDestroyed()) win.close();
  } catch (_) {}
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

// ---------------------------------------------------------
// 🪟 Main window
// ---------------------------------------------------------
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

  // (اختياري) تنظيف الكاش
  mainWindow.webContents.session.clearCache().then(() => {
    console.log('Cache cleared successfully');
  });

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  mainWindow.setMenuBarVisibility(false);

  // فتح الروابط الخارجية في المتصفح
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
// 🔐 Google OAuth (Desktop) via popup window
// - Opens Google consent page
// - Captures redirect to rasedapp://oauth?code=...&state=...
// - Sends code/state back to renderer
// ---------------------------------------------------------
let authWindow = null;

function buildGoogleAuthUrl({
  clientId,
  redirectUri,
  scopes,
  state,
  prompt = 'select_account',
  accessType = 'offline',
}) {
  const scopeStr = Array.isArray(scopes) ? scopes.join(' ') : String(scopes || '');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopeStr);
  url.searchParams.set('state', state || '');
  url.searchParams.set('prompt', prompt);
  url.searchParams.set('access_type', accessType);

  // مهم: لتفادي اختيار حساب تلقائيًا في بعض الحالات
  // url.searchParams.set('include_granted_scopes', 'true');

  return url.toString();
}

function parseUrlParams(urlString) {
  try {
    const u = new URL(urlString);
    const params = {};
    for (const [k, v] of u.searchParams.entries()) params[k] = v;
    return { pathname: u.pathname, host: u.host, params };
  } catch (e) {
    return { pathname: '', host: '', params: {} };
  }
}

async function startGoogleAuthFlow(payload) {
  // payload يأتي من الواجهة عبر ipcMain.handle('auth:start-google', ...)
  const {
    clientId,
    redirectUri,
    scopes,
    state,
    prompt,
    accessType,
  } = payload || {};

  if (!clientId) throw new Error('Missing clientId');
  if (!redirectUri) throw new Error('Missing redirectUri');
  if (!scopes || (Array.isArray(scopes) && scopes.length === 0))
    throw new Error('Missing scopes');

  // أغلق أي نافذة سابقة
  safeClose(authWindow);
  authWindow = null;

  const authUrl = buildGoogleAuthUrl({
    clientId,
    redirectUri,
    scopes,
    state,
    prompt,
    accessType,
  });

  authWindow = new BrowserWindow({
    width: 520,
    height: 720,
    parent: mainWindow || undefined,
    modal: !!mainWindow,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: false,
    },
  });

  authWindow.setMenuBarVisibility(false);

  // منع أي فتح نوافذ جديدة داخل نافذة تسجيل الدخول
  authWindow.webContents.setWindowOpenHandler(({ url }) => {
    // بعض صفحات Google قد تفتح روابط مساعدة
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });

  // التقاط redirect إلى rasedapp://...
  const handlePossibleRedirect = (url) => {
    if (!url || typeof url !== 'string') return false;

    // نلتقط فقط بروتوكولنا
    if (!url.startsWith(`${PROTOCOL}://`)) return false;

    const { params } = parseUrlParams(url);
    const code = params.code;
    const returnedState = params.state;
    const error = params.error;

    if (error) {
      sendToRenderer('google-auth-error', { error, url });
    } else if (code) {
      sendToRenderer('google-auth-code', { code, state: returnedState, url });
    } else {
      sendToRenderer('google-auth-error', {
        error: 'missing_code_in_redirect',
        url,
      });
    }

    safeClose(authWindow);
    authWindow = null;
    return true;
  };

  authWindow.webContents.on('will-redirect', (event, url) => {
    if (handlePossibleRedirect(url)) event.preventDefault();
  });

  authWindow.webContents.on('will-navigate', (event, url) => {
    if (handlePossibleRedirect(url)) event.preventDefault();
  });

  authWindow.on('closed', () => {
    authWindow = null;
  });

  await authWindow.loadURL(authUrl);
  return { ok: true };
}

// ---------------------------------------------------------
// 🏁 Single instance + Deep link handling (Windows/Linux)
// ---------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    const url = extractDeepLink(argv);

    // هذا يظل مفيدًا لسيناريو deep link العام
    if (url) {
      sendToRenderer('deep-link', url);

      // كذلك: لو كان deep link خاص OAuth (rasedapp://oauth?code=...)
      // يمكننا تفكيكه وإرسال الكود مباشرة (احتياط إضافي)
      try {
        if (url.startsWith(`${PROTOCOL}://`)) {
          const { params } = parseUrlParams(url);
          if (params && params.code) {
            sendToRenderer('google-auth-code', {
              code: params.code,
              state: params.state,
              url,
              via: 'second-instance',
            });
          }
          if (params && params.error) {
            sendToRenderer('google-auth-error', {
              error: params.error,
              url,
              via: 'second-instance',
            });
          }
        }
      } catch (_) {}
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerProtocol();

    // IPC: نسخة التطبيق (موجودة عندك في الواجهة)
    ipcMain.handle('get-app-version', () => app.getVersion());

    // IPC: بدء تسجيل Google
    ipcMain.handle('auth:start-google', async (event, payload) => {
      return startGoogleAuthFlow(payload);
    });

    // IPC: إلغاء (اختياري)
    ipcMain.handle('auth:cancel-google', async () => {
      safeClose(authWindow);
      authWindow = null;
      return { ok: true };
    });

    createWindow();

    // أول فتح عبر deep link والتطبيق كان مغلق
    const firstUrl = extractDeepLink(process.argv);
    if (firstUrl) {
      // إرسال deep link كالسابق
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.once('did-finish-load', () => {
          sendToRenderer('deep-link', firstUrl);

          // احتياط: لو deep link هو OAuth redirect
          try {
            const { params } = parseUrlParams(firstUrl);
            if (params && params.code) {
              sendToRenderer('google-auth-code', {
                code: params.code,
                state: params.state,
                url: firstUrl,
                via: 'first-url',
              });
            }
            if (params && params.error) {
              sendToRenderer('google-auth-error', {
                error: params.error,
                url: firstUrl,
                via: 'first-url',
              });
            }
          } catch (_) {}
        });
      }
    }

    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
      if (returnValue.response === 0) autoUpdater.quitAndInstall();
    });
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
