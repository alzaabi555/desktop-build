import React, { useEffect } from 'react';

// =========================================================================
// 🌌 الثيم الليلي الفاخر (يعتمد على tailwind.config.js)
// =========================================================================

const RamadanTheme: React.FC = () => {

  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    // لون شريط المتصفح/الجوال
    metaThemeColor.setAttribute("content", "#0B0F1A"); 
    document.body.style.backgroundColor = "#0B0F1A";

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
          /* 🌟 خلفية التطبيق */
          body.ramadan-active, body.ramadan-active #root {
              @apply bg-bgMain;
              background-image: none !important; 
          }

          /* 🌟 توحيد شكل شريط التمرير */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02) !important; }
          ::-webkit-scrollbar-thumb { @apply bg-bgSoft rounded-xl; } 
          ::-webkit-scrollbar-thumb:hover { @apply bg-primary; }

          /* 🚀 تحييد الألوان الخضراء باستخدام ألوانك المخصصة */
          body.ramadan-active [class*="bg-green-"], 
          body.ramadan-active [class*="bg-emerald-"] { 
              @apply bg-bgCard border border-bgSoft shadow-md;
              background-color: #141A2D !important;
              border-color: #1A2035 !important;
          }
          
          body.ramadan-active [class*="border-green-"], 
          body.ramadan-active [class*="border-emerald-"] { 
              border-color: rgba(37, 99, 235, 0.3) !important; /* primary color with opacity */
          }
          
          body.ramadan-active [class*="text-green-"], 
          body.ramadan-active [class*="text-emerald-"] { 
              color: #06B6D4 !important; /* info color */
          }

          body.ramadan-active [class*="ring-green-"],
          body.ramadan-active [class*="ring-emerald-"] {
              --tw-ring-color: rgba(37, 99, 235, 0.5) !important;
          }

          /* ✨ مربعات الإدخال (Inputs) */
          body.ramadan-active input, 
          body.ramadan-active textarea, 
          body.ramadan-active select {
              @apply bg-bgMain border border-bgSoft text-textPrimary rounded-2xl transition-all duration-300;
              background-color: #0B0F1A !important;
          }
          
          body.ramadan-active input:focus, 
          body.ramadan-active textarea:focus, 
          body.ramadan-active select:focus {
              border-color: #2563EB !important; /* primary color */
              box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
              outline: none !important;
              background-color: #141A2D !important; /* bgCard */
          }
          
          body.ramadan-active input::placeholder, 
          body.ramadan-active textarea::placeholder {
              color: #6B7280 !important; /* textMuted */
          }
          
          /* 🔮 النوافذ المنزلقة (DrawerSheet) */
          body.ramadan-active .z-\\[99999\\], 
          body.ramadan-active .z-\\[100001\\] {
              background-color: rgba(20, 26, 45, 0.95) !important; /* bgCard with opacity */
              backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              border-top: 1px solid rgba(255, 255, 255, 0.1) !important; 
              box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6) !important;
          }
        `}
      </style>

      {/* 🌌 الطبقة الخلفية - التوهج الفضائي */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none bg-bgMain">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-info/5 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"></div>
      </div>
    </>
  );
};

export default RamadanTheme;
