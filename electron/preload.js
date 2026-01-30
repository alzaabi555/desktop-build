// electron/preload.js
const { contextBridge, shell, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openExternal: (url) => shell.openExternal(url),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // استقبال deep link
  onDeepLink: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, url) => callback(url);
    ipcRenderer.on('deep-link', listener);
    return () => ipcRenderer.removeListener('deep-link', listener);
  },
});
