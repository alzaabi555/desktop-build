import React, { useEffect } from 'react';

const LightTheme: React.FC = () => {
  useEffect(() => {
    // 1. تنظيف شامل للجسم
    document.body.className = 'theme-light';
    document.body.style.backgroundColor = '#f3f4f6'; // لونك الأصلي
    document.body.style.color = '#1f2937';

    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) metaThemeColor.setAttribute("content", "#f3f4f6");

    // نضع سمة لـ Tailwind إذا كنت تستخدم الوضع الداكن فيه
    window.document.documentElement.classList.remove('dark');
    window.document.documentElement.classList.add('light');
  }, []);

  return (
    <style>
      {`
        /* حماية مطلقة: إخفاء أي توهج نيون أو تأثيرات زجاجية */
        .neon-glow { display: none !important; }
        body { background-image: none !important; }
        
        /* ضمان أن الكروت تعود لشكلها الأبيض النظيف */
        .theme-light [class*="bg-white"], 
        .theme-light aside {
            background-color: #ffffff !important;
            backdrop-filter: none !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
        }
      `}
    </style>
  );
};

export default LightTheme;
