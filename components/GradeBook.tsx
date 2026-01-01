
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, GradeRecord, AssessmentTool } from '../types';
import { Plus, Search, X, Trash2, Settings, Check, Loader2, Edit2, Printer, FileSpreadsheet, FileUp, Download, AlertTriangle, Wand2, Calculator } from 'lucide-react';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import * as XLSX from 'xlsx';

declare var html2pdf: any;

interface GradeBookProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
  teacherInfo?: { name: string; school: string; subject: string; governorate: string };
}

const GradeBook: React.FC<GradeBookProps> = ({ 
    students = [], 
    classes = [], 
    onUpdateStudent, 
    setStudents, 
    currentSemester, 
    onSemesterChange, 
    teacherInfo 
}) => {
  const { assessmentTools, setAssessmentTools } = useApp();
  
  const tools = useMemo(() => Array.isArray(assessmentTools) ? assessmentTools : [], [assessmentTools]);

  const [selectedClass, setSelectedClass] = useState(() => {
      if (Array.isArray(classes) && classes.length > 0) return classes[0];
      return 'all';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGrade, setShowAddGrade] = useState<{ student: Student } | null>(null);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showToolsManager, setShowToolsManager] = useState(false);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editToolName, setEditToolName] = useState('');

  const [bulkFillTool, setBulkFillTool] = useState<AssessmentTool | null>(null);
  const [bulkScore, setBulkScore] = useState('');

  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [score, setScore] = useState('');

  const styles = {
      card: 'glass-card border border-white/20 rounded-2xl',
      pill: 'rounded-xl',
      header: 'glass-heavy border-b border-white/20 shadow-sm backdrop-blur-xl rounded-[0_0_2rem_2rem] mb-4',
  };

  useEffect(() => {
     if (showAddGrade && !editingGrade) {
         setSelectedToolId('');
         setScore('');
     }
  }, [showAddGrade, editingGrade]);

  const cleanText = (text: string) => { if (!text) return ''; return String(text).trim(); };
  
  // Normalize Arabic text for better matching (remove Hamzas, Tatweel, etc.)
  const normalizeText = (text: string) => {
      if (!text) return '';
      return String(text)
          .trim()
          .toLowerCase()
          .replace(/[أإآ]/g, 'ا')
          .replace(/ة/g, 'ه')
          .replace(/ى/g, 'ي')
          .replace(/[ـ]/g, ''); // Remove Tatweel
  };

  const extractNumericScore = (val: any): number | null => { 
      if (val === undefined || val === null || val === '') return null; 
      // Convert to string, remove non-numeric chars except dot
      const strVal = String(val).trim(); 
      const cleanNum = strVal.replace(/[^0-9.]/g, ''); 
      const num = Number(cleanNum); 
      return isNaN(num) || cleanNum === '' ? null : num; 
  };

  const getGradeSymbol = (score: number) => {
      if (score >= 90) return 'أ';
      if (score >= 80) return 'ب';
      if (score >= 65) return 'ج';
      if (score >= 50) return 'د';
      return 'هـ';
  };

  const getSymbolColor = (score: number) => {
      if (score >= 90) return 'text-emerald-500';
      if (score >= 80) return 'text-blue-500';
      if (score >= 65) return 'text-amber-500';
      if (score >= 50) return 'text-orange-500';
      return 'text-rose-500';
  };

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter(s => {
      if (!s || typeof s !== 'object') return false;
      const name = String(s.name || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const studentClasses = Array.isArray(s.classes) ? s.classes : [];
      const matchesClass = selectedClass === 'all' || studentClasses.includes(selectedClass);
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

  const getSemesterGrades = (student: Student, sem: '1' | '2') => { 
      if (!student || !Array.isArray(student.grades)) return []; 
      return student.grades.filter(g => { 
          if (!g.semester) return sem === '1'; 
          return g.semester === sem; 
      }); 
  };

  const handleAddTool = () => { 
      if (newToolName.trim()) { 
          const finalName = cleanText(newToolName);
          if (tools.some(t => t.name === finalName)) { alert('هذه الأداة موجودة بالفعل'); return; }
          const newTool: AssessmentTool = { id: Math.random().toString(36).substr(2, 9), name: finalName, maxScore: 0 }; 
          setAssessmentTools([...tools, newTool]); 
          setNewToolName(''); 
          setIsAddingTool(false); 
      } 
  };

  const handleDeleteTool = (id: string) => { 
      if (confirm('هل أنت متأكد من حذف هذه الأداة؟')) { setAssessmentTools(tools.filter(t => t.id !== id)); } 
  };

  const startEditingTool = (tool: AssessmentTool) => { setEditingToolId(tool.id); setEditToolName(tool.name); };
  
  const saveEditedTool = () => { 
      if (editingToolId && editToolName.trim()) { 
          const updatedTools = tools.map(t => t.id === editingToolId ? { ...t, name: cleanText(editToolName) } : t ); 
          setAssessmentTools(updatedTools); 
          setEditingToolId(null); 
          setEditToolName(''); 
      } 
  };

  const cancelEditingTool = () => { setEditingToolId(null); setEditToolName(''); };

  const handleDeleteGrade = (gradeId: string) => { 
      if(!showAddGrade) return; 
      if(confirm('حذف الدرجة؟')) { 
          const updatedGrades = showAddGrade.student.grades.filter(g => g.id !== gradeId); 
          const updatedStudent = { ...showAddGrade.student, grades: updatedGrades }; 
          onUpdateStudent(updatedStudent); 
          setShowAddGrade({ student: updatedStudent }); 
      } 
  };

  const handleEditGrade = (grade: GradeRecord) => { 
      setEditingGrade(grade); 
      setScore(grade.score.toString()); 
      const tool = tools.find(t => t.name.trim() === grade.category.trim()); 
      setSelectedToolId(tool ? tool.id : ''); 
  };

  const handleSaveGrade = () => { 
      if (!showAddGrade || score === '') return; 
      const student = showAddGrade.student; 
      let categoryName = 'درجة عامة'; 
      if (selectedToolId) { const tool = tools.find(t => t.id === selectedToolId); if (tool) categoryName = tool.name; } 
      else if (editingGrade) { categoryName = editingGrade.category; } 
      
      const newGrade: GradeRecord = { 
          id: editingGrade ? editingGrade.id : Math.random().toString(36).substr(2, 9), 
          subject: teacherInfo?.subject || 'المادة', 
          category: categoryName.trim(), 
          score: Number(score), 
          maxScore: 0, 
          date: new Date().toISOString(), 
          semester: currentSemester 
      }; 
      
      let updatedGrades; 
      if (editingGrade) { updatedGrades = (student.grades || []).map(g => g.id === editingGrade.id ? newGrade : g); } 
      else { 
          const filtered = (student.grades || []).filter(g => !(g.category.trim() === categoryName.trim() && (g.semester || '1') === currentSemester));
          updatedGrades = [newGrade, ...filtered]; 
      } 
      const updatedStudent = { ...student, grades: updatedGrades }; 
      onUpdateStudent(updatedStudent); 
      setShowAddGrade({ student: updatedStudent }); 
      setScore(''); 
      setEditingGrade(null); 
  };

  const handleBulkFill = () => {
      if (!bulkFillTool) return;
      const scoreValue = bulkScore.trim();
      if (scoreValue === '') return;
      const numericScore = parseFloat(scoreValue);
      if (isNaN(numericScore)) { alert('الرجاء إدخال رقم صحيح'); return; }

      const toolName = bulkFillTool.name.trim(); 
      const safeSemester = currentSemester || '1';
      const visibleIds = new Set(filteredStudents.map(s => s.id));

      if (visibleIds.size === 0) { alert('لا يوجد طلاب'); return; }

      setStudents(currentStudents => {
          return currentStudents.map(student => {
              if (!visibleIds.has(student.id)) return student;
              const existingGrades = Array.isArray(student.grades) ? student.grades : [];
              const keptGrades = existingGrades.filter(g => {
                  const gSem = g.semester || '1';
                  const gName = (g.category || '').trim();
                  if (gSem === safeSemester && gName === toolName) return false;
                  return true;
              });
              const newGrade: GradeRecord = {
                  id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                  subject: teacherInfo?.subject || 'المادة',
                  category: toolName,
                  score: numericScore,
                  maxScore: bulkFillTool.maxScore || 0,
                  date: new Date().toISOString(),
                  semester: safeSemester
              };
              return { ...student, grades: [newGrade, ...keptGrades] };
          });
      });
      setBulkFillTool(null);
      setBulkScore('');
      alert('تم الرصد الجماعي بنجاح! ✅');
  };

  const handleClearGrades = () => {
      const targetClassText = selectedClass === 'all' ? 'جميع الطلاب' : `طلاب فصل ${selectedClass}`;
      if (confirm(`هل أنت متأكد من حذف جميع الدرجات المسجلة لـ ${targetClassText} في الفصل الدراسي ${currentSemester}؟\n⚠️ لا يمكن التراجع عن هذا الإجراء.`)) {
          setStudents(prev => prev.map(s => {
              const sClasses = s.classes || [];
              const matches = selectedClass === 'all' || sClasses.includes(selectedClass);
              
              if (matches) {
                  const keptGrades = (s.grades || []).filter(g => {
                      const gSem = g.semester || '1';
                      return gSem !== currentSemester;
                  });
                  return { ...s, grades: keptGrades };
              }
              return s;
          }));
          alert('تم حذف درجات الفصل المحدد بنجاح');
      }
  };

  // --- IMPROVED IMPORT LOGIC ---
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Use raw: false to get formatted strings
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as any[];
          if (jsonData.length === 0) throw new Error('الملف فارغ');
          
          const headers = Object.keys(jsonData[0]);
          
          // 1. Identify "Name" Column dynamically
          const nameKeywords = ['الاسم', 'اسم الطالب', 'name', 'student', 'full name', 'المتعلم', 'student name'];
          const nameKey = headers.find(h => nameKeywords.some(kw => normalizeText(h).includes(normalizeText(kw)))) || headers[0];

          // 2. Identify "Grade" Columns (Exclude Name, ID, Totals, etc)
          const excludedExact = ['م', '#', 'id', 'no', 'number', 'رقم'];
          const excludedPartial = ['مجموع', 'total', 'تقدير', 'rank', 'average', 'معدل', 'نتيجة', 'result'];
          
          const potentialTools = headers.filter(h => {
              const lowerH = normalizeText(h);
              if (h === nameKey) return false;
              if (excludedExact.includes(lowerH)) return false;
              if (excludedPartial.some(ex => lowerH.includes(ex))) return false;
              return true;
          });

          // 3. Update Tools Context
          let updatedTools = [...tools];
          potentialTools.forEach(h => {
              const cleanH = cleanText(h);
              if (cleanH && !updatedTools.some(t => t.name === cleanH)) {
                  updatedTools.push({ id: Math.random().toString(36).substr(2, 9), name: cleanH, maxScore: 0 });
              }
          });
          setAssessmentTools(updatedTools);
          
          // 4. Map Grades to Students
          let updatedCount = 0;
          setStudents(prev => prev.map(s => {
              // Fuzzy search for student
              const row = jsonData.find((r: any) => {
                  const rName = String(r[nameKey] || '').trim();
                  return normalizeText(rName) === normalizeText(s.name);
              });
              
              if (!row) return s;
              updatedCount++;
              
              let newGrades = [...(s.grades || [])];
              potentialTools.forEach(headerStr => {
                  const val = extractNumericScore(row[headerStr]);
                  if (val !== null) {
                      const toolName = cleanText(headerStr);
                      // Remove existing grade for this tool/semester
                      newGrades = newGrades.filter(g => !(g.category.trim() === toolName && (g.semester || '1') === (currentSemester || '1')));
                      // Add new grade
                      newGrades.unshift({
                          id: Math.random().toString(36).substr(2, 9),
                          subject: teacherInfo?.subject || 'عام',
                          category: toolName,
                          score: val,
                          maxScore: 0,
                          date: new Date().toISOString(),
                          semester: currentSemester
                      });
                  }
              });
              return { ...s, grades: newGrades };
          }));
          
          alert(`تم استيراد الدرجات بنجاح لـ ${updatedCount} طالب.\nتم إضافة ${potentialTools.length} أدوات تقويم جديدة.`);
      } catch (error: any) { 
          console.error(error); 
          alert('خطأ في قراءة الملف: ' + error.message); 
      } finally { 
          setIsImporting(false); 
          if (e.target) e.target.value = ''; 
      }
  };

  // --- IMPROVED EXPORT LOGIC ---
  // Calculates columns dynamically based on what DATA actually exists
  const getActiveColumns = () => {
    const columns = new Set<string>();
    
    // 1. Add explicitly defined tools
    tools.forEach(t => columns.add(t.name.trim()));

    // 2. Scan students for any other grade categories present in THIS semester
    filteredStudents.forEach(s => {
        getSemesterGrades(s, currentSemester).forEach(g => {
            if (g.category) columns.add(g.category.trim());
        });
    });

    return Array.from(columns).sort();
  };

  const handleExportExcel = async () => {
      if (filteredStudents.length === 0) { alert('لا يوجد طلاب'); return; }
      setIsExporting(true);
      try {
          const activeColumns = getActiveColumns();

          const data = filteredStudents.map(student => {
              const row: any = { 'الاسم': student.name, 'الصف': student.classes[0] || '' };
              const semGrades = getSemesterGrades(student, currentSemester);
              
              // Dynamic Columns
              activeColumns.forEach(colName => {
                  const grade = semGrades.find(g => g.category.trim() === colName);
                  row[colName] = grade ? grade.score : '';
              });

              const total = semGrades.reduce((acc, g) => acc + (Number(g.score) || 0), 0);
              row['المجموع'] = total;
              row['التقدير'] = getGradeSymbol(total);
              return row;
          });

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(data);
          if(!ws['!views']) ws['!views'] = [];
          ws['!views'].push({ rightToLeft: true });
          XLSX.utils.book_append_sheet(wb, ws, `درجات_${currentSemester}`);
          const fileName = `GradeBook_${new Date().getTime()}.xlsx`;
          if (Capacitor.isNativePlatform()) {
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const result = await Filesystem.writeFile({ path: fileName, data: wbout, directory: Directory.Cache });
              await Share.share({ title: 'سجل الدرجات', url: result.uri });
          } else { XLSX.writeFile(wb, fileName); }
      } catch (error) { console.error(error); alert('خطأ في التصدير'); } finally { setIsExporting(false); }
  };

  const getBase64Image = async (url: string): Promise<string> => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
          });
      } catch (e) { return ''; }
  };

  const handlePrintGradeReport = async () => {
      if (filteredStudents.length === 0) { alert('لا يوجد بيانات للطباعة'); return; }
      setIsGeneratingPdf(true);

      const logoBase64 = await getBase64Image('icon.png'); 
      // Use the robust column detection
      const activeColumns = getActiveColumns();

      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '20px';
      element.style.backgroundColor = '#fff';
      element.style.color = '#000';

      const toolHeaders = activeColumns.map(name => `<th style="border:1px solid #000; padding:5px; font-size:10px;">${name}</th>`).join('');
      
      const rows = filteredStudents.map((s, i) => {
          const semGrades = getSemesterGrades(s, currentSemester);
          const toolCells = activeColumns.map(name => {
              const g = semGrades.find(grade => grade.category.trim() === name);
              return `<td style="border:1px solid #000; padding:5px; text-align:center;">${g ? g.score : '-'}</td>`;
          }).join('');
          
          const total = semGrades.reduce((acc, g) => acc + (Number(g.score) || 0), 0);
          const symbol = getGradeSymbol(total);

          return `
            <tr>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${i + 1}</td>
                <td style="border:1px solid #000; padding:5px; font-weight:bold;">${s.name}</td>
                ${toolCells}
                <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:bold; background:#f0f0f0;">${total}</td>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${symbol}</td>
            </tr>
          `;
      }).join('');

      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoBase64}" style="width: 80px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />
            <h3 style="margin: 5px 0; font-size: 16px; font-weight: bold;">سلطنة عمان</h3>
            <h3 style="margin: 2px 0; font-size: 16px; font-weight: bold;">وزارة التربية والتعليم</h3>
            <h3 style="margin: 2px 0; font-size: 16px; font-weight: bold;">المديرية العامة للتربية والتعليم لمحافظة ${teacherInfo?.governorate || '.........'}</h3>
            <h3 style="margin: 2px 0; font-size: 16px; font-weight: bold;">مدرسة ${teacherInfo?.school || '..................'}</h3>
            <div style="margin-top: 15px; border-top: 1px solid #000; width: 100%;"></div>
            <h2 style="margin: 15px 0 5px 0; font-size: 20px; font-weight: bold;">سجل الدرجات - الفصل الدراسي ${currentSemester}</h2>
            <p style="margin: 0; font-size: 14px;">المادة: ${teacherInfo?.subject || '.....'} | الصف: ${selectedClass === 'all' ? 'جميع الفصول' : selectedClass}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #000;">
            <thead>
                <tr style="background-color: #eee;">
                    <th style="border:1px solid #000; padding:5px; width:40px;">#</th>
                    <th style="border:1px solid #000; padding:5px;">اسم الطالب</th>
                    ${toolHeaders}
                    <th style="border:1px solid #000; padding:5px; width:60px;">المجموع</th>
                    <th style="border:1px solid #000; padding:5px; width:50px;">التقدير</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; padding: 0 50px;">
            <div style="text-align: center;">معلم المادة<br/>${teacherInfo?.name || ''}</div>
            <div style="text-align: center;">يعتمد،، مدير المدرسة<br/>....................</div>
        </div>
      `;

      if (typeof html2pdf !== 'undefined') {
          const opt = {
              margin: 10,
              filename: `GradeReport_Sem${currentSemester}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
          };
          try {
              const worker = html2pdf().set(opt).from(element).toPdf();
              if (Capacitor.isNativePlatform()) {
                  const pdfBase64 = await worker.output('datauristring');
                  const base64Data = pdfBase64.split(',')[1];
                  const result = await Filesystem.writeFile({
                      path: opt.filename,
                      data: base64Data,
                      directory: Directory.Cache
                  });
                  await Share.share({ title: 'سجل الدرجات', url: result.uri });
              } else {
                  worker.save();
              }
          } catch (e) {
              console.error(e);
              alert('خطأ في إنشاء التقرير');
          } finally {
              setIsGeneratingPdf(false);
          }
      } else {
          alert('مكتبة PDF غير متوفرة');
          setIsGeneratingPdf(false);
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] text-slate-900 dark:text-white pb-20">
        
        {/* Header Section */}
        <div className={styles.header}>
            <div className="p-4 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">سجل الدرجات</h1>
                    <div className="flex gap-2">
                        <label className="w-10 h-10 rounded-full glass-icon text-emerald-600 dark:text-emerald-400 active:scale-95 transition-transform flex items-center justify-center cursor-pointer" title="استيراد Excel">
                             {isImporting ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileUp className="w-5 h-5"/>}
                             <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
                        </label>
                        <button onClick={handleExportExcel} disabled={isExporting} className="w-10 h-10 rounded-full glass-icon text-indigo-600 dark:text-indigo-400 active:scale-95 transition-transform" title="تصدير Excel">
                            {isExporting ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileSpreadsheet className="w-5 h-5"/>}
                        </button>
                        <button onClick={handlePrintGradeReport} disabled={isGeneratingPdf} className="w-10 h-10 rounded-full glass-icon text-blue-600 dark:text-blue-400 active:scale-95 transition-transform" title="طباعة PDF">
                            {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin"/> : <Printer className="w-5 h-5"/>}
                        </button>
                        <button onClick={handleClearGrades} className="w-10 h-10 rounded-full glass-icon text-rose-600 dark:text-rose-400 active:scale-95 transition-transform" title="حذف درجات الفصل الحالي">
                            <Trash2 className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setShowToolsManager(true)} className="w-10 h-10 rounded-full glass-icon text-slate-600 dark:text-white/80 active:scale-95 transition-transform" title="إعدادات أدوات التقويم">
                            <Settings className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-[70%]">
                        <button onClick={() => setSelectedClass('all')} className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${selectedClass === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'glass-card text-slate-600 dark:text-white/60'} ${styles.pill}`}>الكل</button>
                        {classes.map(c => (
                            <button key={c} onClick={() => setSelectedClass(c)} className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${selectedClass === c ? 'bg-indigo-600 text-white shadow-md' : 'glass-card text-slate-600 dark:text-white/60'} ${styles.pill}`}>{c}</button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => onSemesterChange(currentSemester === '1' ? '2' : '1')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm border ${currentSemester === '1' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}
                    >
                        فصل {currentSemester}
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 dark:text-white/40" />
                    <input 
                        type="text" 
                        placeholder="بحث عن طالب..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full glass-input rounded-xl py-2 pr-9 pl-4 text-xs font-bold outline-none border border-white/10 focus:border-indigo-500/50 text-slate-900 dark:text-white" 
                    />
                </div>
            </div>

            {/* Assessment Tools Quick Bar */}
            <div className="px-4 pb-4 overflow-x-auto no-scrollbar flex gap-2">
                {tools.length > 0 ? tools.map(tool => (
                    <button 
                        key={tool.id}
                        onClick={() => { setBulkFillTool(tool); setBulkScore(''); }}
                        className="px-3 py-1.5 glass-card rounded-lg text-[10px] font-bold text-slate-600 dark:text-white/70 whitespace-nowrap hover:bg-white/10 border border-white/10 flex items-center gap-1 active:scale-95"
                    >
                        <Wand2 className="w-3 h-3 text-indigo-400" />
                        رصد {tool.name}
                    </button>
                )) : (
                    <span className="text-[10px] text-slate-400 dark:text-white/40 font-bold px-2">قم بإضافة أدوات تقويم (مثل: اختبار قصير) للبدء</span>
                )}
            </div>
        </div>

        {/* Content - Student List */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 custom-scrollbar">
            {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {filteredStudents.map((student) => {
                        const semGrades = getSemesterGrades(student, currentSemester);
                        const totalScore = semGrades.reduce((sum, g) => sum + (Number(g.score) || 0), 0);

                        return (
                            <div key={student.id} onClick={() => setShowAddGrade({ student })} className={`${styles.card} p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all hover:bg-white/5`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full glass-icon flex items-center justify-center font-bold text-slate-700 dark:text-white/80 overflow-hidden shadow-sm border border-white/10">
                                        {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover"/> : student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-800 dark:text-white">{student.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {tools.slice(0, 3).map(tool => {
                                                const grade = semGrades.find(g => g.category.trim() === tool.name.trim());
                                                return (
                                                    <span key={tool.id} className="text-[9px] px-1.5 py-0.5 rounded glass-card border-none text-slate-500 dark:text-white/60">
                                                        {tool.name}: {grade ? grade.score : '-'}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center bg-white/5 px-3 py-1 rounded-xl border border-white/10">
                                    <span className={`block text-lg font-black ${getSymbolColor(totalScore)}`}>{totalScore}</span>
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-white/40">{getGradeSymbol(totalScore)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-white/30">
                    <FileSpreadsheet className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-bold">لا يوجد طلاب مطابقين</p>
                </div>
            )}
        </div>

        {/* --- Modals --- */}
        
        {/* 1. Add/Edit Grade Modal */}
        <Modal isOpen={!!showAddGrade} onClose={() => { setShowAddGrade(null); setEditingGrade(null); setScore(''); }} className="max-w-sm rounded-[2rem]">
            {showAddGrade && (
                <div className="text-center">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">{showAddGrade.student.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-white/60 font-bold mb-6">رصد درجة جديدة - فصل {currentSemester}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {tools.map(tool => (
                            <button 
                                key={tool.id} 
                                onClick={() => setSelectedToolId(tool.id)}
                                className={`p-3 rounded-xl text-xs font-black transition-all border ${selectedToolId === tool.id ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'glass-card text-slate-600 dark:text-white/70 border-white/10 hover:bg-white/10'}`}
                            >
                                {tool.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input 
                            type="number" 
                            autoFocus
                            placeholder="الدرجة" 
                            className="flex-1 glass-input rounded-xl p-3 text-center text-lg font-black outline-none border border-white/10 focus:border-indigo-500 text-slate-900 dark:text-white"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                        />
                        <button onClick={handleSaveGrade} className="flex-1 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/30">حفظ</button>
                    </div>

                    {/* Existing Grades List */}
                    <div className="border-t border-white/10 pt-4 mt-2">
                        <p className="text-[10px] font-bold text-right mb-2 text-slate-400 dark:text-white/40">الدرجات المرصودة:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                            {getSemesterGrades(showAddGrade.student, currentSemester).length > 0 ? getSemesterGrades(showAddGrade.student, currentSemester).map(g => (
                                <div key={g.id} className="flex items-center justify-between p-2 rounded-lg glass-card border border-white/5 hover:bg-white/5">
                                    <span className="text-xs font-bold text-slate-700 dark:text-white">{g.category}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-indigo-500">{g.score}</span>
                                        <button onClick={() => handleEditGrade(g)} className="p-1 text-slate-400 hover:text-indigo-400"><Edit2 className="w-3 h-3"/></button>
                                        <button onClick={() => handleDeleteGrade(g.id)} className="p-1 text-slate-400 hover:text-rose-400"><Trash2 className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            )) : <p className="text-[10px] text-slate-400">لا توجد درجات</p>}
                        </div>
                    </div>
                </div>
            )}
        </Modal>

        {/* 2. Tools Manager Modal */}
        <Modal isOpen={showToolsManager} onClose={() => { setShowToolsManager(false); setIsAddingTool(false); }} className="max-w-sm rounded-[2rem]">
            <div className="text-center">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">أدوات التقويم</h3>
                    <button onClick={() => { setShowToolsManager(false); setIsAddingTool(false); }} className="p-2 glass-icon rounded-full hover:bg-white/20"><X className="w-5 h-5 text-slate-500 dark:text-white/60"/></button>
                </div>

                {!isAddingTool ? (
                    <>
                        <button onClick={() => setIsAddingTool(true)} className="w-full py-3 mb-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4"/> إضافة أداة جديدة
                        </button>

                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {tools.length > 0 ? tools.map(tool => (
                                <div key={tool.id} className="flex items-center justify-between p-3 glass-card rounded-xl border border-white/10 group">
                                    {editingToolId === tool.id ? (
                                        <div className="flex gap-2 w-full">
                                            <input autoFocus value={editToolName} onChange={e => setEditToolName(e.target.value)} className="flex-1 glass-input rounded-lg px-2 text-xs font-bold" />
                                            <button onClick={saveEditedTool} className="p-1.5 bg-emerald-500 text-white rounded-lg"><Check className="w-3 h-3"/></button>
                                            <button onClick={cancelEditingTool} className="p-1.5 bg-slate-500 text-white rounded-lg"><X className="w-3 h-3"/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold text-slate-700 dark:text-white">{tool.name}</span>
                                            <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditingTool(tool)} className="p-1.5 hover:bg-white/10 rounded-lg"><Edit2 className="w-3 h-3 text-blue-400"/></button>
                                                <button onClick={() => handleDeleteTool(tool.id)} className="p-1.5 hover:bg-white/10 rounded-lg"><Trash2 className="w-3 h-3 text-rose-400"/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )) : <p className="text-xs text-slate-400 dark:text-white/40 py-4">لا توجد أدوات مضافة</p>}
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in zoom-in duration-200">
                        <input 
                            autoFocus 
                            placeholder="اسم الأداة (مثال: اختبار قصير 1)" 
                            value={newToolName} 
                            onChange={e => setNewToolName(e.target.value)} 
                            className="w-full p-4 glass-input rounded-2xl mb-4 font-bold text-sm outline-none border-white/10 focus:border-indigo-500"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setIsAddingTool(false)} className="flex-1 py-3 glass-card text-slate-500 dark:text-white/60 font-bold text-xs rounded-xl">إلغاء</button>
                            <button onClick={handleAddTool} className="flex-[2] py-3 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/30">حفظ الأداة</button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>

        {/* 3. Bulk Fill Modal */}
        <Modal isOpen={!!bulkFillTool} onClose={() => { setBulkFillTool(null); setBulkScore(''); }} className="max-w-xs rounded-[2rem]">
            {bulkFillTool && (
                <div className="text-center">
                    <div className="w-12 h-12 glass-icon rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500">
                        <Wand2 className="w-6 h-6" />
                    </div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">رصد جماعي</h3>
                    <p className="text-xs text-indigo-500 font-bold mb-4">{bulkFillTool.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-white/40 mb-4 px-2">سيتم رصد هذه الدرجة لجميع الطلاب الظاهرين في القائمة الحالية (الذين لم ترصد لهم درجة لهذه الأداة بعد).</p>
                    
                    <input 
                        type="number" 
                        autoFocus
                        placeholder="الدرجة" 
                        className="w-full glass-input rounded-xl p-3 text-center text-lg font-black outline-none border border-white/10 focus:border-indigo-500 mb-4 text-slate-900 dark:text-white"
                        value={bulkScore}
                        onChange={(e) => setBulkScore(e.target.value)}
                    />
                    
                    <button onClick={handleBulkFill} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-500/30">تطبيق الرصد</button>
                </div>
            )}
        </Modal>

    </div>
  );
};

export default GradeBook;
