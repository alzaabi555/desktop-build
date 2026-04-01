import React, { useEffect } from 'react';

const RamadanTheme: React.FC = () => {
  useEffect(() => {
    // 1. تنظيف الجسم من كلاسات الفاتح
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');

    // 2. ألوان الخلفية للداكن
    document.body.style.backgroundColor = '#080C17';
    document.body.style.color = '#f8fafc';

    // 3. لون شريط المتصفح
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", "#080C17");
    }

    return () => {
      document.body.classList.remove('theme-dark');
    };
  }, []);

  return (
    <>
      <style>
        {`
          /* ==================================================================== */
          /* 🌙 الثيم الداكن الفاخر (معزول تماماً ومحمي) */
          /* ==================================================================== */
          
          body.theme-dark {
              background: radial-gradient(circle at 10% 20%, #1A2345 0%, #080C17 100%) !important;
              background-attachment: fixed !important;
          }

          /* السحر: استهداف الكروت فقط بالزجاج المضيء لمنع انهيار الهيكل */
          .theme-dark aside, 
          .theme-dark .z-\\[100001\\], 
          .theme-dark div.rounded-\\[1\\.5rem\\], 
          .theme-dark div.rounded-2xl, 
          .theme-dark div.rounded-3xl, 
          .theme-dark div.rounded-xl {
              background: linear-gradient(160deg, rgba(30, 43, 77, 0.7) 0%, rgba(12, 18, 36, 0.9) 100%) !important;
              backdrop-filter: blur(16px) !important;
              -webkit-backdrop-filter: blur(16px) !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
              border-top: 1px solid rgba(100, 140, 255, 0.3) !important; /* لمعة الزجاج */
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1) !important;
          }

          /* مربعات الإدخال */
          .theme-dark input, 
          .theme-dark select, 
          .theme-dark textarea {
              background: rgba(0, 0, 0, 0.3) !important;
              border: 1px solid rgba(255, 255, 255, 0.15) !important;
              color: #FFFFFF !important;
          }

          /* تفتيح النصوص */
          .theme-dark .text-slate-800,
          .theme-dark .text-slate-900,
          .theme-dark .text-gray-800 { color: #FFFFFF !important; }
          .theme-dark .text-slate-500,
          .theme-dark .text-slate-600 { color: #94A3B8 !important; }
          
          /* إخفاء حدود Tailwind */
          .theme-dark .border-slate-200 { border-color: rgba(255, 255, 255, 0.05) !important; }
        `}
      </style>

      {/* 🌌 التوهج النيوني الخاص بالثيم الداكن */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] opacity-[0.18]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-400 rounded-full blur-[140px] opacity-[0.12]"></div>
      </div>
    </>
  );
};

export default RamadanTheme;
