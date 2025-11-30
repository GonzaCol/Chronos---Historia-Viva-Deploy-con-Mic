import React, { useState, useEffect, useRef } from 'react';
import { SessionConfig, SavedSession, Language, TRANSLATIONS } from '../types';
import { Button } from './Button';
import { Loader2, Dna, Activity, Radio, Calendar, History, Trash2, ArrowRight, UserPlus, ChevronDown, Globe } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface SetupScreenProps {
  onStart: (config: SessionConfig) => void;
  onResume: (session: SavedSession) => void;
  onDeleteSession: (id: string) => void;
  savedSessions: SavedSession[];
  isLoading: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const HISTORICAL_PRESETS = [
  { name: "Napoleon Bonaparte", date: "1805" },
  { name: "Cleopatra VII", date: "40 BC" },
  { name: "Leonardo da Vinci", date: "1500" },
  { name: "Albert Einstein", date: "1905" },
  { name: "Socrates", date: "399 BC" },
  { name: "Ada Lovelace", date: "1843" },
  { name: "William Shakespeare", date: "1600" },
  { name: "Joan of Arc", date: "1429" },
];

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ 
    onStart, 
    onResume, 
    onDeleteSession, 
    savedSessions, 
    isLoading,
    language,
    onLanguageChange
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [character, setCharacter] = useState('');
  const [date, setDate] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  const t = TRANSLATIONS[language];

  // Timeline Logic
  const [lifespan, setLifespan] = useState<{ birthYear: number; deathYear: number; gender: 'MALE' | 'FEMALE' } | null>(null);
  const [isFetchingLifespan, setIsFetchingLifespan] = useState(false);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatYear = (year: number) => {
    return year < 0 ? `${Math.abs(year)} BC` : `${year} AD`;
  };

  useEffect(() => {
    setLifespan(null);
    setSliderValue(null);
    
    if (!character.trim()) return;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    setIsFetchingLifespan(true);
    debounceTimeout.current = setTimeout(async () => {
      const data = await geminiService.getCharacterLifespan(character);
      if (data) {
        setLifespan(data);
        const midLife = Math.floor((data.birthYear + data.deathYear) / 2);
        // Only auto-set slider if date isn't set or is invalid
        if (!date) {
            setSliderValue(midLife);
            setDate(formatYear(midLife));
        } else {
             // Try to parse existing date to slider
             const yearMatch = date.match(/(\d+)/);
             if (yearMatch) {
                 const yearVal = parseInt(yearMatch[1]);
                 const isBC = date.includes('BC');
                 const adjustedYear = isBC ? -yearVal : yearVal;
                 if (adjustedYear >= data.birthYear && adjustedYear <= data.deathYear) {
                     setSliderValue(adjustedYear);
                 }
             }
        }
      }
      setIsFetchingLifespan(false);
    }, 1000); 

    return () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [character]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderValue(val);
    setDate(formatYear(val));
  };

  const selectPreset = (preset: {name: string, date: string}) => {
      setCharacter(preset.name);
      setDate(preset.date);
      setShowPresets(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (character && date) {
      onStart({ 
        character, 
        date, 
        voiceGender: lifespan?.gender || 'MALE' // Default to male if unknown
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden h-dvh">
      {/* Background Grid & Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950"></div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-4 w-full animate-scanline opacity-20"></div>

      <div className="relative w-full max-w-xl z-10">
        {/* Header HUD */}
        <div className="flex justify-between items-end mb-8 border-b border-cyan-900/50 pb-4">
          <div>
            <h1 className="text-4xl font-tech text-white tracking-widest glitch-effect">PROJECT CHRONOS</h1>
            <p className="text-cyan-500 font-data text-sm tracking-[0.2em] flex items-center gap-2">
              <Activity size={14} className="animate-pulse" />
              {t.systemStatus}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 relative">
             <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 text-cyan-500 hover:text-cyan-300 transition-colors px-2 py-1 rounded-sm border border-transparent hover:border-cyan-900/50 hover:bg-cyan-900/20"
             >
                <Globe size={16} />
                <span className="font-tech text-xs uppercase">{language}</span>
             </button>
             
             {showLangMenu && (
                <div className="absolute top-8 right-0 bg-slate-900 border border-cyan-900/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] w-32 z-50 rounded-sm">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                onLanguageChange(lang.code);
                                setShowLangMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-tech flex items-center gap-2 hover:bg-cyan-900/30 transition-colors ${language === lang.code ? 'text-cyan-400 bg-cyan-900/10' : 'text-slate-400'}`}
                        >
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
             )}

             <div className="text-xs text-emerald-500 font-mono">SECURE</div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-slate-900/50 p-1 border border-slate-800 rounded-sm w-fit">
            <button 
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 text-xs font-tech tracking-widest transition-all ${activeTab === 'new' ? 'bg-cyan-900/50 text-cyan-100 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
                {t.newSync}
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-tech tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-cyan-900/50 text-cyan-100 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
                {t.archives} ({savedSessions.length})
            </button>
        </div>

        {activeTab === 'new' ? (
            <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-md border border-cyan-900/50 p-8 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group animate-fadeIn">
            {/* Corner Decors */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500"></div>

            <div className="space-y-8">
                {/* Subject Input */}
                <div className="space-y-2 relative">
                    <div className="flex justify-between items-center">
                        <label className="text-cyan-400 text-xs font-bold font-tech uppercase tracking-widest flex items-center gap-2">
                            <Dna size={16} />
                            {t.targetSubject}
                        </label>
                        <button 
                            type="button" 
                            onClick={() => setShowPresets(!showPresets)}
                            className="text-[10px] text-cyan-600 hover:text-cyan-300 font-mono flex items-center gap-1 uppercase"
                        >
                            {t.quickSelect} <ChevronDown size={12} />
                        </button>
                    </div>

                    {/* Presets Dropdown */}
                    {showPresets && (
                        <div className="absolute top-8 right-0 z-50 w-64 bg-slate-900 border border-cyan-900/50 shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                            {HISTORICAL_PRESETS.map(p => (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => selectPreset(p)}
                                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-cyan-900/30 hover:text-cyan-200 text-xs font-data border-b border-slate-800 last:border-0"
                                >
                                    <span className="block font-bold">{p.name}</span>
                                    <span className="text-[10px] text-slate-500">{p.date}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="relative group/input">
                        <input
                            type="text"
                            value={character}
                            onChange={(e) => setCharacter(e.target.value)}
                            placeholder={t.identifyPlaceholder}
                            className="w-full bg-slate-950/80 border border-slate-700 rounded-none px-4 py-4 text-white font-data text-lg placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all uppercase tracking-wide"
                            required
                        />
                        {isFetchingLifespan && (
                            <div className="absolute right-3 top-4 text-cyan-400 animate-spin">
                                <Loader2 size={20} />
                            </div>
                        )}
                        {/* Glowing line under input */}
                        <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 transition-all duration-500 group-focus-within/input:w-full"></div>
                    </div>
                </div>

                {/* Temporal Input */}
                <div className="space-y-4">
                <label className="text-cyan-400 text-xs font-bold font-tech uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={16} />
                    {t.temporalCoordinates}
                </label>
                <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder={t.datePlaceholder}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-none px-4 py-4 text-white font-data text-lg placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all uppercase tracking-wide"
                    required
                />
                
                {/* Sci-Fi Slider */}
                {lifespan && (
                    <div className="pt-4 px-2 animate-fadeIn border-t border-slate-800/50 mt-4">
                        <div className="flex justify-between text-xs text-cyan-600 font-tech mb-3">
                            <span>{formatYear(lifespan.birthYear)}</span>
                            <span className="text-cyan-400 font-bold flex items-center gap-1">
                                <Radio size={12} className="animate-pulse" />
                                {t.lifespanDetected}
                            </span>
                            <span>{formatYear(lifespan.deathYear)}</span>
                        </div>
                        
                        <div className="relative h-8 flex items-center">
                            {/* Track Background */}
                            <div className="absolute w-full h-2 bg-slate-800/50 skew-x-12 border border-slate-700"></div>
                            
                            {/* Life Range */}
                            <div className="absolute w-full h-2 px-1">
                                    <div 
                                        className="h-full bg-cyan-900/30 skew-x-12 relative overflow-hidden"
                                        style={{
                                            width: '100%'
                                        }}
                                    >
                                        {/* Animated hash lines inside bar */}
                                        <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-20"></div>
                                    </div>
                            </div>

                            {/* Active Progress */}
                            <div 
                                    className="absolute h-2 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-100 skew-x-12"
                                    style={{
                                        width: sliderValue 
                                            ? `${Math.max(0, Math.min(100, ((sliderValue - lifespan.birthYear) / (lifespan.deathYear - lifespan.birthYear)) * 100))}%` 
                                            : '0%'
                                    }}
                            ></div>

                            {/* Range Input */}
                            <input 
                                type="range" 
                                min={lifespan.birthYear} 
                                max={lifespan.deathYear} 
                                value={sliderValue || lifespan.birthYear}
                                onChange={handleSliderChange}
                                className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                            />

                            {/* Thumb */}
                            <div 
                                className="absolute h-6 w-3 bg-white border-2 border-cyan-500 shadow-[0_0_15px_cyan] pointer-events-none transition-all duration-75 z-10"
                                style={{
                                    left: sliderValue 
                                        ? `calc(${((sliderValue - lifespan.birthYear) / (lifespan.deathYear - lifespan.birthYear)) * 100}% - 6px)` 
                                        : '0%'
                                }}
                            ></div>
                        </div>
                        <p className="text-center text-[10px] text-cyan-600/70 mt-2 font-mono uppercase tracking-widest">
                            {t.adjustFlux}
                        </p>
                    </div>
                )}
                </div>

                <Button type="submit" className="w-full text-lg shadow-[0_0_20px_rgba(6,182,212,0.2)]" isLoading={isLoading}>
                {t.initialize}
                </Button>
            </div>
            </form>
        ) : (
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] p-4 max-h-[500px] overflow-y-auto custom-scrollbar animate-fadeIn">
                {savedSessions.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 font-data">
                        <History size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="uppercase tracking-widest text-sm">{t.noArchives}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {savedSessions.sort((a,b) => b.lastModified - a.lastModified).map(session => (
                            <div key={session.id} className="group relative bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 p-4 transition-all hover:bg-slate-900 flex justify-between items-center">
                                <div className="flex-1 cursor-pointer" onClick={() => onResume(session)}>
                                    <h3 className="text-cyan-400 font-tech text-sm uppercase tracking-wider mb-1 group-hover:text-cyan-300">
                                        {session.config.character}
                                    </h3>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono uppercase">
                                        <span>{session.config.date}</span>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                        <span>{new Date(session.lastModified).toLocaleDateString()}</span>
                                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                        <span>{session.messages.length} {t.blocks}</span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-data mt-2 line-clamp-1 italic opacity-60">
                                        "{session.messages[session.messages.length - 1]?.text.substring(0, 60)}..."
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onResume(session)}
                                        className="p-2 text-cyan-600 hover:text-cyan-400 hover:bg-cyan-900/20 rounded-sm transition-colors"
                                        title={t.loadSim}
                                    >
                                        <ArrowRight size={18} />
                                    </button>
                                    <button 
                                        onClick={() => onDeleteSession(session.id)}
                                        className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/10 rounded-sm transition-colors"
                                        title={t.deleteArchive}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};