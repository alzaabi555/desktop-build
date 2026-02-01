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
// ✅ الأيقونات الـ 3D (التي ميزت تطبيقك)
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

// ============================================================================

const SettingsPage = () => {
  const { teacherInfo, setTeacherInfo, students, setStudents, classes, setClasses, schedule, setSchedule, periodTimes, setPeriodTimes } = useApp();
  const [name, setName] = useState(teacherInfo?.name || '');
  const [school, setSchool] = useState(teacherInfo?.school || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [cloudMessage, setCloudMessage] = useState('');

  useEffect(() => {
      setName(teacherInfo?.name || '');
      setSchool(teacherInfo?.school || '');
      const unsubscribe = auth.onAuthStateChanged(user => setCurrentUser(user));
      return () => unsubscribe();
  }, [teacherInfo]);

  const handleCloudAction = async (action: 'upload' | 'download') => {
      if (!currentUser) {
          try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) { console.error(e); }
          return;
      }
      setIsLoading(true);
      setCloudMessage('جاري المزامنة...');
      try {
          if (action === 'upload') {
              const fullData = { teacherInfo, students, classes, schedule, periodTimes, lastUpdated: new Date().toISOString() };
              await setDoc(doc(db, 'users', currentUser.uid), fullData);
              setCloudMessage('✅ تم الحفظ سحابياً');
          } else {
              const docSnap = await getDoc(doc(db, 'users', currentUser.uid));
              if (docSnap.exists()) {
                  const data = docSnap.data();
                  if (data.students) setStudents(data.students);
                  if (data.teacherInfo) setTeacherInfo(data.teacherInfo);
                  setCloudMessage('✅ تم جلب البيانات');
                  setTimeout(() => window.location.reload(), 1000);
              }
          }
      } catch (error: any) { setCloudMessage(`خطأ: ${error.message}`); }
      finally { setIsLoading(false); setTimeout(() => setCloudMessage(''), 3000); }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] pb-24 text-right px-6 pt-10" dir="rtl">
      
      {/* عنوان الصفحة - بسيط وراقي */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">الإعدادات</h1>
        <p className="text-slate-400 text-xs font-bold mt-1">تحكم في هويتك الرقمية وبياناتك</p>
      </div>

      <div className="space-y-6">
        
        {/* 1. بيانات المعلم */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-5">
            <Icon3DProfile />
            <h2 className="text-lg font-black text-slate-800">بياناتك الشخصية</h2>
          </div>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-4 py-4 border border-slate-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="اسمك الكريم" />
            <input value={school} onChange={e => setSchool(e.target.value)} className="w-full bg-slate-50 rounded-2xl px-4 py-4 border border-slate-100 outline-none text-sm font-bold focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="اسم المدرسة" />
            <button onClick={() => setTeacherInfo({ ...teacherInfo, name, school })} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all">حفظ التغييرات محلياً</button>
          </div>
        </div>

        {/* 2. المزامنة السحابية - التصميم الذي طلبته */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-indigo-50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Icon3DCloud />
              <div>
                <h2 className="text-lg font-black text-slate-800">المزامنة السحابية</h2>
                <p className="text-[10px] text-indigo-500 font-bold">{currentUser ? currentUser.email : 'سجل دخولك للحفظ أونلاين'}</p>
              </div>
            </div>
            {currentUser && <button onClick={() => signOut(auth)} className="p-2 text-rose-500 bg-rose-50 rounded-full"><LogOut className="w-4 h-4" /></button>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleCloudAction('upload')} disabled={isLoading} className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
              <UploadCloud className="w-8 h-8 mb-2" />
              <span className="font-black text-sm">رفع للسحابة</span>
            </button>
            <button onClick={() => handleCloudAction('download')} disabled={isLoading} className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-emerald-500 text-white shadow-xl shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all">
              <DownloadCloud className="w-8 h-8 mb-2" />
              <span className="font-black text-sm">سحب من السحابة</span>
            </button>
          </div>
          {cloudMessage && <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 text-xs font-black text-center rounded-2xl border border-indigo-100">{cloudMessage}</div>}
        </div>

        {/* 3. الإدارة اليدوية - الجسر الآمن */}
        <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-200">
          <h2 className="text-md font-black text-slate-700 mb-4 flex items-center gap-2">📂 نقل البيانات يدوياً (JSON)</h2>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => {/* كود التصدير */}} className="py-4 bg-white text-emerald-600 border border-emerald-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">تصدير ملف</button>
            <button onClick={() => fileInputRef.current?.click()} className="py-4 bg-white text-amber-600 border border-amber-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2">استيراد ملف</button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" />
        </div>

      </div>

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} className="max-w-xs rounded-[2.5rem]">
          {/* كود المودال كما هو */}
      </Modal>

    </div>
  );
};

export default SettingsPage;
