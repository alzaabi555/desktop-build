import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  CheckCircle,
  XCircle,
  Bot,
  Keyboard,
  Move,
  Loader2
} from 'lucide-react';
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

type WidgetPosition = {
  x: number;
  y: number;
};

const CONFIRMATION_TIMEOUT_MS = 10000;
const POSITION_KEY = 'rased_windows_voice_assistant_position';

const getInitialPosition = (): WidgetPosition => {
  if (typeof window === 'undefined') {
    return { x: 24, y: 24 };
  }

  try {
    const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
    if (
      saved &&
      typeof saved.x === 'number' &&
      typeof saved.y === 'number'
    ) {
      return {
        x: Math.max(12, Math.min(saved.x, window.innerWidth - 72)),
        y: Math.max(12, Math.min(saved.y, window.innerHeight - 72))
      };
    }
  } catch {
    // تجاهل
  }

  // الموضع الافتراضي في نسخة ويندوز: أسفل يسار الشاشة بعيدًا عن محتوى الصفحة.
  return {
    x: 24,
    y: Math.max(24, window.innerHeight - 112)
  };
};

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onNavigate }) => {
  const { dir, students, setStudents, currentSemester } = useApp();

  /**
   * هذا المكون مخصص لنسخة ويندوز فقط.
   * لا يستخدم Web Speech API داخل Electron.
   * يعتمد على Chrome Voice Bridge إن توفر من preload/main.
   */
  const isElectron =
    typeof navigator !== 'undefined' &&
    navigator.userAgent.toLowerCase().includes('electron');

  const hasElectronVoiceBridge =
    typeof window !== 'undefined' &&
    Boolean((window as any).electron?.openVoiceBridge) &&
    Boolean((window as any).electron?.onVoiceCommand);

  const hasCloseVoiceBridge =
    typeof window !== 'undefined' &&
    Boolean((window as any).electron?.closeVoiceBridge);

  const voiceBridgeSupported = isElectron && hasElectronVoiceBridge;

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedCommand, setTypedCommand] = useState('');
  const [showTypedInput, setShowTypedInput] = useState(!voiceBridgeSupported);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [position, setPosition] = useState<WidgetPosition>(() => getInitialPosition());
  const [feedback, setFeedback] = useState<{ message: string; type: FeedbackType }>({
    message: voiceBridgeSupported
      ? ''
      : 'الصوت في نسخة ويندوز يحتاج Chrome Voice Bridge أو يمكنك كتابة الأمر.',
    type: voiceBridgeSupported ? null : 'info'
  });

  const studentsRef = useRef(students);
  const historyRef = useRef<Student[][]>([]);
  const memoryRef = useRef(new VoiceAgentMemory());

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  });

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

  useEffect(() => {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    } catch {
      // تجاهل
    }
  }, [position]);

  const clearConfirmationTimer = useCallback(() => {
    if (confirmationTimerRef.current) {
      clearTimeout(confirmationTimerRef.current);
      confirmationTimerRef.current = null;
    }
  }, []);

  const displayFeedback = useCallback(
    (message: string, type: FeedbackType) => {
      setFeedback({ message, type });
      setIsPanelOpen(Boolean(message));

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      feedbackTimerRef.current = setTimeout(() => {
        if (isListening) {
          setFeedback({
            message: 'وضع Chrome الصوتي نشط... الوكيل يستقبل الأوامر',
            type: 'info'
          });
          setIsPanelOpen(false);
        } else if (!voiceBridgeSupported) {
          setFeedback({
            message: 'الصوت غير متاح هنا، يمكنك كتابة الأمر.',
            type: 'info'
          });
          setIsPanelOpen(showTypedInput);
        } else {
          setFeedback({ message: '', type: null });
          setIsPanelOpen(false);
        }
      }, 2000);
    },
    [isListening, showTypedInput, voiceBridgeSupported]
  );

  /**
   * في نسخة ويندوز نوقف الرد الصوتي حتى لا يحدث تداخل مع الميكروفون الخارجي/Chrome.
   */
  const speak = useCallback((_message: string) => {
    return;
  }, []);

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
        clearConfirmationTimer();

        pendingConfirmationRef.current = {
          message: 'هذا إجراء حساس. هل تؤكد التنفيذ؟',
          tasks
        };

        displayFeedback('هذا إجراء حساس. قل أو اكتب: نعم للتأكيد أو لا للإلغاء', 'info');
        speak('هذا إجراء حساس. هل تؤكد التنفيذ؟');

        confirmationTimerRef.current = setTimeout(() => {
          if (!pendingConfirmationRef.current) return;
          pendingConfirmationRef.current = null;
          displayFeedback('انتهت مهلة التأكيد وتم إلغاء الإجراء', 'info');
        }, CONFIRMATION_TIMEOUT_MS);

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
      clearConfirmationTimer,
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
      setIsProcessing(true);
      setIsPanelOpen(true);
      setFeedback({ message: 'جاري تحليل الأمر...', type: 'info' });

      try {
        if (pendingConfirmationRef.current) {
          if (/(نعم|ايوا|ايوه|اكد|أكد|موافق|نفذ)/.test(normalized)) {
            const pending = pendingConfirmationRef.current;
            pendingConfirmationRef.current = null;
            clearConfirmationTimer();
            runTasks(pending.tasks);
            return;
          }

          if (/(لا|الغ|الغي|تراجع|وقف|إلغاء|الغاء)/.test(normalized)) {
            pendingConfirmationRef.current = null;
            clearConfirmationTimer();
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
      } finally {
        setIsProcessing(false);
      }
    },
    [clearConfirmationTimer, displayFeedback, runTasks, speak]
  );

  /**
   * استقبال الأوامر القادمة من Chrome Voice Bridge في نسخة ويندوز.
   */
  useEffect(() => {
    if (!voiceBridgeSupported) return;

    const electronApi = (window as any).electron;

    const unsubscribe = electronApi.onVoiceCommand((text: string) => {
      const finalText = String(text || '').trim();
      if (!finalText) return;

      setIsListening(true);
      setTranscript(finalText);
      setIsPanelOpen(true);
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
  }, [displayFeedback, processCommand, voiceBridgeSupported]);

  const submitTypedCommand = useCallback(() => {
    const command = typedCommand.trim();
    if (!command) return;

    setTranscript(command);
    setIsPanelOpen(true);
    processCommand(command);
    setTypedCommand('');

    setTimeout(() => {
      setTranscript('');
    }, 1200);
  }, [processCommand, typedCommand]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      clearConfirmationTimer();

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearConfirmationTimer]);

  const openVoiceBridge = useCallback(() => {
    if (!voiceBridgeSupported) {
      setShowTypedInput(true);
      setIsPanelOpen(true);
      displayFeedback('Chrome Voice Bridge غير متوفر. استخدم كتابة الأمر.', 'info');
      return;
    }

    setIsListening(true);
    setIsPanelOpen(true);
    displayFeedback('سيتم فتح Chrome لوضع الحصة الصوتي', 'info');

    try {
      (window as any).electron.openVoiceBridge();
    } catch {
      setIsListening(false);
      displayFeedback('تعذر فتح Chrome Voice Bridge', 'error');
    }
  }, [displayFeedback, voiceBridgeSupported]);

  const closeVoiceBridge = useCallback(() => {
    pendingConfirmationRef.current = null;
    clearConfirmationTimer();
    setIsListening(false);
    setIsPanelOpen(false);

    try {
      if (hasCloseVoiceBridge) {
        (window as any).electron.closeVoiceBridge();
      }
    } catch {
      // تجاهل
    }

    displayFeedback('تم إيقاف وضع Chrome الصوتي', null);
  }, [clearConfirmationTimer, displayFeedback, hasCloseVoiceBridge]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      closeVoiceBridge();
      return;
    }

    openVoiceBridge();
  }, [closeVoiceBridge, isListening, openVoiceBridge]);

  const toggleTypedInput = useCallback(() => {
    setShowTypedInput(prev => !prev);
    setIsPanelOpen(true);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    dragStateRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }, [position.x, position.y]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag.dragging) return;

    const nextX = drag.originX + (event.clientX - drag.startX);
    const nextY = drag.originY + (event.clientY - drag.startY);

    setPosition({
      x: Math.max(12, Math.min(nextX, window.innerWidth - 64)),
      y: Math.max(12, Math.min(nextY, window.innerHeight - 64))
    });
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    dragStateRef.current = {
      ...drag,
      dragging: false
    };

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // تجاهل
    }
  }, []);

  const isActive = isListening;
  const shouldShowPanel = isPanelOpen && (transcript || feedback.message || showTypedInput);

  return (
    <div
      className="fixed z-[99999] pointer-events-none"
      dir={dir}
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {shouldShowPanel && (
        <div className="mb-2 w-[19rem] max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl border border-gray-200 shadow-xl rounded-2xl p-3 pointer-events-auto animate-in slide-in-from-bottom-2 fade-in shadow-indigo-500/10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {isActive ? (
                <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-bold animate-pulse tracking-wide">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                  وضع Chrome الصوتي نشط
                </div>
              ) : feedback.type === 'success' ? (
                <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  تم
                </div>
              ) : feedback.type === 'error' ? (
                <div className="flex items-center gap-1 text-rose-600 text-[10px] font-bold">
                  <XCircle className="w-3.5 h-3.5" />
                  تنبيه
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold">
                  <Bot className="w-3.5 h-3.5" />
                  النظام
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-600 text-xs font-black"
              aria-label="إخفاء لوحة الأوامر"
            >
              ×
            </button>
          </div>

          {(transcript || feedback.message) && (
            <p className="text-xs font-bold text-slate-800 leading-relaxed min-h-[1.25rem]">
              {transcript || feedback.message}
            </p>
          )}

          {showTypedInput && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={typedCommand}
                onChange={(event) => setTypedCommand(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitTypedCommand();
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

      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={toggleListening}
          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-all duration-300 active:scale-90 border ${
            isActive
              ? 'bg-indigo-600 text-white shadow-indigo-500/30 ring-4 ring-indigo-500/15 border-indigo-500'
              : voiceBridgeSupported
                ? 'bg-slate-800 text-white hover:bg-slate-700 border-slate-700'
                : 'bg-slate-500 text-white border-slate-500'
          }`}
          aria-label={isActive ? 'إيقاف وضع Chrome الصوتي' : 'فتح وضع Chrome الصوتي'}
          title={isActive ? 'إيقاف وضع Chrome الصوتي' : 'فتح وضع Chrome الصوتي'}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isActive ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </button>

        <button
          type="button"
          onClick={toggleTypedInput}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-slate-600 border border-gray-200 shadow-lg hover:text-indigo-600 active:scale-90"
          aria-label="كتابة أمر يدوي"
          title="كتابة أمر يدوي"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-400 border border-gray-200 shadow-lg hover:text-slate-700 active:scale-90 cursor-grab active:cursor-grabbing"
          aria-label="تحريك زر الأوامر الصوتية"
          title="اسحب لتغيير موقع الزر"
        >
          <Move className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;
