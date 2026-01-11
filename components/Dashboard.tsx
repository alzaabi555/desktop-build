
import React, { useState, useEffect, useRef } from 'react';
import { ScheduleDay, PeriodTime } from '../types';
import { 
  Bell, Clock, Edit3, Settings, 
  MapPin, School, BookOpen, Camera, Upload, FileSpreadsheet, Loader2, 
  PlayCircle
} from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import BrandLogo from './BrandLogo';

interface DashboardProps {
    students: any[];
    teacherInfo: { name: string; school: string; subject: string; governorate: string; avatar?: string; stamp?: string; ministryLogo?: string; academicYear?: string };
    onUpdateTeacherInfo: (info: any) => void;
    schedule: ScheduleDay[];
    onUpdateSchedule: (schedule: ScheduleDay[]) => void;
    onSelectStudent: (student: any) => void;
    onNavigate: (tab: string) => void;
    onOpenSettings: () => void;
    periodTimes: PeriodTime[];
    setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;
    notificationsEnabled: boolean;
    onToggleNotifications: () => void;
    currentSemester: '1' | '2';
    onSemesterChange: (sem: '1' | '2') => void;
}

const BELL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const Dashboard: React.FC<DashboardProps> = ({
    teacherInfo,
    onUpdateTeacherInfo,
    schedule,
    onUpdateSchedule,
    periodTimes,
    setPeriodTimes,
    notificationsEnabled,
    onToggleNotifications,
    currentSemester,
    onSemesterChange
}) => {
    const { classes } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stampInputRef = useRef<HTMLInputElement>(null); 
    const ministryLogoInputRef = useRef<HTMLInputElement>(null); 
    const scheduleFileInputRef = useRef<HTMLInputElement>(null);

    const [isImportingSchedule, setIsImportingSchedule] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // State for Teacher Info Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(teacherInfo.name);
    const [editSchool, setEditSchool] = useState(teacherInfo.school);
    const [editSubject, setEditSubject] = useState(teacherInfo.subject);
    const [editGovernorate, setEditGovernorate] = useState(teacherInfo.governorate);
    const [editAvatar, setEditAvatar] = useState(teacherInfo.avatar || '');
    const [editStamp, setEditStamp] = useState(teacherInfo.stamp || '');
    const [editMinistryLogo, setEditMinistryLogo] = useState(teacherInfo.ministryLogo || '');
    const [editAcademicYear, setEditAcademicYear] = useState(teacherInfo.academicYear || '');
    const [editSemester, setEditSemester] = useState<'1' | '2'>(currentSemester);

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleTab, setScheduleTab] = useState<'timing' | 'classes'>('timing');
    const [editingDayIndex, setEditingDayIndex] = useState(0); 
    const [tempPeriodTimes, setTempPeriodTimes] = useState<PeriodTime[]>([]);
    const [tempSchedule, setTempSchedule] = useState<ScheduleDay[]>([]);

    useEffect(() => {
        setEditName(teacherInfo.name);
        setEditSchool(teacherInfo.school);
        setEditSubject(teacherInfo.subject);
        setEditGovernorate(teacherInfo.governorate);
        setEditAvatar(teacherInfo.avatar || '');
        setEditStamp(teacherInfo.stamp || '');
        setEditMinistryLogo(teacherInfo.ministryLogo || '');
        setEditAcademicYear(teacherInfo.academicYear || '');
        setEditSemester(currentSemester);
    }, [teacherInfo, currentSemester]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (showScheduleModal) {
            setTempPeriodTimes(JSON.parse(JSON.stringify(periodTimes)));
            setTempSchedule(JSON.parse(JSON.stringify(schedule)));
        }
    }, [showScheduleModal, periodTimes, schedule]);

    const handleSaveInfo = () => {
        onUpdateTeacherInfo({
            name: editName,
            school: editSchool,
            subject: editSubject,
            governorate: editGovernorate,
            avatar: editAvatar,
            stamp: editStamp,
            ministryLogo: editMinistryLogo,
            academicYear: editAcademicYear
        });
        onSemesterChange(editSemester);
        setShowEditModal(false);
    };

    const handleSaveScheduleSettings = () => {
        setPeriodTimes(tempPeriodTimes);
        onUpdateSchedule(tempSchedule);
        setShowScheduleModal(false);
    };

    const updateTempTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newTimes = [...tempPeriodTimes];
        newTimes[index] = { ...newTimes[index], [field]: value };
        setTempPeriodTimes(newTimes);
    };

    const updateTempClass = (dayIdx: number, periodIdx: number, value: string) => {
        const newSchedule = [...tempSchedule];
        newSchedule[dayIdx].periods[periodIdx] = value;
        setTempSchedule(newSchedule);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditAvatar(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditStamp(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleMinistryLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditMinistryLogo(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleImportSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImportingSchedule(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            const newSchedule: ScheduleDay[] = [
                { dayName: 'الأحد', periods: Array(8).fill('') },
                { dayName: 'الاثنين', periods: Array(8).fill('') },
                { dayName: 'الثلاثاء', periods: Array(8).fill('') },
                { dayName: 'الأربعاء', periods: Array(8).fill('') },
                { dayName: 'الخميس', periods: Array(8).fill('') }
            ];

            jsonData.forEach(row => {
                if (row.length < 2) return;
                const firstCell = String(row[0]).trim();
                const dayIndex = newSchedule.findIndex(d => d.dayName === firstCell || firstCell.includes(d.dayName));
                if (dayIndex !== -1) {
                    for (let i = 1; i <= 8; i++) {
                        if (row[i]) {
                            newSchedule[dayIndex].periods[i-1] = String(row[i]).trim();
                        }
                    }
                }
            });

            onUpdateSchedule(newSchedule);
            alert('تم استيراد الجدول بنجاح');
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء استيراد الجدول.');
        } finally {
            setIsImportingSchedule(false);
            if (e.target) e.target.value = '';
        }
    };

    const checkActivePeriod = (start: string, end: string) => {
        if (!start || !end) return false;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;

        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    };

    const handleTestNotification = async () => {
        try {
            const audio = new Audio(BELL_SOUND_URL);
            audio.volume = 1.0;
            await audio.play().catch(e => console.warn('Audio blocked', e));

            if (Capacitor.isNativePlatform()) {
                await LocalNotifications.schedule({
                    notifications: [{
                        id: 99999,
                        title: '🔔 تجربة الجرس',
                        body: 'هذا مثال على صوت جرس الحصة',
                        schedule: { at: new Date(Date.now() + 1000) },
                        sound: 'beep.wav'
                    }]
                });
            }
        } catch (e) {
            console.error('Test notification failed', e);
        }
    };

    const today = new Date();
    const dayIndex = today.getDay();
    const todaySchedule = schedule[dayIndex] || { dayName: 'اليوم', periods: [] };
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

    return (
        <div className="space-y-6 pb-20 text-slate-900 animate-in fade-in duration-500">
            
            {/* 1. Top Section: Teacher Profile Card (Sticky Header) - ENHANCED */}
            <div className="sticky top-0 z-40 -mx-4 -mt-4">
                <div className="bg-white/90 backdrop-blur-xl p-4 md:p-6 pt-safe relative overflow-hidden rounded-b-[2.5rem] border-b border-indigo-100 shadow-lg shadow-indigo-50/50 group">
                    {/* Background Decorative Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10 flex items-center justify-between mt-4">
                        <button 
                            onClick={() => setShowEditModal(true)}
                            className="glass-icon p-3 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all active:scale-95"
                        >
                            <Edit3 className="w-5 h-5" />
                        </button>

                        <div className="absolute right-3 top-3 flex flex-col items-center gap-1">
                            <BrandLogo className="w-10 h-10" showText={false} />
                            <span className="text-[10px] font-black text-indigo-600 tracking-wider">راصد</span>
                        </div>

                        <div className="flex flex-col items-center w-full">
                            <div className="mt-2"></div>
                            <div className="w-24 h-24 rounded-[2rem] bg-white p-1.5 shadow-xl shadow-indigo-100 mb-3 relative group-hover:scale-105 transition-transform border border-white ring-4 ring-indigo-50">
                                {teacherInfo.avatar ? (
                                    <img src={teacherInfo.avatar} className="w-full h-full object-cover rounded-[1.6rem]" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-indigo-50 to-blue-50 rounded-[1.6rem] flex items-center justify-center text-3xl font-black text-indigo-600 border border-indigo-100">
                                        {teacherInfo.name ? teacherInfo.name.charAt(0) : 'T'}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-800 text-center mb-1 drop-shadow-sm">
                                {teacherInfo.name || 'مرحباً بك يا معلم'}
                            </h1>
                            <div className="flex flex-col items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                {teacherInfo.school && (
                                    <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                                        <School className="w-3.5 h-3.5 text-indigo-500"/> {teacherInfo.school}
                                    </span>
                                )}
                                <span className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-3 py-0.5 rounded-md shadow-md shadow-indigo-200">
                                    الفصل الدراسي {currentSemester === '1' ? 'الأول' : 'الثاني'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Card (Light) - ENHANCED */}
            <div className="glass-card bg-white rounded-[2.5rem] p-5 border border-slate-200 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] relative mt-4 mx-1 overflow-hidden">
                {/* Decorative background for card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-50 pointer-events-none -mr-10 -mt-10"></div>
                
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowScheduleModal(true)} className="w-9 h-9 glass-icon rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={onToggleNotifications} className={`w-9 h-9 glass-icon rounded-full transition-colors border shadow-sm ${notificationsEnabled ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-400 border-slate-200'}`}>
                            <Bell className={`w-4 h-4 ${notificationsEnabled ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button onClick={handleTestNotification} className="w-9 h-9 glass-icon rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 transition-colors shadow-sm" title="تجربة صوت الجرس">
                            <PlayCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => scheduleFileInputRef.current?.click()} className="w-9 h-9 glass-icon rounded-full bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 transition-colors shadow-sm">
                            {isImportingSchedule ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4" />}
                        </button>
                        <input type="file" ref={scheduleFileInputRef} onChange={handleImportSchedule} accept=".xlsx, .xls" className="hidden" />
                    </div>
                    <div className="text-right">
                        <h2 className="text-base font-black text-slate-800 flex items-center gap-2 justify-end">
                            جدول {todaySchedule.dayName}
                            <Clock className="w-5 h-5 text-amber-500" />
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold">اليوم الدراسي الحالي</p>
                    </div>
                </div>
                
                {/* Clear & Visible Schedule Grid - TILES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                    {todaySchedule.periods.map((cls, idx) => {
                        const pt = periodTimes[idx] || { startTime: '--:--', endTime: '--:--' };
                        const isActive = checkActivePeriod(pt.startTime, pt.endTime) && todaySchedule.dayName === days[dayIndex];
                        return (
                            <div key={idx} className={`
                                p-2 rounded-2xl flex flex-col items-center justify-center text-center min-h-[65px] relative transition-all duration-300
                                ${isActive 
                                    ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white border-2 border-amber-400 shadow-xl scale-105 z-10' 
                                    : 'bg-white border border-slate-200 text-slate-600 shadow-sm hover:border-indigo-200 hover:shadow-md'
                                }
                            `}>
                                {isActive && <span className="absolute -top-2.5 bg-amber-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-md animate-pulse border border-white">الآن</span>}
                                <div className={`text-[9px] font-black mb-1 px-2 py-0.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    حصة {idx + 1}
                                </div>
                                <h3 className={`text-xs font-black truncate w-full px-1 mb-1 ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                    {cls || '-'}
                                </h3>
                                <span className={`text-[8px] font-bold dir-ltr block ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                                    {pt.startTime} - {pt.endTime}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Edit Teacher Info Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
                 <div className="text-center">
                    <h3 className="font-black text-2xl mb-6 text-slate-800">إعدادات الهوية</h3>
                    
                    <div className="flex gap-4 justify-center mb-6 overflow-x-auto pb-4 custom-scrollbar">
                        {/* Avatar Uploader */}
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-white shadow-md glass-card bg-white">
                                {editAvatar ? (
                                    <img src={editAvatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600">
                                        {editName ? editName.charAt(0) : 'T'}
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]">
                                <Camera className="w-5 h-5 text-white drop-shadow-md" />
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-500 mt-2">الصورة الشخصية</p>
                        </div>

                        {/* Stamp Uploader */}
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => stampInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-white shadow-md glass-card flex items-center justify-center bg-white">
                                {editStamp ? (
                                    <img src={editStamp} className="w-full h-full object-contain p-2" alt="Stamp" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-6 h-6 mb-1 border-2 border-gray-300 rounded-lg flex items-center justify-center">S</div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]">
                                <Upload className="w-5 h-5 text-white drop-shadow-md" />
                            </div>
                            <input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-500 mt-2">ختم المدرسة</p>
                        </div>

                        {/* Ministry Logo Uploader */}
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => ministryLogoInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-white shadow-md glass-card flex items-center justify-center bg-white">
                                {editMinistryLogo ? (
                                    <img src={editMinistryLogo} className="w-full h-full object-contain p-2" alt="Ministry Logo" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-6 h-6 mb-1 border-2 border-gray-300 rounded-full flex items-center justify-center">M</div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]">
                                <Upload className="w-5 h-5 text-white drop-shadow-md" />
                            </div>
                            <input type="file" ref={ministryLogoInputRef} onChange={handleMinistryLogoUpload} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-500 mt-2">شعار الوزارة</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <input className="w-full p-3 glass-input rounded-xl font-bold text-sm text-slate-800 bg-white border border-gray-200 focus:border-indigo-500 outline-none" placeholder="اسم المعلم" value={editName} onChange={e => setEditName(e.target.value)} />
                        <input className="w-full p-3 glass-input rounded-xl font-bold text-sm text-slate-800 bg-white border border-gray-200 focus:border-indigo-500 outline-none" placeholder="اسم المدرسة" value={editSchool} onChange={e => setEditSchool(e.target.value)} />
                        <input className="w-full p-3 glass-input rounded-xl font-bold text-sm text-slate-800 bg-white border border-gray-200 focus:border-indigo-500 outline-none" placeholder="المادة (مثال: رياضيات)" value={editSubject} onChange={e => setEditSubject(e.target.value)} />
                        <input className="w-full p-3 glass-input rounded-xl font-bold text-sm text-slate-800 bg-white border border-gray-200 focus:border-indigo-500 outline-none" placeholder="المحافظة (للتوجيه)" value={editGovernorate} onChange={e => setEditGovernorate(e.target.value)} />
                        <input className="w-full p-3 glass-input rounded-xl font-bold text-sm text-slate-800 bg-white border border-gray-200 focus:border-indigo-500 outline-none" placeholder="العام الدراسي (مثال: 2024 / 2025)" value={editAcademicYear} onChange={e => setEditAcademicYear(e.target.value)} />
                        
                        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-gray-200">
                            <span className="text-xs font-bold text-gray-500 pr-2">الفصل الدراسي:</span>
                            <div className="flex gap-2">
                                <button onClick={() => setEditSemester('1')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${editSemester === '1' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>الأول</button>
                                <button onClick={() => setEditSemester('2')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${editSemester === '2' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>الثاني</button>
                            </div>
                        </div>

                        <button onClick={handleSaveInfo} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all mt-4">حفظ وتطبيق</button>
                    </div>
                 </div>
            </Modal>

            {/* Schedule Settings Modal */}
            <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} className="max-w-md rounded-[2rem]">
                <div className="text-center">
                    <h3 className="font-black text-xl mb-4 text-slate-800">إعدادات الجدول</h3>
                    
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-4 border border-gray-200">
                        <button onClick={() => setScheduleTab('timing')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${scheduleTab === 'timing' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-slate-700'}`}>التوقيت</button>
                        <button onClick={() => setScheduleTab('classes')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${scheduleTab === 'classes' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-slate-700'}`}>الحصص</button>
                    </div>

                    {scheduleTab === 'timing' ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar p-1">
                            {tempPeriodTimes.map((pt, idx) => (
                                <div key={idx} className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                    <span className="text-xs font-bold w-16 text-slate-500 bg-gray-50 py-2 rounded-lg">حصة {pt.periodNumber}</span>
                                    <input type="time" value={pt.startTime} onChange={e => updateTempTime(idx, 'startTime', e.target.value)} className="flex-1 p-2 glass-input rounded-lg text-xs font-bold text-slate-800 bg-gray-50 border border-gray-200 text-center" />
                                    <span className="text-gray-400 font-bold">-</span>
                                    <input type="time" value={pt.endTime} onChange={e => updateTempTime(idx, 'endTime', e.target.value)} className="flex-1 p-2 glass-input rounded-lg text-xs font-bold text-slate-800 bg-gray-50 border border-gray-200 text-center" />
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar p-1">
                             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                 {tempSchedule.map((day, idx) => (
                                     <button key={idx} onClick={() => setEditingDayIndex(idx)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${editingDayIndex === idx ? 'bg-indigo-600 text-white shadow-md' : 'glass-card bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                                         {day.dayName}
                                     </button>
                                 ))}
                             </div>
                             <div className="space-y-2">
                                 {tempSchedule[editingDayIndex]?.periods.map((cls, pIdx) => (
                                     <div key={pIdx} className="flex items-center gap-3">
                                         <span className="text-xs font-bold w-12 text-slate-400 bg-slate-50 py-2.5 rounded-lg">#{pIdx + 1}</span>
                                         <input 
                                             placeholder="اسم الفصل / المادة" 
                                             value={cls} 
                                             onChange={e => updateTempClass(editingDayIndex, pIdx, e.target.value)}
                                             className="flex-1 p-2.5 glass-input rounded-xl text-xs font-bold text-slate-800 bg-white border border-gray-200 focus:border-indigo-500 outline-none shadow-sm"
                                         />
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}
                    
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3.5 text-slate-500 font-bold text-xs hover:bg-gray-100 rounded-xl transition-colors">إلغاء</button>
                        <button onClick={handleSaveScheduleSettings} className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">حفظ التغييرات</button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Dashboard;
