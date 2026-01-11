
import React, { useState, useMemo, useEffect } from 'react';
import { Printer, FileSpreadsheet, User, Award, BarChart3, Check, Settings, FileWarning, ChevronDown, FileText, Loader2, ListChecks, Eye, Layers, ArrowLeft, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import StudentReport from './StudentReport';
import Modal from './Modal';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import html2pdf from 'html2pdf.js';

// تعريف الإعدادات الافتراضية للشهادة (حماية من الانهيار)
const DEFAULT_CERT_SETTINGS = {
    title: 'شهادة تقدير',
    bodyText: 'يسرنا تكريم الطالب/الطالبة لتفوقه الدراسي وتميزه في مادة...',
    showDefaultDesign: true
};

// --- 1. محرك الطباعة والمعاينة ---
const PrintPreviewModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    content: React.ReactNode; 
    landscape?: boolean;
}> = ({ isOpen, onClose, title, content, landscape }) => {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = async () => {
        const element = document.getElementById('preview-content-area');
        if (!element) return;

        setIsPrinting(true);
        const scrollContainer = document.getElementById('preview-scroll-container');
        if (scrollContainer) scrollContainer.scrollTop = 0;

        const opt = {
            margin: 0,
            filename: `${title.replace(/\s/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                backgroundColor: '#ffffff', // ضمان خلفية بيضاء
                windowWidth: landscape ? 1123 : 794
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: landscape ? 'landscape' : 'portrait' 
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
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
                await Share.share({ title: title, url: result.uri });
            } else {
                worker.save();
            }
        } catch (e) {
            console.error(e);
            alert('حدث خطأ أثناء الطباعة.');
        } finally {
            setIsPrinting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-white/10 shrink-0 shadow-xl">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowRight className="w-6 h-6" /></button>
                    <div>
                        <h3 className="font-bold text-lg">{title}</h3>
                        <p className="text-xs text-slate-400">{landscape ? 'أفقي (Landscape)' : 'عمودي (Portrait)'}</p>
                    </div>
                </div>
                <button onClick={handlePrint} disabled={isPrinting} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 transition-all">
                    {isPrinting ? <Loader2 className="animate-spin w-5 h-5" /> : <Printer className="w-5 h-5" />} 
                    {isPrinting ? 'جاري التحويل...' : 'تصدير PDF'}
                </button>
            </div>
            <div id="preview-scroll-container" className="flex-1 overflow-auto bg-slate-800 p-4 md:p-8 flex justify-center">
                <div id="preview-content-area" className="bg-white text-black shadow-2xl origin-top"
                    style={{ width: landscape ? '297mm' : '210mm', minHeight: landscape ? '210mm' : '297mm', padding: '0', direction: 'rtl', fontFamily: 'Tajawal, sans-serif', backgroundColor: '#ffffff', color: '#000000' }}>
                    {content}
                </div>
            </div>
        </div>
    );
};

// --- 2. القوالب (Templates) ---

// أ. قالب سجل الدرجات (لم يمس)
const GradesTemplate = ({ students, tools, finalTool, teacherInfo, semester, gradeClass }: any) => {
    return (
        <div className="w-full text-black bg-white p-10">
            <div className="text-center mb-6 border-b-2 border-black pb-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-right text-sm font-bold"><p>سلطنة عمان</p><p>وزارة التربية والتعليم</p></div>
                    <div><h1 className="text-xl font-black underline">سجل درجات الطلاب</h1></div>
                    <div className="text-left text-sm font-bold"><p>المادة: {teacherInfo?.subject}</p><p>الصف: {gradeClass}</p></div>
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
                        const getSymbol = (sc: number) => { if (sc >= 90) return 'أ'; if (sc >= 80) return 'ب'; if (sc >= 65) return 'ج'; if (sc >= 50) return 'د'; return 'هـ'; };
                        return (
                            <tr key={s.id} style={{ pageBreakInside: 'avoid' }}>
                                <td className="border border-black p-1 text-center">{i + 1}</td>
                                <td className="border border-black p-1 font-bold whitespace-nowrap">{s.name}</td>
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
            <div className="mt-6 flex justify-between px-10 font-bold text-xs"><p>توقيع المعلم: ....................</p><p>يعتمد مدير المدرسة: ....................</p></div>
        </div>
    );
};

// ب. قالب الشهادات (تم الإصلاح: تصميم متجاوب مع حماية ضد الانهيار)
const CertificatesTemplate = ({ students, settings, teacherInfo }: any) => {
    // 1. ضمان وجود الإعدادات لتجنب الشاشة البيضاء
    const safeSettings = settings || DEFAULT_CERT_SETTINGS;
    const title = safeSettings.title || 'شهادة شكر وتقدير';
    const rawBody = safeSettings.bodyText || 'يسرنا تكريم الطالب...';
    const hasImage = !!safeSettings.backgroundImage;

    // 2. تصميم الحاوية الرئيسية لتملأ ورقة A4 Landscape بالكامل
    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '210mm', // ارتفاع A4 Landscape
        position: 'relative',
        backgroundColor: '#ffffff',
        color: '#000000',
        pageBreakAfter: 'always',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        // التعامل مع الخلفية
        ...(hasImage ? { 
            backgroundImage: `url('${safeSettings.backgroundImage}')`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat'
        } : { 
            border: '10px double #047857' 
        })
    };

    if (!students || students.length === 0) return <div className="p-10 text-center text-black">لا يوجد طلاب</div>;

    return (
        <div className="w-full text-black bg-white">
            {students.map((s: any) => {
                // استبدال النص بأمان
                const safeName = `<span style="color:#b91c1c; font-weight:900; margin:0 5px;">${s.name}</span>`;
                const processedBody = rawBody.replace(/(الطالبة|الطالب)/g, ` ${safeName} `);

                return (
                    <div key={s.id} style={containerStyle}>
                        {/* طبقة داخلية لضمان قراءة النص إذا كانت الخلفية صورة */}
                        <div style={{
                            width: hasImage ? '92%' : '100%', 
                            height: hasImage ? '90%' : '100%', 
                            backgroundColor: hasImage ? 'rgba(255,255,255,0.92)' : 'transparent',
                            borderRadius: '25px',
                            padding: '30px',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            textAlign: 'center',
                            border: hasImage ? '1px solid rgba(0,0,0,0.1)' : 'none'
                        }}>
                            {/* ترويسة الشهادة */}
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', width:'100%'}}>
                                <div style={{textAlign:'right'}}>
                                    <p style={{margin:0, fontWeight:'bold', fontSize:'14px'}}>سلطنة عمان</p>
                                    <p style={{margin:0, fontWeight:'bold', fontSize:'14px'}}>وزارة التربية والتعليم</p>
                                </div>
                                <div>
                                    {teacherInfo?.ministryLogo && <img src={teacherInfo.ministryLogo} style={{height:'60px', objectFit:'contain'}} alt="Logo" />}
                                </div>
                                <div style={{textAlign:'left'}}>
                                    <p style={{margin:0, fontWeight:'bold', fontSize:'14px'}}>مدرسة {teacherInfo?.school || '................'}</p>
                                </div>
                            </div>

                            {/* محتوى الشهادة */}
                            <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                                <h1 style={{fontSize:'52px', fontWeight:'900', color:'#047857', marginBottom:'30px', fontFamily:'Tajawal', textShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>{title}</h1>
                                <div style={{fontSize:'24px', lineHeight:'1.8', fontWeight:'bold', color:'#1f2937', maxWidth:'90%'}} dangerouslySetInnerHTML={{ __html: processedBody }} />
                            </div>

                            {/* التذييل والتواقيع */}
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'20px', width:'100%'}}>
                                <div style={{textAlign:'center', width:'30%'}}>
                                    <p style={{fontWeight:'bold', fontSize:'18px', marginBottom:'40px', color:'#000'}}>معلم المادة</p>
                                    <p style={{fontWeight:'900', fontSize:'20px', color:'#000'}}>{teacherInfo?.name}</p>
                                </div>
                                <div style={{textAlign:'center', width:'40%'}}>
                                    {teacherInfo?.stamp && <img src={teacherInfo.stamp} style={{width:'120px', opacity:0.8, mixBlendMode:'multiply', transform:'rotate(-8deg)'}} alt="Stamp" />}
                                </div>
                                <div style={{textAlign:'center', width:'30%'}}>
                                    <p style={{fontWeight:'bold', fontSize:'18px', marginBottom:'40px', color:'#000'}}>مدير المدرسة</p>
                                    <p style={{fontWeight:'900', fontSize:'20px', color:'#000'}}>....................</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ج. قالب الاستدعاء (لم يمس)
const SummonTemplate = ({ student, teacherInfo, data }: any) => {
    if (!student) return <div className="p-10 text-center">خطأ: بيانات الطالب غير متوفرة</div>;

    return (
        <div className="w-full text-black bg-white p-10 font-serif text-right h-full" dir="rtl">
             <div className="text-center mb-10 border-b border-black pb-4">
                {teacherInfo?.ministryLogo && <img src={teacherInfo.ministryLogo} className="h-16 mx-auto mb-2 object-contain" />}
                <h3 className="font-bold text-sm">سلطنة عمان - وزارة التربية والتعليم</h3>
                <h3 className="font-bold text-sm">مدرسة {teacherInfo?.school}</h3>
            </div>
            <div className="flex justify-between items-end mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div><span className="font-bold text-lg">الفاضل/ ولي أمر الطالب: {student.name}</span> <span className="text-lg mr-2">المحترم</span></div>
                <div className="text-left font-bold text-sm"><p>الصف: {data.className}</p><p>التاريخ: {data.issueDate}</p></div>
            </div>
            <h2 className="text-center text-3xl font-black underline mb-10">استدعاء ولي أمر</h2>
            <p className="text-xl leading-loose text-justify mb-8">
                السلام عليكم ورحمة الله وبركاته،،،<br/>
                نود إفادتكم بضرورة الحضور إلى المدرسة يوم <strong>{data.date}</strong> الساعة <strong>{data.time}</strong>، وذلك لمناقشة الأمر التالي:
            </p>
            <div className="bg-gray-100 border-2 border-black p-5 text-center text-xl font-bold rounded-xl mb-8 shadow-sm">{data.reason}</div>
            {data.procedures && data.procedures.length > 0 && (
                <div className="mb-10 border border-dashed border-black p-5 rounded-xl bg-slate-50">
                    <p className="font-bold underline mb-3 text-lg">الإجراءات المتخذة مسبقاً:</p>
                    <ul className="list-disc pr-6 text-base space-y-1">{data.procedures.map((p:any) => <li key={p}>{p}</li>)}</ul>
                </div>
            )}
            <p className="text-lg leading-loose mt-8 mb-12 text-center font-bold">شاكرين لكم حسن تعاونكم واهتمامكم بمصلحة الطالب.</p>
            <div className="flex justify-between items-end px-12 mt-auto">
                <div className="text-center"><p className="font-bold text-lg mb-6">معلم المادة</p><p className="text-xl">{teacherInfo?.name}</p></div>
                <div className="text-center">{teacherInfo?.stamp && <img src={teacherInfo.stamp} className="w-32 opacity-80 mix-blend-multiply" />}</div>
                <div className="text-center"><p className="font-bold text-lg mb-6">مدير المدرسة</p><p className="text-xl">....................</p></div>
            </div>
        </div>
    );
};

// د. قالب تقارير الصف كاملاً (لم يمس)
const ClassReportsTemplate = ({ students, teacherInfo, semester, assessmentTools }: any) => {
    if (!students || students.length === 0) return <div className="text-black text-center p-10">لا توجد بيانات طلاب لعرضها</div>;

    const finalExamName = "الامتحان النهائي";
    const continuousTools = assessmentTools ? assessmentTools.filter((t: any) => t.name.trim() !== finalExamName) : [];
    const finalTool = assessmentTools ? assessmentTools.find((t: any) => t.name.trim() === finalExamName) : null;

    return (
        <div className="w-full text-black bg-white">
            {students.map((student: any) => {
                const behaviors = (student.behaviors || []).filter((b: any) => !b.semester || b.semester === (semester || '1'));
                const grades = (student.grades || []).filter((g: any) => !g.semester || g.semester === (semester || '1'));
                
                let continuousSum = 0;
                continuousTools.forEach((tool: any) => {
                    const g = grades.find((r: any) => r.category.trim() === tool.name.trim());
                    if (g) continuousSum += (Number(g.score) || 0);
                });
                let finalScore = 0;
                if (finalTool) {
                    const g = grades.find((r: any) => r.category.trim() === finalTool.name.trim());
                    if (g) finalScore = (Number(g.score) || 0);
                }
                const totalScore = continuousSum + finalScore;
                
                const absenceCount = (student.attendance || []).filter((a: any) => a.status === 'absent').length;
                const truantCount = (student.attendance || []).filter((a: any) => a.status === 'truant').length;
                const totalPositive = behaviors.filter((b: any) => b.type === 'positive').reduce((acc: number, b: any) => acc + b.points, 0);
                const totalNegative = behaviors.filter((b: any) => b.type === 'negative').reduce((acc: number, b: any) => acc + Math.abs(b.points), 0);

                return (
                    <div key={student.id} className="w-full min-h-[297mm] p-10 border-b border-gray-300 page-break-after-always box-border relative text-black bg-white" 
                         style={{ backgroundColor: '#ffffff', color: '#000000', pageBreakAfter: 'always' }}>
                        
                        <div className="flex justify-between items-start mb-6 border-b-2 border-slate-200 pb-4">
                            <div className="text-center w-1/3 font-bold text-xs text-black"><p>سلطنة عمان</p><p>وزارة التربية والتعليم</p><p>مدرسة {teacherInfo?.school}</p></div>
                            <div className="text-center w-1/3">
                                {teacherInfo?.ministryLogo && <img src={teacherInfo.ministryLogo} className="h-16 object-contain mx-auto" />}
                                <h2 className="text-lg font-black underline mt-2 text-black">تقرير مستوى طالب</h2>
                            </div>
                            <div className="text-left w-1/3 text-xs font-bold text-black"><p>العام: {teacherInfo?.academicYear}</p><p>الفصل: {semester === '1' ? 'الأول' : 'الثاني'}</p></div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex justify-between items-center text-black">
                            <div><h3 className="text-xl font-black">{student.name}</h3><p className="text-sm text-slate-600">الصف: {student.classes[0]}</p></div>
                            <div className="flex gap-2 text-xs font-bold">
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">إيجابي: {totalPositive}</span>
                                <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded">سلبي: {totalNegative}</span>
                            </div>
                        </div>

                        <h3 className="font-bold mb-2 border-b border-black inline-block text-black">التحصيل الدراسي</h3>
                        <table className="w-full border-collapse border border-black text-xs mb-6 text-black">
                            <thead>
                                <tr className="bg-gray-100 text-black">
                                    <th className="border border-black p-2">المادة</th><th className="border border-black p-2">الأداة</th><th className="border border-black p-2">الدرجة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {continuousTools.map((t: any) => {
                                    const g = grades.find((r: any) => r.category.trim() === t.name.trim());
                                    return <tr key={t.id}><td className="border border-black p-2 text-right">{teacherInfo?.subject}</td><td className="border border-black p-2 text-center">{t.name}</td><td className="border border-black p-2 text-center font-bold">{g ? g.score : '-'}</td></tr>
                                })}
                                {finalTool && (() => {
                                    const g = grades.find((r: any) => r.category.trim() === finalTool.name.trim());
                                    return <tr><td className="border border-black p-2 text-right">{teacherInfo?.subject}</td><td className="border border-black p-2 text-center bg-pink-50">{finalTool.name}</td><td className="border border-black p-2 text-center font-bold">{g ? g.score : '-'}</td></tr>
                                })()}
                                <tr className="bg-slate-200 font-bold text-black"><td colSpan={2} className="border border-black p-2 text-right">المجموع الكلي</td><td className="border border-black p-2 text-center text-sm">{totalScore}</td></tr>
                            </tbody>
                        </table>

                        <div className="flex gap-4 mb-6 text-center text-black">
                            <div className="flex-1 border border-slate-300 p-2 rounded"><p className="text-xs text-slate-500">الغياب</p><p className="font-black text-rose-600">{absenceCount}</p></div>
                            <div className="flex-1 border border-slate-300 p-2 rounded"><p className="text-xs text-slate-500">التسرب</p><p className="font-black text-purple-600">{truantCount}</p></div>
                        </div>

                        <div className="flex justify-between items-end mt-10 px-8 text-black">
                            <div className="text-center"><p className="font-bold text-sm mb-6 text-black">معلم المادة</p><p className="font-bold">{teacherInfo?.name}</p></div>
                            <div className="text-center">{teacherInfo?.stamp && <img src={teacherInfo.stamp} className="w-20 opacity-80 mix-blend-multiply" />}</div>
                            <div className="text-center"><p className="font-bold text-sm mb-6 text-black">مدير المدرسة</p><p>................</p></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- المكون الرئيسي ---
const Reports: React.FC = () => {
  const { students, setStudents, classes, teacherInfo, currentSemester, assessmentTools, certificateSettings, setCertificateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'student_report' | 'grades_record' | 'certificates' | 'summon'>('student_report');

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
  
  // 🛑 تهيئة الحالة الافتراضية لمنع الانهيار
  const [tempCertSettings, setTempCertSettings] = useState(certificateSettings || DEFAULT_CERT_SETTINGS);
  
  const [summonGrade, setSummonGrade] = useState<string>('all');
  const [summonClass, setSummonClass] = useState<string>('');
  const [summonStudentId, setSummonStudentId] = useState<string>('');
  const [summonData, setSummonData] = useState({ date: new Date().toISOString().split('T')[0], time: '09:00', reasonType: 'absence', customReason: '', issueDate: new Date().toISOString().split('T')[0] });
  const [takenProcedures, setTakenProcedures] = useState<string[]>([]);

  const [previewData, setPreviewData] = useState<{ isOpen: boolean; title: string; content: React.ReactNode; landscape?: boolean }>({ isOpen: false, title: '', content: null });

  // Helpers
  const availableGrades = useMemo(() => {
      const grades = new Set<string>();
      students.forEach(s => {
          if (s.grade) grades.add(s.grade); else if (s.classes[0]) { const match = s.classes[0].match(/^(\d+)/); if (match) grades.add(match[1]); }
      });
      if (grades.size === 0 && classes.length > 0) return ['عام']; return Array.from(grades).sort();
  }, [students, classes]);

  const getClassesForGrade = (grade: string) => grade === 'all' ? classes : classes.filter(c => c.startsWith(grade));
  const filteredStudentsForStudentTab = useMemo(() => students.filter(s => s.classes.includes(stClass)), [students, stClass]);
  const filteredStudentsForGrades = useMemo(() => students.filter(s => gradesClass === 'all' || s.classes.includes(gradesClass)), [students, gradesClass]);
  const filteredStudentsForCert = useMemo(() => students.filter(s => s.classes.includes(certClass)), [students, certClass]);
  const availableStudentsForSummon = useMemo(() => students.filter(s => s.classes.includes(summonClass)), [summonClass, students]);

  useEffect(() => { if(getClassesForGrade(stGrade).length > 0) setStClass(getClassesForGrade(stGrade)[0]); }, [stGrade]);
  useEffect(() => { if(getClassesForGrade(certGrade).length > 0) setCertClass(getClassesForGrade(certGrade)[0]); }, [certGrade]);
  useEffect(() => { if(getClassesForGrade(summonGrade).length > 0) setSummonClass(getClassesForGrade(summonGrade)[0]); }, [summonGrade]);

  // تحديث الإعدادات عند التغيير لمنع التعارض
  useEffect(() => { if (certificateSettings) setTempCertSettings(certificateSettings); }, [certificateSettings]);

  const handleUpdateStudent = (updatedStudent: Student) => { setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)); setViewingStudent(updatedStudent); };

  const getReasonText = () => {
    switch (summonData.reasonType) {
        case 'absence': return 'تكرار الغياب عن المدرسة وتأثيره على المستوى الدراسي';
        case 'truant': return 'التسرب المتكرر من الحصص الدراسية';
        case 'behavior': return 'مناقشة بعض السلوكيات الصادرة من الطالب';
        case 'level': return 'مناقشة تدني المستوى التحصيلي للطالب';
        case 'other': return summonData.customReason || '................................'; 
        default: return '';
    }
  };

  const availableProceduresList = ['تنبيه شفوي', 'تعهد خطي', 'اتصال هاتفي', 'إشعار واتساب', 'تحويل أخصائي'];
  const toggleProcedure = (proc: string) => setTakenProcedures(prev => prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]);

  // --- دوال فتح المعاينة ---
  const openGradesPreview = () => {
    if (filteredStudentsForGrades.length === 0) return alert('لا يوجد طلاب');
    const finalExamName = "الامتحان النهائي";
    const continuousTools = assessmentTools.filter(t => t.name.trim() !== finalExamName);
    const finalTool = assessmentTools.find(t => t.name.trim() === finalExamName);
    setPreviewData({ isOpen: true, title: 'سجل الدرجات', landscape: true, content: <GradesTemplate students={filteredStudentsForGrades} tools={continuousTools} finalTool={finalTool} teacherInfo={teacherInfo} semester={currentSemester} gradeClass={gradesClass === 'all' ? 'الكل' : gradesClass} /> });
  };

  const openCertificatesPreview = () => {
    const targets = filteredStudentsForCert.filter(s => selectedCertStudents.includes(s.id));
    if (targets.length === 0) return;
    setPreviewData({ 
        isOpen: true, 
        title: 'شهادات التقدير', 
        landscape: true, 
        // تمرير إعدادات آمنة
        content: <CertificatesTemplate students={targets} settings={certificateSettings || DEFAULT_CERT_SETTINGS} teacherInfo={teacherInfo} /> 
    });
  };

  const openSummonPreview = () => {
    const s = availableStudentsForSummon.find(st => st.id === summonStudentId);
    if (!s) return alert('اختر طالباً');
    setPreviewData({ isOpen: true, title: `استدعاء - ${s.name}`, landscape: false, content: <SummonTemplate student={s} teacherInfo={teacherInfo} data={{...summonData, reason: getReasonText(), className: summonClass, procedures: takenProcedures, issueDate: summonData.issueDate}} /> });
  };

  const openClassReportsPreview = () => {
      if (filteredStudentsForStudentTab.length === 0) return alert('لا يوجد طلاب في هذا الفصل');
      setPreviewData({ 
          isOpen: true, 
          title: `تقارير الصف ${stClass}`, 
          landscape: false, 
          content: <ClassReportsTemplate students={filteredStudentsForStudentTab} teacherInfo={teacherInfo} semester={currentSemester} assessmentTools={assessmentTools} /> 
      });
  };

  const selectAllCertStudents = () => {
      if (selectedCertStudents.length === filteredStudentsForCert.length) {
          setSelectedCertStudents([]);
      } else {
          setSelectedCertStudents(filteredStudentsForCert.map(s => s.id));
      }
  };

  const toggleCertStudent = (id: string) => {
      setSelectedCertStudents(prev => 
          prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
      );
  };

  const handleSendSummonWhatsApp = async () => {
    const student = availableStudentsForSummon.find(s => s.id === summonStudentId);
    if (!student || !student.parentPhone) return alert('لا يوجد رقم هاتف مسجل لولي الأمر');
    let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 5) return alert('رقم الهاتف غير صحيح');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
    else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);
    const msg = encodeURIComponent(`السلام عليكم، ولي أمر الطالب ${student.name}.\nنود إفادتكم بضرورة الحضور للمدرسة يوم ${summonData.date} الساعة ${summonData.time}.\nالسبب: ${getReasonText()}`);
    if (window.electron) window.electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
    else {
        const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
        try { if (Capacitor.isNativePlatform()) await Browser.open({ url: universalUrl }); else window.open(universalUrl, '_blank'); } catch (e) { window.open(universalUrl, '_blank'); }
    }
  };

  if (viewingStudent) return <StudentReport student={viewingStudent} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} onBack={() => setViewingStudent(null)} />;

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-6 pb-20">
      <PrintPreviewModal isOpen={previewData.isOpen} onClose={() => setPreviewData({...previewData, isOpen: false})} title={previewData.title} content={previewData.content} landscape={previewData.landscape} />
      
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
                 <div className="pb-4 border-b border-slate-100 flex items-center gap-3"><div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><User size={20}/></div><div><h3 className="font-black text-lg text-slate-800">تقرير الطالب الشامل</h3></div></div>
                 <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">{availableGrades.map(g => <button key={g} onClick={() => setStGrade(g)} className={`px-4 py-1.5 text-xs font-bold rounded-xl border ${stGrade === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>صف {g}</button>)}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <select value={stClass} onChange={(e) => setStClass(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">{getClassesForGrade(stGrade).map(c => <option key={c} value={c}>{c}</option>)}</select>
                        <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700"><option value="">اختر طالباً...</option>{filteredStudentsForStudentTab.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    </div>
                 </div>
                 <div className="flex gap-4 justify-end pt-6 border-t border-slate-100 mt-4">
                     <button onClick={openClassReportsPreview} disabled={!stClass} className="bg-slate-800 text-white px-6 py-4 rounded-2xl font-black text-xs shadow-lg hover:bg-slate-700 flex items-center gap-2"><Layers size={16} /> طباعة تقارير الفصل كاملاً</button>
                     <button onClick={() => { if(selectedStudentId) { const s = students.find(st=>st.id===selectedStudentId); if(s) setViewingStudent(s); }}} disabled={!selectedStudentId} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-700 flex items-center gap-2"><FileText size={16} /> معاينة فردية</button>
                 </div>
            </div>
        )}
        {activeTab === 'grades_record' && (
            <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100 flex items-center gap-3"><h3 className="font-black text-lg text-slate-800">سجل الدرجات</h3></div>
                <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">{availableGrades.map(g => <button key={g} onClick={() => { setGradesGrade(g); setGradesClass('all'); }} className={`px-4 py-1.5 text-xs font-bold rounded-xl border ${gradesGrade === g ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>صف {g}</button>)}</div>
                    <select value={gradesClass} onChange={(e) => setGradesClass(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700"><option value="all">الكل</option>{getClassesForGrade(gradesGrade).map(c => <option key={c} value={c}>{c}</option>)}</select>
                </div>
                <div className="flex justify-end pt-6"><button onClick={openGradesPreview} className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-amber-600"><Printer size={18} /> معاينة وطباعة السجل</button></div>
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
                    <div className="flex justify-between px-2"><label className="text-xs font-bold text-slate-500">الطلاب ({selectedCertStudents.length})</label><button onClick={selectAllCertStudents} className="text-xs font-bold text-emerald-600">تحديد الكل</button></div>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {filteredStudentsForCert.map(s => (<button key={s.id} onClick={() => toggleCertStudent(s.id)} className={`p-3 rounded-xl border text-xs font-bold flex justify-between ${selectedCertStudents.includes(s.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-600'}`}>{s.name} {selectedCertStudents.includes(s.id) && <Check size={14}/>}</button>))}
                    </div>
                </div>
                <div className="flex justify-end pt-6"><button onClick={openCertificatesPreview} disabled={selectedCertStudents.length === 0} className="bg-emerald-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-emerald-700"><Printer size={18} /> معاينة وطباعة الشهادات</button></div>
            </div>
        )}
        {activeTab === 'summon' && (
            <div className="space-y-6">
                <div className="pb-4 border-b border-slate-100 flex items-center gap-3"><div className="p-2 bg-rose-50 rounded-xl text-rose-600"><FileWarning size={20}/></div><h3 className="font-black text-lg text-slate-800">استدعاء ولي أمر</h3></div>
                <div className="grid grid-cols-2 gap-4">
                     <select value={summonClass} onChange={(e) => setSummonClass(e.target.value)} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700">{getClassesForGrade(summonGrade).map(c => <option key={c} value={c}>{c}</option>)}</select>
                     <select value={summonStudentId} onChange={(e) => setSummonStudentId(e.target.value)} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700"><option value="">الطالب...</option>{availableStudentsForSummon.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                </div>
                <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">{[{ id: 'absence', label: 'غياب' }, { id: 'truant', label: 'تسرب' }, { id: 'behavior', label: 'سلوك' }, { id: 'level', label: 'مستوى' }, { id: 'other', label: 'أخرى (اكتب السبب)' }].map((r) => (<button key={r.id} onClick={() => setSummonData({...summonData, reasonType: r.id})} className={`px-4 py-2 rounded-xl text-xs font-bold border ${summonData.reasonType === r.id ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-600'}`}>{r.label}</button>))}</div>
                    {summonData.reasonType === 'other' && (<textarea value={summonData.customReason} onChange={(e) => setSummonData({...summonData, customReason: e.target.value})} placeholder="اكتب سبب الاستدعاء هنا..." className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl font-bold text-slate-800 mt-2 h-24 resize-none outline-none focus:border-rose-500 transition-colors animate-in fade-in"/>)}
                </div>
                <div className="grid grid-cols-2 gap-2">{availableProceduresList.map(p => <button key={p} onClick={() => toggleProcedure(p)} className={`p-2 rounded-lg text-xs font-bold border ${takenProcedures.includes(p) ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>{p}</button>)}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500">تاريخ الإصدار</label><input type="date" value={summonData.issueDate} onChange={(e) => setSummonData({...summonData, issueDate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" /></div>
                     <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500">تاريخ الحضور</label><input type="date" value={summonData.date} onChange={(e) => setSummonData({...summonData, date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" /></div>
                     <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500">الوقت</label><input type="time" value={summonData.time} onChange={(e) => setSummonData({...summonData, time: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" /></div>
                </div>
                <div className="flex justify-end pt-6"><button onClick={openSummonPreview} disabled={!summonStudentId} className="bg-rose-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-rose-700"><Eye size={18} /> معاينة الخطاب</button></div>
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
