import React, { useEffect } from 'react';

const RamadanTheme: React.FC = () => {
  useEffect(() => {
    document.body.className = 'theme-dark';
    
    // 🎨 تطبيق اللون الأساسي من نظامك: Background Dark
    document.body.style.backgroundColor = '#0B0F1A';
    document.body.style.color = '#ffffff';

    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) metaThemeColor.setAttribute("content", "#0B0F1A");

    window.document.documentElement.classList.add('dark');

    return () => {
      document.body.classList.remove('theme-dark');
      window.document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <>
      <style>
        {`
          /* ==================================================================== */
          /* 🌙 الثيم الداكن (مبني بالكامل على نظامك التصميمي الجديد) */
          /* ==================================================================== */
          
          body.theme-dark {
              /* Background Dark من نظامك */
              background-color: #0B0F1A !important;
              background-image: radial-gradient(circle at 50% 0%, #151e32 0%, #0B0F1A 80%) !important;
              background-attachment: fixed !important;
          }

          /* 🧊 دمج نظام Glassmorphism + Glow + Cards من نظامك */
          .theme-dark aside, 
          .theme-dark .z-\\[100001\\], 
          .theme-dark div.rounded-\\[1\\.5rem\\],
          .theme-dark div.rounded-2xl,
          .theme-dark div.rounded-3xl {
              /* Glass Base: bg-white/10 */
              background-color: rgba(255, 255, 255, 0.05) !important;
              
              /* Backdrop Blur XL */
              backdrop-filter: blur(24px) !important;
              -webkit-backdrop-filter: blur(24px) !important;
              
              /* Border: border-white/10 */
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              
              /* ✨ Glow System: shadow-[0_0_25px_rgba(59,130,246,0.5)] */
              box-shadow: 0 0 25px rgba(59, 130, 246, 0.3), 0 10px 30px rgba(0,0,0,0.5) !important;
              
              transition: all 0.3s ease-in-out !important;
          }

          /* تطبيق تأثير Card Hover من نظامك */
          .theme-dark div.rounded-\\[1\\.5rem\\]:hover,
          .theme-dark div.rounded-2xl:hover {
              /* glow.hover */
              box-shadow: 0 0 40px rgba(59, 130, 246, 0.5), 0 10px 30px rgba(0,0,0,0.6) !important;
              transform: scale(1.01) !important;
          }

          /* 💎 تخصيص الأزرار السريعة (Buttons System) */
          .theme-dark button.bg-blue-600,
          .theme-dark button.bg-gradient-to-r {
              /* buttons.primary */
              background: linear-gradient(to right, #3b82f6, #22d3ee) !important; /* from-blue-500 to-cyan-400 */
              box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4) !important;
              border: none !important;
          }

          /* مربعات الإدخال (Subtle Glass) */
          .theme-dark input, 
          .theme-dark select, 
          .theme-dark textarea {
              /* glass.subtle */
              background-color: rgba(255, 255, 255, 0.05) !important;
              backdrop-filter: blur(16px) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: #FFFFFF !important;
          }

          .theme-dark input:focus {
              /* glow.cyan */
              box-shadow: 0 0 20px rgba(34, 211, 238, 0.4) !important;
              border-color: rgba(34, 211, 238, 0.8) !important;
          }

          /* النصوص (Text System) */
          .theme-dark .text-slate-800,
          .theme-dark .text-slate-900,
          .theme-dark .text-gray-800 { 
              color: #ffffff !important; /* text.primary */
          }
          
          .theme-dark .text-slate-500,
          .theme-dark .text-slate-600 { 
              color: #d1d5db !important; /* text.secondary (gray-300) */
          }
        `}
      </style>

      {/* 🌌 أضواء النيون الخلفية باستخدام ألوان الـ Accent الخاصة بك */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
        {/* إضاءة زرقاء/سماوية (Primary) */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-500 rounded-full blur-[150px] opacity-[0.15]"></div>
        
        {/* إضاءة أرجوانية/زهرية (Accent) في الأسفل */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500 rounded-full blur-[150px] opacity-[0.12]"></div>
      </div>
    </>
  );
};

export default RamadanTheme;
