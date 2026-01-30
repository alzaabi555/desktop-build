
import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Smartphone, Loader2 } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { signInWithGoogle } from '../services/firebase';

interface LoginScreenProps {
  onLoginSuccess: (user: any | null) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isElectron = typeof window !== 'undefined' && !!(window as any)?.electron;
  const completedRef = useRef(false);

  // ✅ Listen for OAuth result from Electron (recommended)
  useEffect(() => {
    if (!isElectron) return;

    const api = (window as any)?.electron;
    if (!api) return;

    const unsubCode =
      api.onGoogleAuthCode?.((data: { code: string; state?: string; url?: string; via?: string }) => {
        if (completedRef.current) return;
        completedRef.current = true;

        setIsLoading(false);
        setError('');

        // مؤقتًا: اعتبرها نجاح (لاحقًا سنبدّل code -> customToken -> signInWithCustomToken)
        onLoginSuccess({ provider: 'google', platform: 'electron', ...data });
      }) ?? (() => {});

    const unsubErr =
      api.onGoogleAuthError?.((data: { error: string; url?: string; via?: string }) => {
        if (completedRef.current) return;
        completedRef.current = true;

        setIsLoading(false);
        setError(data?.error || 'فشل تسجيل الدخول عبر Google.');
      }) ?? (() => {});

    // ✅ Optional fallback: deep link general listener (if you still want it)
    const unsubDeep =
      api.onDeepLink?.((url: string) => {
        // خليه كـ fallback فقط أو للتشخيص
        console.log('Deep link received in LoginScreen:', url);
      }) ?? (() => {});

    return () => {
      try { unsubCode(); } catch {}
      try { unsubErr(); } catch {}
      try { unsubDeep(); } catch {}
    };
  }, [isElectron, onLoginSuccess]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    completedRef.current = false;

    try {
      if (isElectron) {
        const api = (window as any)?.electron;
        if (!api?.startGoogleLogin) {
          throw new Error('Electron bridge غير جاهز (startGoogleLogin).');
        }

        // IMPORTANT: املأ هذه القيم من إعداداتك
        const payload = {
          clientId: 'YOUR_GOOGLE_CLIENT_ID',
          redirectUri: 'rasedapp://oauth',
          scopes: ['openid', 'email', 'profile'],
          state: String(Date.now()), // أو state حقيقي/عشوائي
          // prompt: 'select_account',      // اختياري
          // accessType: 'offline',         // اختياري
        };

        await api.startGoogleLogin(payload);
        // ابقِ isLoading = true إلى أن يصل onGoogleAuthCode أو onGoogleAuthError
        return;
      }

      const user = await signInWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => onLoginSuccess(null);

  return (
    // ... (نفس JSX عندك بدون تغيير)
    <div />
  );
};

export default LoginScreen;
