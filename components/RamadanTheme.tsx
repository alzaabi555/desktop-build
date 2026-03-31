import React, { useEffect } from 'react';

// =========================================================================
// 🌌 الثيم الليلي الاحترافي (Midnight Elegance & Glass Theme)
// =========================================================================

const RamadanTheme: React.FC = () => {

  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    // لون شريط المتصفح/الجوال أزرق ليلي غامق
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
          /* 🌟 خلفية التطبيق: أزرق كحلي عميق جداً ومريح للعين */
          body.ramadan-active, body.ramadan-active #root {
              background-color: #0f172a !important; /* لون Slate 900 */
              background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 70%) !important;
              background-attachment: fixed !important;
          }

          /* 🌟 توحيد شكل شريط التمرير */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02) !important; }
          ::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3) !important; border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.6) !important; }

          /* 🚀 السلاح الشامل: تحييد الألوان الخضراء المزعجة واستبدالها بنغمات زرقاء/نيلية هادئة */
          body.ramadan-active [class*="bg-green-"], 
          body.ramadan-active [class*="bg-emerald-"] { 
              background-color: rgba(255, 255, 255, 0.05) !important; 
              backdrop-filter: blur(12px) !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
              --tw-bg-opacity: 1 !important; 
          }
          
          body.ramadan-active [class*="border-green-"], 
          body.ramadan-active [class*="border-emerald-"] { 
              border-color: rgba(99, 102, 241, 0.3) !important; 
              --tw-border-opacity: 1 !important;
          }
          
          body.ramadan-active [class*="text-green-"], 
          body.ramadan-active [class*="text-emerald-"] { 
              color: #818cf8 !important; /* Indigo 400 */
              --tw-text-opacity: 1 !important;
          }

          body.ramadan-active [class*="ring-green-"],
          body.ramadan-active [class*="ring-emerald-"] {
              --tw-ring-color: rgba(99, 102, 241, 0.5) !important;
          }

          /* ✨ مربعات الإدخال الزجاجية */
          body.ramadan-active input, 
          body.ramadan-active textarea, 
          body.ramadan-active select {
              background-color: rgba(15, 23, 42, 0.6) !important; /* Slate 900 بشفافية */
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: white !important;
              border-radius: 0.75rem !important;
              transition: all 0.3s ease !important;
          }
          
          body.ramadan-active input:focus, 
          body.ramadan-active textarea:focus, 
          body.ramadan-active select:focus {
              border-color: #6366f1 !important; /* Indigo 500 */
              box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
              outline: none !important;
              background-color: rgba(30, 41, 59, 0.8) !important;
          }
          
          body.ramadan-active input::placeholder, 
          body.ramadan-active textarea::placeholder {
              color: rgba(255, 255, 255, 0.4) !important;
          }
          
          /* 🔮 إجبار النوافذ المنزلقة على الشفافية المشرقة الأنيقة */
          body.ramadan-active .z-\\[99999\\], 
          body.ramadan-active .z-\\[100001\\] {
              background-color: rgba(15, 23, 42, 0.7) !important; /* Slate 900 */
              backdrop-filter: blur(24px) !important;
              border: 1px solid rgba(255, 255, 255, 0.08) !important;
              box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5) !important;
          }
        `}
      </style>

      {/* ===================================================== */}
      {/* 🌌 الطبقة الخلفية - إضاءة زرقاء نيلية احترافية وهادئة جداً */}
      {/* ===================================================== */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none bg-[#0f172a]">
        
        {/* توهج علوي خفيف جداً بلون النيلي (Indigo) */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2"></div>
        
        {/* توهج سفلي خفيف بلون الأزرق الفاتح (Blue/Cyan) للمسة تقنية */}
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/4"></div>

      </div>
    </>
  );
};

export default RamadanTheme;
