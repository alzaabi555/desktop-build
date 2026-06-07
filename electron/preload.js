const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  /**
   * الحصول على نسخة التطبيق الحالية
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  /**
   * فتح الروابط الخارجية في المتصفح الافتراضي للنظام
   * مثل واتساب أو روابط الدعم
   */
  openExternal: (url) => {
    if (typeof url === 'string') {
      return shell.openExternal(url);
    }
  },

  /**
   * إرسال أوامر عامة من الواجهة إلى Electron
   * مثل minimize / maximize / close إن كانت مستخدمة في الشريط العلوي
   */
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },

  /**
   * أزرار نافذة ويندوز
   */
  minimize: () => ipcRenderer.send('minimize'),
  maximize: () => ipcRenderer.send('maximize'),
  close: () => ipcRenderer.send('close'),

  /**
   * فتح صفحة Chrome Voice Bridge
   * هذه الصفحة تعمل كميكروفون خارجي وترسل النص إلى تطبيق راصد
   */
  openVoiceBridge: () => ipcRenderer.invoke('open-voice-bridge'),

  /**
   * استقبال الأمر الصوتي القادم من Chrome Voice Bridge
   * main.js يرسل event باسم voice-command
   */
  onVoiceCommand: (callback) => {
    const handler = (_event, text) => {
      if (typeof callback === 'function') {
        callback(text);
      }
    };

    ipcRenderer.on('voice-command', handler);

    // مهم لإزالة المستمع عند إغلاق أو إعادة تحميل المكوّن
    return () => {
      ipcRenderer.removeListener('voice-command', handler);
    };
  },

  /**
   * إرسال قطعة صوت للذكاء الاصطناعي
   * تركتها كما هي إذا كنت تستخدمها في تجارب أخرى
   */
  sendAudioChunk: (buffer) => {
    ipcRenderer.send('audio-chunk', buffer);
  },

  /**
   * استقبال النص النهائي من أي محرك صوت آخر
   */
  onSpeechResult: (callback) => {
    const handler = (_event, text) => {
      if (typeof callback === 'function') {
        callback(text);
      }
    };

    ipcRenderer.on('speech-result', handler);

    return () => {
      ipcRenderer.removeListener('speech-result', handler);
    };
  },

  /**
   * استقبال النص الجزئي من أي محرك صوت آخر
   */
  onSpeechPartial: (callback) => {
    const handler = (_event, text) => {
      if (typeof callback === 'function') {
        callback(text);
      }
    };

    ipcRenderer.on('speech-partial', handler);

    return () => {
      ipcRenderer.removeListener('speech-partial', handler);
    };
  }
});
