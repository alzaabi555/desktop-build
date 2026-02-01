import React, { useState, useEffect, useRef } from 'react';
import { ScheduleDay, PeriodTime } from '../types';
import { 
  School, Loader2, BookOpen, ChevronLeft 
} from 'lucide-react';
import Modal from './Modal';
import * as XLSX from 'xlsx';
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
    onSemesterChange,
    onNavigate
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stampInputRef = useRef<HTMLInputElement>(null); 
    const ministryLogoInputRef = useRef<HTMLInputElement>(null); 
    const scheduleFileInputRef = useRef<HTMLInputElement>(null);
    const periodTimesInputRef = useRef<HTMLInputElement>(null);

    const [isImportingSchedule, setIsImportingSchedule] = useState(false);
    const [isImportingPeriods, setIsImportingPeriods] = useState(false); 
    const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
    
    // Modals State
    const [showEditModal, setShowEditModal] = useState(false);
    
    const [editName, setEditName] = useState(teacherInfo?.name || '');
    const [editSchool, setEditSchool] = useState(teacherInfo?.school || '');
    const [editSubject, setEditSubject] = useState(teacherInfo?.subject || '');
    const [editGovernorate, setEditGovernorate] = useState(teacherInfo?.governorate || '');
    const [editAvatar, setEditAvatar] = useState(teacherInfo?.avatar || '');
    const [editStamp, setEditStamp] = useState(teacherInfo?.stamp || '');
    const [editMinistryLogo, setEditMinistryLogo] = useState(teacherInfo?.ministryLogo || '');
    const [editAcademicYear, setEditAcademicYear] = useState(teacherInfo?.academicYear || '');
    const [editSemester, setEditSemester] = useState<'1' | '2'>(currentSemester);

    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleTab, setScheduleTab] = useState<'timing' | 'classes'>('timing');
    const [editingDayIndex, setEditingDayIndex] = useState(0); 
    const [tempPeriodTimes, setTempPeriodTimes] = useState<PeriodTime[]>([]);
    const [tempSchedule, setTempSchedule] = useState<ScheduleDay[]>([]);

    useEffect(() => {
        setEditName(teacherInfo?.name || '');
        setEditSchool(teacherInfo?.school || '');
        setEditSubject(teacherInfo?.subject || '');
        setEditGovernorate(teacherInfo?.governorate || '');
        setEditAvatar(teacherInfo?.avatar || '');
        setEditStamp(teacherInfo?.stamp || '');
        setEditMinistryLogo(teacherInfo?.ministryLogo || '');
        setEditAcademicYear(teacherInfo?.academicYear || '');
        setEditSemester(currentSemester);
    }, [teacherInfo, currentSemester]);

    useEffect(() => {
        if (showScheduleModal) {
            setTempPeriodTimes(JSON.parse(JSON.stringify(periodTimes)));
            setTempSchedule(JSON.parse(JSON.stringify(schedule)));
        }
    }, [showScheduleModal, periodTimes, schedule]);

    // Helpers
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

    const getFormattedDate = () => {
        return new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    };

    const parseExcelTime = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'number') {
            const totalSeconds = Math.round(value * 86400);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        const str = String(value).trim();
        const match = str.match(/(\d{1,2}):(\d{2})/);
        if (match) {
            return `${String(match[1]).padStart(2, '0')}:${match[2]}`;
        }
        return '';
    };

    // أيقونات المواد (3D Style - Medium Size)
    const getSubjectIcon = (subjectName: string) => {
        if (!subjectName) return <BookOpen className="w-5 h-5 text-[#1e3a8a] opacity-50" />; 
        const name = subjectName.trim().toLowerCase();
        
        const iconStyle = "text-xl drop-shadow-sm filter transform transition-transform hover:scale-110 cursor-default";

        if (name.includes('اسلام') || name.includes('إسلام') || name.includes('دين') || name.includes('قرآن') || name.includes('تجويد')) 
            return <span className={iconStyle}>🕌</span>;
        if (name.includes('عربي') || name.includes('لغتي') || name.includes('نحو') || name.includes('أدب')) 
            return <span className={iconStyle}>📜</span>;
        if (name.includes('رياضيات') || name.includes('حساب') || name.includes('جبر') || name.includes('هندسة') || name.includes('math')) 
            return <span className={iconStyle}>📐</span>;
        if (name.includes('علوم') || name.includes('فيزياء') || name.includes('كيمياء') || name.includes('أحياء') || name.includes('مختبر') || name.includes('science')) 
            return <span className={iconStyle}>🧪</span>;
        if (name.includes('دراسات') || name.includes('اجتماعيات') || name.includes('تاريخ') || name.includes('جغرافيا') || name.includes('وطنية')) 
            return <span className={iconStyle}>🌍</span>;
        if (name.includes('حاسوب') || name.includes('تقنية') || name.includes('رقمية') || name.includes('computer') || name.includes('it')) 
            return <span className={iconStyle}>💻</span>;
        if (name.includes('رياضة') || name.includes('بدنية') || name.includes('sport') || name.includes('pe')) 
            return <span className={iconStyle}>⚽</span>;
        if (name.includes('موسيقى') || name.includes('عزف') || name.includes('music')) 
            return <span className={iconStyle}>🎵</span>;
        if (name.includes('فنون') || name.includes('رسم') || name.includes('تشكيلية') || name.includes('art')) 
            return <span className={iconStyle}>🎨</span>;
        if (name.includes('نجليزي') || name.includes('english') || name.includes('لغات')) 
            return <span className={iconStyle}>🅰️</span>;
        if (name.includes('حياتية') || name.includes('بيئة') || name.includes('زراعة')) 
            return <span className={iconStyle}>🌱</span>;
            
        return <span className={iconStyle}>📚</span>;
    };

    // Handlers
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setter(reader.result as string);
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
                        if (row[i]) newSchedule[dayIndex].periods[i-1] = String(row[i]).trim();
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
            setShowSettingsDropdown(false);
        }
    };

    const handleImportPeriodTimes = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImportingPeriods(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            const newPeriodTimes = [...tempPeriodTimes];
            let updatesCount = 0;

            jsonData.forEach((row) => {
                if (row.length < 2) return;
                const firstCol = String(row[0] || '');
                const periodNumMatch = firstCol.match(/\d+/);
                
                if (periodNumMatch) {
                    const pIndex = parseInt(periodNumMatch[0]) - 1; 
                    if (pIndex >= 0 && pIndex < 8) {
                        const startVal = row[1];
                        const endVal = row[2];
                        const parsedStart = parseExcelTime(startVal);
                        const parsedEnd = parseExcelTime(endVal);

                        if (parsedStart) newPeriodTimes[pIndex].startTime = parsedStart;
                        if (parsedEnd) newPeriodTimes[pIndex].endTime = parsedEnd;
                        
                        if(parsedStart || parsedEnd) updatesCount++;
                    }
                }
            });

            if (updatesCount > 0) {
                setTempPeriodTimes(newPeriodTimes);
                alert(`تم تحديث توقيت ${updatesCount} حصص بنجاح ✅`);
            } else {
                alert('لم يتم العثور على بيانات توقيت صالحة. تأكد من أن العمود الأول يحتوي على رقم الحصة.');
            }

        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء قراءة الملف.');
        } finally {
            setIsImportingPeriods(false);
            if (e.target) e.target.value = '';
        }
    };

    // ✅ إصلاح مشكلة اختفاء الجدول: تحديد اليوم الصحيح (الجمعة/السبت -> الأحد)
    const rawDayIndex = new Date().getDay(); // 0 is Sunday, 6 is Saturday
    const dayIndex = (rawDayIndex === 5 || rawDayIndex === 6) ? 0 : rawDayIndex;
    
    // تأمين ضد المصفوفات الفارغة
    const todaySchedule = (schedule && schedule[dayIndex]) ? schedule[dayIndex] : { dayName: 'اليوم', periods: Array(8).fill('') };
    
    // للتأكد من حالة "اليوم الحالي" في التظليل
    const isToday = rawDayIndex === dayIndex; 

    return (
        <div className="bg-[#f8fafc] text-slate-900 min-h-screen pb-24 font-sans animate-in fade-in duration-500">
            
            {/* ================= HEADER ================= */}
            <header className="bg-[#1e3a8a] text-white pt-8 pb-10 px-6 rounded-b-[2.5rem] shadow-lg relative z-10">
                
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md border border-white/20">
                            <BrandLogo className="w-6 h-6 text-white" showText={false} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black leading-tight tracking-wide">راصد</h1>
                            <p className="text-[10px] text-blue-200 font-bold opacity-80">لوحة تحكم المعلم</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* زر تعديل بيانات المعلم (3D Icon) */}
                        <button onClick={() => setShowEditModal(true)} className="bg-white/10 p-2 rounded-lg backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all active:scale-95 group" title="تعديل بيانات المعلم">
                            <span className="text-xl drop-shadow-md group-hover:scale-110 transition-transform block">✏️</span>
                        </button>
                        
                        {/* زر التنبيهات (3D Icon) */}
                        <button onClick={onToggleNotifications} className="p-2 rounded-full hover:bg-white/10 transition-colors relative group">
                            <span className="text-xl drop-shadow-md group-hover:scale-110 transition-transform block">🔔</span>
                            {notificationsEnabled && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1e3a8a]"></span>}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-5 mb-6 cursor-pointer" onClick={() => setShowEditModal(true)}>
                    <div className="w-16 h-16 rounded-2xl bg-white text-[#1e3a8a] flex items-center justify-center shadow-lg border-2 border-blue-200 overflow-hidden shrink-0">
                        {teacherInfo?.avatar ? <img src={teacherInfo.avatar} className="w-full h-full object-cover"/> : <span className="text-2xl font-black">{teacherInfo?.name ? teacherInfo.name.charAt(0) : 'T'}</span>}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold mb-1 leading-tight">{teacherInfo?.name || 'مرحباً يا معلم'}</h2>
                        <div className="flex flex-col gap-0.5 text-blue-100 text-xs font-medium opacity-90">
                            {teacherInfo?.school && <span className="flex items-center gap-1"><School className="w-3 h-3"/> {teacherInfo.school}</span>}
                            {teacherInfo?.subject && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3"/> معلم {teacherInfo.subject}</span>}
                            {!teacherInfo?.school && !teacherInfo?.subject && <span>اضغط لتحديث بياناتك</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-8 relative">
                    <h3 className="text-xl font-extrabold flex items-center gap-2 text-white">
                        <span className="w-1.5 h-6 bg-blue-400 rounded-full"></span>
                        جدول اليوم
                    </h3>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative z-50">
                            {/* زر الترس (الإعدادات) (3D Icon) */}
                            <button onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} className={`flex items-center justify-center w-9 h-9 rounded-xl border border-white/20 hover:bg-white/20 transition-all group ${showSettingsDropdown ? 'bg-white' : 'bg-white/10'}`}>
                                <span className="text-lg drop-shadow-md group-hover:scale-110 transition-transform block">⚙️</span>
                            </button>
                            
                            {showSettingsDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSettingsDropdown(false)}></div>
                                    <div className="absolute left-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden origin-bottom-left z-50 animate-in zoom-in-95 duration-200">
                                        <div className="flex flex-col py-1">
                                            {/* زر استيراد الجدول */}
                                            <button onClick={() => scheduleFileInputRef.current?.click()} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-right w-full group">
                                                <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">📥</span>
                                                <span className="text-xs font-bold text-slate-700">استيراد الجدول</span>
                                                {isImportingSchedule && <Loader2 className="w-3 h-3 animate-spin mr-auto"/>}
                                            </button>
                                            
                                            {/* زر ضبط التوقيت */}
                                            <button onClick={() => { setShowScheduleModal(true); setShowSettingsDropdown(false); }} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-t border-slate-50 text-right w-full group">
                                                <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">⏱️</span>
                                                <span className="text-xs font-bold text-slate-700">ضبط توقيت الجدول</span>
                                            </button>
                                            
                                            {/* زر منبه الحصص */}
                                            <button onClick={() => { onToggleNotifications(); setShowSettingsDropdown(false); }} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-t border-slate-50 text-right w-full group">
                                                <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">⏰</span>
                                                <span className="text-xs font-bold text-slate-700">منبه الحصص</span>
                                                <span className={`mr-auto text-[10px] px-2 py-0.5 rounded-full ${notificationsEnabled ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>{notificationsEnabled ? 'مفعل' : 'معطل'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <input type="file" ref={scheduleFileInputRef} onChange={handleImportSchedule} accept=".xlsx, .xls" className="hidden" />
                        <span className="text-xs font-bold text-blue-100 bg-white/10 px-4 py-2 rounded-xl border border-white/20">{getFormattedDate()}</span>
                    </div>
                </div>
            </header>

            {/* ================= SCHEDULE CONTENT ================= */}
            <section className="px-6 -mt-6 relative z-20 mb-8 space-y-4">
                {todaySchedule.periods && todaySchedule.periods.map((cls, idx) => {
                    if (!cls) return null;
                    const pt = periodTimes[idx] || { startTime: '00:00', endTime: '00:00' };
                    // تظليل الحصة الحالية فقط إذا كان اليوم هو نفس يوم الجهاز
                    const isActive = isToday && checkActivePeriod(pt.startTime, pt.endTime);

                    return (
                        <div key={idx} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md transition-shadow relative overflow-hidden ${isActive ? 'ring-2 ring-emerald-400 shadow-xl' : ''}`}>
                            
                            {isActive && <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>}

                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isActive ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                                    {/* أيقونات الـ 3D بحجم متوسط */}
                                    {getSubjectIcon(teacherInfo?.subject || '')}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-black text-slate-900">{cls}</h4>
                                        {isActive && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold animate-pulse">الآن</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold mt-0.5">الحصة {idx + 1} {teacherInfo?.school ? `• ${teacherInfo.school}` : ''}</p>
                                </div>
                            </div>
                            
                            {isActive ? (
                                <button onClick={() => onNavigate('attendance')} className="bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center gap-1">
                                    تحضير <ChevronLeft className="w-3 h-3"/>
                                </button>
                            ) : (
                                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <span className="text-sm font-black text-slate-700">{pt.startTime}</span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* إذا لم تكن هناك حصص أو كان الجدول فارغاً */}
                {(!todaySchedule.periods || todaySchedule.periods.every(p => !p)) && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center opacity-75 mt-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <School className="w-8 h-8" />
                        </div>
                        <p className="text-slate-500 font-bold">لا توجد حصص مسجلة لهذا اليوم</p>
                        <button onClick={() => scheduleFileInputRef.current?.click()} className="text-[#1e3a8a] text-xs font-bold mt-2 hover:underline">استيراد جدول جديد</button>
                    </div>
                )}
            </section>

            {/* ================= MODALS ================= */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
                 <div className="text-center">
                    <h3 className="font-black text-2xl mb-6 text-slate-800">إعدادات الهوية</h3>
                    <div className="flex gap-4 justify-center mb-6 overflow-x-auto pb-4 custom-scrollbar">
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-white shadow-md glass-card bg-white">
                                {editAvatar ? <img src={editAvatar} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600">{editName ? editName.charAt(0) : 'T'}</div>}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, setEditAvatar)} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-500 mt-2">الصورة</p>
                        </div>
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => stampInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center">
                                {editStamp ? <img src={editStamp} className="w-full h-full object-contain p-2"/> : <span className="text-gray-300 font-bold">ختم</span>}
                            </div>
                            <input type="file" ref={stampInputRef} onChange={(e) => handleImageUpload(e, setEditStamp)} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-500 mt-2">الختم</p>
                        </div>
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => ministryLogoInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center">
                                {editMinistryLogo ? <img src={editMinistryLogo} className="w-full h-full object-contain p-2"/> : <span className="text-gray-300 font-bold">شعار</span>}
                            </div>
                            <input type="file" ref={ministryLogoInputRef} onChange={(e) => handleImageUpload(e, setEditMinistryLogo)} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-500 mt-2">الوزارة</p>
                        </div>
                    </div>
                    <div className="space-y-3 text-right">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 pr-1">اسم المعلم</label>
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:border-blue-500" placeholder="الاسم الكامل" value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 pr-1">المدرسة</label>
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:border-blue-500" placeholder="اسم المدرسة" value={editSchool} onChange={e => setEditSchool(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <div className="space-y-1 flex-1">
                                <label className="text-[10px] font-bold text-gray-500 pr-1">المادة</label>
                                <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:border-blue-500" placeholder="مثال: رياضيات" value={editSubject} onChange={e => setEditSubject(e.target.value)} />
                            </div>
                            <div className="space-y-1 flex-1">
                                <label className="text-[10px] font-bold text-gray-500 pr-1">المحافظة</label>
                                <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:border-blue-500" placeholder="المحافظة" value={editGovernorate} onChange={e => setEditGovernorate(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 pr-1">العام الدراسي</label>
                            <input className="w-full p-3 bg-slate-50 rounded-xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:border-blue-500" placeholder="مثال: 2025/2026" value={editAcademicYear} onChange={e => setEditAcademicYear(e.target.value)} />
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-gray-200">
                            <span className="text-xs font-bold text-gray-500 pr-2">الفصل الدراسي:</span>
                            <div className="flex gap-2">
                                <button onClick={() => setEditSemester('1')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${editSemester === '1' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>الأول</button>
                                <button onClick={() => setEditSemester('2')} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${editSemester === '2' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>الثاني</button>
                            </div>
                        </div>
                        <button onClick={handleSaveInfo} className="w-full py-3.5 bg-[#1e3a8a] text-white rounded-xl font-black text-sm shadow-lg hover:bg-blue-900 active:scale-95 transition-all mt-4">حفظ وتطبيق</button>
                    </div>
                 </div>
            </Modal>

            <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} className="max-w-md rounded-[2rem]">
                <div className="text-center">
                    <h3 className="font-black text-xl mb-4 text-slate-800">إعدادات الجدول</h3>
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-4 border border-gray-200">
                        <button onClick={() => setScheduleTab('timing')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${scheduleTab === 'timing' ? 'bg-white shadow text-[#1e3a8a]' : 'text-gray-500 hover:text-slate-700'}`}>التوقيت</button>
                        <button onClick={() => setScheduleTab('classes')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${scheduleTab === 'classes' ? 'bg-white shadow text-[#1e3a8a]' : 'text-gray-500 hover:text-slate-700'}`}>الحصص</button>
                    </div>
                    
                    {scheduleTab === 'timing' ? (
                        <>
                            <div className="mb-3 px-1">
                                <button 
                                    onClick={() => periodTimesInputRef.current?.click()} 
                                    disabled={isImportingPeriods}
                                    className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 active:scale-95 transition-all"
                                >
                                    {isImportingPeriods ? <Loader2 className="w-4 h-4 animate-spin"/> : <span className="text-lg drop-shadow-sm">📂</span>}
                                    استيراد التوقيت من Excel
                                </button>
                                <p className="text-[9px] text-gray-400 mt-1 font-bold">الملف يجب أن يحتوي على: رقم الحصة، بداية الوقت، نهاية الوقت</p>
                                <input type="file" ref={periodTimesInputRef} onChange={handleImportPeriodTimes} accept=".xlsx, .xls" className="hidden" />
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {tempPeriodTimes.map((pt, idx) => (
                                    <div key={idx} className="flex items-center gap-2 mb-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                        <span className="text-xs font-bold w-16 text-slate-500 bg-gray-50 py-2 rounded-lg">حصة {pt.periodNumber}</span>
                                        <input type="time" value={pt.startTime} onChange={e => updateTempTime(idx, 'startTime', e.target.value)} className="flex-1 p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-800 border border-slate-200 text-center" />
                                        <span className="text-gray-400 font-bold">-</span>
                                        <input type="time" value={pt.endTime} onChange={e => updateTempTime(idx, 'endTime', e.target.value)} className="flex-1 p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-800 border border-slate-200 text-center" />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                         <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar p-1">
                             <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                 {tempSchedule.map((day, idx) => (
                                     <button key={idx} onClick={() => setEditingDayIndex(idx)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${editingDayIndex === idx ? 'bg-[#1e3a8a] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}>
                                         {day.dayName}
                                     </button>
                                 ))}
                             </div>
                             <div className="space-y-2">
                                 {tempSchedule[editingDayIndex]?.periods.map((cls, pIdx) => (
                                     <div key={pIdx} className="flex items-center gap-3">
                                         <span className="text-xs font-bold w-12 text-slate-400 bg-slate-50 py-2.5 rounded-lg">#{pIdx + 1}</span>
                                         <input placeholder="اسم الفصل / المادة" value={cls} onChange={e => updateTempClass(editingDayIndex, pIdx, e.target.value)} className="flex-1 p-2.5 bg-white rounded-xl text-xs font-bold text-slate-800 border border-gray-200 focus:border-blue-500 outline-none shadow-sm"/>
                                     </div>
                                 ))}
                             </div>
                          </div>
                    )}
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3.5 text-slate-500 font-bold text-xs hover:bg-gray-100 rounded-xl transition-colors">إلغاء</button>
                        <button onClick={handleSaveScheduleSettings} className="flex-[2] py-3.5 bg-[#1e3a8a] text-white rounded-xl font-black text-sm shadow-lg hover:bg-blue-900 active:scale-95 transition-all">حفظ التغييرات</button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Dashboard;
