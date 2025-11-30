import React, { useState, useRef, useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { ChatInterface } from './components/ChatInterface';
import { Visualizer } from './components/Visualizer';
import { Message, SessionConfig, AppState, SavedSession, Language, TRANSLATIONS } from './types';
import { geminiService } from './services/geminiService';
import { nanoid } from 'nanoid';

const LOCAL_STORAGE_KEY = 'chronos_history_v1';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [config, setConfig] = useState<SessionConfig>({ character: '', date: '' });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [latestVisualMessage, setLatestVisualMessage] = useState<Message | undefined>(undefined);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  
  // Language State
  const [language, setLanguage] = useState<Language>('es');

  // Detect browser language on mount
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (['es', 'en', 'fr', 'de', 'ja'].includes(browserLang)) {
        setLanguage(browserLang as Language);
    }
  }, []);
  
  // Audio State
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);

  useEffect(() => {
    // Load History
    const history = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (history) {
        try {
            setSavedSessions(JSON.parse(history));
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }

    return () => {
        // Cleanup audio context on unmount
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  const saveHistoryToStorage = (sessions: SavedSession[]) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
      setSavedSessions(sessions);
  };

  const updateCurrentSession = (msgs: Message[], cfg: SessionConfig) => {
      if (!currentSessionId) return;

      // Filter out heavy audio data before saving to localStorage to avoid quota limits
      const cleanMessages = msgs.map(m => ({
          ...m,
          audioData: undefined // Don't save base64 audio to storage
      }));

      const newSession: SavedSession = {
          id: currentSessionId,
          config: cfg,
          messages: cleanMessages,
          lastModified: Date.now()
      };

      const updatedSessions = savedSessions.filter(s => s.id !== currentSessionId);
      updatedSessions.push(newSession);
      saveHistoryToStorage(updatedSessions);
  };

  // Initialize Chat
  const handleStartSession = async (sessionConfig: SessionConfig) => {
    setConfig(sessionConfig);
    setAppState(AppState.ACTIVE);
    setIsTyping(true);
    
    // Create new session ID
    const newSessionId = nanoid();
    setCurrentSessionId(newSessionId);

    try {
      geminiService.initializeChat(sessionConfig.character, sessionConfig.date, language);
      
      const greetingPrompt = `(SYSTEM: Anomaly detected. A user from the future has appeared. React with shock and authentic confusion as ${sessionConfig.character} in ${sessionConfig.date}.)`;
      
      const response = await geminiService.sendMessage(greetingPrompt);
      
      const botMsg: Message = {
        id: nanoid(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        scenePrompt: response.scenePrompt || undefined,
        contextInfo: response.contextInfo || undefined,
        isImageLoading: !!response.scenePrompt 
      };

      const initialMessages = [botMsg];
      setMessages(initialMessages);
      setLatestVisualMessage(botMsg);
      setIsTyping(false);

      // Initial Save
      updateCurrentSession(initialMessages, sessionConfig);

      if (response.scenePrompt) {
        handleImageGeneration(botMsg.id, response.scenePrompt);
      }

    } catch (error) {
      console.error("Failed to start session", error);
      setAppState(AppState.ERROR);
      setIsTyping(false);
    }
  };

  const handleResumeSession = (session: SavedSession) => {
      setConfig(session.config);
      setMessages(session.messages);
      setCurrentSessionId(session.id);
      
      // Find latest visual
      const lastVisual = [...session.messages].reverse().find(m => m.imageUrl || m.scenePrompt);
      setLatestVisualMessage(lastVisual);

      // Re-initialize gemini context
      geminiService.initializeChat(session.config.character, session.config.date, language); 
      
      setAppState(AppState.ACTIVE);
  };

  const handleDeleteSession = (id: string) => {
      const updated = savedSessions.filter(s => s.id !== id);
      saveHistoryToStorage(updated);
  };

  const handleExitSession = () => {
      stopAudio();
      
      setAppState(AppState.SETUP);
      setMessages([]);
      setCurrentSessionId(null);
      setLatestVisualMessage(undefined);
  };

  const handleSendMessage = async (text: string) => {
    stopAudio();

    const userMsg: Message = {
      id: nanoid(),
      role: 'user',
      text,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    updateCurrentSession(newMessages, config);
    setIsTyping(true);

    try {
      const response = await geminiService.sendMessage(text);
      
      const botMsg: Message = {
        id: nanoid(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        scenePrompt: response.scenePrompt || undefined,
        contextInfo: response.contextInfo || undefined,
        isImageLoading: !!response.scenePrompt
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      updateCurrentSession(finalMessages, config);
      
      if (response.scenePrompt) {
        setLatestVisualMessage(botMsg);
        handleImageGeneration(botMsg.id, response.scenePrompt);
      }
      
    } catch (error) {
      console.error("Error exchanging messages", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageGeneration = async (messageId: string, prompt: string) => {
    const imageUrl = await geminiService.generateImage(prompt);
    
    // Update local state and storage
    const updater = (prevMsgs: Message[]) => {
        const updated = prevMsgs.map(msg => 
            msg.id === messageId 
              ? { ...msg, imageUrl: imageUrl || undefined, isImageLoading: false } 
              : msg
        );
        updateCurrentSession(updated, config);
        return updated;
    };

    setMessages(prev => updater(prev));
      
    setLatestVisualMessage(prev => {
        if (prev && prev.id === messageId) {
            return { ...prev, imageUrl: imageUrl || undefined, isImageLoading: false };
        }
        return prev;
    });
  };

  // --- AUDIO LOGIC ---

  const stopAudio = () => {
    if (activeSourceRef.current) {
        try {
          activeSourceRef.current.onended = null;
          activeSourceRef.current.stop();
          activeSourceRef.current.disconnect();
        } catch(e) { 
          // ignore if already stopped 
        }
        activeSourceRef.current = null;
    }
    setPlayingAudioId(null);
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
     if (playingAudioId === messageId) {
         stopAudio();
         return;
     }

     // Stop any current audio before starting new
     stopAudio();

     const message = messages.find(m => m.id === messageId);
     if (!message) return;

     if (message.audioData) {
         playAudioBase64(message.audioData, messageId);
         return;
     }

     setAudioLoadingId(messageId);
     const audioBase64 = await geminiService.generateSpeech(text, config.voiceGender || 'MALE');
     setAudioLoadingId(null);

     if (audioBase64) {
        setMessages(prev => {
            const updated = prev.map(m => m.id === messageId ? { ...m, audioData: audioBase64 } : m);
            return updated;
        });
        playAudioBase64(audioBase64, messageId);
     }
  };

  const playAudioBase64 = async (base64: string, messageId: string) => {
      try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        // Ensure context is running (fixes autoplay policy issues)
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const ctx = audioContextRef.current;
        
        // 1. Decode Base64 string to Uint8Array
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 2. Convert Raw PCM (16-bit little-endian) to AudioBuffer (Float32)
        // Gemini TTS returns mono 24kHz raw PCM
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        
        // Normalize 16-bit integer to float [-1.0, 1.0]
        for (let i = 0; i < dataInt16.length; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }

        // 3. Play
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
            setPlayingAudioId(null);
        };
        source.start();
        activeSourceRef.current = source;
        setPlayingAudioId(messageId);

      } catch (error) {
          console.error("Audio playback error:", error);
          setPlayingAudioId(null);
      }
  };

  if (appState === AppState.SETUP) {
    return (
        <SetupScreen 
            onStart={handleStartSession} 
            onResume={handleResumeSession}
            onDeleteSession={handleDeleteSession}
            savedSessions={savedSessions}
            isLoading={isTyping} 
            language={language}
            onLanguageChange={setLanguage}
        />
    );
  }

  if (appState === AppState.ERROR) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-tech">
            <div className="text-center p-8 border border-red-900/50 bg-red-950/10 rounded-lg">
                <h1 className="text-2xl font-bold mb-4 text-red-500 animate-pulse">{TRANSLATIONS[language].errorTitle}</h1>
                <p className="mb-4 text-red-200">{TRANSLATIONS[language].errorDesc}</p>
                <button 
                    onClick={() => setAppState(AppState.SETUP)}
                    className="px-6 py-2 bg-red-900/30 border border-red-500 hover:bg-red-900/50 text-red-100 rounded transition-colors"
                >
                    {TRANSLATIONS[language].returnMenu}
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-slate-950 text-slate-200 overflow-hidden relative">
      
      {/* Mobile Layout: Stacked (Visual Top, Chat Bottom) */}
      <div className="md:hidden flex flex-col h-full w-full">
         <div className="h-[35vh] w-full shrink-0 relative z-20 border-b border-cyan-900/50 shadow-lg">
            <Visualizer 
                currentMessage={latestVisualMessage} 
                isMobile={true}
                language={language}
            />
         </div>
         <div className="flex-1 h-[65vh] relative z-10">
            <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage}
                onExit={handleExitSession}
                characterName={config.character}
                date={config.date}
                isTyping={isTyping}
                onPlayAudio={handlePlayAudio}
                playingAudioId={playingAudioId}
                audioLoadingId={audioLoadingId}
                language={language}
            />
         </div>
      </div>

      {/* Desktop Layout: Split Screen */}
      <div className="hidden md:flex w-full h-full">
        <div className="w-[60%] lg:w-[65%] h-full">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            onExit={handleExitSession}
            characterName={config.character}
            date={config.date}
            isTyping={isTyping}
            onPlayAudio={handlePlayAudio}
            playingAudioId={playingAudioId}
            audioLoadingId={audioLoadingId}
            language={language}
          />
        </div>
        <div className="w-[40%] lg:w-[35%] h-full">
          <Visualizer currentMessage={latestVisualMessage} language={language} />
        </div>
      </div>

    </div>
  );
};

export default App;