
import React, { useState, useEffect, useRef } from 'react';
import { Student, ScheduleDay, PeriodTime } from '../types';
import { 
  Bell, Clock, Edit3, LayoutGrid, Settings, Users, 
  MapPin, School, BookOpen, Camera, Upload, FileSpreadsheet, Loader2, 
  ChevronLeft, ChevronRight, CalendarCheck, CheckCircle2, XCircle, AlertCircle, Timer
} from 'lucide-react';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import * as XLSX from 'xlsx';

interface DashboardProps {
    students: Student[];
    teacherInfo: { name: string; school: string; subject: string; governorate: string; avatar?: string };
    onUpdateTeacherInfo: (info: any) => void;
    schedule: ScheduleDay[];
    onUpdateSchedule: (schedule: ScheduleDay[]) => void;
    onSelectStudent: (student: Student) => void;
    onNavigate: (tab: string) => void;
    onOpenSettings: () => void;
    periodTimes: PeriodTime[];
    setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;
    notificationsEnabled: boolean;
    onToggleNotifications: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    students,
    teacherInfo,
    onUpdateTeacherInfo,
    schedule,
    onUpdateSchedule,
    onNavigate,
    onOpenSettings,
    periodTimes,
    setPeriodTimes,
    notificationsEnabled,
    onToggleNotifications
}) => {
    const { theme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    // State for Schedule/Timing Modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleTab, setScheduleTab] = useState<'timing' | 'classes'>('timing');
    const [editingDayIndex, setEditingDayIndex] = useState(0); // 0=Sun, 1=Mon...
    const [tempPeriodTimes, setTempPeriodTimes] = useState<PeriodTime[]>([]);
    const [tempSchedule, setTempSchedule] = useState<ScheduleDay[]>([]);

    useEffect(() => {
        setEditName(teacherInfo.name);
        setEditSchool(teacherInfo.school);
        setEditSubject(teacherInfo.subject);
        setEditGovernorate(teacherInfo.governorate);
        setEditAvatar(teacherInfo.avatar || '');
    }, [teacherInfo]);

    // Update clock every minute to check for active period
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Initialize temp states when opening modal
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
            avatar: editAvatar
        });
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
            reader.onloadend = () => {
                setEditAvatar(reader.result as string);
            };
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
            alert('حدث خطأ أثناء استيراد الجدول. تأكد من صيغة الملف.');
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

    // Calculate Stats
    const today = new Date();
    const dayIndex = today.getDay(); // 0=Sun
    const todaySchedule = schedule[dayIndex] || { dayName: 'اليوم', periods: [] };
    
    // Quick Stats Calculation
    const totalPositive = students.reduce((sum, s) => sum + (s.behaviors?.filter(b => b.type === 'positive').length || 0), 0);
    const totalNegative = students.reduce((sum, s) => sum + (s.behaviors?.filter(b => b.type === 'negative').length || 0), 0);
    
    const todayDateStr = new Date().toLocaleDateString('en-CA');
    const presentCount = students.filter(s => s.attendance?.find(a => a.date === todayDateStr && a.status === 'present')).length;
    const absentCount = students.filter(s => s.attendance?.find(a => a.date === todayDateStr && a.status === 'absent')).length;

    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

    return (
        <div className="space-y-6 pb-20 text-slate-900 dark:text-white animate-in fade-in duration-500">
            
            {/* 1. Top Section: Teacher Profile Card (GLASS STYLE) */}
            <div className="glass-heavy rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl border border-white/20 group transition-all hover:bg-white/5">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50 z-0"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <button 
                        onClick={() => setShowEditModal(true)}
                        className="glass-icon p-3 rounded-2xl text-slate-500 dark:text-white/80 hover:text-white hover:bg-white/20 transition-all absolute left-0 top-0"
                    >
                        <Edit3 className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center w-full">
                        <p className="text-xs font-bold text-amber-500 dark:text-amber-400 mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> طاب يومك
                        </p>
                        
                        <div className="w-24 h-24 rounded-[2rem] glass-card p-1 shadow-2xl mb-3 relative group-hover:scale-105 transition-transform border border-white/30">
                             {teacherInfo.avatar ? (
                                <img src={teacherInfo.avatar} className="w-full h-full object-cover rounded-[1.8rem]" alt="Profile" />
                             ) : (
                                <div className="w-full h-full bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-3xl font-black text-white">
                                    {teacherInfo.name ? teacherInfo.name.charAt(0) : 'T'}
                                </div>
                             )}
                        </div>

                        <h1 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-1 text-glow">
                            {teacherInfo.name || 'مرحباً بك يا معلم'}
                        </h1>
                        
                        <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-300">
                            {teacherInfo.school && <span className="flex items-center gap-1"><School className="w-3 h-3 text-indigo-500"/> {teacherInfo.school}</span>}
                            {teacherInfo.subject && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-emerald-500"/> {teacherInfo.subject}</span>}
                        </div>

                        {teacherInfo.governorate && (
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 w-full text-center">
                                <span className="text-[10px] text-slate-400 dark:text-white/50 font-bold flex items-center justify-center gap-1">
                                    <MapPin className="w-3 h-3" /> {teacherInfo.governorate}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Action Banner (GLASS STYLE) */}
            <div 
                onClick={() => onNavigate('attendance')}
                className="glass-card bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 rounded-[2rem] p-5 flex items-center justify-between cursor-pointer shadow-lg active:scale-95 transition-all group relative overflow-hidden"
            >
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-300 shadow-sm border border-blue-500/10">
                        <CalendarCheck className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">تسجيل الحضور</h2>
                        <p className="text-xs font-bold text-slate-500 dark:text-white/60">اضغط لبدء رصد الغياب اليومي</p>
                    </div>
                </div>
                <div className="glass-icon w-10 h-10 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-300 group-hover:translate-x-[-5px] transition-transform">
                    <ChevronLeft className="w-6 h-6" />
                </div>
            </div>

            {/* 3. Schedule Card (Compact with Active Highlight) */}
            <div className="glass-card rounded-[2.5rem] p-5 border border-white/20 shadow-xl bg-white/5 relative">
                
                {/* Schedule Controls */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button onClick={() => setShowScheduleModal(true)} className="w-9 h-9 glass-icon rounded-full text-slate-500 dark:text-white/60 hover:text-indigo-500 hover:bg-white/10 transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        
                        {/* Bell Toggle */}
                        <button onClick={onToggleNotifications} className={`w-9 h-9 glass-icon rounded-full transition-colors ${notificationsEnabled ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500 dark:text-white/60'}`}>
                            <Bell className={`w-4 h-4 ${notificationsEnabled ? 'fill-amber-500' : ''}`} />
                        </button>

                        {/* Import Excel */}
                        <button onClick={() => scheduleFileInputRef.current?.click()} className="w-9 h-9 glass-icon rounded-full text-slate-500 dark:text-white/60 hover:text-emerald-500 hover:bg-white/10 transition-colors relative">
                            {isImportingSchedule ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4" />}
                        </button>
                        <input type="file" ref={scheduleFileInputRef} onChange={handleImportSchedule} accept=".xlsx, .xls" className="hidden" />
                    </div>

                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        جدول {todaySchedule.dayName}
                        <Clock className="w-5 h-5 text-indigo-500" />
                    </h2>
                </div>

                {/* Periods Grid - COMPACT (4 Columns = 2 Rows) */}
                <div className="grid grid-cols-4 gap-2">
                    {todaySchedule.periods.map((cls, idx) => {
                        const pt = periodTimes[idx] || { startTime: '--:--', endTime: '--:--' };
                        const isActive = checkActivePeriod(pt.startTime, pt.endTime) && todaySchedule.dayName === days[dayIndex];
                        
                        return (
                            <div key={idx} className={`
                                p-2 rounded-xl border flex flex-col items-center justify-center text-center min-h-[70px] relative overflow-hidden transition-all duration-300
                                ${isActive 
                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-105 z-10 ring-2 ring-indigo-300 dark:ring-indigo-700' 
                                    : 'glass-card border-white/5 hover:bg-white/5'
                                }
                            `}>
                                {isActive && (
                                    <div className="absolute top-0 right-0 left-0 h-0.5 bg-white animate-pulse"></div>
                                )}
                                
                                {isActive && <span className="text-[7px] font-black bg-white text-indigo-600 px-1.5 rounded-full mb-0.5 animate-bounce">جارية الآن</span>}
                                
                                <div className={`text-[9px] font-black mb-0.5 ${isActive ? 'text-indigo-200' : 'text-indigo-400'}`}>#{idx + 1}</div>
                                <h3 className={`text-xs font-black truncate w-full px-1 ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{cls || '-'}</h3>
                                <span className={`text-[8px] font-bold dir-ltr block mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-white/40'}`}>
                                    {pt.startTime} - {pt.endTime}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 4. Stats Grid (Bottom) */}
            <div className="grid grid-cols-2 gap-4">
                {/* Behavior Stats (Right) */}
                <div className="glass-card p-5 rounded-[2.5rem] border border-white/20 shadow-lg flex flex-col justify-between h-40">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 text-center">السلوك</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{totalPositive}+</span>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">إيجابي</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <span className="text-lg font-black text-rose-600 dark:text-rose-400">{totalNegative}-</span>
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">سلبي</span>
                        </div>
                    </div>
                </div>

                {/* Attendance Stats (Left) */}
                <div className="glass-card p-5 rounded-[2.5rem] border border-white/20 shadow-lg flex flex-col justify-between h-40 items-center">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">الحضور</h3>
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-slate-200 dark:text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            <path className="text-emerald-500 drop-shadow-md" strokeDasharray={`${(presentCount / (students.length || 1)) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        </svg>
                        <div className="absolute w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-inner flex items-center justify-center border border-slate-100 dark:border-white/10">
                             <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white border-4 border-white dark:border-slate-700">
                                 {presentCount > 0 ? <CheckCircle2 className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                             </div>
                        </div>
                    </div>
                    <div className="flex gap-3 text-[10px] font-bold mt-2">
                        <span className="text-slate-500 dark:text-white/60">حاضر: {presentCount}</span>
                        <span className="text-rose-500">غائب: {absentCount}</span>
                    </div>
                </div>
            </div>

            {/* Edit Teacher Info Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
                 <div className="text-center">
                    <h3 className="font-black text-2xl mb-6 text-slate-900 dark:text-white">بيانات المعلم</h3>
                    
                    {/* Avatar Uploader */}
                    <div className="relative w-28 h-28 mx-auto mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-full h-full rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-xl glass-card">
                            {editAvatar ? (
                                <img src={editAvatar} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-4xl font-black text-white">
                                    {editName ? editName.charAt(0) : 'T'}
                                </div>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>

                    <div className="space-y-4">
                        <input className="w-full p-4 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" value={editName} onChange={e => setEditName(e.target.value)} placeholder="الاسم" />
                        <input className="w-full p-4 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="المدرسة" />
                        <input className="w-full p-4 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" value={editSubject} onChange={e => setEditSubject(e.target.value)} placeholder="المادة" />
                        <input className="w-full p-4 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" value={editGovernorate} onChange={e => setEditGovernorate(e.target.value)} placeholder="المديرية التعليمية (مثال: مسقط)" />
                        
                        <button onClick={handleSaveInfo} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm mt-4 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">حفظ التغييرات</button>
                    </div>
                 </div>
            </Modal>

            {/* Schedule & Timing Modal */}
            <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} className="max-w-lg rounded-[2.5rem]">
                <div className="flex flex-col h-[70vh]">
                    <h3 className="font-black text-xl mb-6 text-center text-slate-900 dark:text-white">إعدادات الجدول والتوقيت</h3>
                    
                    {/* Tabs */}
                    <div className="flex bg-white/10 p-1 rounded-xl mb-4 shrink-0">
                        <button 
                            onClick={() => setScheduleTab('timing')}
                            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${scheduleTab === 'timing' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-white/60 hover:bg-white/10'}`}
                        >
                            توقيت الحصص
                        </button>
                        <button 
                            onClick={() => setScheduleTab('classes')}
                            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${scheduleTab === 'classes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-white/60 hover:bg-white/10'}`}
                        >
                            توزيع الحصص
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                        {scheduleTab === 'timing' ? (
                            <div className="space-y-3">
                                <p className="text-[10px] text-slate-400 text-center mb-2 font-bold">اضبط وقت بداية ونهاية كل حصة لتفعيل الجرس</p>
                                {tempPeriodTimes.map((pt, i) => (
                                    <div key={i} className="flex items-center gap-2 glass-card p-3 rounded-xl border border-white/5">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-sm shrink-0">
                                            {i + 1}
                                        </div>
                                        <input 
                                            type="time" 
                                            className="flex-1 bg-transparent text-center font-bold text-slate-900 dark:text-white text-sm outline-none border-b border-white/10 focus:border-indigo-500"
                                            value={pt.startTime}
                                            onChange={(e) => updateTempTime(i, 'startTime', e.target.value)}
                                        />
                                        <span className="text-slate-400 text-xs">إلى</span>
                                        <input 
                                            type="time" 
                                            className="flex-1 bg-transparent text-center font-bold text-slate-900 dark:text-white text-sm outline-none border-b border-white/10 focus:border-indigo-500"
                                            value={pt.endTime}
                                            onChange={(e) => updateTempTime(i, 'endTime', e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Day Selector */}
                                <div className="flex items-center justify-between glass-card p-2 rounded-xl border border-white/5 sticky top-0 z-10 backdrop-blur-md">
                                    <button onClick={() => setEditingDayIndex(prev => prev > 0 ? prev - 1 : 4)} className="p-2 glass-icon rounded-lg"><ChevronRight className="w-4 h-4"/></button>
                                    <span className="font-black text-sm text-slate-900 dark:text-white">{days[editingDayIndex]}</span>
                                    <button onClick={() => setEditingDayIndex(prev => prev < 4 ? prev + 1 : 0)} className="p-2 glass-icon rounded-lg"><ChevronLeft className="w-4 h-4"/></button>
                                </div>

                                <div className="space-y-2">
                                    {Array(8).fill(null).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-400 w-10">حصة {i + 1}</span>
                                            <input 
                                                type="text" 
                                                placeholder="اسم المادة / الفصل"
                                                className="flex-1 p-3 glass-input rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500/40 outline-none focus:border-indigo-500/50"
                                                value={tempSchedule[editingDayIndex]?.periods[i] || ''}
                                                onChange={(e) => updateTempClass(editingDayIndex, i, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="pt-4 mt-4 border-t border-white/10 shrink-0">
                        <button onClick={handleSaveScheduleSettings} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
                            حفظ الإعدادات
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Dashboard;
