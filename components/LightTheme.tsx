import React, { useEffect } from 'react';

const LightTheme: React.FC = () => {
  useEffect(() => {
    // 1. تنظيف الجسم من أي كلاسات داكنة
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    
    // 2. إرجاع الألوان الأساسية للوضع الفاتح
    document.body.style.backgroundColor = '#f3f4f6';
    document.body.style.color = '#1f2937';

    // 3. لون شريط المتصفح
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", "#f3f4f6");
    }

    // تنظيف عند إغلاق المكون
    return () => {
      document.body.classList.remove('theme-light');
    };
  }, []);

  return (
    <style>
      {`
        /* حماية الثيم الفاتح: التأكد من إخفاء أي توهج أو نيون */
        .neon-glow { display: none !important; }
        
        /* إرجاع لون الخلفية الأساسي */
        body.theme-light {
            background-color: #f3f4f6 !important;
            background-image: none !important;
        }
      `}
    </style>
  );
};

export default LightTheme;
