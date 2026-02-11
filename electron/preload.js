
const { contextBridge, shell, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startGoogleLogin: (payload) => ipcRenderer.invoke('auth:start-google', payload),
  openExternal: (url) => shell.openExternal(url),

  // نسخة التطبيق
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // -------------------------------------------------------
  // Google OAuth (Start / Cancel)
  // -------------------------------------------------------
  /**
   * يبدأ تسجيل Google عبر نافذة من main process.
   * لازم ترسل payload فيه:
   *  - clientId: 87037584903-3uc4aeg3nc5lk3pu8crjbaad184bhjth.apps.googleusercontent.com
   *  - redirectUri: string  (مثال: rasedapp://oauth)
   *  - scopes: string[]     (مثال: ['openid','email','profile'])
   *  - state: string        (اختياري لكن يُفضل)
   *  - prompt/accessType    (اختياري)
   */
  startGoogleLogin: (payload) => ipcRenderer.invoke('auth:start-google', payload),

  cancelGoogleLogin: () => ipcRenderer.invoke('auth:cancel-google'),

  // -------------------------------------------------------
  // Listeners from main process
  // -------------------------------------------------------
  /**
   * يستقبل { code, state, url, via? }
   */
  onGoogleAuthCode: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('google-auth-code', listener);
    return () => ipcRenderer.removeListener('google-auth-code', listener);
  },

  /**
   * يستقبل { error, url, via? }
   */
  onGoogleAuthError: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('google-auth-error', listener);
    return () => ipcRenderer.removeListener('google-auth-error', listener);
  },

  /**
   * deep link عام: يستقبل الـ URL كاملًا مثل rasedapp://...
   */
  onDeepLink: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, url) => callback(url);
    ipcRenderer.on('deep-link', listener);
    return () => ipcRenderer.removeListener('deep-link', listener);
  },
});
