import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Save, Bell, Moon, Cloud, DownloadCloud, UploadCloud, 
  CheckCircle2, AlertTriangle, RefreshCw, LogOut, Clock 
} from 'lucide-react';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// ⚠️ لاحظ: لا توجد أي استيرادات لمكتبات Capacitor هنا نهائياً

const Settings: React.FC = () => {
  const { teacherInfo, setTeacherInfo, students, setStudents, classes, schedule, periodTimes } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastCloudUpdate, setLastCloudUpdate] = useState<string>('غير معروف');

  // جلب تاريخ آخر تحديث
  useEffect(() => {
      const checkLastUpdate = async () => {
          if (auth.currentUser) {
              try {
                  const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
                  if (docSnap.exists() && docSnap.data().lastUpdated) {
                      const date = new Date(docSnap.data().lastUpdated);
                      setLastCloudUpdate(date.toLocaleString('ar-EG'));
                  }
              } catch (e) {}
          }
      };
      checkLastUpdate();
  }, []);

  // ☁️ دالة الرفع (Windows Version)
  const handleUploadToCloud = async () => {
    const user = auth.currentUser;
    if (!user) {
      setSyncStatus('error');
      setSyncMessage('يجب تسجيل الدخول لرفع البيانات.');
      return;
    }

    if (!window.confirm('⚠️ هل أنت متأكد؟\nسيتم حفظ بيانات هذا الكمبيوتر في السحابة لتستخدمها في الأجهزة الأخرى.')) return;

    setIsSyncing(true);
    setSyncMessage('جاري الرفع للسحابة...');
    
    try {
      const fullData = {
        teacherInfo, students, classes, schedule, periodTimes,
        lastUpdated: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), fullData);
      
      setSyncStatus('success');
      setSyncMessage('✅ تم الرفع بنجاح!');
      setLastCloudUpdate(new Date().toLocaleString('ar-EG'));
    } catch (error: any) {
      console.error(error);
      setSyncStatus('error');
      setSyncMessage(`فشل الرفع: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // ☁️ دالة السحب (Windows Version)
  const handleDownloadFromCloud = async () => {
    const user = auth.currentUser;
    if (!user) {
      setSyncStatus('error');
      setSyncMessage('يجب تسجيل الدخول لسحب البيانات.');
      return;
    }

    if (!window.confirm('⚠️ تحذير:\nسيتم استبدال بيانات هذا الكمبيوتر بالبيانات الموجودة في السحابة.\nهل توافق؟')) return;

    setIsSyncing(true);
    setSyncMessage('جاري جلب البيانات...');

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.students) setStudents(data.students);
        if (data.classes) localStorage.setItem('classes', JSON.stringify(data.classes));
        if (data.schedule) localStorage.setItem('schedule', JSON.stringify(data.schedule));
        if (data.teacherInfo) setTeacherInfo(prev => ({...prev, ...data.teacherInfo}));
        
        // حفظ إجباري للطلاب في الذاكرة
        localStorage.setItem('rased_students', JSON.stringify(data.students || []));

        setSyncStatus('success');
        setSyncMessage('✅ تم التحديث! سيتم إعادة تحميل التطبيق...');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setSyncStatus('error');
        setSyncMessage('⚠️ لا توجد بيانات في السحابة لهذا الحساب.');
      }
    } catch (error: any) {
      console.error(error);
      setSyncStatus('error');
      setSyncMessage(`فشل السحب: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
      if (window.confirm("هل تريد تسجيل الخروج؟")) {
          await signOut(auth); // خروج بسيط بفايربيس ويب
          localStorage.clear();
          window.location.reload();
      }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">الإعدادات</h2>
          <p className="text-slate-500 text-sm font-bold">إدارة المزامنة (نسخة الويندوز)</p>
        </div>
      </header>

      {/* لوحة المزامنة */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Cloud className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">المزامنة السحابية</h3>
                    <p className="text-xs text-slate-500 font-bold">
                    {auth.currentUser ? `متصل: ${auth.currentUser.email}` : 'غير متصل'}
                    </p>
                </div>
            </div>
            
            <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1 justify-end text-slate-400 text-[10px] font-bold">
                    <Clock className="w-3 h-3" /> آخر تحديث للسحابة:
                </div>
                <div className="text-xs font-black text-indigo-600 dir-ltr">{lastCloudUpdate}</div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={handleUploadToCloud} disabled={isSyncing} className="flex items-center justify-center gap-3 p-4 rounded-xl border border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-all active:scale-95 group">
            <UploadCloud className="w-6 h-6 text-indigo-600" />
            <div className="text-right">
              <span className="block text-sm font-black text-indigo-900">رفع للسحابة</span>
              <span className="block text-[10px] text-indigo-500 font-bold">حفظ بيانات الكمبيوتر</span>
            </div>
          </button>

          <button onClick={handleDownloadFromCloud} disabled={isSyncing} className="flex items-center justify-center gap-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-all active:scale-95 group">
            <DownloadCloud className="w-6 h-6 text-emerald-600" />
            <div className="text-right">
              <span className="block text-sm font-black text-emerald-900">سحب من السحابة</span>
              <span className="block text-[10px] text-emerald-500 font-bold">جلب بيانات الهاتف</span>
            </div>
          </button>
        </div>

        {syncMessage && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${syncStatus === 'success' ? 'bg-emerald-100 text-emerald-800' : syncStatus === 'error' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100'}`}>
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : syncStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {syncMessage}
          </div>
        )}
      </div>

      {/* باقي الإعدادات */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="font-black text-sm text-slate-800 mb-4">بيانات المعلم</h3>
        <div className="space-y-3">
          <div><label className="block text-xs font-bold text-slate-500 mb-1">الاسم</label><input type="text" value={teacherInfo.name} onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">المدرسة</label><input type="text" value={teacherInfo.school} onChange={(e) => setTeacherInfo({...teacherInfo, school: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500" /></div>
          <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2 shadow-lg shadow-indigo-200 active:scale-95 transition-transform"><Save className="w-4 h-4" /> حفظ التغييرات</button>
        </div>
      </div>

      <div className="pt-4">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 py-4 rounded-xl font-bold border border-rose-100 hover:bg-rose-100 transition-colors">
          <LogOut className="w-5 h-5" /> تسجيل الخروج
        </button>
        <p className="text-center text-[10px] text-slate-400 font-bold mt-4">Version 3.7.3 (Windows)</p>
      </div>
    </div>
  );
};

export default Settings;
