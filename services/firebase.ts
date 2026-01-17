import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, logEvent, Analytics } from 'firebase/analytics';

// إعدادات Firebase الخاصة بمشروع "راصد" (Rased App)
const firebaseConfig = {
  apiKey: "AIzaSyBkHlfGIWzHIhJhuc3bsAG-zWONh8TsHcg", // تأكدت من إصلاح 0 إلى O إذا كان خطأ نسخ، لكن سأبقيه كما هو في صورتك
  authDomain: "rased-app-555.firebaseapp.com",
  projectId: "rased-app-555",
  storageBucket: "rased-app-555.firebasestorage.app",
  messagingSenderId: "35062229126",
  appId: "1:35062229126:web:6e76c3a57348087d440907",
  measurementId: "G-2HMVCBBWE0"
};

let app: FirebaseApp;
let analytics: Analytics | null = null;

export const initFirebase = () => {
  try {
    // 1. التعامل مع تهيئة التطبيق (Singleton Pattern)
    // في النسخة 9 نستخدم getApps() للتحقق بدلاً من firebase.apps.length
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp(); // استرجاع التطبيق المهيأ مسبقاً
    }
    
    // 2. تهيئة التحليلات فقط في بيئة المتصفح
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    console.log('🔥 Firebase Initialized Successfully');
  } catch (error: any) {
    console.error('Firebase initialization failed:', error);
  }
};

export const logAppActivation = (deviceId: string) => {
  if (analytics) {
    try {
      // في النسخة 9، logEvent هي دالة مستقلة نمرر لها كائن analytics
      logEvent(analytics, 'app_activated', {
        device_id: deviceId,
        date: new Date().toISOString()
      });
      console.log('✅ Activation event logged to Firebase');
    } catch (e) {
      console.error('Failed to log event', e);
    }
  }
};

export const logScreenView = (screenName: string) => {
    if (analytics) {
        try {
            logEvent(analytics, 'screen_view', {
                firebase_screen: screenName,
                firebase_screen_class: screenName
            });
        } catch (e) {
            console.error('Failed to log screen view', e);
        }
    }
};