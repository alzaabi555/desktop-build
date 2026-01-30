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
  initializeFirestore,
  persistentLocalCache,
  indexedDbLocalPersistence
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

// تهيئة قاعدة البيانات مع دعم العمل بدون إنترنت (Offline Persistence)
// استخدام الطريقة الحديثة لتجنب تحذيرات Deprecation
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: indexedDbLocalPersistence()
  })
});

// ------------------------------------------------------------------
// دوال المصادقة
// ------------------------------------------------------------------

// تسجيل الدخول (للويب فقط - الويندوز يتم معالجته في LoginScreen)
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Web Login Error:", error);
    throw error;
  }
};

// تسجيل الدخول باستخدام Custom Token (سنحتاجه لاحقاً لاستكمال دورة الويندوز)
export const signInWithToken = async (token: string) => {
  try {
    const result = await signInWithCustomToken(auth, token);
    return result.user;
  } catch (error) {
    console.error("Token Login Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await firebaseSignOut(auth);
};
