import React from 'react';
import { Student } from '../types';
import { Smartphone, QrCode, Scissors } from 'lucide-react';

interface ParentCardsProps {
  students: Student[];
  schoolName?: string;
  teacherName?: string;
  selectedClass: string;
}

const ParentCardsTemplate: React.FC<ParentCardsProps> = ({ students, schoolName, teacherName, selectedClass }) => {
  // فلترة الطلاب بناءً على الفصل المختار، واستبعاد من ليس لديهم كود
  let filteredStudents = students.filter(s => s.parentCode);
  if (selectedClass !== 'all') {
      filteredStudents = filteredStudents.filter(s => s.classes.includes(selectedClass));
  }

  if (filteredStudents.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 w-full" style={{ direction: 'rtl' }}>
            <QrCode className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-black text-xl mb-2">لا توجد أكواد للطباعة!</p>
            <p className="text-sm">الرجاء الذهاب لصفحة "الطلاب"، واختيار الفصل، وتوليد الأكواد أولاً.</p>
        </div>
    );
  }

  return (
    <div className="bg-white text-black p-8" style={{ width: '210mm', minHeight: '297mm', direction: 'rtl' }}>
        
        <div className="text-center mb-8 border-b-2 border-dashed border-slate-200 pb-4">
            <h2 className="text-2xl font-black text-slate-800">بطاقات دخول أولياء الأمور</h2>
            <p className="text-sm text-slate-500">الفصل: {selectedClass === 'all' ? 'جميع الفصول' : selectedClass} | المادة: {teacherName}</p>
        </div>

        {/* شبكة البطاقات (عمودين) */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            {filteredStudents.map((student, index) => (
                <div key={student.id} className="relative border-2 border-slate-300 rounded-2xl overflow-hidden shadow-sm break-inside-avoid flex flex-col h-48">
                    
                    {/* رأس البطاقة */}
                    <div className="bg-[#1e3a8a] text-white p-3 flex justify-between items-center">
                        <div>
                            <h4 className="font-black text-sm">{schoolName || 'مدرسة راصد'}</h4>
                            <p className="text-[10px] opacity-80 mt-0.5 tracking-wider">بوابة متابعة ولي الأمر</p>
                        </div>
                        <QrCode className="w-7 h-7 opacity-80" />
                    </div>

                    {/* محتوى البطاقة */}
                    <div className="p-4 flex-1 flex flex-col justify-center items-center text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 to-white">
                        <h3 className="font-black text-lg text-slate-800 mb-1">{student.name}</h3>
                        <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold mb-3 border border-slate-300">
                            الصف: {student.classes[0] || 'غير محدد'}
                        </span>
                        
                        <div className="border-2 border-dashed border-amber-500 bg-amber-50 px-6 py-2 rounded-xl w-full max-w-[85%] shadow-inner">
                            <p className="text-[10px] font-bold text-amber-700 mb-1">الكود السري (PIN):</p>
                            <p className="font-mono font-black text-xl tracking-[0.3em] text-amber-600">{student.parentCode}</p>
                        </div>
                    </div>

                    {/* تذييل البطاقة */}
                    <div className="bg-slate-100 border-t border-slate-200 p-2 text-center flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600">
                        <Smartphone size={14} className="text-[#1e3a8a] animate-pulse"/>
                        حمل تطبيق "راصد للآباء" وأدخل الكود أعلاه
                    </div>

                    {/* أيقونة المقص (للزينة الإرشادية) */}
                    {index % 2 === 0 && (
                         <div className="absolute -left-3 top-1/2 text-slate-400 transform -translate-y-1/2 flex flex-col items-center bg-white rounded-full p-1 z-10">
                            <Scissors size={14} />
                         </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

export default ParentCardsTemplate;
