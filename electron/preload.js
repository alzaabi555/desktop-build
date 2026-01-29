
const { contextBridge, shell, ipcRenderer } = require('electron');

// نحن نكشف وظائف آمنة للواجهة الأمامية
contextBridge.exposeInMainWorld('electron', {
  // 1. وظيفتك الحالية (لفتح الروابط) - ممتازة، أبقيتها كما هي
  openExternal: (url) => shell.openExternal(url),

  // 2. ✅ الوظيفة الجديدة (لجلب رقم الإصدار من النظام)
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
