const { contextBridge, shell, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  /**
   * الحصول على نسخة التطبيق الحالية
   * مفيد لعرض رقم الإصدار في الإعدادات أو أسفل القائمة
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  /**
   * فتح الروابط الخارجية في المتصفح الافتراضي للنظام
   * يُستخدم لفتح الواتساب أو أي روابط دعم فني خارج نافذة التطبيق
   */
  openExternal: (url) => shell.openExternal(url),
  // 🚀 🚀 هذا هو العصب المفقود الذي زرعناه للتو! 
  send: (channel, data) => ipcRenderer.send(channel, data)
  // إرسال قطعة صوت للذكاء الاصطناعي
  sendAudioChunk: (buffer) => ipcRenderer.send('audio-chunk', buffer),
  
  // استقبال النص المترجم
  onSpeechResult: (callback) => ipcRenderer.on('speech-result', (event, text) => callback(text)),
  onSpeechPartial: (callback) => ipcRenderer.on('speech-partial', (event, text) => callback(text)),
});
