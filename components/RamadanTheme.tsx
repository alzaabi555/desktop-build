import React, { useEffect } from 'react';

const RamadanTheme: React.FC = () => {
  useEffect(() => {
    document.body.className = 'theme-dark';
    document.body.style.backgroundColor = '#080C17';
    document.body.style.color = '#ffffff';

    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) metaThemeColor.setAttribute("content", "#080C17");

    window.document.documentElement.classList.add('dark');
  }, []);

  return (
    <>
      <style>
        {`
          body.theme-dark {
              background: radial-gradient(circle at 20% 30%, #1A2345 0%, #080C17 100%) !important;
              background-attachment: fixed !important;
          }

          /* 🌟 تأثير الزجاج المضيء للكروت واللوحات الجانبية 🌟 */
          .theme-dark aside, 
          .theme-dark .z-\\[100001\\], 
          .theme-dark [class*="bg-slate-800"],
          .theme-dark div.rounded-\\[1\\.5rem\\],
          .theme-dark div.rounded-2xl {
              background: linear-gradient(160deg, rgba(30, 43, 77, 0.7) 0%, rgba(12, 18, 36, 0.9) 100%) !important;
              backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(100, 140, 255, 0.1) !important;
              border-top: 1px solid rgba(100, 140, 255, 0.3) !important;
              box-shadow: 0 0 20px rgba(59, 130, 246, 0.15), 0 15px 35px rgba(0,0,0,0.5) !important;
          }

          .theme-dark input { background: rgba(0,0,0,0.3) !important; color: white !important; }
        `}
      </style>

      {/* التوهج الخلفي المضيء */}
      <div className="neon-glow fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] opacity-[0.15]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-400 rounded-full blur-[140px] opacity-[0.1]"></div>
      </div>
    </>
  );
};

export default RamadanTheme;
