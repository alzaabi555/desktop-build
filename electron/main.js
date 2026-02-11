const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const crypto = require('crypto');

// ---------------------------------------------------------
// 🚀 1. إعدادات الأداء والنظام (High Performance Mode)
// ---------------------------------------------------------
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-site-isolation-trials');

app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// 🔴 البروتوكول للمعرف المعكوس (Google Auth)
const PROTOCOL = 'com.googleusercontent.apps.87037584903-3uc4aeg3nc5lk3pu8crjbaad184bhjth';

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'),
    backgroundColor: '#f3f4f6', // ✅ تم تصحيح مكانها والفاصلة قبلها
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // استخدام path.resolve لضمان الوصول للملف في النسخة المجمعة
      preload: path.resolve(__dirname, 'preload.js'),
      sandbox: false, // 👈 ضروري جداً لفتح المتصفح الخارجي
      backgroundThrottling: false,
      webSecurity: true
    }
  });

  mainWindow.webContents.session.clearCache();
  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  mainWindow.setMenuBarVisibility(false);

  // معالجة فتح الروابط الخارجية
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(console.error);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------
// 🔗 2. معالجة الروابط العميقة (Deep Linking)
// ---------------------------------------------------------
function handleDeepLink(url) {
  if (!mainWindow || !url) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();

  try {
    const cleanUrl = url.replace('#', '?');
    const urlObj = new URL(cleanUrl);
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');

    if (code) {
      mainWindow.webContents.send('google-auth-code', { code, state, url });
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

// ---------------------------------------------------------
// 🔐 3. المصادقة (Google Auth) - الحل النووي
// ---------------------------------------------------------
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('auth:start-google', async (_event, payload) => {
  const { clientId, redirectUri, scopes, state: userState } = payload;
  const state = userState || crypto.randomBytes(16).toString('hex');
  const scopeString = Array.isArray(scopes) ? scopes.join(' ') : 'openid email profile';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopeString)}&state=${state}`;

  try {
    // الطريقة الأولى: الفتح عبر Shell
    await shell.openExternal(authUrl);
    
    // الطريقة الثانية (خطة الطوارئ للويندوز): الفتح عبر سطر الأوامر بعد ثانية
    setTimeout(() => {
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`start "" "${authUrl}"`);
      }
    }, 1000);

    // تصغير التطبيق لإعطاء المجال للمتصفح
    if (mainWindow) {
        setTimeout(() => mainWindow.minimize(), 1500);
    }

    return { ok: true, state };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ---------------------------------------------------------
// 🏁 4. بدء التشغيل
// ---------------------------------------------------------
app.whenReady().then(() => {
  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  const deepUrl = process.argv.find(arg => arg.startsWith(PROTOCOL + '://'));
  if (deepUrl) setTimeout(() => handleDeepLink(deepUrl), 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
