import React, { useState, useEffect } from 'react';
import { Moon, Star } from 'lucide-react';

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

  // إذا لم يكن رمضان، يختفي المكون تماماً ولا يستهلك موارد
  if (!isRamadan) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* 1. السماء الليلية العميقة (أزرق داكن إلى بنفسجي ليلي) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617]"></div>
      
      {/* 2. وهج سحري في الزوايا العلوية والسفلية */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

      {/* 3. الهلال الذهبي المضيء (للشاشات الكبيرة) */}
      <div className="absolute top-12 right-12 opacity-80 hidden md:block">
        <Moon size={160} className="text-amber-300 fill-amber-300 drop-shadow-[0_0_30px_rgba(252,211,77,0.6)] transform -rotate-12" />
      </div>
      
      {/* الهلال الذهبي المضيء (للجوالات) */}
      <div className="absolute top-24 left-8 opacity-60 md:hidden">
        <Moon size={80} className="text-amber-300 fill-amber-300 drop-shadow-[0_0_20px_rgba(252,211,77,0.5)] transform -rotate-12" />
      </div>

      {/* 4. نجوم تتلألأ في السماء (تأثير النبض البطيء) */}
      <div className="absolute top-20 left-1/4 animate-[pulse_4s_ease-in-out_infinite]">
        <Star size={24} className="text-amber-200 fill-amber-200 opacity-60" />
      </div>
      <div className="absolute top-40 right-1/3 animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}>
        <Star size={16} className="text-amber-100 fill-amber-100 opacity-40" />
      </div>
      <div className="absolute bottom-1/3 left-12 animate-[pulse_5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}>
        <Star size={32} className="text-amber-300 fill-amber-300 opacity-30" />
      </div>
      <div className="absolute top-1/2 right-20 animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}>
        <Star size={20} className="text-indigo-200 fill-indigo-200 opacity-50" />
      </div>
    </div>
  );
};

export default RamadanTheme;
