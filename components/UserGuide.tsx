
import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Users, 
  Upload, 
  PenTool, 
  Shuffle, 
  LayoutGrid, 
  Printer, 
  ChevronLeft,
  Info,
  Lightbulb
} from 'lucide-react';

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('symbols');

  // دالة الطباعة البسيطة
  const handlePrint = () => {
    window.print();
  };

  const guides = [
    {
      id: 'symbols',
      title: 'دليل الرموز',
      icon: HelpCircle,
      description: 'تعرف على وظيفة كل أيقونة في التطبيق',
      content: (
        <div className="space-y-6">
           <div className="flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-bold text-indigo-400">إدارة الفصل والطلاب</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card bg-[#374151] p-4 rounded-2xl border border-gray-600 flex items-center gap-4 shadow-sm break-inside-avoid">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 shrink-0 border border-green-500/30">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">استيراد</h4>
                    <p className="text-xs text-gray-300 font-bold">رفع ملف Excel لإضافة مجموعة طلاب دفعة واحدة.</p>
                  </div>
              </div>

              <div className="glass-card bg-[#374151] p-4 rounded-2xl border border-gray-600 flex items-center gap-4 shadow-sm break-inside-avoid">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/30">
                    <div className="text-2xl font-light">+</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">إضافة</h4>
                    <p className="text-xs text-gray-300 font-bold">تسجيل طالب جديد أو عنصر جديد يدوياً.</p>
                  </div>
              </div>

              <div className="glass-card bg-[#374151] p-4 rounded-2xl border border-gray-600 flex items-center gap-4 shadow-sm break-inside-avoid">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/30">
                    <PenTool className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">تعديل</h4>
                    <p className="text-xs text-gray-300 font-bold">تغيير بيانات الطالب أو الفصل أو الدرجة.</p>
                  </div>
              </div>

              <div className="glass-card bg-[#374151] p-4 rounded-2xl border border-gray-600 flex items-center gap-4 shadow-sm break-inside-avoid">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/30">
                    <Shuffle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">اختيار عشوائي</h4>
                    <p className="text-xs text-gray-300 font-bold">اختيار طالب عشوائياً للمشاركة مع مؤثرات بصرية.</p>
                  </div>
              </div>

               <div className="glass-card bg-[#374151] p-4 rounded-2xl border border-gray-600 flex items-center gap-4 shadow-sm break-inside-avoid">
                  <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 shrink-0 border border-rose-500/30">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">إدارة الحصص</h4>
                    <p className="text-xs text-gray-300 font-bold">تعديل جدول الحصص وتوقيت الجرس المدرسي.</p>
                  </div>
              </div>
           </div>
        </div>
      )
    },
    {
      id: 'start',
      title: 'كيف أبدأ؟',
      icon: Lightbulb,
      description: 'خطواتك الأولى لاستخدام التطبيق',
      content: (
        <div className="space-y-4">
          <p className="text-gray-200 font-bold leading-relaxed text-lg">
            1. ابدأ بإنشاء الفصول الدراسية الخاصة بك.<br/>
            2. قم بإضافة الطلاب يدوياً أو عبر استيراد ملف إكسل.<br/>
            3. انتقل لسجل الدرجات لإعداد أدوات التقويم.<br/>
            4. استخدم خاصية "الحضور" لرصد الغياب اليومي.<br/>
            5. يمكنك تصدير التقارير في أي وقت عبر زر الطباعة.
          </p>
        </div>
      )
    },
    {
      id: 'about',
      title: 'حول التطبيق',
      icon: Info,
      description: 'معلومات الإصدار والمطور',
      content: (
        <div className="text-center space-y-4">
          <p className="text-white font-bold text-lg">تطبيق راصد - الإصدار 3.6.0 (Glass UI)</p>
          <p className="text-gray-300 font-bold">تم التطوير بواسطة: محمد درويش الزعابي</p>
          <p className="text-gray-300 font-bold">جميع الحقوق محفوظة © 2026</p>
        </div>
      )
    }
  ];

  const activeContent = guides.find(g => g.id === activeSection);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)] animate-in fade-in zoom-in duration-500 text-white">
      
      {/* منطقة المحتوى (التي ستطبع) */}
      <div id="guide-printable-area" className="flex-1 glass-card bg-[#1f2937] p-8 overflow-y-auto custom-scrollbar rounded-3xl relative border border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2">{activeContent?.title}</h2>
          <p className="text-gray-400 font-bold opacity-70">{activeContent?.description}</p>
        </div>
        
        <div className="text-white">
            {activeContent?.content}
        </div>

        {/* تذييل للطباعة فقط */}
        <div className="hidden print:block mt-10 pt-4 border-t border-gray-500 text-center text-xs text-black">
            تمت الطباعة من تطبيق راصد - دليل المستخدم
        </div>
      </div>

      {/* القائمة الجانبية (ستختفي عند الطباعة) */}
      <div id="user-guide-sidebar" className="w-full md:w-80 flex flex-col gap-4 print:hidden">
        <div className="glass-card bg-[#1f2937] p-6 rounded-3xl border border-white/10">
          <h3 className="text-xl font-black text-white mb-1">الدليل الشامل</h3>
          <p className="text-xs text-gray-400 font-bold mb-6 opacity-70">شرح مفصل لكافة الخصائص</p>
          
          <div className="space-y-3">
            {guides.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-300 group ${
                  activeSection === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' 
                    : 'bg-[#374151] border border-gray-600 hover:bg-[#4b5563] text-gray-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  <span className="font-bold text-sm">{item.title}</span>
                </div>
                {activeSection === item.id && <ChevronLeft className="w-5 h-5" />}
              </button>
            ))}
          </div>
        </div>

        {/* زر الطباعة */}
        <button 
          onClick={handlePrint}
          className="glass-card bg-[#374151] p-5 rounded-3xl flex items-center justify-center gap-3 text-white hover:bg-[#4b5563] transition-all font-black group mt-auto border border-white/10"
        >
          <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>طباعة الدليل</span>
        </button>
      </div>

    </div>
  );
};

export default UserGuide;
