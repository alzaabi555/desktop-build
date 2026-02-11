
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Student, ScheduleDay, PeriodTime, Group, AssessmentTool, CertificateSettings, GradeSettings } from '../types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface TeacherInfo {
  name: string;
  school: string;
  subject: string;
  governorate: string;
  avatar?: string;
  stamp?: string;
  ministryLogo?: string;
  academicYear?: string;
  gender?: 'male' | 'female';
}

type SyncMode = 'cloud' | 'local';

interface AppContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;

  classes: string[];
  setClasses: React.Dispatch<React.SetStateAction<string[]>>;

  hiddenClasses: string[];
  setHiddenClasses: React.Dispatch<React.SetStateAction<string[]>>;

  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;

  schedule: ScheduleDay[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleDay[]>>;

  periodTimes: PeriodTime[];
  setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;

  teacherInfo: TeacherInfo;
  setTeacherInfo: React.Dispatch<React.SetStateAction<TeacherInfo>>;

  currentSemester: '1' | '2';
  setCurrentSemester: React.Dispatch<React.SetStateAction<'1' | '2'>>;

  assessmentTools: AssessmentTool[];
  setAssessmentTools: React.Dispatch<React.SetStateAction<AssessmentTool[]>>;

  gradeSettings: GradeSettings;
  setGradeSettings: React.Dispatch<React.SetStateAction<GradeSettings>>;

  certificateSettings: CertificateSettings;
  setCertificateSettings: React.Dispatch<React.SetStateAction<CertificateSettings>>;

  syncMode: SyncMode;
  setSyncMode: React.Dispatch<React.SetStateAction<SyncMode>>;

  isDataLoaded: boolean;
  defaultStudentGender: 'male' | 'female';
  setDefaultStudentGender: React.Dispatch<React.SetStateAction<'male' | 'female'>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DBFILENAME = 'raseddatabasev2.json';
const LS_SYNC_MODE = 'rasedSyncMode';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- Initial States ---
  const currentMonth = new Date().getMonth();
  const defaultSemester: '1' | '2' = currentMonth >= 1 && currentMonth <= 7 ? '2' : '1';
  const [currentSemester, setCurrentSemester] = useState<'1' | '2'>(defaultSemester);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [hiddenClasses, setHiddenClasses] = useState<string[]>([]);

  const [groups, setGroups] = useState<Group[]>([
    { id: 'g1', name: 'الصقور', color: 'emerald' },
    { id: 'g2', name: 'النمور', color: 'orange' },
    { id: 'g3', name: 'النجوم', color: 'purple' },
    { id: 'g4', name: 'الرواد', color: 'blue' },
  ]);

  const [schedule, setSchedule] = useState<ScheduleDay[]>([
    { dayName: 'الأحد', periods: Array(8).fill('') },
    { dayName: 'الاثنين', periods: Array(8).fill('') },
    { dayName: 'الثلاثاء', periods: Array(8).fill('') },
    { dayName: 'الأربعاء', periods: Array(8).fill('') },
    { dayName: 'الخميس', periods: Array(8).fill('') },
  ]);

  const [periodTimes, setPeriodTimes] = useState<PeriodTime[]>(
    Array(8)
      .fill(null)
      .map((_, i) => ({ periodNumber: i + 1, startTime: '', endTime: '' }))
  );

  const now = new Date();
  const defaultAcademicYear = now.getMonth() >= 7 
    ? `${now.getFullYear()} / ${now.getFullYear() + 1}` 
    : `${now.getFullYear() - 1} / ${now.getFullYear()}`;

  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>({
    name: '',
    school: '',
    subject: '',
    governorate: '',
    avatar: '',
    stamp: '',
    ministryLogo: '',
    academicYear: defaultAcademicYear,
    gender: 'male',
  });

  const [assessmentTools, setAssessmentTools] = useState<AssessmentTool[]>([]);
  const [gradeSettings, setGradeSettings] = useState<GradeSettings>({
      totalScore: 100,
      finalExamScore: 40,
      finalExamName: 'الامتحان النهائي'
  });

  const [certificateSettings, setCertificateSettings] = useState<CertificateSettings>({
    title: 'شهادة تفوق دراسي',
    bodyText: 'تتشرف إدارة المدرسة بمنح الطالب هذه الشهادة نظير تفوقه وتميزه في المادة',
    showDefaultDesign: true,
  });

  const [defaultStudentGender, setDefaultStudentGender] = useState<'male' | 'female'>('male');

  const [syncMode, setSyncMode] = useState<SyncMode>(() => {
    const saved = localStorage.getItem(LS_SYNC_MODE);
    return saved === 'local' || saved === 'cloud' ? saved : 'cloud';
  });

  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<any>(null);

  // Check if we are in a heavy environment (Electron or Native Mobile)
  const isHeavyEnvironment = () => {
      return Capacitor.isNativePlatform() || (window as any).electron !== undefined;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        let data: any = null;

        // 1. Try Loading from FileSystem (Preferred for Windows/Mobile)
        if (isHeavyEnvironment()) {
          try {
            const result = await Filesystem.readFile({
              path: DBFILENAME,
              directory: Directory.Data,
              encoding: Encoding.UTF8,
            });
            if (result.data) {
                data = JSON.parse(result.data as string);
                console.log('✅ Data loaded from FileSystem');
            }
          } catch (e) {
            console.log('ℹ️ No FileSystem data found, falling back to LocalStorage...');
          }
        }

        // 2. Fallback to LocalStorage (or Web Mode)
        if (!data) {
          const lsStudents = localStorage.getItem('studentData');
          if (lsStudents) {
            data = {
              students: JSON.parse(lsStudents),
              classes: JSON.parse(localStorage.getItem('classesData') || '[]'),
              hiddenClasses: JSON.parse(localStorage.getItem('hiddenClasses') || '[]'),
              groups: JSON.parse(localStorage.getItem('groupsData') || '[]'),
              schedule: JSON.parse(localStorage.getItem('scheduleData') || '[]'),
              periodTimes: JSON.parse(localStorage.getItem('periodTimes') || '[]'),
              assessmentTools: JSON.parse(localStorage.getItem('assessmentTools') || '[]'),
              gradeSettings: JSON.parse(localStorage.getItem('gradeSettings') || 'null'),
              currentSemester: localStorage.getItem('currentSemester'),
              teacherInfo: {
                name: localStorage.getItem('teacherName') || '',
                school: localStorage.getItem('schoolName') || '',
                subject: localStorage.getItem('subjectName') || '',
                governorate: localStorage.getItem('governorate') || '',
                avatar: localStorage.getItem('teacherAvatar') || '',
                stamp: localStorage.getItem('teacherStamp') || '',
                ministryLogo: localStorage.getItem('ministryLogo') || '',
                academicYear: localStorage.getItem('academicYear') || defaultAcademicYear,
                gender: localStorage.getItem('teacherGender') || 'male',
              },
              certificateSettings: JSON.parse(localStorage.getItem('certificateSettings') || 'null'),
              defaultStudentGender: localStorage.getItem('defaultStudentGender') || 'male',
            };
            console.log('✅ Data loaded from LocalStorage');
          }
        }

        const savedSync = localStorage.getItem(LS_SYNC_MODE);
        if (savedSync === 'local' || savedSync === 'cloud') setSyncMode(savedSync);

        if (data) {
          if (data.students) setStudents(data.students);
          if (data.classes) setClasses(data.classes);
          if (data.hiddenClasses) setHiddenClasses(data.hiddenClasses);
          if (data.groups && data.groups.length > 0) setGroups(data.groups);
          if (data.schedule && data.schedule.length > 0) setSchedule(data.schedule);
          if (data.periodTimes && data.periodTimes.length > 0) setPeriodTimes(data.periodTimes);
          if (data.assessmentTools && data.assessmentTools.length > 0) setAssessmentTools(data.assessmentTools);
          if (data.gradeSettings) setGradeSettings(data.gradeSettings);
          if (data.currentSemester) setCurrentSemester(data.currentSemester);
          if (data.teacherInfo) setTeacherInfo((prev) => ({ ...prev, ...data.teacherInfo }));
          if (data.certificateSettings) setCertificateSettings((prev) => ({ ...prev, ...data.certificateSettings }));
          if (data.defaultStudentGender) setDefaultStudentGender(data.defaultStudentGender);
        }
      } catch (error) {
        console.error('❌ Failed to load data', error);
      } finally {
        setIsDataLoaded(true);
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 1000);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Increased debounce to 3000ms to reduce I/O load
    saveTimeoutRef.current = setTimeout(async () => {
      const dataToSave = {
        version: '3.6.0',
        timestamp: new Date().toISOString(),
        students,
        classes,
        hiddenClasses,
        groups,
        schedule,
        periodTimes,
        teacherInfo,
        currentSemester,
        assessmentTools,
        gradeSettings,
        certificateSettings,
        defaultStudentGender,
        syncMode, 
      };

      const isHeavy = isHeavyEnvironment();

      // 1. Save to FileSystem (Async & Efficient) - Always done if available
      if (isHeavy) {
        try {
          const jsonString = JSON.stringify(dataToSave);
          await Filesystem.writeFile({
            path: DBFILENAME,
            data: jsonString,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
          // console.log('💾 Disk Save Complete');
        } catch (e) {
          console.error('❌ Disk Save Failed', e);
        }
      }

      // 2. Save to LocalStorage (Sync & Blocking)
      // STRATEGY: Only save lightweight preferences here if we are in Electron/Mobile.
      // This prevents the UI freeze caused by serializing huge student arrays.
      try {
        localStorage.setItem('teacherName', teacherInfo.name || '');
        localStorage.setItem('schoolName', teacherInfo.school || '');
        localStorage.setItem('subjectName', teacherInfo.subject || '');
        localStorage.setItem('governorate', teacherInfo.governorate || '');
        localStorage.setItem('academicYear', teacherInfo.academicYear || '');
        localStorage.setItem('teacherGender', teacherInfo.gender || 'male');
        localStorage.setItem('defaultStudentGender', defaultStudentGender);
        localStorage.setItem('currentSemester', String(currentSemester));
        localStorage.setItem(LS_SYNC_MODE, syncMode);
        
        // These can be large images, save them carefully
        localStorage.setItem('teacherAvatar', teacherInfo.avatar || '');
        localStorage.setItem('teacherStamp', teacherInfo.stamp || '');
        localStorage.setItem('ministryLogo', teacherInfo.ministryLogo || '');

        // ⚠️ CRITICAL OPTIMIZATION: 
        // If we are on Electron/Native, DO NOT save heavy arrays to LocalStorage.
        // Rely on FileSystem instead. This creates the "Unlimited Capacity" feel.
        if (!isHeavy) {
            localStorage.setItem('studentData', JSON.stringify(students));
            localStorage.setItem('classesData', JSON.stringify(classes));
            localStorage.setItem('hiddenClasses', JSON.stringify(hiddenClasses));
            localStorage.setItem('groupsData', JSON.stringify(groups));
            localStorage.setItem('scheduleData', JSON.stringify(schedule));
            localStorage.setItem('periodTimes', JSON.stringify(periodTimes));
            localStorage.setItem('assessmentTools', JSON.stringify(assessmentTools));
            localStorage.setItem('gradeSettings', JSON.stringify(gradeSettings));
            localStorage.setItem('certificateSettings', JSON.stringify(certificateSettings));
        }

      } catch (e: any) {
        console.error('LocalStorage Save Error:', e);
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            // Ignore quota errors in heavy mode as we rely on disk
            if (!isHeavy) {
                alert('⚠️ مساحة التخزين ممتلئة! يرجى استخدام نسخة الكمبيوتر لبيانات غير محدودة.');
            }
        }
      }
    }, 3000); 

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    students,
    classes,
    hiddenClasses,
    groups,
    schedule,
    periodTimes,
    teacherInfo,
    currentSemester,
    assessmentTools,
    gradeSettings,
    certificateSettings,
    defaultStudentGender,
    syncMode,
  ]);

  return (
    <AppContext.Provider
      value={{
        students, setStudents,
        classes, setClasses,
        hiddenClasses, setHiddenClasses,
        groups, setGroups,
        schedule, setSchedule,
        periodTimes, setPeriodTimes,
        teacherInfo, setTeacherInfo,
        currentSemester, setCurrentSemester,
        assessmentTools, setAssessmentTools,
        gradeSettings, setGradeSettings,
        certificateSettings, setCertificateSettings,
        syncMode, setSyncMode,
        isDataLoaded,
        defaultStudentGender, setDefaultStudentGender
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
