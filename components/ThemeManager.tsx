import React, { useEffect } from 'react';

interface ThemeManagerProps {
  theme: 'dark' | 'light';
}

const ThemeManager: React.FC<ThemeManagerProps> = ({ theme }) => {
  useEffect(() => {
    // 1. تحديث لون شريط المتصفح/الجوال
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", theme === 'dark' ? '#080C17' : '#F4F7F9');
    
    // 2. حقن السمة في الـ Body ليفهم التطبيق الثيم الحالي
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <style>
        {`
          /* ========================================================== */
          /* 🌙 الثيم الداكن (Glowing Midnight Blue) - تماماً كالصورة */
          /* ========================================================== */
          
          body[data-theme='dark'] {
              /* ليس أسود! بل تدرج قطري من الكحلي إلى الداكن */
              background: radial-gradient(circle at top right, #1A2345 0%, #080C17 100%) !important;
              color: #FFFFFF !important;
              background-attachment: fixed !important;
          }

          /* 🌟 السيطرة العنيفة على الكروت لتحويلها لزجاج 3D مضيء */
          body[data-theme='dark'] [class*="bg-bgCard"], 
          body[data-theme='dark'] [class*="bg-white/5"],
          body[data-theme='dark'] aside,
          body[data-theme='dark'] .z-\\[100001\\] {
              background: linear-gradient(160deg, rgba(30, 43, 77, 0.7) 0%, rgba(12, 18, 36, 0.9) 100%) !important;
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              /* اللمعة العلوية التي تعطي إحساس الـ 3D (هذا هو سر الصورة!) */
              border-top: 1px solid rgba(100, 140, 255, 0.3) !important; 
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.1) !important;
              backdrop-filter: blur(16px) !important;
          }

          /* مربعات الإدخال والبحث في الداكن */
          body[data-theme='dark'] input, 
          body[data-theme='dark'] select {
              background: rgba(0, 0, 0, 0.2) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              color: #FFFFFF !important;
              box-shadow: inset 0 2px 5px rgba(0,0,0,0.2) !important;
          }
          
          body[data-theme='dark'] input:focus {
              border-color: #3B82F6 !important;
              box-shadow: 0 0 15px rgba(59, 130, 246, 0.4), inset 0 2px 5px rgba(0,0,0,0.2) !important;
          }

          /* ========================================================== */
          /* ☀️ الثيم الفاتح (الرسمي/النظيف) - تماماً كالصورة الثانية */
          /* ========================================================== */
          
          body[data-theme='light'] {
              background: #F4F7F9 !important;
              color: #1E293B !important;
          }

          /* كروت مسطحة وواضحة بدون زجاجيات */
          body[data-theme='light'] [class*="bg-bgCard"], 
          body[data-theme='light'] [class*="bg-white/5"],
          body[data-theme='light'] aside,
          body[data-theme='light'] .z-\\[100001\\] {
              background: #FFFFFF !important;
              border: 1px solid #E2E8F0 !important;
              border-top: 1px solid #FFFFFF !important;
              box-shadow: 0 8px 20px -4px rgba(50, 70, 100, 0.08) !important;
              backdrop-filter: none !important;
          }

          body[data-theme='light'] input, 
          body[data-theme='light'] select {
              background: #F8FAFC !important;
              border: 1px solid #CBD5E1 !important;
              color: #0F172A !important;
              box-shadow: none !important;
          }

          body[data-theme='light'] input:focus {
              border-color: #2563EB !important;
              background: #FFFFFF !important;
              box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
          }

          body[data-theme='light'] .text-white,
          body[data-theme='light'] .text-textPrimary {
              color: #0F172A !important;
          }
          
          body[data-theme='light'] .text-textSecondary {
              color: #64748B !important;
          }

          /* ========================================================== */
          /* 🌟 التوهج الخلفي للثيم الداكن فقط */
          /* ========================================================== */
          .dark-glow-1, .dark-glow-2 { transition: opacity 0.5s ease; }
          body[data-theme='light'] .dark-glow-1,
          body[data-theme='light'] .dark-glow-2 { opacity: 0 !important; }
        `}
      </style>

      {/* التوهج الخلفي المضيء (يظهر في الداكن ويختفي في الفاتح) */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none bg-transparent">
        <div className="dark-glow-1 absolute top-[0%] right-[0%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]"></div>
        <div className="dark-glow-2 absolute bottom-[0%] left-[0%] w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[120px]"></div>
      </div>
    </>
  );
};

export default ThemeManager;
