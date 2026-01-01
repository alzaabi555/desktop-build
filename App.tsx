
import React, { useState, useEffect, Suspense, ErrorInfo, ReactNode } from 'react';
import { Student, ScheduleDay, PeriodTime, Group } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import GroupCompetition from './components/GroupCompetition';
import UserGuide from './components/UserGuide';
import About from './components/About';
import Settings from './components/Settings'; // Imported Settings
import BrandLogo from './components/BrandLogo';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { useSchoolBell } from './hooks/useSchoolBell';
import { 
  LayoutDashboard, Users, CalendarCheck, BarChart3, FileText, 
  Trophy, Upload, HelpCircle, Info, 
  Menu, X, LogOut, Moon, Sun, Laptop, Zap, Settings as SettingsIcon
} from 'lucide-react';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(_: Error): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="p-10 text-center text-slate-800 dark:text-white glass-card m-10 rounded-3xl"><h1>حدث خطأ غير متوقع.</h1><button onClick={() => window.location.reload()} className="mt-4 bg-white/20 hover:bg-white/30 text-slate-800 dark:text-white px-6 py-2 rounded-xl backdrop-blur-md transition-all">إعادة تحميل</button></div>;
    return (this as any).props.children;
  }
}

const AppContent: React.FC = () => {
  const { 
      students, setStudents, classes, setClasses, groups, setGroups,
      schedule, setSchedule, periodTimes, setPeriodTimes,
      teacherInfo, setTeacherInfo, currentSemester, setCurrentSemester
  } = useApp();

  const { theme, setTheme, isDark, toggleLowPower, isLowPower } = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  // Custom Hooks
  useSchoolBell(periodTimes, schedule, notificationsEnabled);

  // Handlers
  const handleUpdateTeacherInfo = (info: any) => setTeacherInfo(prev => ({ ...prev, ...info }));
  const handleUpdateSchedule = (newSchedule: ScheduleDay[]) => setSchedule(newSchedule);
  const handleToggleNotifications = () => {
      setNotificationsEnabled(prev => {
          const newVal = !prev;
          if (newVal) alert('تم تفعيل جرس الحصص 🔔');
          else alert('تم إيقاف جرس الحصص 🔕');
          return newVal;
      });
  };

  const handleNavigate = (tab: string) => {
      setActiveTab(tab);
      setIsSidebarOpen(false); // Close sidebar on mobile after navigation
      if (tab !== 'report') setSelectedStudentForReport(null);
  };

  // Helper to handle student operations
  const handleUpdateStudent = (updatedStudent: Student) => {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleAddStudentManually = (name: string, className: string, phone?: string, avatar?: string) => {
      const newStudent: Student = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          grade: '',
          classes: [className],
          attendance: [],
          behaviors: [],
          grades: [],
          parentPhone: phone,
          avatar
      };
      setStudents(prev => [...prev, newStudent]);
      if (!classes.includes(className)) setClasses(prev => [...prev, className]);
  };

  const handleBatchAddStudents = (newStudents: Student[]) => {
      setStudents(prev => [...prev, ...newStudents]);
      // Extract new classes
      const newClasses = new Set(classes);
      newStudents.forEach(s => s.classes.forEach(c => newClasses.add(c)));
      setClasses(Array.from(newClasses));
  };

  const handleDeleteStudent = (id: string) => {
      setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleAddClass = (name: string) => {
      if (!classes.includes(name)) setClasses(prev => [...prev, name]);
  };

  const handleEditClass = (oldName: string, newName: string) => {
      setClasses(prev => prev.map(c => c === oldName ? newName : c));
      setStudents(prev => prev.map(s => ({
          ...s,
          classes: s.classes.map(c => c === oldName ? newName : c)
      })));
  };

  const handleDeleteClass = (className: string) => {
      if (confirm(`هل أنت متأكد من حذف الفصل "${className}"؟ سيتم حذف الفصل من قائمة الفصول، لكن الطلاب سيبقون مسجلين.`)) {
          setClasses(prev => prev.filter(c => c !== className));
      }
  };

  // Render Main Content
  const renderContent = () => {
      if (activeTab === 'dashboard') {
          return <Dashboard 
              students={students} 
              teacherInfo={teacherInfo} 
              onUpdateTeacherInfo={handleUpdateTeacherInfo}
              schedule={schedule}
              onUpdateSchedule={handleUpdateSchedule}
              onSelectStudent={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }}
              onNavigate={handleNavigate}
              onOpenSettings={() => setActiveTab('settings')} 
              periodTimes={periodTimes}
              setPeriodTimes={setPeriodTimes}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
          />;
      }
      if (activeTab === 'students') {
          return <StudentList 
              students={students} 
              classes={classes}
              onAddClass={handleAddClass}
              onAddStudentManually={handleAddStudentManually}
              onBatchAddStudents={handleBatchAddStudents}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onViewReport={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }}
              currentSemester={currentSemester}
              onSemesterChange={setCurrentSemester}
              onEditClass={handleEditClass}
              onDeleteClass={handleDeleteClass}
          />;
      }
      if (activeTab === 'attendance') return <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />;
      if (activeTab === 'grades') return <GradeBook students={students} classes={classes} onUpdateStudent={handleUpdateStudent} setStudents={setStudents} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo} />;
      if (activeTab === 'groups') return <GroupCompetition students={students} classes={classes} onUpdateStudent={handleUpdateStudent} groups={groups} onUpdateGroups={setGroups} setStudents={setStudents} />;
      if (activeTab === 'report') {
          if (selectedStudentForReport) return <StudentReport student={selectedStudentForReport} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} onBack={() => setSelectedStudentForReport(null)} />;
          return <StudentList students={students} classes={classes} onAddClass={handleAddClass} onAddStudentManually={handleAddStudentManually} onBatchAddStudents={handleBatchAddStudents} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} onViewReport={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} onEditClass={handleEditClass} onDeleteClass={handleDeleteClass} />;
      }
      // 'import' tab removed
      if (activeTab === 'settings') return <Settings />; // New Settings Route
      if (activeTab === 'guide') return <UserGuide />;
      if (activeTab === 'about') return <About />;
      
      return null;
  };

  const navItems = [
      { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
      { id: 'students', label: 'الطلاب', icon: Users },
      { id: 'attendance', label: 'الغياب', icon: CalendarCheck },
      { id: 'grades', label: 'الدرجات', icon: BarChart3 },
      { id: 'groups', label: 'المنافسة', icon: Trophy },
      // { id: 'import', label: 'استيراد', icon: Upload }, // Removed
      { id: 'settings', label: 'البيانات', icon: SettingsIcon }, 
      { id: 'guide', label: 'الدليل', icon: HelpCircle },
      { id: 'about', label: 'حول', icon: Info },
  ];

  return (
    <div className={`flex h-screen overflow-hidden font-sans text-slate-900 dark:text-white ${isLowPower ? 'low-power' : ''}`}>
        
        {/* Sidebar (Desktop & Mobile) - iOS 26 Ultra Glass */}
        <aside className={`
            fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-300 ease-in-out 
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            md:relative md:translate-x-0 md:w-64 bg-transparent border-none
        `}>
            {/* Desktop Inner Floating Panel */}
            <div className="h-full p-4">
                <div className="h-full rounded-[2.5rem] glass-heavy flex flex-col overflow-hidden shadow-2xl border border-white/20">
                    {/* Sidebar Header */}
                    <div className="p-6 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0 glass-icon rounded-2xl border border-white/30"><BrandLogo className="w-full h-full" showText={false} /></div>
                            <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight text-glow">راصد</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden glass-icon w-8 h-8 rounded-full text-slate-500 dark:text-white/70"><X className="w-4 h-4"/></button>
                    </div>

                    {/* Nav Items - Scrollable area */}
                    <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleNavigate(item.id)}
                                className={`
                                    w-full flex items-center gap-4 px-4 py-3.5 rounded-[1.2rem] transition-all duration-300 font-bold text-sm relative group
                                    ${activeTab === item.id 
                                        ? 'glass-card border-white/40 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-white/20' 
                                        : 'text-slate-600 dark:text-white/60 hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                                    }
                                `}
                            >
                                <div className={`w-6 h-6 flex items-center justify-center transition-all ${activeTab === item.id ? 'scale-110 drop-shadow-md' : 'opacity-70'}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="block tracking-wide">{item.label}</span>
                                
                                {activeTab === item.id && (
                                    <div className="absolute left-3 w-1.5 h-1.5 bg-indigo-400 dark:bg-white rounded-full shadow-[0_0_10px_currentColor]"></div>
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Footer Actions - Glass Buttons */}
                    <div className="p-4 pt-2 space-y-2 bg-transparent">
                        <button 
                            onClick={() => setTheme(isDark ? 'ceramic' : 'vision')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-slate-600 dark:text-white/60 hover:bg-white/10 glass-card border-white/10 hover:border-white/20 active:scale-95"
                        >
                            <div className="w-6 h-6 flex items-center justify-center">
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </div>
                            <span className="block">{isDark ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                        </button>

                        <button 
                            onClick={toggleLowPower}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all glass-card border-white/10 hover:border-white/20 active:scale-95 ${isLowPower ? 'text-amber-500 border-amber-500/30' : 'text-slate-600 dark:text-white/60 hover:bg-white/10'}`}
                        >
                            <div className="w-6 h-6 flex items-center justify-center">
                                <Zap className={`w-4 h-4 ${isLowPower ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </div>
                            <span className="block">{isLowPower ? 'توفير الطاقة' : 'وضع التوفير'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
            {/* Mobile Header (Floating Glass) */}
            <div className="md:hidden p-4 pb-0 z-30">
                <div className="glass-card rounded-[2rem] p-4 flex items-center justify-between border border-white/20 shadow-lg">
                    <div className="flex items-center gap-3">
                        <BrandLogo className="w-8 h-8" showText={false} />
                        <span className="font-black text-lg text-slate-800 dark:text-white text-glow">راصد</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="glass-icon w-10 h-10 rounded-2xl text-slate-800 dark:text-white active:scale-95 transition-transform hover:bg-white/20">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar scroll-smooth">
                <div className="max-w-7xl mx-auto h-full pb-20 md:pb-0">
                    {renderContent()}
                </div>
            </div>
        </main>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
