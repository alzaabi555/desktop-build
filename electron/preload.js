const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  startGoogleLogin: (payload) => ipcRenderer.invoke('auth:start-google', payload),
  exchangeGoogleCode: (payload) => ipcRenderer.invoke('auth:exchange-code', payload),

  onGoogleAuthCode: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('google-auth-code', listener);
    return () => ipcRenderer.removeListener('google-auth-code', listener);
  },

  onGoogleAuthError: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('google-auth-error', listener);
    return () => ipcRenderer.removeListener('google-auth-error', listener);
  },
});
