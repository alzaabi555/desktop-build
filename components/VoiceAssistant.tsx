import React, { useState, useRef, useEffect } from 'react';

const VoiceAssistant = () => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const audioContextRef = useRef(null);
    const streamRef = useRef(null);
    const processorRef = useRef(null);

    useEffect(() => {
        // الاستماع للنص القادم من Electron
        window.electronAPI.onSpeechResult((text) => {
            if (text.trim() !== '') {
                setTranscript((prev) => prev + " " + text);
                // 💡 هنا يمكنك كتابة كود (إذا كان النص يساوي كذا، نفذ الأمر كذا)
            }
        });

        window.electronAPI.onSpeechPartial((text) => {
            // يمكنك استخدام هذه لعرض الكلمات وهي تُكتب مباشرة
            console.log("جاري الاستماع:", text);
        });
    }, []);

    const toggleListening = async () => {
        if (isListening) {
            // إيقاف المايك
            if (processorRef.current) processorRef.current.disconnect();
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioContextRef.current) audioContextRef.current.close();
            setIsListening(false);
        } else {
            // تشغيل المايك
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                
                // إنشاء معالج صوت بتردد 16000 (المطلوب لـ Vosk)
                const audioContext = new window.AudioContext({ sampleRate: 16000 });
                audioContextRef.current = audioContext;
                
                const source = audioContext.createMediaStreamSource(stream);
                const processor = audioContext.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;

                source.connect(processor);
                processor.connect(audioContext.destination);

                processor.onaudioprocess = (e) => {
                    // تحويل الصوت إلى صيغة PCM 16-bit
                    const float32Audio = e.inputBuffer.getChannelData(0);
                    const int16Audio = new Int16Array(float32Audio.length);
                    for (let i = 0; i < float32Audio.length; i++) {
                        let s = Math.max(-1, Math.min(1, float32Audio[i]));
                        int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                    }
                    // إرسال الصوت للـ Backend
                    window.electronAPI.sendAudioChunk(int16Audio.buffer);
                };

                setIsListening(true);
            } catch (err) {
                console.error("خطأ في تشغيل المايك:", err);
                alert("يرجى التأكد من توصيل المايكروفون وإعطاء الصلاحيات.");
            }
        }
    };

    return (
        <div className="p-4 bg-white rounded-xl shadow-md text-center">
            <h3 className="font-bold mb-4">المساعد الصوتي (أوفلاين)</h3>
            <button 
                onClick={toggleListening}
                className={`p-4 rounded-full text-white font-bold transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
                {isListening ? '🎙️ جاري الاستماع...' : '🎙️ اضغط للتحدث'}
            </button>
            
            <div className="mt-4 p-4 border rounded bg-gray-50 min-h-[100px] text-right">
                <p className="text-gray-700">{transcript || 'النص سيظهر هنا...'}</p>
            </div>
        </div>
    );
};

export default VoiceAssistant;
