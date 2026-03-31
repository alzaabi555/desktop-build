import React, { useEffect } from 'react';

// =========================================================================
// 🔮 الثيم الزجاجي الداكن (Royal Purple & Gold Glass Theme)
// =========================================================================

const RamadanTheme: React.FC = () => {
  // تم إزالة شروط التاريخ، هذا الثيم سيعمل دائماً لدعم التصميم الزجاجي الفاخر

  // تغيير لون شريط هاتف المستخدم (أو المتصفح) ليتناسب مع الثيم البنفسجي الداكن
  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#1e1b4b"); 
    document.body.style.backgroundColor = "#1e1b4b";

    // تنظيف في حال تم إلغاء المكون
    return () => {
      document.body.style.backgroundColor = "#f3f4f6";
    };
  }, []);

  return (
    <>
      <style>
        {`
          /* 🌟 تفتيح خلفية التطبيق بالكامل لتكون مشرقّة (تدرج لوني فخم بدل اللون الكئيب الموحد) */
          body, #root {
              background: linear-gradient(135deg, #1e1b4b 0%, #3b0764 50%, #0f172a 100%) !important;
              background-attachment: fixed !important;
          }

          /* 🌟 توحيد شكل شريط التمرير ليكون مضيئاً */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02) !important; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2) !important; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(251, 191, 36, 0.8) !important; }

          /* 🚫 إبادة اللون الأخضر وأي ألوان شاذة في الحاويات والمربعات وتحويلها لزجاج شفاف */
          .bg-green-50, .bg-green-100, .bg-green-200, .bg-emerald-50, .bg-emerald-100 { 
              background-color: rgba(255, 255, 255, 0.05) !important; 
              backdrop-filter: blur(10px) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .border-green-500, .border-green-200, .border-green-400, .border-emerald-500 { 
              border-color: rgba(251, 191, 36, 0.4) !important; /* حدود ذهبية ناعمة بدلاً من الأخضر */
          }
          .text-green-700, .text-green-600, .text-green-500, .text-emerald-600 { 
              color: #fbbf24 !important; /* نص ذهبي مشرق بدلاً من الأخضر */
          }

          /* ✨ تحويل جميع مربعات الإدخال (Inputs & Selects) في كل التطبيق إلى زجاج مشرق */
          input, textarea, select {
              background-color: rgba(255, 255, 255, 0.08) !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              color: white !important;
              border-radius: 1rem !important;
              transition: all 0.3s ease !important;
          }
          input:focus, textarea:focus, select:focus {
              border-color: #fbbf24 !important;
              box-shadow: 0 0 15px rgba(251, 191, 36, 0.25) !important;
              outline: none !important;
              background-color: rgba(255, 255, 255, 0.15) !important;
          }
          input::placeholder, textarea::placeholder {
              color: rgba(255, 255, 255, 0.4) !important; /* لون إرشادي أفتح وأوضح */
          }
        `}
      </style>

      {/* ===================================================== */}
      {/* 🌌 الطبقة الخلفية (z-0) - السماء البنفسجية العميقة والتوهج الذهبي */}
      {/* ===================================================== */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        
        {/* السماء الليلية (بنفسجي ملكي داكن مستوحى من صورتك الرائعة) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1b54] via-[#1a103c] to-[#0f0726]"></div>
        
        {/* تأثيرات الإضاءة (توهج ذهبي في الأعلى وبنفسجي/وردي في الأسفل لإبراز الزجاج) */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

      </div>
    </>
  );
};

export default RamadanTheme;
