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
          /* ☀️ الثيم الفاتح (الآمن 100% - لا يوجد أي تدخل برمجي فيه) */
          /* ==================================================================== */
          body.theme-light, body.theme-light #root {
              background-color: #F4F7F9 !important;
              background-image: none !important;
              color: #1E293B !important;
          }

          body.theme-light .neon-glow {
              display: none !important;
          }

          /* ==================================================================== */
          /* 🌙 الثيم الداكن المضيء (النسخة الفاخرة ذات التوهج النيوني) */
          /* ==================================================================== */
          
          /* 1. خلفية المجرة العميقة */
          body.theme-dark, body.theme-dark #root {
              background: radial-gradient(circle at 10% 20%, #1A2345 0%, #080C17 100%) !important;
              color: #FFFFFF !important;
              background-attachment: fixed !important;
          }

          /* 2. 🌟 إشعال التوهج النيوني (Neon Bleed) حول اللوحات الجانبية والبطاقات الرئيسية 🌟 */
          /* الاستهداف الجراحي الدقيق لمنع انهيار الشاشة (Layout Collapse) */
          body.theme-dark aside, /* القائمة الجانبية (Desktop) */
          body.theme-dark .z-\\[100001\\], /* اللوحة المنزلقة "المزيد" (Mobile) */
          body.theme-dark .rounded-\\[1\\.5rem\\], /* بطاقات الطلاب الكبيرة */
          body.theme-dark .rounded-2xl, /* بعض الكروت الإحصائية */
          body.theme-dark .rounded-3xl /* الحاويات الداخلية */ {
              /* تأثير الزجاج الداكن */
              background: linear-gradient(160deg, rgba(30, 43, 77, 0.7) 0%, rgba(12, 18, 36, 0.9) 100%) !important;
              backdrop-filter: blur(20px) !important;
              -webkit-backdrop-filter: blur(20px) !important;
              
              /* لمعة الزجاج العلوية (Edge Highlight) */
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              border-top: 1px solid rgba(100, 140, 255, 0.4) !important; 
              
              /* 💥 السحر: التوهج الخارجي والظل الداخلي (Layered Glow & Drop Shadow) 💥 */
              box-shadow: 
                  0 0 20px rgba(59, 130, 246, 0.15),  /* التوهج النيوني الأزرق المتسرب للخارج */
                  0 15px 35px rgba(0, 0, 0, 0.6),     /* الظل الأسود العميق للرفع عن الشاشة */
                  inset 0 1px 1px rgba(255, 255, 255, 0.1) !important; /* لمعة داخلية خفيفة */
          }

          /* 3. توحيد وتفتيح النصوص الداكنة القديمة لتكون مقروءة بوضوح */
          body.theme-dark .text-slate-800,
          body.theme-dark .text-slate-900,
          body.theme-dark .text-gray-800 {
              color: #F8FAFC !important;
          }
          body.theme-dark .text-slate-500,
          body.theme-dark .text-slate-600 {
              color: #94A3B8 !important; /* لون رمادي مزرق فاخر للنصوص الثانوية */
          }

          /* 4. إخفاء الحدود البيضاء المزعجة من Tailwind لكي يبرز التوهج بحرية */
          body.theme-dark .border-slate-200 {
              border-color: rgba(255, 255, 255, 0.05) !important;
          }

          /* 5. تصميم زجاجي أنيق لمربعات البحث والإدخال */
          body.theme-dark input, 
          body.theme-dark select,
          body.theme-dark textarea {
              background: rgba(0, 0, 0, 0.3) !important;
              border: 1px solid rgba(100, 140, 255, 0.2) !important;
              color: #FFFFFF !important;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.3) !important;
          }
          body.theme-dark input:focus {
              border-color: #3B82F6 !important;
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.3), inset 0 2px 4px rgba(0,0,0,0.3) !important;
          }
        `}
      </style>

      {/* 🌌 تأثير الأضواء الكاشفة في الخلفية (Ambient Nebula Glows) */}
      <div className="neon-glow fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none">
        {/* بقعة إضاءة زرقاء (Blue Highlight) في الزاوية العلوية اليمنى */}
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-600 rounded-full blur-[150px] opacity-[0.18]"></div>
        
        {/* بقعة إضاءة سماوية (Cyan Highlight) في الزاوية السفلية اليسرى */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-400 rounded-full blur-[140px] opacity-[0.12]"></div>
      </div>
    </>
  );
};

export default RamadanTheme;
