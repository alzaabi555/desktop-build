import React, { useEffect } from 'react';

// =========================================================================
// 🔮 الثيم الزجاجي المضيء (Luminous Royal Purple & Gold Glass Theme)
// =========================================================================

const RamadanTheme: React.FC = () => {

  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", "#2e1a65"); 
    document.body.style.backgroundColor = "#2e1a65";

    // 💡 إضافة كلاس للـ body لتسهيل استهداف الأنماط
    document.body.classList.add('ramadan-active');

    return () => {
      document.body.style.backgroundColor = "#f3f4f6";
      document.body.classList.remove('ramadan-active');
    };
  }, []);

  return (
    <>
      <style>
        {`
          /* 🌟 إضاءة شاملة للتطبيق (تدرج لوني مشرق) */
          body.ramadan-active, body.ramadan-active #root {
              background: linear-gradient(135deg, #3b1c7a 0%, #22104c 50%, #130733 100%) !important;
              background-attachment: fixed !important;
          }

          /* 🌟 توحيد شكل شريط التمرير */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02) !important; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3) !important; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(251, 191, 36, 0.8) !important; }

          /* 🚀 السلاح الشامل (المحسن): تجاوز متغيرات Tailwind */
          body.ramadan-active [class*="bg-green-"], 
          body.ramadan-active [class*="bg-emerald-"] { 
              background-color: rgba(255, 255, 255, 0.08) !important; 
              backdrop-filter: blur(12px) !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              /* تجاوز متغيرات Tailwind إذا كانت موجودة */
              --tw-bg-opacity: 1 !important; 
          }
          
          body.ramadan-active [class*="border-green-"], 
          body.ramadan-active [class*="border-emerald-"] { 
              border-color: rgba(251, 191, 36, 0.5) !important; 
              --tw-border-opacity: 1 !important;
          }
          
          body.ramadan-active [class*="text-green-"], 
          body.ramadan-active [class*="text-emerald-"] { 
              color: #fbbf24 !important; 
              --tw-text-opacity: 1 !important;
          }

          body.ramadan-active [class*="ring-green-"],
          body.ramadan-active [class*="ring-emerald-"] {
              --tw-ring-color: rgba(251, 191, 36, 0.5) !important;
          }

          /* ✨ مربعات الإدخال الزجاجية المضيئة */
          body.ramadan-active input, 
          body.ramadan-active textarea, 
          body.ramadan-active select {
              background-color: rgba(255, 255, 255, 0.12) !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
              color: white !important;
              border-radius: 1rem !important;
              transition: all 0.3s ease !important;
          }
          
          body.ramadan-active input:focus, 
          body.ramadan-active textarea:focus, 
          body.ramadan-active select:focus {
              border-color: #fbbf24 !important;
              box-shadow: 0 0 20px rgba(251, 191, 36, 0.3) !important;
              outline: none !important;
              background-color: rgba(255, 255, 255, 0.2) !important;
              /* إجبار لون الـ Ring في Tailwind */
              --tw-ring-color: #fbbf24 !important; 
              --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color) !important;
          }
          
          body.ramadan-active input::placeholder, 
          body.ramadan-active textarea::placeholder {
              color: rgba(255, 255, 255, 0.6) !important;
          }
          
          /* 🔮 إجبار النوافذ المنزلقة (DrawerSheet) على الشفافية المشرقة (Glassmorphism) */
          body.ramadan-active .z-\\[99999\\] {
              background-color: rgba(30, 27, 75, 0.4) !important;
              backdrop-filter: blur(24px) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              box-shadow: 0 0 60px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.05) !important;
          }
        `}
      </style>

      {/* ===================================================== */}
      {/* 🌌 الطبقة الخلفية - تم تفتيحها وإضافة مصابيح إضاءة */}
      {/* ===================================================== */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
        
        {/* سماء مضيئة (استبدال الألوان القاتمة بألوان بنفسجية حيوية وشفافة) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b1c7a] via-[#22104c] to-[#130733] opacity-70"></div>
        
        {/* تأثيرات الإضاءة (توهج ذهبي قوي في الأعلى وبنفسجي في الأسفل) */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/25 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-fuchsia-500/25 rounded-full blur-[130px] translate-y-1/4 -translate-x-1/4"></div>
        
        {/* مصباح إضاءة إضافي في المنتصف لإنارة التطبيق */}
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2"></div>

      </div>
    </>
  );
};

export default RamadanTheme;
