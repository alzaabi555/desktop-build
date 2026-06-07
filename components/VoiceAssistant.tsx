import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, CheckCircle, XCircle, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';

import { VoiceTask, FeedbackType } from '../voice-agent/types';
import { VoiceAgentMemory } from '../voice-agent/memory';
import { normalizeText } from '../voice-agent/normalizer';
import { planCommand } from '../voice-agent/planner';
import { executeTask } from '../voice-agent/executor';
import { requiresConfirmation } from '../voice-agent/confirmationManager';

interface VoiceAssistantProps {
  onNavigate?: (tab: string) => void;
}
const SpeechRecognitionCtor =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onNavigate }) => {
  const { dir, students, setStudents, currentSemester } = useApp();

  const isElectron =
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron');

  const hasElectronVoiceBridge =
    typeof window !== 'undefined' &&
    !!(window as any).electron?.openVoiceBridge &&
    !!(window as any).electron?.onVoiceCommand;

  /**
   * مهم:
   * في Electron لا نستخدم SpeechRecognition حتى لو كان موجودًا
   * لأنه أعطى عندك network error.
   * لذلك:
   * - Electron يستخدم Chrome Voice Bridge.
   * - غير Electron يستخدم Web Speech.
   */
  const webSpeechSupported = !!SpeechRecognitionCtor && !isElectron;
  const chromeBridgeSupported = isElectron && hasElectronVoiceBridge;
  const voiceSupported = webSpeechSupported || chromeBridgeSupported;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedCommand, setTypedCommand] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: FeedbackType }>({
    message: voiceSupported ? '' : 'الصوت غير مدعوم هنا، يمكنك كتابة الأمر',
    type: voiceSupported ? null : 'info'
  });

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const manualStopRef = useRef(false);
  const isRecognitionStartingRef = useRef(false);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const studentsRef = useRef(students);
  const historyRef = useRef<Student[][]>([]);
  const memoryRef = useRef(new VoiceAgentMemory());

  const lastProcessedRef = useRef({
    text: '',
    time: 0
  });

  const pendingConfirmationRef = useRef<{
    message: string;
    tasks: VoiceTask[];
  } | null>(null);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  const displayFeedback = useCallback(
    (message: string, type: FeedbackType) => {
      setFeedback({ message, type });

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      feedbackTimerRef.current = setTimeout(() => {
        if (shouldListenRef.current && webSpeechSupported) {
          setFeedback({ message: 'وضع الحصة نشط... الوكيل يستمع', type: 'info' });
        } else if (shouldListenRef.current && chromeBridgeSupported) {
          setFeedback({ message: 'وضع الحصة نشط عبر Chrome... الوكيل يستقبل الأوامر', type: 'info' });
        } else if (!voiceSupported) {
          setFeedback({ message: 'الصوت غير مدعوم هنا، يمكنك كتابة الأمر', type: 'info' });
        } else {
          setFeedback({ message: '', type: null });
        }
      }, 1800);
    },
    [voiceSupported, webSpeechSupported, chromeBridgeSupported]
  );

  /**
   * أثناء الحصة نوقف الرد الصوتي حتى لا يتداخل صوت الجهاز مع الميكروفون.
   */
  const speak = useCallback((_message: string) => {
    return;
  }, []);

  const restartRecognition = useCallback(
    (delay = 250) => {
      if (!webSpeechSupported) return;
      if (!shouldListenRef.current) return;
      if (!recognitionRef.current) return;

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      restartTimerRef.current = setTimeout(() => {
        if (!shouldListenRef.current || !recognitionRef.current) return;
        if (isRecognitionStartingRef.current) return;

        try {
          isRecognitionStartingRef.current = true;
          recognitionRef.current.start();
        } catch {
          // غالبًا المحرك يعمل بالفعل أو لم ينهِ دورة الإيقاف بعد
        } finally {
          setTimeout(() => {
            isRecognitionStartingRef.current = false;
          }, 500);
        }
      }, delay);
    },
    [webSpeechSupported]
  );

  const createId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }, []);

  const saveSnapshot = useCallback(() => {
    historyRef.current.push(JSON.parse(JSON.stringify(studentsRef.current)));

    if (historyRef.current.length > 20) {
      historyRef.current.shift();
    }
  }, []);

  const undoLastAction = useCallback(() => {
    const previous = historyRef.current.pop();

    if (!previous) {
      displayFeedback('لا توجد عملية للتراجع', 'error');
      speak('لا يوجد شيء للتراجع عنه');
      return;
    }

    setStudents(previous);
    displayFeedback('تم التراجع بنجاح', 'success');
    speak('تم التراجع');
  }, [displayFeedback, setStudents, speak]);

  const runTasks = useCallback(
    (tasks: VoiceTask[]) => {
      if (!tasks.length) return;

      if (requiresConfirmation(tasks)) {
        pendingConfirmationRef.current = {
          message: 'هذا إجراء حساس. هل تؤكد التنفيذ؟',
          tasks
        };

        displayFeedback('هذا إجراء حساس. قل أو اكتب: نعم للتأكيد أو لا للإلغاء', 'info');
        speak('هذا إجراء حساس. هل تؤكد التنفيذ؟');
        return;
      }

      for (const task of tasks) {
        if (task.type === 'undo') {
          undoLastAction();
          continue;
        }

        executeTask(task, {
          setStudents,
          currentSemester,
          onNavigate,
          saveSnapshot,
          createId,
          memory: memoryRef.current,
          displayFeedback,
          speak
        });
      }
    },
    [
      createId,
      currentSemester,
      displayFeedback,
      onNavigate,
      saveSnapshot,
      setStudents,
      speak,
      undoLastAction
    ]
  );

  const processCommand = useCallback(
    (command: string) => {
      const originalText = command.trim();

      if (!originalText) return;

      const normalized = normalizeText(originalText);
      const now = Date.now();

      /**
       * منع التكرار غير المقصود.
       */
      if (
        normalized === lastProcessedRef.current.text &&
        now - lastProcessedRef.current.time < 1200
      ) {
        return;
      }

      lastProcessedRef.current = {
        text: normalized,
        time: now
      };

      memoryRef.current.setLastCommand(originalText);

      if (pendingConfirmationRef.current) {
        if (/(نعم|ايوا|ايوه|اكد|أكد|موافق|نفذ)/.test(normalized)) {
          const pending = pendingConfirmationRef.current;
          pendingConfirmationRef.current = null;
          runTasks(pending.tasks);
          return;
        }

        if (/(لا|الغ|الغي|تراجع|وقف|إلغاء|الغاء)/.test(normalized)) {
          pendingConfirmationRef.current = null;
          displayFeedback('تم إلغاء الإجراء', 'info');
          speak('تم الإلغاء');
          return;
        }

        displayFeedback('قل أو اكتب نعم للتأكيد أو لا للإلغاء', 'info');
        return;
      }

      const memory = memoryRef.current.snapshot;

      if (memory.pendingIntent === 'create_student') {
        const cleanName = originalText
          .replace(/^(اسمه|اسم الطالب|الطالب اسمه|اسمها|اسم الطالبة|الطالبة اسمها)\s*/g, '')
          .trim();

        const tasks: VoiceTask[] = [
          {
            type: 'create_student',
            payload: {
              name: cleanName,
              grade: memory.pendingGrade || 'بدون فصل'
            }
          }
        ];

        memoryRef.current.clearPendingIntent();
        runTasks(tasks);
        return;
      }

      const tasks = planCommand(originalText, {
        students: studentsRef.current,
        memory: memoryRef.current
      });

      runTasks(tasks);
    },
    [displayFeedback, runTasks, speak]
  );

  /**
   * استقبال الأوامر القادمة من Chrome Voice Bridge في نسخة Electron.
   */
  useEffect(() => {
    if (!chromeBridgeSupported) return;

    const electronApi = (window as any).electron;

    const unsubscribe = electronApi.onVoiceCommand((text: string) => {
      const finalText = String(text || '').trim();

      if (!finalText) return;

      shouldListenRef.current = true;
      setIsListening(true);
      setTranscript(finalText);
      displayFeedback(`تم استقبال الأمر: ${finalText}`, 'info');

      processCommand(finalText);

      setTimeout(() => {
        setTranscript('');
      }, 1200);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [chromeBridgeSupported, processCommand, displayFeedback]);

  const submitTypedCommand = useCallback(() => {
    const command = typedCommand.trim();

    if (!command) return;

    setTranscript(command);
    processCommand(command);
    setTypedCommand('');

    setTimeout(() => {
      setTranscript('');
    }, 1200);
  }, [processCommand, typedCommand]);

  /**
   * Web Speech للمتصفح و Android فقط.
   * في Electron لا نشغله، لأن Chrome Voice Bridge هو المسؤول عن الصوت.
   */
  useEffect(() => {
    if (!webSpeechSupported) return;

    try {
      const recognition = new SpeechRecognitionCtor();

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'ar-OM';

      recognition.onstart = () => {
        isRecognitionStartingRef.current = false;
        setIsListening(true);

        if (feedbackTimerRef.current) {
          clearTimeout(feedbackTimerRef.current);
        }

        setFeedback({
          message: 'وضع الحصة نشط... الوكيل يستمع',
          type: 'info'
        });
      };

      recognition.onresult = (event: any) => {
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          }
        }

        finalText = finalText.trim();

        if (!finalText) return;

        setTranscript(finalText);
        processCommand(finalText);

        setTimeout(() => {
          setTranscript('');
        }, 1200);

        restartRecognition(350);
      };

      recognition.onend = () => {
        setIsListening(false);

        if (manualStopRef.current) {
          manualStopRef.current = false;
          shouldListenRef.current = false;
          displayFeedback('تم إيقاف الوكيل', null);
          return;
        }

        if (shouldListenRef.current) {
          setFeedback({
            message: 'إعادة تنشيط الاستماع...',
            type: 'info'
          });

          restartRecognition(250);
        } else {
          displayFeedback('تم إيقاف الوكيل', null);
        }
      };

      recognition.onerror = (event: any) => {
        const error = event.error;

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          manualStopRef.current = true;
          shouldListenRef.current = false;
          setIsListening(false);
          displayFeedback('الرجاء السماح للتطبيق بالوصول للمايكروفون', 'error');
          return;
        }

        if (error === 'no-speech') {
          if (shouldListenRef.current) {
            displayFeedback('لم أسمع أمرًا واضحًا... ما زلت أستمع', 'info');
            restartRecognition(300);
          }
          return;
        }

        if (error === 'aborted' || error === 'network' || error === 'audio-capture') {
          if (shouldListenRef.current) {
            displayFeedback('إعادة تشغيل الاستماع...', 'info');
            restartRecognition(700);
          }
          return;
        }

        if (shouldListenRef.current) {
          restartRecognition(700);
        }
      };

      recognitionRef.current = recognition;

      return () => {
        manualStopRef.current = true;
        shouldListenRef.current = false;

        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
        }

        try {
          recognition.stop();
        } catch {
          // تجاهل
        }
      };
    } catch {
      displayFeedback('تعذر تشغيل التعرف الصوتي، يمكنك كتابة الأمر', 'error');
    }
  }, [displayFeedback, processCommand, restartRecognition, webSpeechSupported]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    /**
     * Windows / Electron:
     * افتح Chrome Voice Bridge بدل تشغيل SpeechRecognition داخل Electron.
     */
    if (chromeBridgeSupported) {
      shouldListenRef.current = true;
      setIsListening(true);
      displayFeedback('سيتم فتح Chrome لوضع الحصة الصوتي', 'info');

      try {
        (window as any).electron.openVoiceBridge();
      } catch {
        displayFeedback('تعذر فتح Chrome Voice Bridge', 'error');
      }

      return;
    }

    /**
     * إذا لم يتوفر لا Web Speech ولا Chrome Bridge.
     */
    if (!webSpeechSupported) {
      displayFeedback('الصوت غير مدعوم في هذه البيئة، استخدم كتابة الأمر', 'info');
      return;
    }

    /**
     * Android / Chrome:
     * Web Speech الحالي.
     */
    if (shouldListenRef.current) {
      manualStopRef.current = true;
      shouldListenRef.current = false;

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      try {
        recognitionRef.current?.stop();
      } catch {
        // تجاهل
      }

      setIsListening(false);
      displayFeedback('تم إيقاف الوكيل', null);
      return;
    }

    manualStopRef.current = false;
    shouldListenRef.current = true;

    displayFeedback('وضع الحصة نشط... الوكيل يستمع', 'info');

    try {
      recognitionRef.current?.start();
    } catch {
      restartRecognition(300);
    }
  }, [
    chromeBridgeSupported,
    webSpeechSupported,
    displayFeedback,
    restartRecognition
  ]);

  const showTypedFallback = !voiceSupported;

  return (
    <div
      className={`fixed bottom-24 md:bottom-8 ${
        dir === 'rtl' ? 'left-6' : 'right-6'
      } z-[99999] flex flex-col items-${dir === 'rtl' ? 'start' : 'end'} pointer-events-none`}
      dir={dir}
    >
      {(isListening || transcript || feedback.message || showTypedFallback) && (
        <div className="mb-4 bg-white/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl p-4 max-w-sm pointer-events-auto animate-in slide-in-from-bottom-2 fade-in shadow-indigo-500/10">
          <div className="flex items-center gap-2 mb-2">
            {isListening ? (
              <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[11px] font-bold animate-pulse tracking-wide">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                {chromeBridgeSupported ? 'وضع Chrome الصوتي نشط' : 'وضع الحصة نشط'}
              </div>
            ) : feedback.type === 'success' ? (
              <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                تم
              </div>
            ) : feedback.type === 'error' ? (
              <div className="flex items-center gap-1 text-rose-600 text-[11px] font-bold">
                <XCircle className="w-3.5 h-3.5" />
                تنبيه
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-500 text-[11px] font-bold">
                <Bot className="w-3.5 h-3.5" />
                النظام
              </div>
            )}
          </div>

          <p className="text-sm font-bold text-slate-800 leading-relaxed min-h-[1.5rem]">
            {transcript || feedback.message}
          </p>

          {showTypedFallback && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={typedCommand}
                onChange={(e) => setTypedCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitTypedCommand();
                  }
                }}
                placeholder="اكتب الأمر هنا..."
                className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                data-voice-field="أمر مكتوب"
                aria-label="أمر مكتوب"
              />

              <button
                type="button"
                onClick={submitTypedCommand}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white active:scale-95"
              >
                تنفيذ
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggleListening}
        className={`pointer-events-auto flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-300 active:scale-90 ${
          isListening || shouldListenRef.current
            ? 'bg-indigo-600 text-white shadow-indigo-500/40 ring-4 ring-indigo-500/20'
            : voiceSupported
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-slate-500 text-white'
        }`}
        aria-label={
          chromeBridgeSupported
            ? 'فتح وضع الحصة الصوتي في Chrome'
            : webSpeechSupported
              ? isListening || shouldListenRef.current
                ? 'إيقاف وضع الحصة الصوتي'
                : 'تشغيل وضع الحصة الصوتي'
              : 'الصوت غير مدعوم، استخدم كتابة الأمر'
        }
        title={
          chromeBridgeSupported
            ? 'فتح وضع الحصة الصوتي في Chrome'
            : webSpeechSupported
              ? isListening || shouldListenRef.current
                ? 'إيقاف وضع الحصة الصوتي'
                : 'تشغيل وضع الحصة الصوتي'
              : 'الصوت غير مدعوم هنا'
        }
      >
        {voiceSupported ? (
          isListening || shouldListenRef.current ? (
            <Mic className="w-7 h-7" />
          ) : (
            <MicOff className="w-7 h-7" />
          )
        ) : (
          <Bot className="w-7 h-7" />
        )}
      </button>
    </div>
  );
};

export default VoiceAssistant;
import { Mic, MicOff, CheckCircle, XCircle, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';

import { VoiceTask, FeedbackType } from '../voice-agent/types';
import { VoiceAgentMemory } from '../voice-agent/memory';
import { normalizeText } from '../voice-agent/normalizer';
import { planCommand } from '../voice-agent/planner';
import { executeTask } from '../voice-agent/executor';
import { requiresConfirmation } from '../voice-agent/confirmationManager';

