import React, { useState, UIEvent } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useApp } from "../context/AppContext";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightActions?: React.ReactNode;
  leftActions?: React.ReactNode; 
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  icon,
  rightActions,
  leftActions,
  children,
  showBackButton,
  onBack
}) => {
  const { dir } = useApp();
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrollY(e.currentTarget.scrollTop);
  };

  // 💉 تفعيل حالة التقلص عند النزول أكثر من 20 بكسل
  const isScrolled = scrollY > 20;
  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  return (
    // 💉 1. استخدام h-full بدلاً من h-[100dvh] لكي يحترم القائمة الجانبية في الويندوز
    <div className="relative w-full h-full flex flex-col bg-bgSoft text-textPrimary overflow-hidden" dir={dir}>
      
      {/* ================= 🩺 الهيدر المرن (Flex Item) ================= */}
      {/* 💉 2. إزالة fixed left-0 right-0 واستخدام shrink-0 ليبقى الهيدر أعلى الصفحة بأدب دون تخطي حدوده */}
      <header 
        className={`shrink-0 w-full z-40 transition-all duration-300 border-b ${
          isScrolled 
            ? 'bg-bgCard/90 backdrop-blur-md border-borderColor shadow-sm' 
            : 'bg-bgSoft border-transparent'
        }`}
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 12px)' 
        }}
      >
        <div className="px-4 pb-3 flex flex-col w-full">
          <div className="flex items-center justify-between w-full">
            
            <div className="flex items-center gap-3">
              {showBackButton && (
                <button onClick={onBack} className="p-2 -mx-2 rounded-xl text-textSecondary hover:bg-bgCard active:scale-95 transition-all">
                  <BackIcon size={24} />
                </button>
              )}
              
              {icon && (
                <div 
                  className={`rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all duration-300 shrink-0 ${isScrolled ? 'w-9 h-9' : 'w-11 h-11'}`}
                >
                  {icon}
                </div>
              )}
              
              <div className="flex flex-col justify-center">
                <h1 
                  className="font-black text-textPrimary transition-all duration-300 origin-left"
                  style={{ fontSize: isScrolled ? '18px' : '22px' }}
                >
                  {title}
                </h1>
                
                {subtitle && (
                  <div 
                    className="transition-all duration-300 overflow-hidden"
                    style={{
                      height: isScrolled ? '0px' : '18px',
                      opacity: isScrolled ? 0 : 1
                    }}
                  >
                    <p className="text-[11px] font-bold text-textSecondary mt-0.5 whitespace-nowrap">
                      {subtitle}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {rightActions}
            </div>
          </div>

          {/* 💉 الفلاتر والبحث (تختفي بذكاء مع النزول) */}
          {leftActions && (
            <div 
              className="w-full transition-all duration-300 overflow-hidden origin-top"
              style={{
                maxHeight: isScrolled ? '0px' : '150px',
                opacity: isScrolled ? 0 : 1,
                marginTop: isScrolled ? '0px' : '16px'
              }}
            >
              {leftActions}
            </div>
          )}
        </div>
      </header>

      {/* ================= 📝 منطقة المحتوى (Scrollable Area) ================= */}
      {/* 💉 3. المحتوى يأخذ المساحة المتبقية (flex-1) وينزلق بشكل طبيعي بدون الحاجة لمساحة دافعة (Spacer) */}
      <main 
        className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar relative"
        onScroll={handleScroll}
      >
        <div className="px-4 pb-32 pt-4 w-full">
          {children}
        </div>
      </main>

    </div>
  );
};

export default PageLayout;
