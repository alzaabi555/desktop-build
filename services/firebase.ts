import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  indexedDbLocalPersistence
} from "firebase/firestore";

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB93x2kKaFd7-Ni3O2zzkqfi4BveVrsQ1U",
  authDomain: "rasedapp-m555.firebaseapp.com",
  projectId: "rasedapp-m555",
  storageBucket: "rasedapp-m555.firebasestorage.app",
  messagingSenderId: "87037584903",
  appId: "1:87037584903:web:ea709deb8d2203fa41eca2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// إعداد قاعدة البيانات مع الكاش
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: indexedDbLocalPersistence()
  })
});

// دوال المصادقة (للويب فقط - الويندوز يتم عبر LoginScreen)
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Web Login Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await firebaseSignOut(auth);
};
