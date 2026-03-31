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

    return () => {
      document.body.style.backgroundColor = "#f3f4f6";
    };
  }, []);

  return (
    <>
      <style>
        {`
          /* 🌟 إضاءة شاملة للتطبيق (تدرج لوني مشرق) */
          body, #root {
              background: linear-gradient(135deg, #3b1c7a 0%, #22104c 50%, #130733 100%) !important;
              background-attachment: fixed !important;
          }

          /* 🌟 توحيد شكل شريط التمرير */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02) !important; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3) !important; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(251, 191, 36, 0.8) !important; }

          /* 🚀 السلاح الشامل: استهداف أي كلاس يحتوي على كلمة green أو emerald مهما كانت شفافيته */
          [class*="bg-green-"], [class*="bg-emerald-"] { 
              background-color: rgba(255, 255, 255, 0.08) !important; 
              backdrop-filter: blur(12px) !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
          }
          [class*="border-green-"], [class*="border-emerald-"] { 
              border-color: rgba(251, 191, 36, 0.5) !important; 
          }
          [class*="text-green-"], [class*="text-emerald-"] { 
              color: #fbbf24 !important; 
          }
          [class*="fill-green-"], [class*="fill-emerald-"] { 
              fill: #fbbf24 !important; 
          }

          /* ✨ مربعات الإدخال الزجاجية المضيئة */
          input, textarea, select {
              background-color: rgba(255, 255, 255, 0.12) !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
              color: white !important;
              border-radius: 1rem !important;
              transition: all 0.3s ease !important;
          }
          input:focus, textarea:focus, select:focus {
              border-color: #fbbf24 !important;
              box-shadow: 0 0 20px rgba(251, 191, 36, 0.3) !important;
              outline: none !important;
              background-color: rgba(255, 255, 255, 0.2) !important;
          }
          input::placeholder, textarea::placeholder {
              color: rgba(255, 255, 255, 0.6) !important;
          }
          
          /* 🔮 إجبار النوافذ المنزلقة (DrawerSheet) على الشفافية المشرقة (Glassmorphism) */
          .z-\\[99999\\] {
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
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        
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
