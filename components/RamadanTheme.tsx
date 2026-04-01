import React, { useEffect } from 'react';

// =========================================================================
// 🔮 ثيم الفخامة التقنية (Glowing Midnight Blue Theme) - فرض السيطرة
// =========================================================================

const RamadanTheme: React.FC = () => {

  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    // لون شريط المتصفح/الجوال متوافق مع الكحلي العميق
    metaThemeColor.setAttribute("content", "#0f172a"); 
    document.body.style.backgroundColor = "#0f172a";

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
          /* 🌟 1. فرض التدرج الكحلي المضيء على الخلفية بأكملها (لن يكون أسود!) */
          body.ramadan-active, body.ramadan-active #root {
              background: radial-gradient(circle at 10% 20%, rgb(18, 28, 54) 0%, rgb(10, 15, 30) 90.2%) !important;
              background-attachment: fixed !important;
          }

          /* 🌟 2. تلوين الكروت والخلفيات القديمة (تأثير زجاجي نيلي) */
          body.ramadan-active [class*="bg-green-"], 
          body.ramadan-active [class*="bg-emerald-"],
          body.ramadan-active [class*="bg-slate-800"],
          body.ramadan-active aside,
          body.ramadan-active header { 
              background-color: rgba(99, 102, 241, 0.03) !important; /* Indigo شفاف جداً */
              backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
              --tw-bg-opacity: 1 !important; 
          }
          
          /* ✨ 3. تعديل مربعات الإدخال (Inputs) - تصميم زجاجي ناعم */
          body.ramadan-active input, 
          body.ramadan-active textarea, 
          body.ramadan-active select {
              background-color: rgba(255, 255, 255, 0.02) !important; 
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
              color: white !important;
              transition: all 0.3s ease !important;
          }
          
          body.ramadan-active input:focus {
              border-color: rgba(99, 102, 241, 0.4) !important; 
              box-shadow: 0 0 15px rgba(99, 102, 241, 0.2) !important;
              outline: none !important;
          }

          /* ✨ 4. تعديل النوافذ المنزلقة (DrawerSheet) - زجاج ناعم */
          body.ramadan-active .z-\\[99999\\], 
          body.ramadan-active .z-\\[100001\\] {
              background-color: rgba(15, 23, 42, 0.7) !important; /* لون slate-900 بشفافية */
              backdrop-filter: blur(25px) !important;
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6) !important;
          }
        `}
      </style>

      {/* ===================================================== */}
      {/* 🌌 الطبقة الخلفية: تأثير السديم النيلي المضيء (Nebula Glow) */}
      {/* ===================================================== */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none bg-transparent">
        
        {/* توهج علوي يمين: نيلي (Indigo) */}
        <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-indigo-600/10 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4"></div>
        
        {/* توهج سفلي يسار: سماوي (Cyan) لمحاكاة الإضاءة الحيوية */}
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[130px] translate-y-1/3 -translate-x-1/4"></div>

      </div>
    </>
  );
};

export default RamadanTheme;
