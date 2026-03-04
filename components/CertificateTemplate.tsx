import React, { forwardRef } from 'react';
import { Award } from 'lucide-react';

export interface CertificateProps {
  studentName: string;
  grade: string;
  teacherName: string;
  schoolName?: string;
  subject?: string;
  date?: string;
}

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateProps>(({
  studentName,
  grade,
  teacherName,
  schoolName = "مدرسة الابداع للبنين (5-8)",
  subject = "الدراسات الاجتماعية",
  date = new Date().toLocaleDateString('ar-EG')
}, ref) => {

  return (
    <div 
      ref={ref}
      className="w-[1122px] h-[793px] bg-white relative p-6 mx-auto overflow-hidden font-sans [-webkit-print-color-adjust:exact] print:shadow-none shadow-2xl"
      dir="rtl"
    >
      {/* الإطار الخارجي */}
      <div className="w-full h-full border-[12px] border-double border-amber-400 p-2 relative z-10">
        
        {/* الإطار الداخلي */}
        <div className="w-full h-full border-4 border-[#1e3a8a] bg-[#faf9f6] p-10 relative flex flex-col items-center justify-between overflow-hidden">
          
          {/* العلامة المائية الشفافة */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <Award className="w-[600px] h-[600px] text-amber-900" />
          </div>

          {/* ================= الترويسة ================= */}
          <div className="w-full flex justify-between items-start relative z-10">
            {/* بيانات الوزارة */}
            <div className="text-center space-y-1">
              <h3 className="font-black text-[18px] text-[#1e3a8a]">سلطنة عُمان</h3>
              <h3 className="font-bold text-[16px] text-[#1e3a8a]">وزارة التربية والتعليم</h3>
              <h3 className="font-bold text-[16px] text-[#1e3a8a]">المديرية العامة للتربية والتعليم بمحافظة شمال الباطنة</h3>
              <h3 className="font-bold text-[16px] text-amber-600">{schoolName}</h3>
            </div>

            {/* الشعار السلطاني الأصلي (الخنجر والسيفين) */}
            <div className="flex flex-col items-center justify-center">
              {/* تأكد من مسار الصورة الصحيح حسب مجلدك */}
              <img 
                src={require('../assets/pngegg (2).png')} 
                alt="شعار سلطنة عمان" 
                className="w-24 h-24 object-contain"
              />
            </div>

            {/* بيانات الإصدار */}
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

          {/* ================= المحتوى الرئيسي ================= */}
          <div className="flex-1 flex flex-col items-center justify-center text-center w-full z-10 mt-4">
            <h1 className="text-6xl font-black text-[#1e3a8a] tracking-tight mb-2">شهادة تميز</h1>
            <div className="bg-amber-400 text-[#1e3a8a] px-8 py-2 rounded-full font-black text-2xl mb-10 shadow-md">
              لفرسان الشهر الأبطال
            </div>

            <p className="text-2xl font-bold text-gray-700 mb-6">
              يُسعدنا بكل فخر واعتزاز أن نُتوّج الفارس:
            </p>

            {/* اسم الطالب */}
            <div className="relative w-3/4 py-6 border-y-2 border-amber-300 bg-white/50 backdrop-blur-sm shadow-sm mb-6 rounded-2xl">
              <h2 className="text-6xl font-black text-[#1e3a8a] leading-tight">
                {studentName}
              </h2>
            </div>

            <p className="text-2xl font-bold text-gray-700 leading-relaxed max-w-4xl">
              المقيد بالصف <span className="text-amber-600 font-black text-3xl mx-2">({grade})</span>، 
              تقديراً لجهوده العظيمة واعتلاءه صدارة فرسان هذا الشهر. 
              متمنين له دوام التألق والنجاح.
            </p>
          </div>

          {/* ================= التذييل والأختام ================= */}
          <div className="w-full flex justify-between items-end relative z-10 pt-8 mt-auto">
            
            {/* توقيع المعلم */}
            <div className="text-center w-64">
              <h4 className="font-bold text-xl text-[#1e3a8a] mb-4">معلم المادة</h4>
              <div className="border-b-2 border-gray-400 mx-8 mb-2"></div>
              <h3 className="font-black text-xl text-gray-700">{teacherName}</h3>
            </div>

            {/* ختم المدرسة الأصلي */}
            <div className="flex flex-col items-center justify-center -translate-y-4">
              {/* استخدمنا mix-blend-multiply لكي يندمج اللون الأزرق للختم مع خلفية الورقة ويبدو كحبر حقيقي */}
              <img 
                src={require('../assets/School seal.png')} 
                alt="ختم المدرسة" 
                className="w-36 h-36 object-contain opacity-90 mix-blend-multiply"
              />
            </div>

            {/* توقيع الإدارة */}
            <div className="text-center w-64">
              <h4 className="font-bold text-xl text-[#1e3a8a] mb-4">مدير/ة المدرسة</h4>
              <div className="border-b-2 border-gray-400 mx-8 mb-2"></div>
              <h3 className="font-black text-2xl text-gray-400 italic">..........................</h3>
            </div>

          </div>

          {/* زينة الزوايا */}
          <div className="absolute top-2 right-2 w-16 h-16 border-t-4 border-r-4 border-[#1e3a8a]"></div>
          <div className="absolute top-2 left-2 w-16 h-16 border-t-4 border-l-4 border-[#1e3a8a]"></div>
          <div className="absolute bottom-2 right-2 w-16 h-16 border-b-4 border-r-4 border-[#1e3a8a]"></div>
          <div className="absolute bottom-2 left-2 w-16 h-16 border-b-4 border-l-4 border-[#1e3a8a]"></div>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
