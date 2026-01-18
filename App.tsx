
import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { 
  LayoutDashboard, Users, CalendarCheck, BarChart3, 
  Settings as SettingsIcon, Grid, Trophy, Crown, 
  Building2, Globe, Info, Lock, FileText, Menu, BookOpen
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Modal from './components/Modal';
import GamificationHub from './components/GamificationHub';
import GroupCompetition from './components/GroupCompetition';
import MinistrySync from './components/MinistrySync';
import NoorPlatform from './components/NoorPlatform';
import About from './components/About';
import UserGuide from './components/UserGuide';
import BrandLogo from './components/BrandLogo';
import WelcomeScreen from './components/WelcomeScreen'; // Import WelcomeScreen
import { Loader2 } from 'lucide-react';
import { useSchoolBell } from './hooks/useSchoolBell';
import { App as CapacitorApp } from '@capacitor/app';

// Main App Container
const AppContent: React.FC = () => {
  const { 
      isDataLoaded, students, setStudents, classes, setClasses, 
      teacherInfo, setTeacherInfo, schedule, setSchedule, 
      periodTimes, setPeriodTimes, currentSemester, setCurrentSemester,
      groups, setGroups 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  // Welcome Screen State
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
      return !localStorage.getItem('rased_welcome_seen');
  });

  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
      return localStorage.getItem('bell_enabled') === 'true';
  });

  // Activate Bell Hook
  useSchoolBell(periodTimes, schedule, notificationsEnabled);

  // Toggle Handler
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
  
  // Handle Loading State
  if (!isDataLoaded) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-gray-50">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
      );
  }

  // Show Welcome Screen if first time
  if (showWelcome) {
      return <WelcomeScreen onFinish={handleFinishWelcome} />;
  }

  // Navigation Handlers
  const handleNavigate = (tab: string) => {
      setActiveTab(tab);
      setShowMoreMenu(false);
  };

  // Helper Wrappers
  const handleUpdateStudent = (updated: any) => setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  const handleAddClass = (name: string) => setClasses(prev => [...prev, name]);
  
  const handleDeleteClass = (className: string) => {
      setClasses(prev => prev.filter(c => c !== className));
      setStudents(prev => prev.map(s => {
          if (s.classes.includes(className)) {
              return { ...s, classes: s.classes.filter(c => c !== className) };
          }
          return s;
      }));
  };

  const handleAddStudent = (name: string, className: string, phone?: string, avatar?: string) => {
      setStudents(prev => [...prev, { 
          id: Math.random().toString(36).substr(2,9), 
          name, classes: [className], attendance:[], behaviors:[], grades:[], grade: '', parentPhone: phone, avatar: avatar
      }]);
  };

  const renderContent = () => {
      switch (activeTab) {
          case 'dashboard':
              return <Dashboard 
                  students={students} teacherInfo={teacherInfo} onUpdateTeacherInfo={(i) => setTeacherInfo(prev => ({...prev, ...i}))}
                  schedule={schedule} onUpdateSchedule={setSchedule} onSelectStudent={() => {}} onNavigate={handleNavigate}
                  onOpenSettings={() => setActiveTab('settings')} periodTimes={periodTimes} setPeriodTimes={setPeriodTimes}
                  notificationsEnabled={notificationsEnabled} onToggleNotifications={handleToggleNotifications}
                  currentSemester={currentSemester} onSemesterChange={setCurrentSemester}
              />;
          case 'attendance': return <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />;
          case 'students':
              return <StudentList 
                  students={students} classes={classes} onAddClass={handleAddClass} onAddStudentManually={handleAddStudent}
                  onBatchAddStudents={(newS) => setStudents(prev => [...prev, ...newS])} onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={(id) => setStudents(prev => prev.filter(s => s.id !== id))} onViewReport={(s) => {}}
                  currentSemester={currentSemester} onSemesterChange={setCurrentSemester} onDeleteClass={handleDeleteClass}
              />;
          case 'grades':
              return <GradeBook 
                  students={students} classes={classes} onUpdateStudent={handleUpdateStudent} setStudents={setStudents}
                  currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo}
              />;
          case 'reports': return <Reports />;
          case 'noor': return <NoorPlatform />;
          case 'guide': return <UserGuide />;
          case 'settings': return <Settings />;
          case 'about': return <About />;
          default: return <Dashboard students={students} teacherInfo={teacherInfo} onUpdateTeacherInfo={() => {}} schedule={schedule} onUpdateSchedule={() => {}} onSelectStudent={() => {}} onNavigate={handleNavigate} onOpenSettings={() => {}} periodTimes={periodTimes} setPeriodTimes={() => {}} notificationsEnabled={false} onToggleNotifications={() => {}} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} />;
      }
  };

  // Mobile Bottom Bar Items
  const mobileNavItems = [
      { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
      { id: 'attendance', label: 'الحضور', icon: CalendarCheck },
      { id: 'students', label: 'الطلاب', icon: Users },
      { id: 'grades', label: 'الدرجات', icon: BarChart3 },
  ];

  const desktopNavItems = [
      { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
      { id: 'attendance', label: 'الحضور', icon: CalendarCheck },
      { id: 'students', label: 'الطلاب', icon: Users },
      { id: 'grades', label: 'الدرجات', icon: BarChart3 },
      { id: 'reports', label: 'التقارير', icon: FileText },
      { id: 'noor', label: 'منصة نور', icon: Globe },
      { id: 'guide', label: 'دليل المستخدم', icon: BookOpen },
      { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
      { id: 'about', label: 'حول التطبيق', icon: Info },
  ];

  const isMoreActive = !mobileNavItems.some(item => item.id === activeTab);

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans overflow-hidden text-slate-900 relative">
        
        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="hidden md:flex w-72 flex-col bg-white border-l border-slate-200 z-50 shadow-sm transition-all h-full">
            <div className="p-8 flex items-center gap-4">
                <div className="w-12 h-12">
                    <BrandLogo className="w-full h-full" showText={false} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">راصد</h1>
                    <span className="text-[10px] font-bold text-indigo-600 tracking-wider">نسخة المعلم</span>
                </div>
            </div>

            <div className="px-6 mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 shadow-sm shrink-0">
                         {teacherInfo.avatar ? <img src={teacherInfo.avatar} className="w-full h-full object-cover"/> : <span className="font-black text-slate-500 text-lg">{teacherInfo.name?.[0]}</span>}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate">{teacherInfo.name || 'مرحباً بك'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{teacherInfo.school || 'المدرسة'}</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar pb-4">
                {desktopNavItems.map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                                isActive 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-100'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} transition-colors`} strokeWidth={2.5} />
                            <span className="font-bold text-sm">{item.label}</span>
                            {isActive && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                        </button>
                    );
                })}
            </nav>

            <div className="p-6 text-center border-t border-slate-200">
                <p className="text-[10px] font-bold text-gray-400">الإصدار 3.6.0</p>
            </div>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        {/* تم إزالة القائمة السفلية من هنا لضمان عدم تأثرها بالتمرير أو التراكب */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#f3f4f6]">
            <div 
                className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-28 md:pb-4 px-4 md:px-8 pt-safe overscroll-contain"
                id="main-scroll-container"
            >
                <div className="max-w-5xl mx-auto w-full min-h-full">
                    {renderContent()}
                </div>
            </div>
        </main>

        {/* --- MOBILE TAB BAR (Moved to Root Level for better Z-Index & Touch Handling) --- */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-[60px] bg-white rounded-t-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex justify-around items-end pb-2 border-t border-slate-100 pb-safe safe-area-bottom">
            {mobileNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id)}
                        className="relative w-full h-full flex flex-col items-center justify-end group pb-1 touch-manipulation"
                    >
                        <span 
                            className={`
                                absolute top-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-none
                                ${isActive 
                                    ? 'w-14 h-14 bg-indigo-600 rounded-full -mt-6 border-[6px] border-[#f3f4f6] shadow-[0_10px_20px_rgba(79,70,229,0.3)] flex items-center justify-center transform scale-100 opacity-100' 
                                    : 'w-0 h-0 bg-transparent border-0 opacity-0 scale-0 translate-y-12'
                                }
                            `}
                        >
                           {isActive && <item.icon className="w-6 h-6 text-white animate-in fade-in zoom-in duration-300" strokeWidth={2.5} />}
                        </span>

                        <span 
                            className={`
                                transition-all duration-300 mb-1 group-hover:scale-110 group-active:scale-95 pointer-events-none
                                ${isActive 
                                    ? 'opacity-0 scale-0 translate-y-10' 
                                    : 'opacity-100 scale-100 text-gray-400 group-hover:text-indigo-500'
                                }
                            `}
                        >
                            <item.icon className="w-6 h-6" strokeWidth={2} />
                        </span>

                        <span 
                            className={`
                                text-[10px] font-black transition-all duration-300 pointer-events-none
                                ${isActive ? 'translate-y-1 text-indigo-600 opacity-100' : 'text-gray-400 opacity-80 group-hover:text-indigo-500'}
                            `}
                        >
                            {item.label}
                        </span>
                    </button>
                );
            })}
            
            <button
                onClick={() => setShowMoreMenu(true)}
                className="relative w-full h-full flex flex-col items-center justify-end group pb-1 touch-manipulation"
            >
                <span 
                    className={`
                        absolute top-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-none
                        ${isMoreActive 
                            ? 'w-14 h-14 bg-indigo-600 rounded-full -mt-6 border-[6px] border-[#f3f4f6] shadow-[0_10px_20px_rgba(79,70,229,0.3)] flex items-center justify-center transform scale-100 opacity-100' 
                            : 'w-0 h-0 bg-transparent border-0 opacity-0 scale-0 translate-y-12'
                        }
                    `}
                >
                   {isMoreActive && <Grid className="w-6 h-6 text-white animate-in fade-in zoom-in duration-300" strokeWidth={2.5} />}
                </span>

                <span 
                    className={`
                        transition-all duration-300 mb-1 group-hover:scale-110 group-active:scale-95 pointer-events-none
                        ${isMoreActive 
                            ? 'opacity-0 scale-0 translate-y-10' 
                            : 'opacity-100 scale-100 text-gray-400 group-hover:text-indigo-500'
                        }
                    `}
                >
                    <Grid className="w-6 h-6" strokeWidth={2} />
                </span>

                <span 
                    className={`
                        text-[10px] font-black transition-all duration-300 pointer-events-none
                        ${isMoreActive ? 'translate-y-1 text-indigo-600 opacity-100' : 'text-gray-400 opacity-80 group-hover:text-indigo-500'}
                    `}
                >
                    المزيد
                </span>
            </button>
        </div>

        {/* Mobile Menu Modal */}
        <Modal isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} className="max-w-md rounded-[2rem] mb-28 md:hidden">
            <div className="text-center mb-6">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                <h3 className="font-black text-slate-800 text-lg">القائمة الكاملة</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <button onClick={() => handleNavigate('reports')} className="p-4 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform border border-indigo-200 aspect-square shadow-sm">
                    <FileText className="w-7 h-7 text-indigo-600" />
                    <span className="font-bold text-[10px] text-indigo-800">التقارير</span>
                </button>
                
                <button onClick={() => handleNavigate('noor')} className="p-4 bg-cyan-50 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform border border-cyan-200 aspect-square shadow-sm">
                    <Globe className="w-7 h-7 text-cyan-600" />
                    <span className="font-bold text-[10px] text-cyan-800">منصة نور</span>
                </button>

                <button onClick={() => handleNavigate('settings')} className="p-4 bg-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform border border-gray-300 aspect-square shadow-sm">
                    <SettingsIcon className="w-7 h-7 text-gray-600" />
                    <span className="font-bold text-[10px] text-gray-800">الإعدادات</span>
                </button>

                <button onClick={() => handleNavigate('guide')} className="p-4 bg-amber-50 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform border border-amber-200 aspect-square shadow-sm">
                    <BookOpen className="w-7 h-7 text-amber-600" />
                    <span className="font-bold text-[10px] text-amber-800">الدليل</span>
                </button>

                <button onClick={() => handleNavigate('about')} className="p-4 bg-purple-50 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform border border-purple-200 aspect-square shadow-sm">
                    <Info className="w-7 h-7 text-purple-600" />
                    <span className="font-bold text-[10px] text-purple-800">حول التطبيق</span>
                </button>
            </div>
        </Modal>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
