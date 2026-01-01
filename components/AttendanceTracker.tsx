
import React, { useState, useMemo } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, Filter, MessageCircle, ChevronDown, CheckCircle2, RotateCcw, Search, Printer, Loader2, CalendarRange, UserCircle2, Share2, Download, FileSpreadsheet, DoorOpen } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

declare var html2pdf: any;

interface AttendanceTrackerProps {
  students: Student[];
  classes: string[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, classes, setStudents }) => {
  const { theme, isLowPower } = useTheme();
  const today = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState(today);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'absent' | 'late' | 'truant'} | null>(null);

  // Styles
  const styles = {
      header: 'glass-heavy border-b border-white/20 sticky top-0 z-30 transition-all duration-300 rounded-[0_0_2rem_2rem] mb-4 shadow-lg',
      contentContainer: 'px-1 pb-32 pt-2 overflow-y-auto custom-scrollbar',
      card: 'glass-card active:scale-[0.99] transition-transform duration-200 touch-manipulation',
      search: 'glass-input rounded-xl border border-white/10 text-center focus:text-right transition-all text-slate-800 dark:text-white',
      pill: 'rounded-full text-xs font-bold transition-all',
  };

  const formatDateDisplay = (dateString: string) => {
      const d = new Date(dateString);
      return d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getStatus = (student: Student) => {
    return student.attendance.find(a => a.date === selectedDate)?.status;
  };

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const filtered = s.attendance.filter(a => a.date !== selectedDate);
      const currentStatus = s.attendance.find(a => a.date === selectedDate)?.status;
      
      const newStudent = {
        ...s,
        attendance: currentStatus === status ? filtered : [...filtered, { date: selectedDate, status }]
      };

      // If status is truant, verify notification trigger
      if (status === 'truant' && currentStatus !== 'truant') {
          setTimeout(() => setNotificationTarget({ student: newStudent, type: 'truant' }), 50);
      }

      return newStudent;
    }));
  };

  const handleMarkAll = (status: AttendanceStatus | 'reset') => {
      if (classFilter === 'all' && students.length > 50) {
          if (!confirm(`سيتم تطبيق هذا الإجراء على جميع الطلاب (${students.length}). هل أنت متأكد؟`)) return;
      }
      
      setStudents(prev => prev.map(s => {
          if (classFilter !== 'all' && (!s.classes || !s.classes.includes(classFilter))) {
              return s;
          }
          const filtered = s.attendance.filter(a => a.date !== selectedDate);
          if (status === 'reset') {
              return { ...s, attendance: filtered };
          }
          return {
              ...s,
              attendance: [...filtered, { date: selectedDate, status }]
          };
      }));
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = classFilter === 'all' || s.classes.includes(classFilter);
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, classFilter, searchQuery]);

  const stats = useMemo(() => {
      const present = filteredStudents.filter(s => getStatus(s) === 'present').length;
      const absent = filteredStudents.filter(s => getStatus(s) === 'absent').length;
      const late = filteredStudents.filter(s => getStatus(s) === 'late').length;
      const truant = filteredStudents.filter(s => getStatus(s) === 'truant').length;
      return { present, absent, late, truant, total: filteredStudents.length };
  }, [filteredStudents, selectedDate]);

  const performNotification = async (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.student.parentPhone) {
          alert('لا يوجد رقم هاتف مسجل');
          return;
      }
      
      const { student, type } = notificationTarget;
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 5) return alert('رقم الهاتف غير صحيح');
      
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
      else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

      let statusText = '';
      if (type === 'absent') statusText = 'غائب';
      else if (type === 'late') statusText = 'متأخر';
      else if (type === 'truant') statusText = 'تسرب من الحصة (هروب)';

      const dateText = new Date().toLocaleDateString('ar-EG');
      const msg = encodeURIComponent(`السلام عليكم، نود إشعاركم بأن الطالب ${student.name} تم تسجيل حالة: *${statusText}* اليوم (${dateText}). نرجو المتابعة.`);
      
      if (method === 'whatsapp') {
          const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
          try {
              if (Capacitor.isNativePlatform()) await Browser.open({ url: universalUrl });
              else window.open(universalUrl, '_blank');
          } catch (e) { window.open(universalUrl, '_blank'); }
      } else {
          window.location.href = `sms:${cleanPhone}?body=${msg}`;
      }
      setNotificationTarget(null);
  };

  // --- Monthly Excel Export ---
  const handleExportDailyExcel = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      setIsExportingExcel(true);
      try {
          const targetDate = new Date(selectedDate);
          const year = targetDate.getFullYear();
          const month = targetDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          const data = filteredStudents.map((s, idx) => {
              const row: any = {
                  'م': idx + 1,
                  'اسم الطالب': s.name,
                  'الفصل': s.classes[0] || ''
              };

              let abs = 0, late = 0, truant = 0;

              for (let d = 1; d <= daysInMonth; d++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const record = s.attendance.find(a => a.date === dateStr);
                  let symbol = '';
                  if (record) {
                      if (record.status === 'present') symbol = '✓';
                      else if (record.status === 'absent') { symbol = 'غ'; abs++; }
                      else if (record.status === 'late') { symbol = 'ت'; late++; }
                      else if (record.status === 'truant') { symbol = 'س'; truant++; }
                  }
                  row[`${d}`] = symbol;
              }

              row['مجموع الغياب'] = abs;
              row['مجموع التأخير'] = late;
              row['مجموع التسرب'] = truant;
              return row;
          });

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(data);
          
          // Widths
          const wscols = [{wch:5}, {wch:25}, {wch:10}];
          for(let i=0; i<daysInMonth; i++) wscols.push({wch:3});
          ws['!cols'] = wscols;
          if(!ws['!views']) ws['!views'] = [];
          ws['!views'].push({ rightToLeft: true });

          XLSX.utils.book_append_sheet(wb, ws, `شهر_${month + 1}`);
          const fileName = `Attendance_${month + 1}_${year}.xlsx`;

          if (Capacitor.isNativePlatform()) {
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const result = await Filesystem.writeFile({
                  path: fileName,
                  data: wbout,
                  directory: Directory.Cache
              });
              await Share.share({ title: 'سجل الحضور الشهري', url: result.uri });
          } else {
              XLSX.writeFile(wb, fileName);
          }
      } catch (error) {
          console.error(error);
          alert('خطأ في التصدير');
      } finally {
          setIsExportingExcel(false);
      }
  };

  // --- Daily PDF Report ---
  const handlePrintDailyReport = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      setIsGeneratingPdf(true);

      const dateObj = new Date(selectedDate);
      const dateFormatted = dateObj.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '20px';
      element.style.backgroundColor = '#fff';
      element.style.color = '#000';

      const rows = filteredStudents.map((s, i) => {
          const status = getStatus(s);
          let statusText = 'حضور';
          let color = '#10b981'; // Green
          if (status === 'absent') { statusText = 'غائب'; color = '#ef4444'; }
          else if (status === 'late') { statusText = 'تأخر'; color = '#f59e0b'; }
          else if (status === 'truant') { statusText = 'تسرب'; color = '#8b5cf6'; }
          else if (!status) { statusText = '-'; color = '#9ca3af'; }

          return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; text-align: center; border-left: 1px solid #eee;">${i + 1}</td>
                <td style="padding: 8px; border-left: 1px solid #eee; font-weight: bold;">${s.name}</td>
                <td style="padding: 8px; text-align: center; color: ${color}; font-weight: bold;">${statusText}</td>
            </tr>
          `;
      }).join('');

      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; font-size: 22px; font-weight: bold;">تقرير الحضور اليومي</h2>
            <p style="margin: 5px; font-size: 14px;">التاريخ: ${dateFormatted}</p>
            <p style="margin: 5px; font-size: 14px;">الفصل: ${classFilter === 'all' ? 'جميع الفصول' : classFilter}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc; font-size: 12px;">
            <thead style="background-color: #f3f4f6;">
                <tr>
                    <th style="padding: 10px; border: 1px solid #ccc; width: 40px;">#</th>
                    <th style="padding: 10px; border: 1px solid #ccc;">الطالب</th>
                    <th style="padding: 10px; border: 1px solid #ccc; width: 80px;">الحالة</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div style="margin-top: 20px; display: flex; justify-content: space-around; font-size: 12px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px;">
            <span>حضور: ${stats.present}</span>
            <span style="color: #ef4444;">غياب: ${stats.absent}</span>
            <span style="color: #f59e0b;">تأخر: ${stats.late}</span>
            <span style="color: #8b5cf6;">تسرب: ${stats.truant}</span>
        </div>
      `;

      if (typeof html2pdf !== 'undefined') {
          const opt = {
              margin: 10,
              filename: `Attendance_Daily_${selectedDate}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          try {
              const worker = html2pdf().set(opt).from(element).toPdf();
              if (Capacitor.isNativePlatform()) {
                  const pdfBase64 = await worker.output('datauristring');
                  const base64Data = pdfBase64.split(',')[1];
                  const result = await Filesystem.writeFile({
                      path: opt.filename,
                      data: base64Data,
                      directory: Directory.Cache
                  });
                  await Share.share({ title: 'تقرير يومي', url: result.uri });
              } else {
                  worker.save();
              }
          } catch (e) {
              console.error(e);
              alert('خطأ في إنشاء التقرير');
          } finally {
              setIsGeneratingPdf(false);
          }
      } else {
          alert('مكتبة PDF غير متوفرة');
          setIsGeneratingPdf(false);
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -mt-4 -mx-4 text-slate-900 dark:text-white relative">
        
        {/* iOS Style Header with Glass */}
        <div className={styles.header}>
            <div className="px-5 pt-4 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-[28px] font-black tracking-tight text-slate-900 dark:text-white">الغياب</h1>
                    <div className="flex gap-2">
                         <button onClick={handlePrintDailyReport} disabled={isGeneratingPdf} className="w-9 h-9 glass-icon rounded-full text-slate-800 dark:text-white active:scale-90 transition-transform" title="طباعة تقرير يومي (PDF)">
                             {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Printer className="w-5 h-5"/>}
                         </button>
                         <button onClick={handleExportDailyExcel} disabled={isExportingExcel} className="w-9 h-9 glass-icon rounded-full text-emerald-600 dark:text-emerald-400 active:scale-90 transition-transform" title="تصدير سجل شهري (Excel)">
                             {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin"/> : <Share2 className="w-5 h-5"/>}
                         </button>
                    </div>
                </div>

                {/* Date Scroller (Glass) */}
                <div className="flex items-center justify-between glass-card border-white/10 rounded-xl p-1 mb-3">
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toLocaleDateString('en-CA')); }} className="p-2 rounded-lg hover:bg-white/10 shadow-sm"><ChevronDown className="w-4 h-4 rotate-90"/></button>
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400"/>
                        {formatDateDisplay(selectedDate)}
                    </div>
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toLocaleDateString('en-CA')); }} className="p-2 rounded-lg hover:bg-white/10 shadow-sm"><ChevronDown className="w-4 h-4 -rotate-90"/></button>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    <div className="relative flex-1 min-w-[120px]">
                        <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-gray-400"/>
                        <input 
                            type="text" 
                            placeholder="بحث..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full py-2 pr-8 pl-3 text-xs font-bold outline-none ${styles.search}`} 
                        />
                    </div>
                    <div className="h-6 w-px bg-white/20 mx-1 shrink-0"></div>
                    <button onClick={() => setClassFilter('all')} className={`px-4 py-2 text-[10px] whitespace-nowrap ${styles.pill} ${classFilter === 'all' ? 'bg-indigo-600 text-white border-transparent' : 'glass-card border-white/10 text-slate-700 dark:text-white'}`}>الكل</button>
                    {classes.map(c => (
                        <button key={c} onClick={() => setClassFilter(c)} className={`px-4 py-2 text-[10px] whitespace-nowrap ${styles.pill} ${classFilter === c ? 'bg-indigo-600 text-white border-transparent' : 'glass-card border-white/10 text-slate-700 dark:text-white'}`}>{c}</button>
                    ))}
                </div>
            </div>

            {/* Live Stats Strip (Glass Buttons) */}
            <div className="grid grid-cols-5 gap-px bg-white/10 dark:bg-white/5 border-t border-white/10">
                <button onClick={() => handleMarkAll('present')} className="hover:bg-white/10 py-3 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-white/60 mb-0.5">حضور</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{stats.present}</span>
                </button>
                <button onClick={() => handleMarkAll('absent')} className="hover:bg-white/10 py-3 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-white/60 mb-0.5">غياب</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">{stats.absent}</span>
                </button>
                <button onClick={() => handleMarkAll('late')} className="hover:bg-white/10 py-3 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-white/60 mb-0.5">تأخر</span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">{stats.late}</span>
                </button>
                <button onClick={() => handleMarkAll('truant')} className="hover:bg-white/10 py-3 flex flex-col items-center bg-purple-500/5">
                    <span className="text-[9px] font-bold text-purple-500 dark:text-purple-300 mb-0.5">تسرب</span>
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400">{stats.truant}</span>
                </button>
                <button onClick={() => handleMarkAll('reset')} className="hover:bg-white/10 py-3 flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-white/60 mb-0.5">غير محدد</span>
                    <span className="text-xs font-black text-slate-400 dark:text-white/40">{stats.total - (stats.present + stats.absent + stats.late + stats.truant)}</span>
                </button>
            </div>
        </div>

        {/* Student List */}
        <div className={styles.contentContainer}>
            {filteredStudents.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {filteredStudents.map((student) => {
                        const status = getStatus(student);
                        return (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={student.id} 
                                className={`p-3 rounded-[18px] flex items-center justify-between glass-card ${
                                    status === 'absent' ? 'border-rose-500/30 bg-rose-500/10' : 
                                    status === 'present' ? 'border-emerald-500/30 bg-emerald-500/10' : 
                                    status === 'late' ? 'border-amber-500/30 bg-amber-500/10' : 
                                    status === 'truant' ? 'border-purple-500/30 bg-purple-500/10' : 
                                    ''
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0 shadow-sm glass-icon`}>
                                        {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover rounded-full" /> : student.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-sm font-bold truncate ${status ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>{student.name}</h3>
                                        {(status === 'absent' || status === 'late' || status === 'truant') && (
                                            <button 
                                                onClick={() => setNotificationTarget({ student, type: status as any })}
                                                className={`mt-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md w-fit active:scale-95 glass-card border-none ${
                                                    status === 'absent' 
                                                    ? 'text-rose-600 dark:text-rose-300' 
                                                    : status === 'truant'
                                                    ? 'text-purple-600 dark:text-purple-300'
                                                    : 'text-amber-700 dark:text-amber-300'
                                                }`}
                                            >
                                                <MessageCircle className="w-3 h-3" /> {status === 'truant' ? 'إشعار تسرب' : (status === 'absent' ? 'إشعار غياب' : 'إشعار تأخير')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => toggleAttendance(student.id, 'present')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110' : 'glass-icon text-gray-400 hover:text-emerald-500'}`}>
                                        <Check className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'absent')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110' : 'glass-icon text-gray-400 hover:text-rose-500'}`}>
                                        <X className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'late')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110' : 'glass-icon text-gray-400 hover:text-amber-500'}`}>
                                        <Clock className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                    {/* Truancy Button - The New Addition */}
                                    <button onClick={() => toggleAttendance(student.id, 'truant')} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${status === 'truant' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-110' : 'glass-icon text-gray-400 hover:text-purple-500'}`} title="تسرب">
                                        <DoorOpen className="w-4 h-4" strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <UserCircle2 className="w-16 h-16 text-slate-300 dark:text-white mb-4" />
                    <p className="text-sm font-bold text-slate-400 dark:text-white">لا يوجد طلاب مطابقين</p>
                </div>
            )}
        </div>

        {/* Notification Modal */}
        <Modal isOpen={!!notificationTarget} onClose={() => setNotificationTarget(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <div className="w-16 h-16 glass-icon rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="font-black text-lg mb-1 dark:text-white">إرسال إشعار</h3>
                <p className="text-xs text-gray-500 mb-6 font-bold">{notificationTarget?.student.name} - {notificationTarget?.type === 'truant' ? 'تسرب من الحصة' : (notificationTarget?.type === 'absent' ? 'غياب' : 'تأخير')}</p>
                
                <div className="space-y-3">
                    <button onClick={() => performNotification('whatsapp')} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-95">
                        <MessageCircle className="w-5 h-5" /> واتساب
                    </button>
                    <button onClick={() => performNotification('sms')} className="w-full glass-card hover:bg-white/20 text-slate-700 dark:text-white py-3.5 rounded-xl font-black text-sm transition-all active:scale-95">
                        رسالة نصية (SMS)
                    </button>
                    <button onClick={() => setNotificationTarget(null)} className="text-xs font-bold text-gray-400 mt-2">إلغاء</button>
                </div>
            </div>
        </Modal>

    </div>
  );
};

export default AttendanceTracker;
