
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from "firebase/firestore";

// ------------------------------------------------------------------
// إعدادات Firebase الخاصة بتطبيق راصد (Rased App)
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyB93x2kKaFd7-Ni3O2zzkqfi4BveVrsQ1U",
  authDomain: "rasedapp-m555.firebaseapp.com",
  projectId: "rasedapp-m555",
  storageBucket: "rasedapp-m555.firebasestorage.app",
  messagingSenderId: "87037584903",
  appId: "1:87037584903:web:ea709deb8d2203fa41eca2"
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
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence');
        }
    });
} catch (e) {
    console.log("Persistence setup error (might be running in non-browser env):", e);
}

// دوال مساعدة لتسجيل الدخول والخروج
export const signInWithGoogle = async () => {
    try {
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
