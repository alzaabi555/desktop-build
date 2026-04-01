import React, { useEffect, useState } from 'react';

const RamadanTheme: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('rased_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setTheme((localStorage.getItem('rased_theme') as 'dark' | 'light') || 'dark');
    };
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
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
  }, [theme]);

  return (
    <>
      <style>
        {`
          /* ==================================================================== */
          /* 🌙 الثيم الداكن (خلفية مضيئة فقط - بدون المساس بمكونات التطبيق) */
          /* ==================================================================== */
          body.theme-dark, body.theme-dark #root {
              background: radial-gradient(circle at 10% 20%, #1A2345 0%, #080C17 100%) !important;
              color: #FFFFFF !important;
              background-attachment: fixed !important;
          }

          /* ==================================================================== */
          /* ☀️ الثيم الفاتح (خلفية نظيفة فقط) */
          /* ==================================================================== */
          body.theme-light, body.theme-light #root {
              background-color: #F4F7F9 !important;
              background-image: none !important;
              color: #1E293B !important;
          }

          /* إخفاء التوهج في الثيم الفاتح */
          body.theme-light .neon-glow {
              display: none !important;
          }
        `}
      </style>

      {/* التوهج الخلفي المضيء (آمن تماماً لأنه معزول في الخلف) */}
      <div className="neon-glow fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none bg-transparent">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full blur-[160px] opacity-[0.15]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-400 rounded-full blur-[140px] opacity-[0.1]"></div>
      </div>
    </>
  );
};

export default RamadanTheme;
