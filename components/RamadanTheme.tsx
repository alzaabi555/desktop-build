import React, { useState, useEffect } from 'react';
import { Moon, Star } from 'lucide-react';

// =========================================================================
// 🏮 مكون الفانوس الآمن 
// =========================================================================
const HangingLantern = ({ 
  stringLength, 
  size, 
  duration, 
  delay, 
  position 
}: { 
  stringLength: number, 
  size: number, 
  duration: number, 
  delay: number, 
  position: string 
}) => (
  <div
    className={`absolute top-0 ${position} flex flex-col items-center pointer-events-none`}
    style={{
      animation: `swing ${duration}s ease-in-out infinite alternate`,
      animationDelay: `${delay}s`,
      transformOrigin: 'top center'
    }}
  >
    {/* حبل الفانوس */}
    <div 
      style={{ 
        width: '2px', 
        height: `${stringLength}px`, 
        background: 'linear-gradient(to bottom, rgba(251,191,36,0.2), rgba(251,191,36,0.9))' 
      }}
    ></div>
    
    {/* جسم الفانوس */}
    <svg 
      width={size} 
      height={size * 1.6} 
      viewBox="0 0 60 95" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className="drop-shadow-[0_15px_25px_rgba(251,191,36,0.5)]"
    >
       {/* الحلقة العلوية */}
       <circle cx="30" cy="5" r="4" stroke="#fbbf24" strokeWidth="2"/>
       {/* قبة الفانوس */}
       <path d="M20 15 L40 15 L45 30 L15 30 Z" fill="#b45309"/>
       <path d="M25 15 L35 15 L38 30 L22 30 Z" fill="#f59e0b"/>
       {/* الزجاج المضيء (جسم الفانوس) */}
       <path d="M15 30 L45 30 L50 70 L10 70 Z" fill="#fef3c7" fillOpacity="0.15" stroke="#fbbf24" strokeWidth="2"/>
       {/* الشمعة / الضوء الداخلي المتوهج */}
       <circle cx="30" cy="55" r="8" fill="#fde047" className="animate-pulse" filter="blur(3px)"/>
       <circle cx="30" cy="55" r="3" fill="#ffffff" className="animate-pulse" />
       {/* خطوط الحماية المعدنية */}
       <path d="M30 30 L30 70 M13 50 L47 50" stroke="#fbbf24" strokeWidth="1.5" strokeOpacity="0.7"/>
       {/* القاعدة */}
       <path d="M15 70 L45 70 L40 80 L20 80 Z" fill="#b45309"/>
       <path d="M25 80 L35 80 L35 88 L25 88 Z" fill="#fbbf24"/>
    </svg>
  </div>
);


const RamadanTheme: React.FC = () => {
  const [isRamadan, setIsRamadan] = useState(false);

  useEffect(() => {
    try {
      const today = new Date();
      // المستشعر الهجري لمعرفة شهر رمضان (شهر 9)
      const hijriFormatter = new Intl.DateTimeFormat('en-TN-u-ca-islamic', { month: 'numeric' });
      const parts = hijriFormatter.formatToParts(today);
      const hMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
      
      if (hMonth === 9) {
        setIsRamadan(true);
      }
    } catch (e) {
      console.error("Hijri Date parsing skipped.");
    }
  }, []);

  if (!isRamadan) return null;

  return (
    <>
      {/* 🔮 أكواد الأنيميشن الحية */}
      <style>
        {`
          @keyframes swing {
            0% { transform: rotate(4deg); }
            100% { transform: rotate(-4deg); }
          }
          @keyframes floatCrescent {
            0% { transform: translateY(0px) rotate(-12deg); }
            50% { transform: translateY(-15px) rotate(-8deg); }
            100% { transform: translateY(0px) rotate(-12deg); }
          }
        `}
      </style>

      {/* ===================================================== */}
      {/* 🌌 الطبقة الخلفية (z-0) - السماء والنجوم فقط */}
      {/* ===================================================== */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        
        {/* السماء الليلية والتوهج */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617]"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

        {/* النجوم المتلألئة (بقيت في الخلف لتعطي إحساساً بالعمق) */}
        <div className="absolute top-32 left-1/4 animate-[pulse_4s_ease-in-out_infinite]"><Star size={20} className="text-amber-200 fill-amber-200 opacity-60" /></div>
        <div className="absolute top-60 right-1/4 animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}><Star size={14} className="text-amber-100 fill-amber-100 opacity-40" /></div>
        <div className="absolute bottom-1/3 left-12 animate-[pulse_5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}><Star size={28} className="text-amber-300 fill-amber-300 opacity-30" /></div>
        <div className="absolute top-1/2 right-20 animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}><Star size={18} className="text-indigo-200 fill-indigo-200 opacity-50" /></div>
      </div>

      {/* ===================================================== */}
      {/* 🏮 الطبقة الأمامية (z-100) - الهلال والفوانيس المتدلية */}
      {/* ===================================================== */}
      <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden select-none">
        
        {/* ======================================= */}
        {/* 🌙 الهلال العملاق العائم (تم نقله للأمام) */}
        {/* ======================================= */}
        <div className="absolute top-16 right-8 md:top-12 md:right-16 opacity-80" style={{ animation: 'floatCrescent 8s ease-in-out infinite' }}>
          <Moon size={180} className="text-amber-300 fill-amber-300 drop-shadow-[0_0_40px_rgba(252,211,77,0.7)]" />
          <div className="absolute top-1/2 left-1/4 animate-pulse">
              <Star size={24} className="text-amber-100 fill-amber-200 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
          </div>
        </div>

        {/* ======================================= */}
        {/* 🏮 الفوانيس المتدلية من الأعلى */}
        {/* ======================================= */}
        
        {/* فانوس يسار الشاشة (طويل) */}
        <HangingLantern stringLength={140} size={50} duration={3} delay={0} position="left-[10%] md:left-[15%]" />
        
        {/* فانوس وسط-يسار (قصير) */}
        <HangingLantern stringLength={70} size={35} duration={2.5} delay={0.5} position="left-[35%] md:left-[30%]" />
        
        {/* فانوس وسط-يمين (متوسط) - يختفي في الجوال لتجنب الزحمة */}
        <div className="hidden md:block">
          <HangingLantern stringLength={100} size={40} duration={3.5} delay={1} position="right-[35%]" />
        </div>

      </div>
    </>
  );
};

export default RamadanTheme;
