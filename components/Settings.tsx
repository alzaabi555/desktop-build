import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, FileJson, User, Smartphone, Info, Share2, Trash2, Cloud, UploadCloud, DownloadCloud, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { auth, db } from '../services/firebase'; 
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'; 
import Modal from './Modal';

// ============================================================================
// ✅ أيقونات 3D (التصميم الجميل الخاص بك)
// ============================================================================
const Icon3DProfile = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10">
    <defs>
      <linearGradient id="gradProfile" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#2563eb" /></linearGradient>
      <filter id="shadowProfile" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.3" /></filter>
    </defs>
    <circle cx="50" cy="40" r="15" fill="url(#gradProfile)" filter="url(#shadowProfile)" />
    <path d="M25 80 Q50 90 75 80 V70 Q50 50 25 70 Z" fill="url(#gradProfile)" filter="url(#shadowProfile)" />
  </svg>
);

const Icon3DCloud = () => (
    <svg viewBox="0 0 100 100" className="w-10 h-10">
      <defs>
        <linearGradient id="gradCloud" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4f46e5" /></linearGradient>
        <filter id="shadowCloud" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.3" /></filter>
      </defs>
      <path d="M25 60 Q15 60 15 45 Q15 30 30 30 Q35 15 55 15 Q75 15 80 35 Q95 35 95 55 Q95 70 75 70 H25 Z" fill="url(#gradCloud)" filter="url(#shadowCloud)" />
    </svg>
);

const Icon3DBackup = () => (
    <svg viewBox="0 0 100 100" className="w-10 h-10">
      <defs>
        <linearGradient id="gradBackup" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#059669" /></linearGradient>
      </defs>
      <path d="M30 60 L50 40 L70 60 M50 40 V80" stroke="url(#gradBackup)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 60 Q10 60 10 40 Q10 15 40 15 Q50 5 65 15 Q90 15 90 45 Q90 60 70 60" fill="none" stroke="url(#gradBackup)" strokeWidth="5" />
    </svg>
);

// ============================================================================

const SettingsPage = () => {
  const { teacherInfo, setTeacherInfo, students, setStudents, classes, setClasses, schedule, setSchedule, periodTimes, setPeriodTimes } = useApp();
  
  const [name, setName] = useState(teacherInfo?.name || '');
  const [school, setSchool] = useState(teacherInfo?.school || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isCloudSupported = !Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios'; 
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [cloudMessage, setCloudMessage] = useState('');

  useEffect(() => {
      setName(teacherInfo?.name || '');
      setSchool(teacherInfo?.school || '');
      const unsubscribe = auth.onAuthStateChanged(user => setCurrentUser(user));
      return () => unsubscribe();
  }, [teacherInfo]);

  const handleSaveProfile = () => {
    setTeacherInfo({ ...teacherInfo, name, school });
    alert('تم حفظ البيانات محلياً! ✅');
  };

  const handleCloudAction = async (action: 'upload' | 'download') => {
      if (!currentUser) {
          try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) { console.error(e); }
          return;
      }
      
      const confirmMsg = action === 'upload' 
        ? 'سيتم رفع بياناتك الحالية للسحابة لاستبدال النسخة القديمة. هل أنت متأكد؟' 
        : 'سيتم مسح بيانات الجهاز الحالية واستبدالها ببيانات السحابة. هل أنت متأكد؟';

      if (!window.confirm(confirmMsg)) return;

      setIsLoading(true);
      setCloudMessage('جاري المزامنة...');

      try {
          if (action === 'upload') {
              const fullData = { teacherInfo, students, classes, schedule, periodTimes, lastUpdated: new Date().toISOString() };
              await setDoc(doc(db, 'users', currentUser.uid), fullData);
              setCloudMessage('✅ تم الحفظ في السحابة بنجاح');
          } else {
              const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
              if (docSnap.exists()) {
                  const data = docSnap.data();
                  if (data.students) setStudents(data.students);
                  if (data.classes) setClasses(data.classes);
                  if (data.schedule) setSchedule(data.schedule);
                  if (data.teacherInfo) setTeacherInfo(prev => ({...prev, ...data.teacherInfo}));
                  setCloudMessage('✅ تم جلب البيانات من السحابة');
                  setTimeout(() => window.location.reload(), 1000);
              } else {
                setCloudMessage('❌ لا توجد بيانات سحابية لهذا الحساب');
              }
          }
      } catch (error: any) {
          setCloudMessage(`خطأ: ${error.message}`);
      } finally {
          setIsLoading(false);
          setTimeout(() => setCloudMessage(''), 4000);
      }
  };

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const backupData = { version: '3.8.0', date: new Date().toISOString(), teacherInfo, students, classes, schedule, periodTimes };
      const fileName = `Rased_Backup_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.json`;
      const jsonString = JSON.stringify(backupData, null, 2);

      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({ path: fileName, data: jsonString, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: 'نسخة احتياطية - راصد', url: result.uri });
      } else {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (error) { alert('فشل التصدير'); } finally { setIsLoading(false); }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.students && Array.isArray(data.students)) {
        if(confirm('سيتم استبدال جميع بياناتك ببيانات الملف. استمرار؟')) {
            setStudents(data.students);
            if (data.classes) setClasses(data.classes);
            if (data.teacherInfo) setTeacherInfo(data.teacherInfo);
            alert('تم الاستيراد بنجاح! 🔄');
            window.location.reload();
        }
      }
    } catch (e) { alert('ملف غير صالح'); } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] pb-24 text-right" dir="rtl">
      
      {/* Header */}
      <div className="bg-[#1e3a8a] text-white pt-10 pb-12 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <h1 className="text-2xl font-black text-center">إعدادات النظام</h1>
        <p className="text-center text-blue-100 text-xs mt-2 opacity-80">تحكم في بياناتك ومزامنتها بكل سهولة</p>
      </div>

      <div className="px-5 space-y-6 -mt-6">
        
        {/* 1. Profile Section */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-5">
            <Icon3DProfile />
            <div>
              <h2 className="text-lg font-black text-slate-800">بيانات المعلم</h2>
              <p className="text-[10px] text-slate-400 font-bold">تظهر في التقارير والشهادات</p>
            </div>
          </div>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-4 py-4 border border-slate-100 outline-none text-sm font-bold focus:border-blue-400 transition-all" placeholder="اسم المعلم بالكامل" />
            <input value={school} onChange={e => setSchool(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-4 py-4 border border-slate-100 outline-none text-sm font-bold focus:border-blue-400 transition-all" placeholder="اسم المدرسة" />
            <button onClick={handleSaveProfile} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all">حفظ البيانات محلياً</button>
          </div>
        </div>

        {/* 2. Cloud Sync (The Visual requested) */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-indigo-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Icon3DCloud />
              <div>
                <h2 className="text-lg font-black text-slate-800">المزامنة السحابية</h2>
                <p className="text-[10px] text-indigo-500 font-bold">
                  {currentUser ? `متصل: ${currentUser.email}` : 'غير متصل بالسحابة'}
                </p>
              </div>
            </div>
            {currentUser && (
              <button onClick={() => signOut(auth)} className="p-2 text-rose-500 bg-rose-50 rounded-full hover:bg-rose-100 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleCloudAction('upload')} 
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <UploadCloud className="w-8 h-8 mb-2" />
              <span className="font-black text-sm">رفع للسحابة</span>
              <span className="text-[9px] opacity-60 mt-1">تأمين البيانات أونلاين</span>
            </button>

            <button 
              onClick={() => handleCloudAction('download')} 
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-emerald-500 text-white shadow-xl shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
            >
              <DownloadCloud className="w-8 h-8 mb-2" />
              <span className="font-black text-sm">سحب من السحابة</span>
              <span className="text-[9px] opacity-60 mt-1">استعادة من سيرفر راصد</span>
            </button>
          </div>

          {cloudMessage && (
            <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 text-xs font-black text-center rounded-2xl border border-indigo-100 animate-pulse">
              {cloudMessage}
            </div>
          )}
        </div>

        {/* 3. Local Bridge Section */}
        <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <Icon3DBackup />
            <h2 className="text-md font-black text-slate-700">نقل الملفات يدوياً (JSON)</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleBackup} className="py-3 px-4 bg-white text-emerald-600 border border-emerald-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
              <FileJson className="w-4 h-4" /> تصدير ملف
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="py-3 px-4 bg-white text-amber-600 border border-amber-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
              <RefreshCw className="w-4 h-4" /> استيراد ملف
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
        </div>

      </div>

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} className="max-w-xs rounded-[2.5rem]">
          <div className="text-center p-6">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-black text-xl text-slate-900">حذف كلي؟</h3>
              <p className="text-xs font-bold text-slate-500 mt-2">سيتم تصفير التطبيق تماماً.</p>
              <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold">تراجع</button>
                  <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black">نعم، احذف</button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default SettingsPage;
