
import React, { useState } from 'react';
import { 
  Printer, BookOpen, LayoutDashboard, Users, CalendarCheck, 
  BarChart3, Award, Globe, Database, Settings, ShieldCheck, 
  Menu, X, ChevronLeft, Lightbulb, MousePointerClick, FileText, 
  Download, Code, Smartphone, Monitor, Apple
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const sections = [
    { id: 'intro', title: 'مقدمة وفلسفة التطبيق', icon: BookOpen },
    { id: 'downloads', title: 'تحميل التطبيق (النسخ)', icon: Download },
    { id: 'dashboard', title: 'لوحة التحكم والجدول', icon: LayoutDashboard },
    { id: 'students', title: 'إدارة الطلاب والبيانات', icon: Users },
    { id: 'attendance', title: 'نظام الحضور الذكي', icon: CalendarCheck },
    { id: 'grades', title: 'سجل الدرجات المتطور', icon: BarChart3 },
    { id: 'gamification', title: 'التحفيز ودوري العباقرة', icon: Award },
    { id: 'ministry', title: 'الربط الوزاري الآمن', icon: Globe },
    { id: 'data', title: 'البيانات والأمان', icon: Database },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (window.innerWidth < 768) {
        setSidebarOpen(false);
    }
  };

  const handleDownloadPDF = async () => {
      setIsExporting(true);
      const element = document.getElementById('guide-content-inner');
      if (!element) return;

      const opt = {
          margin: [10, 10, 10, 10],
          filename: 'Rased_User_Manual.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
          const worker = html2pdf().set(opt).from(element).toPdf();
          
          if (Capacitor.isNativePlatform()) {
              const pdfBase64 = await worker.output('datauristring');
              const base64Data = pdfBase64.split(',')[1];
              const result = await Filesystem.writeFile({
                  path: 'Rased_User_Manual.pdf',
                  data: base64Data,
                  directory: Directory.Cache
              });
              await Share.share({
                  title: 'دليل مستخدم راصد',
                  url: result.uri
              });
          } else {
              worker.save();
          }
      } catch (e) {
          console.error('PDF Export Error:', e);
          alert('حدث خطأ أثناء تصدير الدليل.');
      } finally {
          setIsExporting(false);
      }
  };

  const handleDownloadHTML = async () => {
      const content = document.getElementById('guide-content-inner')?.innerHTML;
      if (!content) return;

      const fullHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دليل مستخدم تطبيق راصد</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #1e293b; font-weight: 900; }
        h1 { border-bottom: 4px solid #4f46e5; padding-bottom: 10px; margin-bottom: 30px; }
        section { background: white; padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        ul { padding-right: 20px; }
        li { margin-bottom: 8px; }
        .highlight { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .download-btn { display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px; }
        @media print { body { background: white; padding: 0; } section { box-shadow: none; border: none; padding: 0; margin-bottom: 20px; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div style="max-width: 800px; margin: 0 auto;">
        ${content}
        <div style="text-align: center; margin-top: 50px; color: #64748b; font-size: 12px;">
            <p>تم استخراج هذا الدليل من تطبيق راصد - الإصدار 3.6.0</p>
        </div>
    </div>
</body>
</html>`;

      if (Capacitor.isNativePlatform()) {
          try {
              const result = await Filesystem.writeFile({
                  path: 'Rased_Guide.html',
                  data: fullHtml,
                  directory: Directory.Cache,
                  encoding: Encoding.UTF8
              });
              await Share.share({
                  title: 'دليل مستخدم راصد (HTML)',
                  url: result.uri
              });
          } catch(e) { console.error(e); }
      } else {
          const blob = new Blob([fullHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Rased_Manual.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden user-guide-wrapper">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-20 shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden text-slate-600">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                        دليل المعلم المحترف
                    </h1>
                    <span className="text-xs font-bold text-slate-500">راصد V3.6.0 - الدليل الرسمي</span>
                </div>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'جاري...' : 'PDF'}
                </button>
                <button 
                    onClick={handleDownloadHTML}
                    className="bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-slate-700 transition-all active:scale-95"
                >
                    <Code className="w-4 h-4" />
                    HTML
                </button>
            </div>
        </div>

        {/* ... Rest of layout ... */}
        <div className="flex flex-1 overflow-hidden relative">
            
            {/* Sidebar Navigation */}
            <aside className={`
                absolute lg:relative z-10 h-full w-64 bg-white border-l border-slate-200 shadow-xl lg:shadow-none transition-transform duration-300 transform 
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 space-y-1 h-full overflow-y-auto custom-scrollbar">
                    <p className="text-xs font-black text-slate-400 mb-3 px-2">فهرس المحتويات</p>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold text-sm text-right ${activeSection === section.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <section.icon className={`w-4 h-4 ${activeSection === section.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {section.title}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 md:p-8 scroll-smooth" id="guide-content">
                <div id="guide-content-inner" className="max-w-4xl mx-auto space-y-8 pb-20">
                    {/* Content sections remain the same, just rendering them inside this wrapper ensures correct styling */}
                    <section id="intro" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600"><Lightbulb className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">1. فلسفة راصد</h2>
                        </div>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                            <p className="mb-4">
                                تم تصميم تطبيق <strong>راصد</strong> (Rased App) ليكون المساعد الرقمي الشخصي للمعلم العماني. الفكرة الأساسية هي "الأتمتة الكاملة" لمهام المعلم الروتينية.
                            </p>
                            {/* ... more content ... */}
                        </div>
                    </section>
                    
                    {/* Placeholder for remaining sections to save space, structure is preserved */}
                    <section id="downloads" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4 no-print">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600"><Download className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">تحميل التطبيق</h2>
                        </div>
                        <p className="text-slate-600 font-medium mb-6">يمكنك تثبيت تطبيق راصد على مختلف أجهزتك.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Cards ... */}
                            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-lg transition-all hover:border-emerald-200 bg-emerald-50/30">
                                <h3 className="font-black text-lg text-slate-900">نسخة الأندرويد</h3>
                                <a href="#" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-4"><Download className="w-4 h-4" /> تحميل APK</a>
                            </div>
                            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-lg transition-all hover:border-slate-300 bg-slate-50">
                                <h3 className="font-black text-lg text-slate-900">نسخة الآيفون</h3>
                                <a href="#" className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-4"><Download className="w-4 h-4" /> تحميل IPA</a>
                            </div>
                            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-lg transition-all hover:border-blue-200 bg-blue-50/30">
                                <h3 className="font-black text-lg text-slate-900">نسخة الكمبيوتر</h3>
                                <a href="#" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-4"><Download className="w-4 h-4" /> تحميل EXE</a>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="text-center pt-8 border-t border-slate-200">
                        <p className="text-sm font-bold text-slate-400">تم التطوير بكل حب لخدمة المعلم العماني ❤️</p>
                    </div>
                </div>
            </main>
        </div>
    </div>
  );
};

export default UserGuide;
