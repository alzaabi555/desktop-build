
import React from 'react';
import { ExternalLink, Building2, Lock, ShieldCheck, ChevronRight, Smartphone } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const MinistrySync: React.FC = () => {
  const url = "https://certificate.moe.gov.om/Portal/Services/UserLoginnew.aspx";

  const handleOpenPlatform = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: url, presentationStyle: 'fullscreen' });
    } else {
        window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full glass-heavy rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in fade-in duration-500 border border-white/20">
      
      {/* Decorative Header */}
      <div className="p-8 flex flex-col items-center justify-center text-center border-b border-white/10 bg-white/5 backdrop-blur-md">
         <div className="w-24 h-24 glass-icon rounded-[2rem] flex items-center justify-center relative shadow-xl shadow-emerald-500/10 mb-6 border border-white/20">
            <Building2 className="w-10 h-10 text-emerald-500" />
            <div className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-xl border-2 border-white/10 shadow-lg">
                <Lock className="w-4 h-4 text-white" />
            </div>
         </div>
         
         <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 text-glow">البوابة التعليمية</h2>
         <p className="text-xs font-bold text-slate-500 dark:text-white/60 max-w-[280px] leading-relaxed">
            تسجيل الدخول - وزارة التربية والتعليم
         </p>
      </div>

      {/* Action Section */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
         
         <div className="glass-card p-4 rounded-2xl border border-amber-500/20 w-full bg-amber-500/10">
            <div className="flex gap-3 items-start">
               <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-amber-100/90 leading-relaxed text-right">
                  سيتم فتح صفحة تسجيل الدخول في نافذة آمنة. 
                  <br/>
                  للعودة للتطبيق، استخدم زر <strong>"Done"</strong> أو <strong>"إغلاق"</strong>.
               </p>
            </div>
         </div>

         <button 
            onClick={handleOpenPlatform}
            className="group w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl p-3 pl-4 flex items-center transition-all shadow-xl shadow-emerald-500/30 active:scale-95 border border-emerald-400/50"
         >
            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <ExternalLink className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-right pr-4">
                <span className="block text-sm font-black">الدخول للبوابة</span>
                <span className="block text-[9px] font-bold text-emerald-200">certificate.moe.gov.om</span>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-200" />
         </button>

      </div>
      
      {/* Footer */}
      <div className="p-4 text-center border-t border-white/5">
         <p className="text-[9px] font-bold text-slate-400 dark:text-white/30 flex items-center justify-center gap-1">
            <Smartphone className="w-3 h-3" />
            متصفح داخلي محسن
         </p>
      </div>

    </div>
  );
};

export default MinistrySync;
