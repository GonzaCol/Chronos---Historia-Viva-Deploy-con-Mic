import React, { useRef, useEffect, useState } from 'react';
import { Message, Language, TRANSLATIONS } from '../types';
import { Send, User, Cpu, Mic, Volume2, Loader2, Play, Power, StopCircle } from 'lucide-react';
import { Button } from './Button';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onDictate: (audioBase64: string) => Promise<string | null>;
  onPlayAudio: (messageId: string, text: string) => void;
  onExit: () => void;
  characterName: string;
  date: string;
  isTyping: boolean;
  playingAudioId: string | null;
  audioLoadingId: string | null;
  language: Language;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onDictate,
  onPlayAudio,
  onExit,
  characterName,
  date,
  isTyping,
  playingAudioId,
  audioLoadingId,
  language
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const t = TRANSLATIONS[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            
            // Stop all tracks to release microphone
            stream.getTracks().forEach(track => track.stop());
            
            setIsRecording(false);
            setIsProcessingAudio(true);

            // Convert blob to base64
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                // Remove data url prefix
                const base64 = base64String.split(',')[1];
                
                const text = await onDictate(base64);
                if (text) {
                    setInputValue(prev => prev + (prev ? ' ' : '') + text);
                }
                setIsProcessingAudio(false);
            };
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access is required to use voice features.");
        setIsRecording(false);
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          // State update handled in onstop event
      }
  };

  const toggleRecording = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/90 relative">
       {/* Subtle grid overlay */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-900/30 bg-slate-950/80 backdrop-blur z-20">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <div>
                <h2 className="text-cyan-400 font-tech text-sm tracking-widest uppercase leading-none">{characterName}</h2>
                <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">{date} // {t.simulationActive}</span>
            </div>
        </div>
        <button 
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-950/20 border border-red-900/50 text-red-400 text-xs font-tech hover:bg-red-900/40 hover:text-red-300 transition-colors uppercase tracking-widest rounded-sm"
        >
            <Power size={14} />
            <span className="hidden md:inline">{t.terminate}</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 max-w-3xl animate-fadeIn ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`
              flex-shrink-0 w-8 h-8 flex items-center justify-center mt-1 border
              ${msg.role === 'user' 
                ? 'bg-slate-900 border-slate-600 text-slate-400' 
                : 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'}
            `}>
              {msg.role === 'user' ? <User size={14} /> : <Cpu size={14} />}
            </div>

            {/* Bubble */}
            <div className={`
              flex flex-col gap-1
              ${msg.role === 'user' ? 'items-end' : 'items-start'}
            `}>
              <div className={`
                px-5 py-3 text-sm leading-relaxed font-data relative
                ${msg.role === 'user' 
                  ? 'bg-slate-800 text-slate-200 border-l-2 border-slate-600' 
                  : 'bg-slate-900/80 text-cyan-50 border-l-2 border-cyan-500 shadow-lg'}
              `}>
                {msg.role === 'model' && (
                  <div className="absolute -left-[2px] top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_8px_cyan]"></div>
                )}
                
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                    T-{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                
                {/* TTS Controls for Model */}
                {msg.role === 'model' && (
                  <button 
                    onClick={() => onPlayAudio(msg.id, msg.text)}
                    disabled={audioLoadingId === msg.id}
                    className="flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-400 uppercase tracking-wider font-tech transition-colors disabled:opacity-50"
                  >
                    {audioLoadingId === msg.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : playingAudioId === msg.id ? (
                      <span className="flex items-center gap-1 text-emerald-500 animate-pulse">
                         <Volume2 size={12} /> {t.playing}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Play size={12} /> {t.audio}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 border border-cyan-500/30 bg-cyan-900/10 flex items-center justify-center">
              <Loader2 size={14} className="text-cyan-500 animate-spin" />
            </div>
            <div className="bg-slate-900/50 px-4 py-3 border-l-2 border-cyan-500/50 flex items-center gap-2">
              <span className="text-xs font-tech text-cyan-500/70 animate-pulse">{t.decrypting}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 md:p-4 border-t border-cyan-900/30 bg-slate-950/80 backdrop-blur-sm relative z-20">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex gap-2">
          
          <div className="relative flex-1 group">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? "Recording audio..." : `${t.transmitPlaceholder} ${characterName}...`}
                className={`w-full bg-slate-900/50 border border-slate-700 pl-4 pr-12 py-3 text-white placeholder-slate-600 font-data focus:outline-none focus:border-cyan-500 focus:bg-slate-900 transition-all ${isRecording ? 'border-red-500/50 text-red-200' : ''}`}
                disabled={isTyping || isRecording || isProcessingAudio}
            />
            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-500 group-focus-within:border-cyan-500 transition-colors"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-500 group-focus-within:border-cyan-500 transition-colors"></div>
            
            {/* Mic Button inside Input */}
            <button
                type="button"
                onClick={toggleRecording}
                disabled={isProcessingAudio}
                className={`absolute right-2 top-2 p-1.5 rounded-sm transition-all z-20 ${
                    isRecording 
                    ? 'text-red-500 animate-pulse bg-red-900/20 shadow-[0_0_10px_rgba(220,38,38,0.5)]' 
                    : isProcessingAudio
                        ? 'text-cyan-500 animate-spin'
                        : 'text-slate-500 hover:text-cyan-400'
                }`}
                title={t.dictate}
            >
                {isProcessingAudio ? <Loader2 size={18} /> : isRecording ? <StopCircle size={18} fill="currentColor" /> : <Mic size={18} />}
            </button>
          </div>

          <Button
            type="submit"
            disabled={!inputValue.trim() || isTyping || isRecording || isProcessingAudio}
            className="px-4"
            variant="primary"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
};