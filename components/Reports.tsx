import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Printer, FileSpreadsheet, User, Award, BarChart3, Check, Settings, FileWarning, Share2, ChevronDown, X, FileText, Loader2, ListChecks, Eye, Layers, ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import StudentReport from './StudentReport';
import Modal from './Modal';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import html2pdf from 'html2pdf.js';

// --- مكونات القوالب (Templates Components) - هذا هو سر الحل ---

// 1. قالب سجل الدرجات
const GradesTemplate = ({ students, tools, finalTool, teacherInfo, semester, gradeClass }: any) => {
    return (
        <div id="print-content" className="w-full text-black bg-white p-5 font-sans" dir="rtl">
            <div className="text-center mb-6 border-b-2 border-black pb-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-right">
                        <p className="font-bold text-sm">سلطنة عمان</p>
                        <p className="font-bold text-sm">وزارة التربية والتعليم</p>
                    </div>
                    <div><h1 className="text-xl font-black underline">سجل درجات الطلاب</h1></div>
                    <div className="text-left">
                        <p className="font-bold text-sm">المادة: {teacherInfo.subject}</p>
                        <p className="font-bold text-sm">الصف: {gradeClass}</p>
                    </div>
                </div>
            </div>
            <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-black p-1 w-8">م</th>
                        <th className="border border-black p-1 text-right">الاسم</th>
                        {tools.map((t: any) => <th key={t.id} className="border border-black p-1 bg-orange-100">{t.name}</th>)}
                        <th className="border border-black p-1 bg-blue-100">المجموع (60)</th>
                        {finalTool && <th className="border border-black p-1 bg-pink-100">{finalTool.name} (40)</th>}
                        <th className="border border-black p-1 bg-gray-300">الكلي</th>
                        <th className="border border-black p-1">الرمز</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((s: any, i: number) => {
                        const semGrades = (s.grades || []).filter((g: any) => (g.semester || '1') === semester);
                        let contSum = 0;
                        const contCells = tools.map((tool: any) => {
                            const g = semGrades.find((r: any) => r.category.trim() === tool.name.trim());
                            const val = g ? Number(g.score) : 0;
                            contSum += val;
                            return <td key={tool.id} className="border border-black p-1 text-center">{g ? g.score : '-'}</td>;
                        });
                        const finalG = finalTool ? semGrades.find((r: any) => r.category.trim() === finalTool.name.trim()) : null;
                        const finalVal = finalG ? Number(finalG.score) : 0;
                        const total = contSum + finalVal;
                        
                        const getSymbol = (sc: number) => {
                            if (sc >= 90) return 'أ'; if (sc >= 80) return 'ب'; if (sc >= 65) return 'ج'; if (sc >= 50) return 'د'; return 'هـ';
                        };

                        return (
                            <tr key={s.id}>
                                <td className="border border-black p-1 text-center">{i + 1}</td>
                                <td className="border border-black p-1 font-bold">{s.name}</td>
                                {contCells}
                                <td className="border border-black p-1 text-center font-bold bg-blue-50">{contSum}</td>
                                {finalTool && <td className="border border-black p-1 text-center font-bold bg-pink-50">{finalG ? finalG.score : '-'}</td>}
                                <td className="border border-black p-1 text-center font-black bg-gray-100">{total}</td>
                                <td className="border border-black p-1 text-center">{getSymbol(total)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="mt-8 flex justify-between px-10 font-bold text-sm">
                <p>توقيع المعلم: ....................</p>
                <p>يعتمد مدير المدرسة: ....................</p>
            </div>
        </div>
    );
};

// 2. قالب الشهادات
const CertificatesTemplate = ({ students, settings, teacherInfo }: any) => {
    return (
        <div id="print-content" className="w-full text-black bg-white">
            {students.map((s: any) => {
                const body = settings.bodyText.replace(/(الطالبة|الطالب)/g, `<span class="font-black text-emerald-800 mx-1">${s.name}</span>`);
                return (
                    <div key={s.id} className="w-full min-h-[290mm] relative bg-white flex flex-col items-center text-center p-10 border-[10px] border-double border-emerald-600 mb-10 last:mb-0 page-break-after-always">
                        <div className="mb-8">
                            {teacherInfo.ministryLogo && <img src={teacherInfo.ministryLogo} className="h-20 mx-auto mb-2" />}
                            <h3 className="font-bold text-sm">سلطنة عمان - وزارة التربية والتعليم</h3>
                            <h3 className="font-bold text-sm">مدرسة {teacherInfo.school}</h3>
                        </div>
                        <div className="flex-1 flex flex-col justify-center items-center w-full max-w-2xl">
                            <h1 className="text-5xl font-black text-emerald-800 mb-10">{settings.title}</h1>
                            <div className="text-2xl leading-loose font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: body }}></div>
                        </div>
                        <div className="w-full flex justify-between items-end mt-10 px-10">
                            <div className="text-center"><p className="font-bold text-lg mb-6">معلم المادة</p><p className="font-black text-xl">{teacherInfo.name}</p></div>
                            <div className="text-center">{teacherInfo.stamp && <img src={teacherInfo.stamp} className="w-28 opacity-80 mix-blend-multiply" />}</div>
                            <div className="text-center"><p className="font-bold text-lg mb-6">مدير المدرسة</p><p className="font-black text-xl">....................</p></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// 3. قالب الاستدعاء
const SummonTemplate = ({ student, teacherInfo, data }: any) => {
    return (
        <div id="print-content" className="w-full text-black bg-white p-10 font-serif text-right" dir="rtl">
             <div className="text-center mb-8">
                {teacherInfo.ministryLogo && <img src={teacherInfo.ministryLogo} className="h-16 mx-auto mb-2" />}
                <h3 className="font-bold text-sm">سلطنة عمان - وزارة التربية والتعليم</h3>
                <h3 className="font-bold text-sm">مدرسة {teacherInfo.school}</h3>
            </div>
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between">
                <div><span className="font-bold text-lg">الفاضل/ ولي أمر الطالب: {student.name}</span> <span className="text-lg">المحترم</span></div>
                <div className="text-left font-bold text-sm"><p>الصف: {data.className}</p><p>التاريخ: {data.issueDate}</p></div>
            </div>
            <h2 className="text-center text-2xl font-black underline mb-8">استدعاء ولي أمر</h2>
            <p className="text-lg leading-loose text-justify mb-6">السلام عليكم ورحمة الله وبركاته،،،<br/>نود إفادتكم بضرورة الحضور إلى المدرسة يوم <strong>{data.date}</strong> الساعة <strong>{data.time}</strong>، وذلك لمناقشة الأمر التالي:</p>
            <div className="bg-gray-100 border border-black p-4 text-center text-lg font-bold rounded-lg mb-6">{data.reason}</div>
            {data.procedures.length > 0 && (
                <div className="mb-8 border border-dashed border-black p-4 rounded-lg"><p className="font-bold underline mb-2">الإجراءات المتخذة مسبقاً:</p><ul className="list-disc pr-6">{data.procedures.map((p:any) => <li key={p}>{p}</li>)}</ul></div>
            )}
            <p className="text-lg leading-loose mt-6 mb-12">شاكرين لكم حسن تعاونكم واهتمامكم بمصلحة الطالب.</p>
            <div className="flex justify-between items-end px-10">
                <div className="text-center"><p className="font-bold text-lg mb-8">معلم المادة</p><p className="text-xl">{teacherInfo.name}</p></div>
                <div className="text-center">{teacherInfo.stamp && <img src={teacherInfo.stamp} className="w-28 opacity-80 mix-blend-multiply" />}</div>
                <div className="text-center"><p className="font-bold text-lg mb-8">مدير المدرسة</p><p className="text-xl">....................</p></div>
            </div>
        </div>
    );
};

// --- المكون الرئيسي ---
const Reports: React.FC = () => {
  const { students, setStudents, classes, teacherInfo, currentSemester, assessmentTools, certificateSettings, setCertificateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'student_report' | 'grades_record' | 'certificates' | 'summon'>('student_report');

  // Filters State
  const [stGrade, setStGrade] = useState<string>('all');
  const [stClass, setStClass] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const [gradesGrade, setGradesGrade] = useState<string>('all');
  const [gradesClass, setGradesClass] = useState<string>('all');
  
  const [certGrade, setCertGrade] = useState<string>('all');
  const [certClass, setCertClass] = useState<string>('');
  const [selectedCertStudents, setSelectedCertStudents] = useState<string[]>([]);
  const [showCertSettingsModal, setShowCertSettingsModal] = useState(false);
  const [tempCertSettings, setTempCertSettings] = useState(certificateSettings);
  
  const [summonGrade, setSummonGrade] = useState<string>('all');
  const [summonClass, setSummonClass] = useState<string>('');
  const [summonStudentId, setSummonStudentId] = useState<string>('');
  const [summonData, setSummonData] = useState({ date: new Date().toISOString().split('T')[0], time: '09:00', reasonType: 'absence', customReason: '', issueDate: new Date().toISOString().split('T')[0] });
  const [takenProcedures, setTakenProcedures] = useState<string[]>([]);

  // Preview Modal State
  const [previewMode, setPreviewMode] = useState<string | null>(null); // 'grades', 'cert', 'summon'
  const [isPrinting, setIsPrinting] = useState(false);

  // Helpers
  const availableGrades = useMemo(() => {
      const grades = new Set<string>();
      students.forEach(s => {
          if (s.grade) grades.add(s.grade);
          else if (s.classes[0]) {
              const match = s.classes[0].match(/^(\d+)/);
              if (match) grades.add(match[1]);
          }
      });
      if (grades.size === 0 && classes.length > 0) return ['عام']; 
      return Array.from(grades).sort();
  }, [students, classes]);

  const getClassesForGrade = (grade: string) => grade === 'all' ? classes : classes.filter(c => c.startsWith(grade));

  const filteredStudentsForStudentTab = useMemo(() => students.filter(s => s.classes.includes(stClass)), [students, stClass]);
  const filteredStudentsForGrades = useMemo(() => students.filter(s => gradesClass === 'all' || s.classes.includes(gradesClass)), [students, gradesClass]);
  const filteredStudentsForCert = useMemo(() => students.filter(s => s.classes.includes(certClass)), [students, certClass]);
  const availableStudentsForSummon = useMemo(() => students.filter(s => s.classes.includes(summonClass)), [summonClass, students]);

  useEffect(() => { if(getClassesForGrade(stGrade).length > 0) setStClass(getClassesForGrade(stGrade)[0]); }, [stGrade]);
  useEffect(() => { if(getClassesForGrade(certGrade).length > 0) setCertClass(getClassesForGrade(certGrade)[0]); }, [certGrade]);
  useEffect(() => { if(getClassesForGrade(summonGrade).length > 0) setSummonClass(getClassesForGrade(summonGrade)[0]); }, [summonGrade]);

  const handleUpdateStudent = (updatedStudent: Student) => {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      setViewingStudent(updatedStudent);
  };

  const getReasonText = () => {
    switch (summonData.reasonType) {
        case 'absence': return 'تكرار الغياب عن المدرسة وتأثيره على المستوى الدراسي';
        case 'truant': return 'التسرب المتكرر من الحصص الدراسية';
        case 'behavior': return 'مناقشة بعض السلوكيات الصادرة من الطالب';
        case 'level': return 'مناقشة تدني المستوى التحصيلي للطالب';
        case 'other': return summonData.customReason;
        default: return '';
    }
  };

  const handlePrint = async (filename: string, landscape = false) => {
      const element = document.getElementById('print-content');
      if (!element) return;

      setIsPrinting(true);
      window.scrollTo(0,0);

      const opt = {
          margin: 5,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: landscape ? 1123 : 794 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      try {
          const worker = html2pdf().set(opt).from(element).toPdf();
          if (Capacitor.isNativePlatform()) {
              const pdfBase64 = await worker.output('datauristring');
              const base64Data = pdfBase64.split(',')[1];
              const result = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
              await Share.share({ title: filename, url: result.uri });
          } else {
              worker.save();
          }
      } catch (e) {
          console.error(e);
          alert('حدث خطأ أثناء الطباعة');
      } finally {
          setIsPrinting(false);
      }
  };

  if (viewingStudent) {
      return <StudentReport student={viewingStudent} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} onBack={() => setViewingStudent(null)} />;
  }

  // --- RENDER PREVIEW MODAL ---
  const renderPreviewContent = () => {
      if (previewMode === 'grades') {
          const finalExamName = "الامتحان النهائي";
          const continuousTools = assessmentTools.filter(t => t.name.trim() !== finalExamName);
          const finalTool = assessmentTools.find(t => t.name.trim() === finalExamName);
          return <GradesTemplate students={filteredStudentsForGrades} tools={continuousTools} finalTool={finalTool} teacherInfo={teacherInfo} semester={currentSemester} gradeClass={gradesClass === 'all' ? 'الكل' : gradesClass} />;
      }
      if (previewMode === 'cert') {
          const targets = filteredStudentsForCert.filter(s => selectedCertStudents.includes(s.id));
          return <CertificatesTemplate students={targets} settings={certificateSettings} teacherInfo={teacherInfo} />;
      }
      if (previewMode === 'summon') {
          const s = availableStudentsForSummon.find(st => st.id === summonStudentId);
          if (!s) return null;
          return <SummonTemplate student={s} teacherInfo={teacherInfo} data={{...summonData, reason: getReasonText(), className: summonClass, procedures: takenProcedures}} />;
      }
      return null;
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* Preview Modal Overlay - The Solution to White Screen */}
      {previewMode && (
          <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setPreviewMode(null)} className="p-2 hover:bg-white/10 rounded-full"><ArrowRight /></button>
                      <h3 className="font-bold text-lg">معاينة الطباعة</h3>
                  </div>
                  <button onClick={() => handlePrint(`Report.pdf`, previewMode === 'grades')} disabled={isPrinting} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                      {isPrinting ? <Loader2 className="animate-spin" /> : <Printer />} {isPrinting ? 'جاري التحويل...' : 'تصدير PDF'}
                  </button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-800 p-4 md:p-8 flex justify-center">
                  <div className="bg-white shadow-2xl relative min-h-[297mm]" style={{ width: previewMode === 'grades' ? '297mm' : '210mm' }}>
                      {renderPreviewContent()}
                  </div>
              </div>
          </div>
      )}

      {/* Main UI Tabs */}
      <div className="flex items-center gap-4 pt-4 px-2 mb-2">
        <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm"><FileSpreadsheet size={30} /></div>
        <div><h2 className="text-3xl font-black text-slate-800 tracking-tight">مركز التقارير</h2><p className="text-slate-500 text-xs font-bold mt-1">طباعة الكشوفات والشهادات والاستدعاءات</p></div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-1">
        {[{id:'student_report', label:'تقرير طالب', icon:User}, {id:'grades_record', label:'سجل الدرجات', icon:BarChart3}, {id:'certificates', label:'الشهادات', icon:Award}, {id:'summon', label:'استدعاء', icon:FileWarning}].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex items-center gap-4 p-4 rounded-[1.5rem] transition-all border ${activeTab === item.id ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-100' : 'bg-white border-slate-200 opacity-80'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}><item.icon size={24} /></div>
                <span className={`block font-black text-sm ${activeTab === item.id ? 'text-slate-900' : 'text-slate-500'}`}>{item.label}</span>
            </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 min-h-[400px] shadow-xl relative">
        {activeTab === 'student_report' && (
            <div className="space-y-6">
                 <div className="pb-4 border-b border-slate-100 flex items-center gap-3"><h3 className="font-black text-lg text-slate-800">تقرير الطالب الشامل</h3></div>
                 <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">{availableGrades.map(g => <button key={g} onClick={() => setStGrade(g)} className={`px-4 py-1.5 text-xs font-bold rounded-xl border ${stGrade === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>صف {g}</button>)}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <select value={stClass} onChange={(e) => setStClass(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">{getClassesForGrade(stGrade).map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700"><option value="">اختر طالباً...</option>{filteredStudentsForStudentTab.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    </div>
                 </div>
                 <div className="flex justify-end pt-6"><button onClick={() => { if(selectedStudentId) { const s = students.find(st=>st.id===selectedStudentId); if(s) setViewingStudent(s); }}} disabled={!selectedStudentId} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-700">معاينة التقرير</button></div>
            </div>
        )}

        {activeTab === 'grades_record' && (
            <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100 flex items-center gap-3"><h3 className="font-black text-lg text-slate-800">سجل الدرجات</h3></div>
                <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">{availableGrades.map(g => <button key={g} onClick={() => { setGradesGrade(g); setGradesClass('all'); }} className={`px-4 py-1.5 text-xs font-bold rounded-xl border ${gradesGrade === g ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>صف {g}</button>)}</div>
                    <select value={gradesClass} onChange={(e) => setGradesClass(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700"><option value="all">الكل</option>{getClassesForGrade(gradesGrade).map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="flex justify-end pt-6"><button onClick={() => setPreviewMode('grades')} className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-amber-600"><Printer size={18} /> معاينة وطباعة السجل</button></div>
            </div>
        )}

        {activeTab === 'certificates' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100"><h3 className="font-black text-lg text-slate-800">شهادات التقدير</h3><button onClick={() => setShowCertSettingsModal(true)} className="p-2 bg-slate-100 rounded-lg text-slate-600"><Settings size={18}/></button></div>
                <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">{availableGrades.map(g => <button key={g} onClick={() => setCertGrade(g)} className={`px-4 py-1.5 text-xs font-bold rounded-xl border ${certGrade === g ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>صف {g}</button>)}</div>
                    <select value={certClass} onChange={(e) => { setCertClass(e.target.value); setSelectedCertStudents([]); }} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">{getClassesForGrade(certGrade).map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between px-2"><label className="text-xs font-bold text-slate-500">الطلاب ({selectedCertStudents.length})</label><button onClick={() => selectedCertStudents.length === filteredStudentsForCert.length ? setSelectedCertStudents([]) : setSelectedCertStudents(filteredStudentsForCert.map(s => s.id))} className="text-xs font-bold text-emerald-600">تحديد الكل</button></div>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredStudentsForCert.map(s => (
                            <button key={s.id} onClick={() => setSelectedCertStudents(prev => prev.includes(s.id) ? prev.filter(sid => sid !== s.id) : [...prev, s.id])} className={`p-3 rounded-xl border text-xs font-bold flex justify-between ${selectedCertStudents.includes(s.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-600'}`}>{s.name} {selectedCertStudents.includes(s.id) && <Check size={14}/>}</button>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end pt-6"><button onClick={() => setPreviewMode('cert')} disabled={selectedCertStudents.length === 0} className="bg-emerald-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-emerald-700"><Printer size={18} /> معاينة وطباعة الشهادات</button></div>
            </div>
        )}

        {activeTab === 'summon' && (
            <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100 flex items-center gap-3"><h3 className="font-black text-lg text-slate-800">استدعاء ولي أمر</h3></div>
                <div className="grid grid-cols-2 gap-4">
                     <select value={summonClass} onChange={(e) => setSummonClass(e.target.value)} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">{getClassesForGrade(summonGrade).map(c => <option key={c} value={c}>{c}</option>)}</select>
                     <select value={summonStudentId} onChange={(e) => setSummonStudentId(e.target.value)} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700"><option value="">الطالب...</option>{availableStudentsForSummon.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                </div>
                <div className="flex flex-wrap gap-2">{[{ id: 'absence', label: 'غياب' }, { id: 'truant', label: 'تسرب' }, { id: 'behavior', label: 'سلوك' }, { id: 'level', label: 'مستوى' }].map((r) => (<button key={r.id} onClick={() => setSummonData({...summonData, reasonType: r.id})} className={`px-4 py-2 rounded-xl text-xs font-bold border ${summonData.reasonType === r.id ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600'}`}>{r.label}</button>))}</div>
                <div className="grid grid-cols-2 gap-2">{['تنبيه شفوي', 'تعهد خطي', 'اتصال هاتفي', 'إشعار واتساب', 'تحويل أخصائي'].map(p => <button key={p} onClick={() => setTakenProcedures(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className={`p-2 rounded-lg text-xs font-bold border ${takenProcedures.includes(p) ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>{p}</button>)}</div>
                <div className="flex justify-end pt-6"><button onClick={() => setPreviewMode('summon')} disabled={!summonStudentId} className="bg-rose-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-rose-700"><Eye size={18} /> معاينة الخطاب</button></div>
            </div>
        )}
      </div>

      <Modal isOpen={showCertSettingsModal} onClose={() => setShowCertSettingsModal(false)} className="max-w-md rounded-[2rem]">
          <div className="text-center p-4">
              <h3 className="font-black text-lg mb-4 text-slate-800">إعدادات الشهادة</h3>
              <div className="space-y-3">
                  <input type="text" value={tempCertSettings.title} onChange={(e) => setTempCertSettings({...tempCertSettings, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" placeholder="عنوان الشهادة" />
                  <textarea value={tempCertSettings.bodyText} onChange={(e) => setTempCertSettings({...tempCertSettings, bodyText: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 h-24" placeholder="نص الشهادة" />
                  <button onClick={() => { setCertificateSettings(tempCertSettings); setShowCertSettingsModal(false); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg">حفظ</button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default Reports;
