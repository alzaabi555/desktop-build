import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'glass' | 'ramadan';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('rased-theme') as Theme) || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement; // وسم <html>
    const body = window.document.body; // وسم <body>

    // مسح الثيمات القديمة من HTML و Body
    const themes = ['light', 'dark', 'glass', 'ramadan'];
    root.classList.remove(...themes);
    body.classList.remove(...themes);

    // فرض الثيم الجديد بقوة
    root.classList.add(theme);
    body.classList.add(theme);
    
    localStorage.setItem('rased-theme', theme);
    
    // دليل قاطع للتأكد أن الأوامر وصلت للشاشة
    console.log("🔥 تم حقن الثيم في الشاشة بنجاح:", theme, "| كلاسات الـ HTML الآن هي:", root.className);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};