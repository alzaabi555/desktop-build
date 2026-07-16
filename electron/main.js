/**
 * Rased App
 * Electron main process
 * Developed by: Mohammed Al-Zaabi
 * Copyright (c) 2026. All rights reserved.
 */

const { app, BrowserWindow, shell, ipcMain, dialog, session } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const VOICE_BRIDGE_PORT = 37654;
const ENABLE_DEVTOOLS = process.env.RASED_DEVTOOLS === '1';

let mainWindow = null;
let voiceBridgeServer = null;
let voiceBridgeProcess = null;

function isRamadan() {
  try {
    const parts = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      month: 'numeric'
    }).formatToParts(new Date());

    const monthPart = parts.find((part) => part.type === 'month');
    return Number(monthPart && monthPart.value) === 9;
  } catch (error) {
    return false;
  }
}

function appendRendererLog(level, message, source, line) {
  try {
    const logPath = path.join(app.getPath('userData'), 'rased-renderer-errors.log');
    const entry = [
      '==================================================',
      new Date().toISOString(),
      `Level: ${String(level)}`,
      `Message: ${String(message || '')}`,
      `Source: ${String(source || '')}`,
      `Line: ${String(line || 0)}`,
      ''
    ].join('\n');

    fs.appendFileSync(logPath, entry, 'utf8');
  } catch (error) {
    console.error('Failed to write renderer log:', error);
  }
}

function findChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];

  return possiblePaths.find((filePath) => filePath && fs.existsSync(filePath)) || null;
}

function getVoiceBridgeHtml() {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rased Voice Bridge</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #0f172a; color: #fff; }
    main { padding: 18px; }
    h1 { margin: 0 0 8px; font-size: 18px; }
    p { margin: 0; line-height: 1.7; color: #cbd5e1; font-size: 13px; }
    .status { margin-top: 14px; padding: 10px 12px; border-radius: 12px; background: #1e293b; }
  </style>
</head>
<body>
  <main>
    <h1>راصد - جسر الأوامر الصوتية</h1>
    <p>اترك هذه النافذة مفتوحة عند استخدام التعرف الصوتي في نسخة Windows.</p>
    <div class="status">Voice bridge is ready.</div>
  </main>
</body>
</html>`;
}

function startVoiceBridgeServer() {
  if (voiceBridgeServer) return;

  voiceBridgeServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getVoiceBridgeHtml());
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok', service: 'rased-voice-bridge' }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'error', message: 'Not found' }));
  });

  voiceBridgeServer.listen(VOICE_BRIDGE_PORT, '127.0.0.1', () => {
    console.log(`Chrome Voice Bridge running on http://127.0.0.1:${VOICE_BRIDGE_PORT}`);
  });

  voiceBridgeServer.on('error', (error) => {
    console.error('Voice Bridge server error:', error);
    voiceBridgeServer = null;
  });
}

function openVoiceBridgeInChrome() {
  startVoiceBridgeServer();

  const url = `http://127.0.0.1:${VOICE_BRIDGE_PORT}/`;

  if (voiceBridgeProcess && !voiceBridgeProcess.killed) return true;

  const chromePath = findChromePath();
  if (!chromePath) {
    shell.openExternal(url).catch((error) => {
      console.error('Failed to open voice bridge:', error);
    });
    return true;
  }

  const userDataDir = path.join(
    app.getPath('userData'),
    'rased-voice-bridge-chrome-profile'
  );

  voiceBridgeProcess = spawn(
    chromePath,
    [
      `--app=${url}`,
      '--window-size=390,260',
      '--window-position=80,120',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--disable-extensions',
      '--autoplay-policy=no-user-gesture-required'
    ],
    {
      detached: false,
      stdio: 'ignore'
    }
  );

  voiceBridgeProcess.on('exit', () => {
    voiceBridgeProcess = null;
  });

  voiceBridgeProcess.on('error', (error) => {
    console.error('Failed to open Chrome Voice Bridge:', error);
    voiceBridgeProcess = null;
    shell.openExternal(url).catch(console.error);
  });

  return true;
}

function closeVoiceBridgeInChrome() {
  if (!voiceBridgeProcess) return;

  try {
    voiceBridgeProcess.kill();
  } catch (error) {
    console.error('Failed to close Chrome Voice Bridge:', error);
  }

  voiceBridgeProcess = null;
}

app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('enable-media-stream');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-background-media-suspend');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function isAllowedExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return ['https:', 'http:', 'mailto:', 'tel:', 'sms:', 'whatsapp:'].includes(parsed.protocol);
  } catch (error) {
    return false;
  }
}

function createWindow() {
  const themeBgColor = isRamadan() ? '#0f172a' : '#f3f4f6';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, '../icon.png'),
    backgroundColor: themeBgColor,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.autoHideMenuBar = true;
  mainWindow.removeMenu();

  mainWindow.webContents.session.clearCache().catch(console.error);

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (Number(level) >= 2 || String(message).includes('[RASED_')) {
      appendRendererLog(level, message, sourceId, line);
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('did-fail-load:', errorCode, errorDescription, validatedURL);
    appendRendererLog('did-fail-load', `${errorCode}: ${errorDescription}`, validatedURL, 0);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('render-process-gone:', details);
    appendRendererLog('render-process-gone', JSON.stringify(details), '', 0);
  });

  mainWindow.on('unresponsive', () => {
    console.error('mainWindow became unresponsive');
    appendRendererLog('unresponsive', 'mainWindow became unresponsive', '', 0);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      shell.openExternal(url).catch(console.error);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocalFile = url.startsWith('file://');
    if (!isLocalFile && isAllowedExternalUrl(url)) {
      event.preventDefault();
      shell.openExternal(url).catch(console.error);
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();

    if (ENABLE_DEVTOOLS) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Rased window loaded.');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadFile(path.join(__dirname, '../www/index.html')).catch((error) => {
    console.error('Failed to load app window:', error);
    appendRendererLog('loadFile', error && error.stack ? error.stack : String(error), '', 0);
  });
}

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('open-voice-bridge', () => openVoiceBridgeInChrome());
ipcMain.handle('close-voice-bridge', () => {
  closeVoiceBridgeInChrome();
  return true;
});

ipcMain.on('minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize', () => {
  if (!mainWindow) return;

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('open-external', (_event, url) => {
  if (typeof url === 'string' && isAllowedExternalUrl(url)) {
    shell.openExternal(url).catch(console.error);
  }
});

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowedPermissions = new Set([
        'media',
        'microphone',
        'audioCapture',
        'notifications',
        'clipboard-read',
        'clipboard-sanitized-write'
      ]);

      callback(allowedPermissions.has(permission));
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => {
      const allowedPermissions = new Set([
        'media',
        'microphone',
        'audioCapture',
        'notifications',
        'clipboard-read',
        'clipboard-sanitized-write'
      ]);

      return allowedPermissions.has(permission);
    }
  );

  session.defaultSession.setDevicePermissionHandler((details) => {
    return details.deviceType === 'audio';
  });

  startVoiceBridgeServer();
  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      console.error('Update check failed:', error);
    });
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('second-instance', () => {
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'تحديث جديد',
    message: 'يوجد تحديث جديد، يتم تحميله الآن في الخلفية...',
    buttons: ['حسناً']
  }).catch(console.error);
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'question',
    buttons: ['تثبيت الآن', 'لاحقاً'],
    defaultId: 0,
    cancelId: 1,
    title: 'اكتمل التحميل',
    message: 'تم تحميل التحديث. هل تريد إعادة التشغيل للتثبيت الآن؟'
  }).then(({ response }) => {
    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  }).catch(console.error);
});

app.on('window-all-closed', () => {
  closeVoiceBridgeInChrome();

  if (voiceBridgeServer) {
    try {
      voiceBridgeServer.close();
    } catch (error) {
      console.error('Failed to close voice bridge server:', error);
    }
    voiceBridgeServer = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
