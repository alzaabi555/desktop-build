import React, { useEffect, useState } from 'react';

const RamadanTheme: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('rased_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    // تحديث الثيم عند التخزين
    const handleStorageChange = () => {
      setTheme((localStorage.getItem('rased_theme') as 'dark' | 'light') || 'dark');
    };
    
    // التحديث عند الضغط على الزر
    const handleManualChange = () => {
        setTheme((localStorage.getItem('rased_theme') as 'dark' | 'light') || 'dark');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('theme_changed', handleManualChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('theme_changed', handleManualChange);
    };
  }, []);

  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", theme === 'dark' ? '#080C17' : '#F4F7F9');
    
    // وضع الكلاس على الـ body ليعمل الـ CSS
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
  }, [theme]);

  return (
    <>
      <style>
        {`
          /* ==================================================================== */
          /* 🌙 الثيم الداكن (الزجاج المضيء) */
          /* ==================================================================== */
          
          body.theme-dark, body.theme-dark #root {
              background: radial-gradient(circle at 10% 20%, #1A2345 0%, #080C17 100%) !important;
              color: #FFFFFF !important;
              background-attachment: fixed !important;
          }

          /* استهداف آمن للكروت الداكنة والرمادية وتحويلها لزجاج فخم */
          body.theme-dark [class*="bg-slate-800"], 
          body.theme-dark [class*="bg-[#1e293b]"], 
          body.theme-dark [class*="bg-[#0f1123]"],
          body.theme-dark [class*="bg-[#0B1120]"],
          body.theme-dark [class*="bg-white/5"] {
              background: linear-gradient(160deg, rgba(30, 43, 77, 0.6) 0%, rgba(12, 18, 36, 0.9) 100%) !important;
              backdrop-filter: blur(16px) !important;
              -webkit-backdrop-filter: blur(16px) !important;
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              border-top: 1px solid rgba(100, 140, 255, 0.3) !important; 
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
          }

          /* مربعات الإدخال */
          body.theme-dark input, 
          body.theme-dark select,
          body.theme-dark [class*="bg-slate-700"] {
              background: rgba(0, 0, 0, 0.25) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: #FFFFFF !important;
          }

          /* تفتيح النصوص */
          body.theme-dark .text-slate-800,
          body.theme-dark .text-slate-900,
          body.theme-dark .text-gray-800 {
              color: #FFFFFF !important;
          }
          body.theme-dark .text-slate-500,
          body.theme-dark .text-slate-600 {
              color: #94A3B8 !important;
          }

          /* ==================================================================== */
          /* ☀️ الثيم الفاتح (نظيف ويحترم كودك الأصلي) */
          /* ==================================================================== */
          
          body.theme-light, body.theme-light #root {
              background: #F4F7F9 !important;
              color: #1E293B !important;
              background-image: none !important;
          }

          body.theme-light [class*="bg-slate-800"], 
          body.theme-light [class*="bg-[#1e293b]"], 
          body.theme-light [class*="bg-[#0f1123]"],
          body.theme-light [class*="bg-[#0B1120]"],
          body.theme-light [class*="bg-white/5"] {
              background: #FFFFFF !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              border: 1px solid #E2E8F0 !important;
              border-top: 1px solid #FFFFFF !important;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03) !important;
          }

          body.theme-light input, 
          body.theme-light select {
              background: #F8FAFC !important;
              border: 1px solid #CBD5E1 !important;
              color: #0F172A !important;
          }

          body.theme-light .text-white {
              color: #1E293B !important;
          }

          /* إخفاء التوهج في الثيم الفاتح */
          body.theme-light .neon-glow {
              display: none !important;
          }
        `}
      </style>

      {/* התوهج الخلفي يظهر فقط في الثيم الداكن */}
      <div className="neon-glow fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none bg-transparent">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full blur-[160px] opacity-[0.15]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-400 rounded-full blur-[140px] opacity-[0.1]"></div>
      </div>
    </>
  );
};

export default RamadanTheme;
