
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, GradeRecord, AssessmentTool } from '../types';
import { Plus, X, Trash2, Settings, Check, Loader2, Edit2, FileSpreadsheet, FileUp, Wand2 } from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import * as XLSX from 'xlsx';

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
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showAddGrade, setShowAddGrade] = useState<{ student: Student } | null>(null);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
      card: `
        bg-white border border-slate-200 rounded-[1.8rem] 
        hover:border-indigo-300 hover:shadow-[0_8px_20px_-4px_rgba(79,70,229,0.15)] hover:-translate-y-1 
        transition-all duration-300 relative overflow-hidden shadow-sm
      `,
      pill: 'rounded-xl border border-slate-200 shadow-sm hover:shadow-md',
      // تم تعديل الترويسة لتكون شفافة ومتناسقة مع خلفية التطبيق (مثل صفحة الطلاب)
      header: 'sticky top-0 z-30 pb-2 bg-[#f3f4f6] -mx-4 px-4 -mt-4',
  };

  useEffect(() => {
     if (showAddGrade && !editingGrade) {
         setSelectedToolId('');
         setScore('');
     }
  }, [showAddGrade, editingGrade]);

  const availableGrades = useMemo(() => {
      const grades = new Set<string>();
      students.forEach(s => {
          if (s.grade) grades.add(s.grade);
          else if (s.classes[0]) {
              const match = s.classes[0].match(/^(\d+)/);
              if (match) grades.add(match[1]);
          }
      });
      return Array.from(grades).sort();
  }, [students, classes]);

  const visibleClasses = useMemo(() => {
      if (selectedGrade === 'all') return classes;
      return classes.filter(c => c.startsWith(selectedGrade));
  }, [classes, selectedGrade]);

  const cleanText = (text: string) => { if (!text) return ''; return String(text).trim(); };
  
  const normalizeText = (text: string) => {
      if (!text) return '';
      return String(text).trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ـ]/g, ''); 
  };

  const extractNumericScore = (val: any): number | null => { 
      if (val === undefined || val === null || val === '') return null; 
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
      if (score >= 90) return 'text-emerald-600'; 
      if (score >= 80) return 'text-blue-600';
      if (score >= 65) return 'text-amber-600';
      if (score >= 50) return 'text-orange-600';
      return 'text-rose-600';
  };

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter(s => {
      if (!s || typeof s !== 'object') return false;
      const matchesClass = selectedClass === 'all' || (s.classes && s.classes.includes(selectedClass));
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
          matchesGrade = s.grade === selectedGrade || (s.classes[0] && s.classes[0].startsWith(selectedGrade));
      }
      return matchesClass && matchesGrade;
    });
  }, [students, selectedClass, selectedGrade]);

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

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as any[];
          if (jsonData.length === 0) throw new Error('الملف فارغ');
          const headers = Object.keys(jsonData[0]);
          const nameKeywords = ['الاسم', 'اسم الطالب', 'name', 'student', 'full name', 'المتعلم', 'student name'];
          const nameKey = headers.find(h => nameKeywords.some(kw => normalizeText(h).includes(normalizeText(kw)))) || headers[0];
          const excludedExact = ['م', '#', 'id', 'no', 'number', 'رقم'];
          const excludedPartial = ['مجموع', 'total', 'تقدير', 'rank', 'average', 'معدل', 'نتيجة', 'result'];
          const potentialTools = headers.filter(h => {
              const lowerH = normalizeText(h);
              if (h === nameKey) return false;
              if (excludedExact.includes(lowerH)) return false;
              if (excludedPartial.some(ex => lowerH.includes(ex))) return false;
              return true;
          });
          let updatedTools = [...tools];
          potentialTools.forEach(h => {
              const cleanH = cleanText(h);
              if (cleanH && !updatedTools.some(t => t.name === cleanH)) {
                  updatedTools.push({ id: Math.random().toString(36).substr(2, 9), name: cleanH, maxScore: 0 });
              }
          });
          setAssessmentTools(updatedTools);
          let updatedCount = 0;
          setStudents(prev => prev.map(s => {
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
                      newGrades = newGrades.filter(g => !(g.category.trim() === toolName && (g.semester || '1') === (currentSemester || '1')));
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
      } catch (error: any) { console.error(error); alert('خطأ في قراءة الملف: ' + error.message); } finally { setIsImporting(false); if (e.target) e.target.value = ''; }
  };

  const handleExportExcel = async () => {
      if (filteredStudents.length === 0) { alert('لا يوجد طلاب'); return; }
      setIsExporting(true);
      try {
          const finalExamName = "الامتحان النهائي";
          const continuousTools = tools.filter(t => t.name.trim() !== finalExamName);
          const finalTool = tools.find(t => t.name.trim() === finalExamName);

          const data = filteredStudents.map(student => {
              const row: any = { 'الاسم': student.name, 'الصف': student.classes[0] || '' };
              const semGrades = getSemesterGrades(student, currentSemester);
              
              let continuousSum = 0;
              continuousTools.forEach(tool => {
                  const grade = semGrades.find(g => g.category.trim() === tool.name.trim());
                  const val = grade ? Number(grade.score) : 0;
                  row[tool.name] = grade ? grade.score : '';
                  continuousSum += val;
              });

              row['المجموع (60)'] = continuousSum;

              let finalScore = 0;
              if (finalTool) {
                  const grade = semGrades.find(g => g.category.trim() === finalTool.name.trim());
                  finalScore = grade ? Number(grade.score) : 0;
                  row[`${finalTool.name} (40)`] = grade ? grade.score : '';
              }

              const total = continuousSum + finalScore;
              row['المجموع الكلي'] = total;
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

  return (
    <div className="flex flex-col h-full text-slate-800">
        
        {/* Sticky Header (Updated to match StudentList style - No Box) */}
        <div className={styles.header}>
            {/* Removed pt-safe and large mt-4 to fix mobile spacing */}
            <div className="flex justify-between items-center mb-3 mt-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">سجل الدرجات</h1>
                <div className="flex gap-2">
                    <label className="w-10 h-10 rounded-2xl glass-icon text-emerald-600 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-md border border-slate-200 hover:shadow-lg" title="استيراد Excel">
                            {isImporting ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileUp className="w-5 h-5"/>}
                            <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
                    </label>
                    <button onClick={handleExportExcel} disabled={isExporting} className="w-10 h-10 rounded-2xl glass-icon text-indigo-600 active:scale-95 transition-all shadow-md border border-slate-200 hover:shadow-lg" title="تصدير Excel">
                        {isExporting ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileSpreadsheet className="w-5 h-5"/>}
                    </button>
                    <button onClick={handleClearGrades} className="w-10 h-10 rounded-2xl glass-icon text-rose-600 active:scale-95 transition-all shadow-md border border-slate-200 hover:shadow-lg" title="حذف درجات الفصل الحالي">
                        <Trash2 className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setShowToolsManager(true)} className="w-10 h-10 rounded-2xl glass-icon text-slate-500 active:scale-95 transition-all shadow-md border border-slate-200 hover:shadow-lg" title="إعدادات أدوات التقويم">
                        <Settings className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* Hierarchical Filters */}
            <div className="space-y-2 mb-2">
                {/* Grades */}
                {availableGrades.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => { setSelectedGrade('all'); setSelectedClass('all'); }} className={`px-4 py-2 text-[10px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedGrade === 'all' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>كل المراحل</button>
                        {availableGrades.map(g => (
                            <button key={g} onClick={() => { setSelectedGrade(g); setSelectedClass('all'); }} className={`px-4 py-2 text-[10px] font-bold whitespace-nowrap transition-all rounded-xl border ${selectedGrade === g ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>صف {g}</button>
                        ))}
                    </div>
                )}

                {/* Classes */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {visibleClasses.map(c => (
                        <button key={c} onClick={() => setSelectedClass(c)} className={`px-5 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${selectedClass === c ? 'bg-indigo-600 text-white shadow-indigo-200 border-indigo-700' : 'bg-white text-slate-600 hover:bg-slate-50'} ${styles.pill}`}>{c}</button>
                    ))}
                </div>
            </div>

            {/* Assessment Tools Quick Bar */}
            <div className="overflow-x-auto no-scrollbar flex gap-2 pt-1 pb-1">
                {tools.length > 0 ? tools.map(tool => (
                    <button 
                        key={tool.id}
                        onClick={() => { setBulkFillTool(tool); setBulkScore(''); }}
                        className="px-4 py-2 glass-card rounded-xl text-[10px] font-bold text-slate-700 whitespace-nowrap hover:bg-indigo-50 border border-slate-200 flex items-center gap-1.5 active:scale-95 shadow-sm transition-all"
                    >
                        <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                        رصد {tool.name}
                    </button>
                )) : (
                    <span className="text-[10px] text-slate-400 font-bold px-2 py-2">قم بإضافة أدوات تقويم للبدء</span>
                )}
            </div>
        </div>

        {/* Content - Student List */}
        <div className="flex-1 overflow-y-auto px-2 pb-20 custom-scrollbar pt-2">
            {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {filteredStudents.map((student) => {
                        const semGrades = getSemesterGrades(student, currentSemester);
                        const totalScore = semGrades.reduce((sum, g) => sum + (Number(g.score) || 0), 0);

                        return (
                            <div key={student.id} onClick={() => setShowAddGrade({ student })} className={`${styles.card} p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] group`}>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center font-bold text-slate-400 overflow-hidden shadow-inner border border-gray-200 group-hover:border-indigo-200 transition-colors">
                                        {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover"/> : student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-700 transition-colors">{student.name}</h3>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            {tools.slice(0, 3).map(tool => {
                                                const grade = semGrades.find(g => g.category.trim() === tool.name.trim());
                                                return (
                                                    <span key={tool.id} className="text-[9px] px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-bold">
                                                        {tool.name}: <span className="text-indigo-600">{grade ? grade.score : '-'}</span>
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-inner group-hover:bg-white transition-colors relative z-10 min-w-[70px]">
                                    <span className={`block text-2xl font-black ${getSymbolColor(totalScore)}`}>{totalScore}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{getGradeSymbol(totalScore)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-50">
                    <FileSpreadsheet className="w-16 h-16 mb-4" />
                    <p className="font-bold">لا يوجد طلاب مطابقين</p>
                </div>
            )}
        </div>

        {/* ... Modals (Add Grade, Tools Manager, Bulk Fill) ... */}
        <Modal isOpen={!!showAddGrade} onClose={() => { setShowAddGrade(null); setEditingGrade(null); setScore(''); }} className="max-w-sm rounded-[2rem]">
            {showAddGrade && (
                <div className="text-center text-slate-900">
                    <h3 className="font-black text-lg mb-1">{showAddGrade.student.name}</h3>
                    <p className="text-xs text-gray-500 font-bold mb-6">رصد درجة جديدة - فصل {currentSemester}</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {tools.map(tool => (
                            <button 
                                key={tool.id} 
                                onClick={() => setSelectedToolId(tool.id)}
                                className={`p-3 rounded-xl text-xs font-black transition-all border ${selectedToolId === tool.id ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-gray-50 shadow-sm'}`}
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
                            className="flex-1 glass-input rounded-xl p-3 text-center text-lg font-black outline-none border border-slate-200 focus:border-indigo-500 text-slate-900 shadow-inner bg-gray-50"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                        />
                        <button onClick={handleSaveGrade} className="flex-1 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">حفظ</button>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mt-2">
                        <p className="text-[10px] font-bold text-right mb-2 text-gray-400">الدرجات المرصودة:</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                            {getSemesterGrades(showAddGrade.student, currentSemester).length > 0 ? getSemesterGrades(showAddGrade.student, currentSemester).map(g => (
                                <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 shadow-sm transition-colors">
                                    <span className="text-xs font-bold text-slate-700">{g.category}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-indigo-600 text-sm bg-indigo-50 px-2 py-0.5 rounded-lg">{g.score}</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEditGrade(g)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                                            <button onClick={() => handleDeleteGrade(g.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="text-[10px] text-gray-400 py-2">لا توجد درجات مسجلة</p>}
                        </div>
                    </div>
                </div>
            )}
        </Modal>

        <Modal isOpen={showToolsManager} onClose={() => { setShowToolsManager(false); setIsAddingTool(false); }} className="max-w-sm rounded-[2rem]">
            <div className="text-center text-slate-900">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-lg">أدوات التقويم</h3>
                    <button onClick={() => { setShowToolsManager(false); setIsAddingTool(false); }} className="p-2 glass-icon rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500"/></button>
                </div>
                {!isAddingTool ? (
                    <>
                        <button onClick={() => setIsAddingTool(true)} className="w-full py-3.5 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95">
                            <Plus className="w-4 h-4"/> إضافة أداة جديدة
                        </button>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {tools.length > 0 ? tools.map(tool => (
                                <div key={tool.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-300 transition-colors">
                                    {editingToolId === tool.id ? (
                                        <div className="flex gap-2 w-full">
                                            <input autoFocus value={editToolName} onChange={e => setEditToolName(e.target.value)} className="flex-1 glass-input bg-gray-50 rounded-lg px-3 text-xs font-bold text-slate-800 border-slate-200" />
                                            <button onClick={saveEditedTool} className="p-2 bg-emerald-500 text-white rounded-lg shadow-sm hover:bg-emerald-600"><Check className="w-3.5 h-3.5"/></button>
                                            <button onClick={cancelEditingTool} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"><X className="w-3.5 h-3.5"/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-xs font-bold text-slate-700 px-2">{tool.name}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEditingTool(tool)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
                                                <button onClick={() => handleDeleteTool(tool.id)} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )) : <p className="text-xs text-gray-400 py-4 font-bold">لا توجد أدوات مضافة</p>}
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in zoom-in duration-200">
                        <input autoFocus placeholder="اسم الأداة (مثال: اختبار قصير 1)" value={newToolName} onChange={e => setNewToolName(e.target.value)} className="w-full p-4 glass-input bg-gray-50 rounded-2xl mb-4 font-bold text-sm outline-none border border-slate-200 focus:border-indigo-500 text-slate-800 shadow-inner" />
                        <div className="flex gap-2">
                            <button onClick={() => setIsAddingTool(false)} className="flex-1 py-3 bg-gray-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors">إلغاء</button>
                            <button onClick={handleAddTool} className="flex-[2] py-3 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">حفظ الأداة</button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>

        <Modal isOpen={!!bulkFillTool} onClose={() => { setBulkFillTool(null); setBulkScore(''); }} className="max-w-xs rounded-[2rem]">
            {bulkFillTool && (
                <div className="text-center text-slate-900">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500 shadow-sm border border-indigo-100"><Wand2 className="w-7 h-7" /></div>
                    <h3 className="font-black text-lg mb-1">رصد جماعي</h3>
                    <p className="text-xs text-indigo-600 font-bold mb-4 bg-indigo-50 inline-block px-3 py-1 rounded-lg">{bulkFillTool.name}</p>
                    <p className="text-[10px] text-gray-500 mb-4 px-2 font-medium">سيتم رصد هذه الدرجة لجميع الطلاب الظاهرين في القائمة الحالية (الذين لم ترصد لهم درجة لهذه الأداة بعد).</p>
                    <input type="number" autoFocus placeholder="الدرجة" className="w-full glass-input bg-gray-50 rounded-xl p-3 text-center text-lg font-black outline-none border border-slate-200 focus:border-indigo-500 mb-4 text-slate-800 shadow-inner" value={bulkScore} onChange={(e) => setBulkScore(e.target.value)} />
                    <button onClick={handleBulkFill} className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">تطبيق الرصد</button>
                </div>
            )}
        </Modal>

    </div>
  );
};

export default GradeBook;
