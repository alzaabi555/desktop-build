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
});
