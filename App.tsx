import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import {
  LayoutDashboard, Users, CalendarCheck, BarChart3,
  Settings as SettingsIcon, Info, FileText, BookOpen, Medal, Loader2, CheckSquare, Library, CloudSync, X
} from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import TeacherTasks from './components/TeacherTasks';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Leaderboard from './components/Leaderboard';
import About from './components/About';
import UserGuide from './components/UserGuide';
import BrandLogo from './components/BrandLogo';
import WelcomeScreen from './components/WelcomeScreen';
import StudentGroups from './components/StudentGroups';
import TeacherLibrary from './components/TeacherLibrary';
import { useSchoolBell } from './hooks/useSchoolBell';

// 🚀 استدعاء الثيم الداكن الزجاجي (الوحيد المعتمد الآن)
import RamadanTheme from './components/RamadanTheme'; 
import GlobalSyncManager from './components/GlobalSyncManager'; 

const DrawerSheet: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    dir: string;
}> = ({ isOpen, onClose, children, dir }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div
                className={`fixed z-[10001] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                    max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85vh] max-md:rounded-t-[2.5rem]
                    md:inset-y-0 ${dir === 'rtl' ? 'md:left-0 md:rounded-r-[2.5rem]' : 'md:right-0 md:rounded-l-[2.5rem]'} md:w-[450px] md:h-full
                    bg-[#0B1120]/95 backdrop-blur-2xl text-white
                    ${isOpen
                        ? `translate-y-0 md:translate-x-0`
                        : `max-md:translate-y-full ${dir === 'rtl' ? 'md:-translate-x-[150%]' : 'md:translate-x-[150%]'} shadow-none` 
                    }
                `}
            >
                <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0 cursor-pointer" onClick={onClose}>
                    <div className="w-10 h-1.5 rounded-full bg-white/20" />
                </div>
                <button
                    onClick={onClose}
                    className={`hidden md:flex absolute top-4 ${dir === 'rtl' ? 'right-4' : 'left-4'} p-2 rounded-full transition-colors z-[102] hover:bg-white/10 text-white/70 hover:text-white`}
                >
                    <X size={20} />
                </button>
                <div className="flex-1 flex flex-col overflow-hidden md:pt-10">
                    {children}
                </div>
            </div>
        </>
    );
};

const NavIconWrapper = ({ active, children }: any) => (
  <div className={`w-full h-full flex flex-col items-center justify-center transition-all duration-500 ${active ? 'scale-110' : 'opacity-50'}`}>
    <div className={`relative p-2 rounded-2xl transition-all duration-500 ${active ? 'bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}`}>
      {children}
    </div>
  </div>
);

const Dashboard3D = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <LayoutDashboard size={24} className={active ? 'text-blue-500' : 'text-white'} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const Attendance3D = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <CalendarCheck size={24} className={active ? 'text-blue-500' : 'text-white'} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const Students3D = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <Users size={24} className={active ? 'text-blue-500' : 'text-white'} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const Grades3D = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <BarChart3 size={24} className={active ? 'text-blue-500' : 'text-white'} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const Tasks3D = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <CheckSquare size={24} className={active ? 'text-blue-500' : 'text-white'} strokeWidth={active ? 2.5 : 2} />
  </NavIconWrapper>
);

const More3D = ({ active }: any) => (
  <NavIconWrapper active={active}>
    <div className="grid grid-cols-2 gap-1">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`w-2 h-2 rounded-sm border ${active ? 'bg-blue-500 border-blue-500' : 'border-white/60'}`}></div>
      ))}
    </div>
  </NavIconWrapper>
);

const AppContent: React.FC = () => {
  const {
    isDataLoaded, students, setStudents, classes, setClasses,
    teacherInfo, setTeacherInfo, schedule, setSchedule,
    periodTimes, setPeriodTimes, currentSemester, setCurrentSemester,
    t, dir, language
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [appVersion, setAppVersion] = useState('4.4.1');
  
  const [showWelcome, setShowWelcome] = useState<boolean>(() => !localStorage.getItem('rased_welcome_seen'));
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => localStorage.getItem('bell_enabled') === 'true');

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        if (window.electron && window.electron.getAppVersion) {
          const ver = await window.electron.getAppVersion();
          setAppVersion(ver);
        } else if (Capacitor.isNativePlatform()) {
          const info = await CapacitorApp.getInfo();
          setAppVersion(info.version);
        }
      } catch (error) { console.error("Version error", error); }
    };
    fetchVersion();
  }, []);

  useSchoolBell(periodTimes, schedule, notificationsEnabled);

  const handleToggleNotifications = () => {
    setNotificationsEnabled(prev => {
      const newState = !prev;
      localStorage.setItem('bell_enabled', String(newState));
      return newState;
    });
  };

  const handleFinishWelcome = () => {
    localStorage.setItem('rased_welcome_seen', 'true');
    setShowWelcome(false);
  };

  const mobileNavItems = [
    { id: 'dashboard', label: t('navDashboard') || (dir === 'rtl' ? 'الرئيسية' : 'Dashboard'), IconComponent: Dashboard3D },
    { id: 'attendance', label: t('navAttendance') || (dir === 'rtl' ? 'الغياب' : 'Attendance'), IconComponent: Attendance3D },
    { id: 'students', label: t('navStudents') || (dir === 'rtl' ? 'الطلاب' : 'Students'), IconComponent: Students3D },
    { id: 'grades', label: t('navGrades') || (dir === 'rtl' ? 'الدرجات' : 'Grades'), IconComponent: Grades3D },
    { id: 'tasks', label: t('navTasks') || t('tasks') || (dir === 'rtl' ? 'المهام' : 'Tasks'), IconComponent: Tasks3D },
  ];
  
  const desktopNavItems = [
    { id: 'dashboard', label: t('navDashboard') || (dir === 'rtl' ? 'الرئيسية' : 'Dashboard'), icon: LayoutDashboard },
    { id: 'attendance', label: t('navAttendance') || (dir === 'rtl' ? 'الغياب' : 'Attendance'), icon: CalendarCheck },
    { id: 'students', label: t('navStudents') || (dir === 'rtl' ? 'الطلاب' : 'Students'), icon: Users },
    { id: 'groups', label: t('navGroups') || (dir === 'rtl' ? 'المجموعات' : 'Groups'), icon: Users },
    { id: 'grades', label: t('navGrades') || (dir === 'rtl' ? 'الدرجات' : 'Grades'), icon: BarChart3 },
    { id: 'tasks', label: t('navTasks') || t('tasks') || (dir === 'rtl' ? 'المهام' : 'Tasks'), icon: CheckSquare },
    { id: 'library', label: t('navLibrary') || t('library') || (dir === 'rtl' ? 'المكتبة' : 'Library'), icon: Library },
    { id: 'leaderboard', label: t('navKnights') || (dir === 'rtl' ? 'الفرسان' : 'Leaderboard'), icon: Medal },
    { id: 'reports', label: t('navReports') || (dir === 'rtl' ? 'التقارير' : 'Reports'), icon: FileText },
    { id: 'sync', label: t('navSync') || (dir === 'rtl' ? 'مزامنة السحابة' : 'Cloud Sync'), icon: CloudSync },
    { id: 'guide', label: t('navGuide') || (dir === 'rtl' ? 'الدليل' : 'Guide'), icon: BookOpen },
    { id: 'settings', label: t('navSettings') || (dir === 'rtl' ? 'الإعدادات' : 'Settings'), icon: SettingsIcon },
    { id: 'about', label: t('navAbout') || (dir === 'rtl' ? 'حول' : 'About'), icon: Info },
  ];

  if (!isDataLoaded) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center fixed inset-0 z-[99999] bg-[#0B1120]" dir={dir}>
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="font-medium text-sm text-slate-300">{t('loadingData') || (dir === 'rtl' ? 'جاري تحميل البيانات...' : 'Loading Data...')}</p>
      </div>
    );
  }

  if (showWelcome) return <WelcomeScreen onFinish={handleFinishWelcome} />;

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard
          students={students} teacherInfo={teacherInfo} onUpdateTeacherInfo={(i) => setTeacherInfo(prev => ({ ...prev, ...i }))}
          schedule={schedule} onUpdateSchedule={setSchedule} onSelectStudent={() => { }} onNavigate={handleNavigate}
          onOpenSettings={() => setActiveTab('settings')} periodTimes={periodTimes} setPeriodTimes={setPeriodTimes}
          notificationsEnabled={notificationsEnabled} onToggleNotifications={handleToggleNotifications}
          currentSemester={currentSemester} onSemesterChange={setCurrentSemester}
        />;
      case 'tasks': return <TeacherTasks students={students} teacherSubject={teacherInfo?.subject || 'عام'} />;
      case 'library': return <TeacherLibrary />;
      case 'attendance': return <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />;
      case 'students':
        return <StudentList
          students={students} classes={classes} onAddClass={(n) => setClasses(p => [...p, n])} 
          onAddStudentManually={(n, c, p, a, g, cid) => setStudents(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: n, classes: [c], attendance: [], behaviors: [], grades: [], grade: '', parentPhone: p, avatar: a, gender: g || 'male', parentCode: cid }])}
          onBatchAddStudents={(newS) => setStudents(prev => [...prev, ...newS])} 
          onUpdateStudent={(u) => setStudents(p => p.map(s => s.id === u.id ? u : s))}
          onDeleteStudent={(id) => setStudents(p => p.filter(s => s.id !== id))} 
          onViewReport={() => {}} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} 
          onDeleteClass={(cn) => setClasses(p => p.filter(c => c !== cn))}
        />;
      case 'groups': return <StudentGroups />;
      case 'grades': return <GradeBook students={students} classes={classes} onUpdateStudent={(u) => setStudents(p => p.map(s => s.id === u.id ? u : s))} setStudents={setStudents} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo} />;
      case 'leaderboard': return <Leaderboard students={students} classes={classes} onUpdateStudent={(u) => setStudents(p => p.map(s => s.id === u.id ? u : s))} teacherInfo={teacherInfo} />;
      case 'reports': return <Reports />;
      case 'sync': return <GlobalSyncManager />;
      case 'guide': return <UserGuide />;
      case 'settings': return <Settings />;
      case 'about': return <About />;
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col h-screen font-sans overflow-hidden relative bg-transparent text-white ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
  
      <RamadanTheme />

      {/* 🖥️ الشريط العلوي للديسكتوب */}
      <div 
        className="hidden md:flex w-full h-12 shrink-0 items-center justify-between px-4 relative z-[99999] shadow-sm bg-[#0B1120]/50 backdrop-blur-md"
        style={{ WebkitAppRegion: 'drag' as any }}
      >
        <div className="w-20 flex justify-start" style={{ WebkitAppRegion: 'no-drag' as any }}>
            {/* مساحة فارغة بعد إزالة زر الثيم للتوازن */}
        </div>
        
        <span className="text-xs font-black tracking-widest uppercase opacity-90 text-blue-400">
          {t('appNameMain') || 'راصد'} - {t('appSubtitleMain') || 'نسخة المعلم'}
        </span>
        
        <div className="w-20"></div> 
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10 w-full bg-transparent">
        
        {/* Sidebar (Desktop) */}
        <aside className={`hidden md:flex w-72 flex-col z-50 h-full relative border-white/5 bg-[#0B1120]/70 backdrop-blur-2xl ${dir === 'rtl' ? 'border-l' : 'border-r'}`}>
          <div className="p-8 flex items-center gap-4 relative z-10" style={{ WebkitAppRegion: 'no-drag' as any }}>
            <div className="shrink-0" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                <BrandLogo style={{ width: '100%', height: '100%', objectFit: 'contain' }} showText={false} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-white">{t('appNameMain') || 'راصد'}</h1>
              <span className="text-[10px] font-bold text-blue-400">{t('appSubtitleMain') || 'النسخة المتقدمة'}</span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-4 relative z-10">
            {desktopNavItems.map(item => (
              <button key={item.id} onClick={() => handleNavigate(item.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                <item.icon className="w-5 h-5" />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 bg-transparent">
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 md:pb-4 px-4 md:px-8 pt-safe relative z-10">
            <div className="max-w-5xl mx-auto w-full min-h-full">{renderContent()}</div>
          </div>
        </main>
      </div>

      {/* Bottom Nav (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] flex justify-around items-end border-t border-white/10 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-[#0B1120]/95 backdrop-blur-2xl">
        {mobileNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => handleNavigate(item.id)} className="relative w-full h-full flex flex-col items-center justify-end pb-1 active:scale-90 transition-transform">
              <div className={`absolute top-0 transition-all duration-500 ${isActive ? '-translate-y-7 scale-110' : 'translate-y-1 scale-90'}`}>
                <div className="w-11 h-11"><item.IconComponent active={isActive} /></div>
              </div>
              <span className={`text-[10px] font-black ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>{item.label}</span>
            </button>
          );
        })}
        <button onClick={() => setShowMoreMenu(true)} className="relative w-full h-full flex flex-col items-center justify-end pb-1">
          <div className="absolute top-0 translate-y-1 scale-90 w-11 h-11"><More3D active={showMoreMenu} /></div>
          <span className="text-[10px] font-black text-slate-400">{t('navMore') || (dir === 'rtl' ? 'المزيد' : 'More')}</span>
        </button>
      </div>

      <DrawerSheet isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} dir={dir}>
         <div className="flex flex-col h-full w-full">
            <div className="px-6 pb-4 shrink-0 text-center flex items-center justify-center">
               <h2 className="text-xl font-black text-white">{t('navMore') || (dir === 'rtl' ? 'المزيد' : 'More')}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
               <div className="grid grid-cols-3 gap-3">
                 
                  <button onClick={() => handleNavigate('groups')} className="group p-4 rounded-3xl flex flex-col items-center justify-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-300">
                    <div className="p-2.5 rounded-2xl transition-colors bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <Users size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[10px] tracking-wide text-white">{t('navGroups') || (dir === 'rtl' ? 'المجموعات' : 'Groups')}</span>
                  </button>

                  <button onClick={() => handleNavigate('leaderboard')} className="group p-4 rounded-3xl flex flex-col items-center justify-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-300">
                    <div className="p-2.5 rounded-2xl transition-colors bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <Medal size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[10px] tracking-wide text-white">{t('navKnights') || (dir === 'rtl' ? 'الفرسان' : 'Knights')}</span>
                  </button>

                  <button onClick={() => handleNavigate('reports')} className="group p-4 rounded-3xl flex flex-col items-center justify-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-300">
                    <div className="p-2.5 rounded-2xl transition-colors bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <FileText size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[10px] tracking-wide text-white">{t('navReports') || (dir === 'rtl' ? 'التقارير' : 'Reports')}</span>
                  </button>

                  <button onClick={() => handleNavigate('settings')} className="group p-4 rounded-3xl flex flex-col items-center justify-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-300">
                    <div className="p-2.5 rounded-2xl transition-colors bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <SettingsIcon size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[10px] tracking-wide text-white">{t('navSettings') || (dir === 'rtl' ? 'الإعدادات' : 'Settings')}</span>
                  </button>

                  <button onClick={() => handleNavigate('guide')} className="group p-4 rounded-3xl flex flex-col items-center justify-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-300">
                    <div className="p-2.5 rounded-2xl transition-colors bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <BookOpen size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[10px] tracking-wide text-white">{t('navGuideShort') || t('navGuide') || (dir === 'rtl' ? 'الدليل' : 'Guide')}</span>
                  </button>

                  <button onClick={() => handleNavigate('about')} className="group p-4 rounded-3xl flex flex-col items-center justify-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-300">
                    <div className="p-2.5 rounded-2xl transition-colors bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <Info size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[10px] tracking-wide text-white">{t('navAbout') || (dir === 'rtl' ? 'حول' : 'About')}</span>
                  </button>

                  <button onClick={() => handleNavigate('library')} className="group p-4 rounded-3xl flex flex-col items-center justify-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-300">
                    <div className="p-2.5 rounded-2xl transition-colors bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <Library size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[10px] tracking-wide text-white">{t('navLibrary') || t('library') || (dir === 'rtl' ? 'المكتبة' : 'Library')}</span>
                  </button>

                  <button onClick={() => handleNavigate('sync')} className="group p-4 rounded-3xl flex flex-col items-center justify-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10 active:scale-90 transition-all duration-300">
                    <div className="p-2.5 rounded-2xl transition-colors bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
                      <CloudSync size={24} strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-[10px] tracking-wide text-white">مزامنة السحابة</span>
                  </button>

               </div>
            </div>
         </div>
      </DrawerSheet>

    </div>
  );
};

const App: React.FC = () => (
    <AppProvider>
      <AppContent />
    </AppProvider>
);

export default App;
