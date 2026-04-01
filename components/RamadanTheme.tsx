import React, { useEffect, useState } from 'react';

// =========================================================================
// 🔮 محرك الثيمات الآمن والكامل (الشفافية العميقة، التوهج النيوني، وتأثير الزجاج)
// =========================================================================

const RamadanTheme: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('rased_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('rased_theme') as 'dark' | 'light';
      if (currentTheme) setTheme(currentTheme);
    };

    window.addEventListener('storage', handleThemeChange);
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme-changed'] });

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", theme === 'dark' ? '#080C17' : '#f3f4f6');
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
  }, [theme]);

  return (
    <>
      <style>
        {`
          /* ==================================================================== */
          /* 🌙 الثيم الداكن (الزجاج المضيء والفخامة - تم التحديث!) */
          /* ==================================================================== */
          
          /* الخلفية العامة للتطبيق: مجرة نيلي أعمق (Deep Midnight Nebula) */
          body.theme-dark, body.theme-dark #root {
              /* دمج عدة تدرجات لإنشاء تأثير النيبولا المضيء في الخلفية */
              background: #080C17 !important;
              background-image: 
                radial-gradient(circle at 10% 10%, #1a2345 0%, transparent 60%),
                radial-gradient(circle at 80% 20%, #0d152b 0%, transparent 50%),
                radial-gradient(circle at 50% 100%, #111525 0%, transparent 60%) !important;
              color: #FFFFFF !important;
              background-attachment: fixed !important;
          }

          /* 🛡️ السيطرة الآمنة والكاملة: تطبيق تأثير الزجاج المضيء والنيون */
          /* يستهدف كل الكروت في كل الصفحات، واللوحات الجانبية والمنزلقة */
          body.theme-dark [class*="bg-white"], 
          body.theme-dark [class*="bg-slate-800"], 
          body.theme-dark [class*="bg-[#1e293b]"], 
          body.theme-dark [class*="bg-[#0f1123]"],
          body.theme-dark [class*="bg-[#0B1120]"],
          body.theme-dark [class*="bg-white/5"],
          body.theme-dark aside, /* اللوحة الجانبية الديسكتوب */
          body.theme-dark .z-\\[100001\\] /* اللوحة الجانبية المنزلقة "المزيد" للجوال */ {
              background: linear-gradient(160deg, rgba(30, 43, 77, 0.7) 0%, rgba(12, 18, 36, 0.9) 100%) !important;
              backdrop-filter: blur(16px) !important;
              -webkit-backdrop-filter: blur(16px) !important;
              
              /* الحواف المضيئة (Neon Blue Border) */
              border: 1px solid rgba(100, 140, 255, 0.2) !important;
              
              /* 🌟 السحر الحقيقي: التوهج بين وحول البطاقات (Layered Neon Box Shadow) 🌟 */
              box-shadow: 
                  0 0 10px rgba(59, 130, 246, 0.3), /* توهج نيوني خفيف حول الحافة */
                  0 15px 35px rgba(0, 0, 0, 0.5) !important; /* ظل البطاقة الأساسي للعمق */
              
              /* لمنع الظلال العملاقة السابقة */
              position: relative;
          }

          /* مربعات الإدخال في الداكن */
          body.theme-dark input, 
          body.theme-dark select,
          body.theme-dark textarea {
              background: rgba(0, 0, 0, 0.25) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: #FFFFFF !important;
          }

          /* توحيد النصوص */
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
          /* ☀️ الثيم الفاتح (يترك التطبيق كما صممته أنت، دون أي تدخل) */
          /* ==================================================================== */
          
          body.theme-light, body.theme-light #root {
              background-color: #f3f4f6 !important;
              background-image: none !important;
              color: #1E293B !important;
          }

          /* إجبار الكروت على العودة للون الأبيض النظيف */
          body.theme-light [class*="bg-slate-800"], 
          body.theme-light [class*="bg-[#1e293b]"], 
          body.theme-light [class*="bg-[#0f1123]"],
          body.theme-light [class*="bg-[#0B1120]"],
          body.theme-light [class*="bg-white/5"],
          body.theme-light aside,
          body.theme-light .z-\\[100001\\] {
              background: #FFFFFF !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              border: 1px solid #E2E8F0 !important;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03) !important;
          }

          body.theme-light .text-white {
              color: #1E293B !important;
          }

          /* إخفاء إضاءة النيون في الثيم الفاتح */
          body.theme-light .neon-glow {
              display: none !important;
              opacity: 0 !important;
          }
        `}
      </style>

      {/* التوهج الخلفي (Neon Glow) يظهر فقط في الداكن بفضل كلاس neon-glow */}
      <div className="neon-glow fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none bg-transparent opacity-100 transition-opacity duration-1000">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full blur-[160px] opacity-[0.12]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-400 rounded-full blur-[140px] opacity-[0.08]"></div>
      </div>
    </>
  );
};

export default RamadanTheme;
