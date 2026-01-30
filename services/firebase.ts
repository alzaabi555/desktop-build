
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
} from "firebase/firestore";

// ------------------------------------------------------------------
// إعدادات Firebase الخاصة بتطبيق راصد (Rased App)
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyB93x2kKaFd7-Ni3O2zzkqfi4BveVrsQ1U",
  authDomain: "rasedapp-m555.firebaseapp.com",
  projectId: "rasedapp-m555",
  storageBucket: "rasedapp-m555.firebasestorage.app",
  messagingSenderId: "87037584903",
  appId: "1:87037584903:web:ea709deb8d2203fa41eca2",
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// تهيئة المصادقة
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// تهيئة قاعدة البيانات
export const db = getFirestore(app);

// تفعيل الكاش المحلي للعمل بدون إنترنت (Offline Persistence)
try {
  enableIndexedDbPersistence(db).catch((err: any) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "Multiple tabs open, persistence can only be enabled in one tab at a time."
      );
    } else if (err.code === "unimplemented") {
      console.warn(
        "The current browser does not support all features required to enable persistence."
      );
    }
  });
} catch (e) {
  console.log("Persistence setup error (might be running in non-browser env):", e);
}

// ✅ Helper: detect Electron safely
function isElectron(): boolean {
  return typeof window !== "undefined" && !!(window as any)?.electron;
}

// ✅ Windows/Electron Google Sign-in via native flow (expects IPC implemented in main)
async function signInWithGoogleOnElectron() {
  const api = (window as any)?.electron;
  if (!api?.startGoogleLogin || !api?.completeGoogleLogin || !api?.onDeepLink) {
    throw new Error("Electron auth bridge is not available (preload/main not wired).");
  }

  // 1) اطلب من main فتح المتصفح الخارجي (OAuth)
  await api.startGoogleLogin();

  // 2) انتظر deep link (rasedapp://auth?...code=...)
  const deepLinkUrl: string = await new Promise((resolve, reject) => {
    let timeout: any;

    const unsubscribe = api.onDeepLink((url: string) => {
      try {
        clearTimeout(timeout);
        unsubscribe?.();
      } catch {}

      resolve(url);
    });

    timeout = setTimeout(() => {
      try {
        unsubscribe?.();
      } catch {}
      reject(new Error("Timed out waiting for deep link."));
    }, 120000); // 2 minutes
  });

  // 3) أرسل الرابط إلى main ليبدّل code -> Firebase custom token (عبر backend)
  const tokenResult = await api.completeGoogleLogin(deepLinkUrl);

  if (!tokenResult?.firebaseCustomToken) {
    throw new Error("No firebaseCustomToken returned from main process.");
  }

  // 4) سجّل دخول Firebase عبر custom token
  const cred = await signInWithCustomToken(auth, tokenResult.firebaseCustomToken);
  return cred.user;
}

// دوال مساعدة لتسجيل الدخول والخروج
export const signInWithGoogle = async () => {
  try {
    // ✅ Electron (Windows) path
    if (isElectron()) {
      return await signInWithGoogleOnElectron();
    }

    // ✅ Web/Mobile path
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await firebaseSignOut(auth);
};
