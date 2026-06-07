/**
 * Rased App
 * Developed by: Mohammed Al-Zaabi
 * Copyright © 2026. All rights reserved.
 */

const { app, BrowserWindow, shell, ipcMain, dialog, session } = require('electron');
const path = require('path');
const http = require('http');
const { autoUpdater } = require('electron-updater');

// ---------------------------------------------------------
// 🌙 دالة استشعار رمضان الذكية الخاصة بـ Electron
// ---------------------------------------------------------
function isRamadan() {
  try {
    const parts = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      month: 'numeric'
    }).formatToParts(new Date());

    return parseInt(parts.find(p => p.type === 'month')?.value || '0') === 9;
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------
// 🚀 إعدادات الأداء والنظام
// ---------------------------------------------------------
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=8192');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-site-isolation-trials');

// ---------------------------------------------------------
// 🎙️ إعدادات المايكروفون والوسائط داخل Electron
// ---------------------------------------------------------
app.commandLine.appendSwitch('enable-media-stream');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('disable-background-media-suspend');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// ---------------------------------------------------------
// 📁 مسار بيانات التطبيق
// ---------------------------------------------------------
app.setPath('userData', path.join(app.getPath('appData'), 'RasedApp'));

// ---------------------------------------------------------
// 🔒 منع تشغيل أكثر من نسخة
// ---------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
}

// ---------------------------------------------------------
// 🔄 إعدادات التحديث التلقائي
// ---------------------------------------------------------
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

// ---------------------------------------------------------
// 🎙️ Chrome Voice Bridge
// ---------------------------------------------------------
const VOICE_BRIDGE_PORT = 37654;
let voiceBridgeServer = null;

function getVoiceBridgeHtml() {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>راصد - وضع الحصة الصوتي</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .card {
      width: min(520px, calc(100vw - 32px));
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 25px 80px rgba(0,0,0,0.35);
      backdrop-filter: blur(16px);
    }

    .badge {
      display: inline-flex;
      gap: 8px;
      align-items: center;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(99,102,241,0.22);
      color: #c7d2fe;
      font-weight: 800;
      font-size: 12px;
      margin-bottom: 16px;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 26px;
      font-weight: 900;
    }

    p {
      margin: 8px 0;
      color: #cbd5e1;
      font-size: 14px;
      line-height: 1.7;
    }

    button {
      margin-top: 20px;
      border: 0;
      border-radius: 18px;
      padding: 16px 22px;
      font-size: 16px;
      font-weight: 900;
      cursor: pointer;
      color: white;
      background: #4f46e5;
      box-shadow: 0 14px 35px rgba(79,70,229,0.35);
      transition: transform 0.15s ease, background 0.15s ease;
    }

    button:active {
      transform: scale(0.96);
    }

    button.stop {
      background: #e11d48;
      box-shadow: 0 14px 35px rgba(225,29,72,0.3);
    }

    .transcript {
      margin-top: 20px;
      min-height: 48px;
      background: rgba(15,23,42,0.55);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 18px;
      padding: 14px;
      font-size: 18px;
      font-weight: 800;
      color: #f8fafc;
      word-break: break-word;
    }

    .status {
      margin-top: 12px;
      font-size: 12px;
      color: #94a3b8;
      min-height: 20px;
    }

    .hint {
      margin-top: 16px;
      font-size: 12px;
      color: #a5b4fc;
    }
  </style>
</head>

<body>
  <div class="card">
    <div class="badge">
      <span id="dot">●</span>
      <span id="badgeText">جاهز</span>
    </div>

    <h1>وضع الحصة الصوتي</h1>
    <p>هذه الصفحة تستخدم Chrome للاستماع فقط، وترسل الأوامر إلى تطبيق راصد في ويندوز.</p>
    <p>اضغط تشغيل مرة واحدة، ثم قل مثلًا: سجل غياب محمد، قرعة عشوائية، تعزيز الفائز.</p>

    <button id="toggleBtn">تشغيل الاستماع</button>

    <div class="transcript" id="transcript">لم يتم التقاط أمر بعد</div>
    <div class="status" id="status">يفضل إبقاء هذه النافذة مفتوحة أثناء الحصة.</div>
    <div class="hint">إذا توقف الاستماع، اضغط تشغيل مرة أخرى.</div>
  </div>

  <script>
    const ENDPOINT = 'http://127.0.0.1:${VOICE_BRIDGE_PORT}/command';

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const toggleBtn = document.getElementById('toggleBtn');
    const transcriptEl = document.getElementById('transcript');
    const statusEl = document.getElementById('status');
    const badgeText = document.getElementById('badgeText');
    const dot = document.getElementById('dot');

    let recognition = null;
    let listening = false;
    let manualStop = false;
    let restartTimer = null;

    function setStatus(text) {
      statusEl.textContent = text;
    }

    function setListeningUi(active) {
      if (active) {
        badgeText.textContent = 'يستمع الآن';
        dot.style.color = '#22c55e';
        toggleBtn.textContent = 'إيقاف الاستماع';
        toggleBtn.classList.add('stop');
      } else {
        badgeText.textContent = 'متوقف';
        dot.style.color = '#f97316';
        toggleBtn.textContent = 'تشغيل الاستماع';
        toggleBtn.classList.remove('stop');
      }
    }

    async function sendCommand(text) {
      try {
        await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });

        setStatus('تم إرسال الأمر إلى تطبيق راصد');
      } catch (error) {
        setStatus('تعذر إرسال الأمر إلى تطبيق راصد. تأكد أن التطبيق مفتوح.');
      }
    }

    function restartRecognition(delay = 350) {
      if (!listening || manualStop) return;

      if (restartTimer) {
        clearTimeout(restartTimer);
      }

      restartTimer = setTimeout(() => {
        if (!listening || manualStop || !recognition) return;

        try {
          recognition.start();
        } catch (e) {
          // قد يكون المحرك يعمل بالفعل
        }
      }, delay);
    }

    function createRecognition() {
      if (!SpeechRecognition) {
        transcriptEl.textContent =
          'SpeechRecognition غير متوفر في هذا المتصفح. افتح الصفحة في Google Chrome.';
        setStatus('المتصفح غير مدعوم.');
        return null;
      }

      const rec = new SpeechRecognition();

      rec.lang = 'ar-OM';
      rec.continuous = true;
      rec.interimResults = false;

      rec.onstart = () => {
        listening = true;
        setListeningUi(true);
        setStatus('استمع الآن...');
      };

      rec.onresult = (event) => {
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          }
        }

        finalText = finalText.trim();

        if (!finalText) return;

        transcriptEl.textContent = finalText;
        sendCommand(finalText);

        restartRecognition(350);
      };

      rec.onerror = (event) => {
        setStatus('خطأ: ' + event.error);

        if (
          event.error === 'not-allowed' ||
          event.error === 'service-not-allowed'
        ) {
          listening = false;
          manualStop = true;
          setListeningUi(false);
          return;
        }

        if (listening && !manualStop) {
          restartRecognition(700);
        }
      };

      rec.onend = () => {
        if (listening && !manualStop) {
          setStatus('إعادة تنشيط الاستماع...');
          restartRecognition(350);
        } else {
          setListeningUi(false);
          setStatus('تم إيقاف الاستماع');
        }
      };

      return rec;
    }

    function start() {
      manualStop = false;

      if (!recognition) {
        recognition = createRecognition();
      }

      if (!recognition) return;

      listening = true;

      try {
        recognition.start();
      } catch (e) {
        restartRecognition(300);
      }
    }

    function stop() {
      manualStop = true;
      listening = false;

      if (restartTimer) {
        clearTimeout(restartTimer);
      }

      try {
        if (recognition) {
          recognition.stop();
        }
      } catch (e) {}

      setListeningUi(false);
      setStatus('تم إيقاف الاستماع');
    }

    toggleBtn.addEventListener('click', () => {
      if (listening) {
        stop();
      } else {
        start();
      }
    });

    if (!SpeechRecognition) {
      transcriptEl.textContent =
        'افتح هذه الصفحة في Google Chrome حتى يعمل التعرف الصوتي.';
      setStatus('SpeechRecognition غير متوفر.');
    } else {
      setStatus('جاهز. اضغط تشغيل الاستماع.');
    }
  </script>
</body>
</html>
`;
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

    if (req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });
      res.end(getVoiceBridgeHtml());
      return;
    }

    if (req.method === 'POST' && req.url === '/command') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const text = String(payload.text || '').trim();

          if (text && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('voice-command', text);
          }

          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
          });
          res.end(JSON.stringify({ ok: true }));
        } catch (error) {
          res.writeHead(400, {
            'Content-Type': 'application/json; charset=utf-8'
          });
          res.end(JSON.stringify({ ok: false }));
        }
      });

      return;
    }

    res.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8'
    });
    res.end('Not found');
  });

  voiceBridgeServer.listen(VOICE_BRIDGE_PORT, '127.0.0.1', () => {
    console.log(
      'Chrome Voice Bridge running on http://127.0.0.1:' +
        VOICE_BRIDGE_PORT
    );
  });

  voiceBridgeServer.on('error', error => {
    console.error('Voice Bridge server error:', error);
  });
}

function openVoiceBridgeInChrome() {
  startVoiceBridgeServer();

  const url = 'http://127.0.0.1:' + VOICE_BRIDGE_PORT + '/';

  shell.openExternal(url).catch(error => {
    console.error('Failed to open voice bridge:', error);
  });
}

// ---------------------------------------------------------
// 🪟 إنشاء نافذة التطبيق
// ---------------------------------------------------------
function createWindow() {
  const ramadanActive = isRamadan();
  const themeBgColor = ramadanActive ? '#0f172a' : '#f3f4f6';

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
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.resolve(__dirname, 'preload.js'),
      sandbox: false,
      backgroundThrottling: false,
      webSecurity: true,
      zoomFactor: 1.0,
      enableWebSQL: false
    }
  });

  mainWindow.webContents.session.clearCache();

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('did-fail-load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('render-process-gone:', details);
  });

  mainWindow.on('unresponsive', () => {
    console.error('mainWindow became unresponsive');
  });

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) return;

    mainWindow.show();
    mainWindow.focus();
    mainWindow.center();
  });

  mainWindow.autoHideMenuBar = true;
  mainWindow.removeMenu();

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Rased window loaded.');

    mainWindow.webContents
      .executeJavaScript(`
        console.log('SpeechRecognition:', window.SpeechRecognition);
        console.log('webkitSpeechRecognition:', window.webkitSpeechRecognition);
        console.log('mediaDevices:', navigator.mediaDevices);
        console.log(
          'getUserMedia:',
          navigator.mediaDevices && navigator.mediaDevices.getUserMedia
        );
      `)
      .catch(err => {
        console.error('Diagnostic script error:', err);
      });

    // mainWindow.webContents.openDevTools();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      const allowed = [
        'https:',
        'http:',
        'mailto:',
        'tel:',
        'sms:',
        'whatsapp:'
      ];

      if (allowed.includes(u.protocol)) {
        shell.openExternal(url).catch(console.error);
      }
    } catch (e) {
      console.error('Invalid URL in open handler', e);
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
// 📡 قنوات الاتصال IPC
// ---------------------------------------------------------
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('open-voice-bridge', () => {
  openVoiceBridgeInChrome();
  return true;
});

ipcMain.on('minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('open-external', (_event, url) => {
  if (typeof url === 'string') {
    shell.openExternal(url).catch(console.error);
  }
});

// ---------------------------------------------------------
// 🏁 دورة حياة التطبيق
// ---------------------------------------------------------
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      console.log('Permission request:', permission, details);

      const allowedPermissions = [
        'media',
        'audioCapture',
        'videoCapture',
        'microphone',
        'camera'
      ];

      if (allowedPermissions.includes(permission)) {
        callback(true);
        return;
      }

      callback(false);
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      console.log('Permission check:', permission, requestingOrigin, details);

      const allowedPermissions = [
        'media',
        'audioCapture',
        'videoCapture',
        'microphone',
        'camera'
      ];

      return allowedPermissions.includes(permission);
    }
  );

  session.defaultSession.setDevicePermissionHandler(details => {
    console.log('Device permission request:', details);

    if (
      details.deviceType === 'audioinput' ||
      details.deviceType === 'videoinput'
    ) {
      return true;
    }

    return false;
  });

  startVoiceBridgeServer();
  createWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
  }
});

// ---------------------------------------------------------
// 🔄 مستمعي التحديث التلقائي
// ---------------------------------------------------------
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'تحديث جديد',
    message: 'يوجد تحديث جديد، يتم تحميله الآن في الخلفية...',
    buttons: ['حسناً']
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog
    .showMessageBox({
      type: 'question',
      buttons: ['تثبيت الآن', 'لاحقاً'],
      title: 'اكتمل التحميل',
      message: 'تم تحميل التحديث. هل تريد إعادة التشغيل للتثبيت الآن؟'
    })
    .then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

app.on('window-all-closed', () => {
  if (voiceBridgeServer) {
    try {
      voiceBridgeServer.close();
    } catch (e) {
      // تجاهل
    }

    voiceBridgeServer = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
