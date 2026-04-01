import React, { useEffect } from 'react';

// =========================================================================
// 🌌 الثيم الليلي الفاخر (Midnight Elegance) - راصد الإصدار الاحترافي
// =========================================================================

const RamadanTheme: React.FC = () => {

  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    // لون شريط المتصفح/الجوال مطابق للخلفية (bgMain)
    metaThemeColor.setAttribute("content", "#0B0F1A"); 
    document.body.style.backgroundColor = "#0B0F1A";

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
          /* 🌟 خلفية التطبيق: أزرق كحلي داكن جداً ومريح (bgMain) */
          body.ramadan-active, body.ramadan-active #root {
              background-color: #0B0F1A !important;
              background-image: none !important; /* إزالة التدرج الشعاعي للتركيز على الكروت والهدوء */
          }

          /* 🌟 توحيد شكل شريط التمرير */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02) !important; }
          ::-webkit-scrollbar-thumb { background: #1A2035 !important; border-radius: 10px; } /* لون bgSoft */
          ::-webkit-scrollbar-thumb:hover { background: #2563EB !important; } /* لون primary */

          /* 🚀 السلاح الشامل: تحييد الألوان القديمة واستبدالها بألوان الستايل الجديد */
          body.ramadan-active [class*="bg-green-"], 
          body.ramadan-active [class*="bg-emerald-"] { 
              background-color: #141A2D !important; /* لون bgCard */
              border: 1px solid #1A2035 !important; /* لون bgSoft */
              --tw-bg-opacity: 1 !important; 
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
          }
          
          body.ramadan-active [class*="border-green-"], 
          body.ramadan-active [class*="border-emerald-"] { 
              border-color: rgba(37, 99, 235, 0.3) !important; /* لون primary بشفافية */
              --tw-border-opacity: 1 !important;
          }
          
          body.ramadan-active [class*="text-green-"], 
          body.ramadan-active [class*="text-emerald-"] { 
              color: #06B6D4 !important; /* لون info */
              --tw-text-opacity: 1 !important;
          }

          body.ramadan-active [class*="ring-green-"],
          body.ramadan-active [class*="ring-emerald-"] {
              --tw-ring-color: rgba(37, 99, 235, 0.5) !important;
          }

          /* ✨ مربعات الإدخال (Inputs) - تصميم ناعم ومتناسق */
          body.ramadan-active input, 
          body.ramadan-active textarea, 
          body.ramadan-active select {
              background-color: #0B0F1A !important; /* أغمق من الكرت للتباين */
              border: 1px solid #1A2035 !important; /* لون bgSoft */
              color: white !important;
              border-radius: 1rem !important;
              transition: all 0.3s ease !important;
          }
          
          body.ramadan-active input:focus, 
          body.ramadan-active textarea:focus, 
          body.ramadan-active select:focus {
              border-color: #2563EB !important; /* لون primary */
              box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
              outline: none !important;
              background-color: #141A2D !important;
          }
          
          body.ramadan-active input::placeholder, 
          body.ramadan-active textarea::placeholder {
              color: #6B7280 !important; /* لون textMuted */
          }
          
          /* 🔮 النوافذ المنزلقة (DrawerSheet) - شفافة مع إضاءة علوية */
          body.ramadan-active .z-\\[99999\\], 
          body.ramadan-active .z-\\[100001\\] {
              background-color: rgba(20, 26, 45, 0.95) !important; /* لون bgCard بشفافية */
              backdrop-filter: blur(20px) !important;
              border: 1px solid rgba(255, 255, 255, 0.05) !important;
              border-top: 1px solid rgba(255, 255, 255, 0.1) !important; /* لمعة علوية */
              box-shadow: -10px 0 40px rgba(0, 0, 0, 0.6) !important;
          }
          
          /* 🌟 كلاسات مساعدة للكروت (Cards) للاستخدام المستقبلي */
          .card-active {
              background: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%) !important; /* primary to info */
              color: white !important;
              box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4) !important;
              border: none !important;
          }
          
          .card-inactive {
              background-color: #141A2D !important; /* bgCard */
              border: 1px solid #1A2035 !important; /* bgSoft */
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
          }
        `}
      </style>

      {/* ===================================================== */}
      {/* 🌌 الطبقة الخلفية - هادئة جداً (بدون ألوان فاقعة أو سواد ميت) */}
      {/* ===================================================== */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden select-none bg-bgMain">
        
        {/* توهج خفيف جداً في الأعلى (لمسة تقنية زرقاء) */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2"></div>
        
        {/* توهج خفيف في الزاوية السفلية */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-info/5 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"></div>

      </div>
    </>
  );
};

export default RamadanTheme;
