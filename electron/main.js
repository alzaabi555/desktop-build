const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { URL } = require('url');
const { autoUpdater } = require('electron-updater');

// ------------------------------
// Performance flags (اختياري)
// ------------------------------
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-site-isolation-trials');

app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

// Single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// ------------------------------
// Google OAuth Desktop settings
// ------------------------------
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  'PUT_YOUR_DESKTOP_CLIENT_ID.apps.googleusercontent.com';

const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET ||
  'PUT_YOUR_DESKTOP_CLIENT_SECRET';

let mainWindow = null;

// ------------------------------
// Helpers
// ------------------------------
function isHttpUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function sendToRenderer(channel, payload) {
  try {
    if (mainWindow && mainWindow.webContents) mainWindow.webContents.send(channel, payload);
  } catch {}
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
      backgroundThrottling: false,
      webSecurity: true,
    },
  });

  // لا تمسح Cache هنا (قد يسبب مشاكل تسجيل الدخول)
  // mainWindow.webContents.session.clearCache();

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  mainWindow.setMenuBarVisibility(false);

  // أي نافذة جديدة => افتح خارجيًا
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  // أي تنقّل خارجي داخل نفس النافذة => افتح خارجيًا
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isHttpUrl(url)) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

// ------------------------------
// Loopback OAuth (127.0.0.1)
// ------------------------------
let loopbackServer = null;
let loopbackState = null;
let loopbackRedirectUri = null;

function startLoopbackServer() {
  return new Promise((resolve, reject) => {
    // نظّف أي سيرفر سابق
    try {
      if (loopbackServer) loopbackServer.close();
    } catch {}

    loopbackServer = http.createServer((req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://127.0.0.1:${loopbackServer.address().port}`);
        if (reqUrl.pathname !== '/oauth2/callback') {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        const code = reqUrl.searchParams.get('code');
        const state = reqUrl.searchParams.get('state');
        const error = reqUrl.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h3>Login failed</h3><p>You can close this window and return to the app.</p>');
          sendToRenderer('google-auth-error', { error, url: reqUrl.toString(), via: 'loopback' });
          return;
        }

        // أظهر صفحة نجاح للمستخدم
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h3>Login completed</h3><p>You can close this window and return to the app.</p>');

        // تحقق state
        if (!code) {
          sendToRenderer('google-auth-error', { error: 'Missing code', url: reqUrl.toString(), via: 'loopback' });
          return;
        }
        if (loopbackState && state !== loopbackState) {
          sendToRenderer('google-auth-error', { error: 'State mismatch', url: reqUrl.toString(), via: 'loopback' });
          return;
        }

        // أرسل الكود للواجهة
        sendToRenderer('google-auth-code', { code, state, url: reqUrl.toString(), via: 'loopback' });
      } catch (e) {
        sendToRenderer('google-auth-error', { error: String(e?.message || e), via: 'loopback' });
      }
    });

    loopbackServer.on('error', reject);

    // port=0 => اختيار بورت متاح تلقائيًا
    loopbackServer.listen(0, '127.0.0.1', () => {
      const port = loopbackServer.address().port;
      loopbackRedirectUri = `http://127.0.0.1:${port}/oauth2/callback`;
      resolve({ port, redirectUri: loopbackRedirectUri });
    });
  });
}

async function exchangeCodeForTokens(code) {
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('client_id', 
87037584903-lavg5se9f7mfkuvhnqbj53skmorord0u.apps.googleusercontent.com
);
  params.append('client_secret', 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);
  params.append('redirect_uri', loopbackRedirectUri);
  params.append('grant_type', 'authorization_code');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || 'Token exchange failed');

  return { id_token: data.id_token, access_token: data.access_token };
}

// ------------------------------
// IPC
// ------------------------------
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('auth:start-google', async (_event, payload) => {
  const scopes = Array.isArray(payload?.scopes) ? payload.scopes : ['openid', 'email', 'profile'];
  const scopeString = scopes.join(' ');
  loopbackState = payload?.state || crypto.randomBytes(16).toString('hex');

  try {
    const { redirectUri } = await startLoopbackServer();

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopeString)}` +
      `&state=${encodeURIComponent(loopbackState)}` +
      `&prompt=select_account`;

    await shell.openExternal(authUrl);

    return { ok: true, state: loopbackState, redirectUri };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
});

ipcMain.handle('auth:exchange-code', async (_event, payload) => {
  const code = payload?.code;
  if (!code) throw new Error('Missing code');

  const tokens = await exchangeCodeForTokens(code);

  // اختياري: أغلق السيرفر بعد النجاح لتفريغ المنفذ
  try {
    if (loopbackServer) loopbackServer.close();
  } catch {}
  loopbackServer = null;

  return tokens;
});

// ------------------------------
// Startup
// ------------------------------
app.whenReady().then(() => {
  createWindow();
  if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
