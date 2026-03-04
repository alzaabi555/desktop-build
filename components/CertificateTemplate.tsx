import React, { forwardRef } from 'react';
import { Award, Medal, Star, ShieldCheck } from 'lucide-react';

export interface CertificateProps {
  studentName: string;
  grade: string;
  teacherName: string;
  schoolName?: string;
  subject?: string;
  date?: string;
}

// نستخدم forwardRef لكي نتمكن من التقاط هذا المكون وطباعته لاحقاً
const CertificateTemplate = forwardRef<HTMLDivElement, CertificateProps>(({
  studentName,
  grade,
  teacherName,
  schoolName = "مدرسة الإبداع للتعليم الأساسي (5-8)",
  subject = "الدراسات الاجتماعية",
  date = new Date().toLocaleDateString('ar-EG')
}, ref) => {

  return (
    // الحاوية الرئيسية: حجم A4 بالعرض (Landscape)
    // استخدمنا خاصية [-webkit-print-color-adjust:exact] لضمان طباعة الألوان كما هي على الشاشة
    <div 
      ref={ref}
      className="w-[1122px] h-[793px] bg-white relative p-6 mx-auto overflow-hidden font-sans [-webkit-print-color-adjust:exact] print:shadow-none shadow-2xl"
      dir="rtl"
    >
      {/* الإطار الخارجي الذهبي المزدوج */}
      <div className="w-full h-full border-[12px] border-double border-amber-400 p-2 relative z-10">
        
        {/* الإطار الداخلي الكحلي الملكي مع خلفية ورقية ناعمة */}
        <div className="w-full h-full border-4 border-[#1e3a8a] bg-[#faf9f6] p-10 relative flex flex-col items-center justify-between overflow-hidden">
          
          {/* 🌟 العلامة المائية الشفافة في الخلفية (شعار راصد الذهبي) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="w-[600px] h-[600px] text-amber-900" />
          </div>

          {/* ================= الترويسة (Header) ================= */}
          <div className="w-full flex justify-between items-start relative z-10">
            {/* الجهة اليمنى: بيانات الوزارة */}
            <div className="text-center space-y-1">
              <h3 className="font-black text-[18px] text-[#1e3a8a]">سلطنة عُمان</h3>
              <h3 className="font-bold text-[16px] text-[#1e3a8a]">وزارة التربية والتعليم</h3>
              <h3 className="font-bold text-[16px] text-[#1e3a8a]">المديرية العامة للتربية والتعليم</h3>
              <h3 className="font-bold text-[16px] text-amber-600">{schoolName}</h3>
            </div>

            {/* المنتصف: الشعار الفيكتور (بديل الصور المبكسلة) */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-amber-400 bg-white flex items-center justify-center shadow-lg relative">
                <div className="absolute inset-2 border-2 border-dashed border-[#1e3a8a] rounded-full"></div>
                <ShieldCheck className="w-12 h-12 text-[#1e3a8a]" />
              </div>
            </div>

            {/* الجهة اليسرى: بيانات الإصدار */}
            <div className="text-right space-y-2 border-r-2 border-amber-400 pr-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[16px] text-gray-500">التاريخ:</span>
                <span className="font-black text-[18px] text-[#1e3a8a]">{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[16px] text-gray-500">المادة:</span>
                <span className="font-black text-[18px] text-[#1e3a8a]">{subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[16px] text-gray-500">رقم الإصدار:</span>
                <span className="font-black text-[16px] text-[#1e3a8a] tracking-widest">RS-{Math.floor(Math.random() * 9000) + 1000}</span>
              </div>
            </div>
          </div>

          {/* ================= المحتوى الرئيسي (Body) ================= */}
          <div className="flex-1 flex flex-col items-center justify-center text-center w-full z-10 mt-4">
            
            <div className="flex items-center gap-4 mb-4">
              <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
              <h1 className="text-6xl font-black text-[#1e3a8a] tracking-tight" style={{ fontFamily: 'Tajawal, sans-serif' }}>شهادة تميز وتقدير</h1>
              <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>

            <div className="bg-amber-400 text-[#1e3a8a] px-8 py-2 rounded-full font-black text-2xl mb-10 shadow-md">
              لفرسان الشهر الأبطال
            </div>

            <p className="text-2xl font-bold text-gray-700 mb-6">
              بكل فخر واعتزاز، يسر إدارة المدرسة ومعلم المادة أن يتوجوا الطالب الفارس:
            </p>

            {/* اسم الطالب بخط ضخم وبارز */}
            <div className="relative w-3/4 py-6 border-y-2 border-dashed border-amber-300 bg-white/50 backdrop-blur-sm shadow-sm mb-6 rounded-2xl">
              <h2 className="text-6xl font-black text-[#1e3a8a] leading-tight">
                {studentName}
              </h2>
            </div>

            <p className="text-2xl font-bold text-gray-700 leading-relaxed max-w-4xl">
              المقيد بالصف <span className="text-amber-600 font-black text-3xl mx-2">({grade})</span>، 
              وذلك لتميزه العلمي، وتفوقه السلوكي، واعتلائه صدارة فرسان هذا الشهر. 
              متمنين له دوام التألق والنجاح في مسيرته العلمية.
            </p>
          </div>

          {/* ================= التذييل والأختام (Footer) ================= */}
          <div className="w-full flex justify-between items-end relative z-10 pt-8 mt-auto">
            
            {/* توقيع المعلم */}
            <div className="text-center w-64">
              <h4 className="font-bold text-xl text-gray-500 mb-4">معلم المادة</h4>
              <div className="border-b-2 border-gray-400 mx-8 mb-2"></div>
              <h3 className="font-black text-2xl text-[#1e3a8a]">أ. {teacherName}</h3>
            </div>

            {/* 🔴 الختم الاعتمادي (مبني بالكود CSS بدون صور) */}
            <div className="flex flex-col items-center justify-center -translate-y-4">
              <div className="w-32 h-32 rounded-full border-[6px] border-red-600 flex items-center justify-center relative opacity-80 rotate-[-15deg] mix-blend-multiply">
                <div className="absolute inset-1 border-2 border-dashed border-red-500 rounded-full"></div>
                <div className="text-center">
                  <Medal className="w-10 h-10 text-red-600 mx-auto mb-1" />
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">معتمد رسمياً</p>
                  <p className="text-[14px] font-black text-red-600">تطبيق راصد</p>
                </div>
              </div>
            </div>

            {/* توقيع الإدارة */}
            <div className="text-center w-64">
              <h4 className="font-bold text-xl text-gray-500 mb-4">يعتمد،،، مدير المدرسة</h4>
              <div className="border-b-2 border-gray-400 mx-8 mb-2"></div>
              <h3 className="font-black text-2xl text-gray-400 italic">..........................</h3>
            </div>

          </div>

          {/* زينة الزوايا (Corner Ornaments) */}
          <div className="absolute top-2 right-2 w-16 h-16 border-t-4 border-r-4 border-amber-400"></div>
          <div className="absolute top-2 left-2 w-16 h-16 border-t-4 border-l-4 border-amber-400"></div>
          <div className="absolute bottom-2 right-2 w-16 h-16 border-b-4 border-r-4 border-amber-400"></div>
          <div className="absolute bottom-2 left-2 w-16 h-16 border-b-4 border-l-4 border-amber-400"></div>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
