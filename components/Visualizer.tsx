import React from 'react';
import { Message, Language, TRANSLATIONS } from '../types';
import { Eye, Loader2, Zap, MapPin } from 'lucide-react';

interface VisualizerProps {
  currentMessage?: Message;
  isMobile?: boolean;
  language: Language;
}

export const Visualizer: React.FC<VisualizerProps> = ({ currentMessage, isMobile, language }) => {
  const isEmpty = !currentMessage || (!currentMessage.imageUrl && !currentMessage.isImageLoading);
  const t = TRANSLATIONS[language];

  if (isEmpty) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 text-slate-600 p-8 text-center relative overflow-hidden border-b md:border-b-0 md:border-l border-cyan-900/30">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        
        <div className="relative z-10 p-8 border border-slate-800 bg-slate-900/50 backdrop-blur-sm rotate-45 mb-8 group hover:border-cyan-500/50 transition-colors duration-500">
            <div className="-rotate-45">
                <Eye className="w-10 h-10 opacity-50 text-cyan-500 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            </div>
        </div>
        <h3 className="text-lg font-tech text-cyan-500/80 mb-2 uppercase tracking-widest relative z-10">
             {t.memBlockOffline}
        </h3>
        <p className="text-xs font-data text-slate-500 max-w-xs uppercase tracking-wide relative z-10">
          {t.waitingSync}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black relative overflow-hidden border-b md:border-b-0 md:border-l border-cyan-900/30 flex flex-col group">
      
      {/* Background Blur Effect */}
      <div className="absolute inset-0 z-0">
          {currentMessage?.imageUrl && (
              <div 
                  className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-125 saturate-150"
                  style={{ backgroundImage: `url(${currentMessage.imageUrl})` }}
              ></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-0 overflow-hidden">
        {/* Main Image Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          
          {currentMessage?.isImageLoading ? (
             <div className="flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-500 opacity-20 animate-ping"></div>
                    <div className="relative bg-slate-950 border border-cyan-900 p-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    </div>
                </div>
                <p className="font-tech tracking-widest text-xs animate-pulse text-cyan-500 mt-4 uppercase">
                    {t.rendering}
                </p>
             </div>
          ) : currentMessage?.imageUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black/50">
                {/* Use object-contain to ensure the full image is visible, with blur background filling gaps */}
                <img 
                    src={currentMessage.imageUrl} 
                    alt="Historical Scene" 
                    className="w-full h-full object-contain relative z-10" 
                />
                
                {/* Tech Overlays */}
                <div className="absolute top-0 left-0 p-4 opacity-50 hidden md:block">
                     <div className="h-2 w-20 bg-cyan-500 mb-1"></div>
                     <div className="text-[10px] font-tech text-cyan-400">MEM.SEQ.892</div>
                </div>

                <div className="absolute bottom-0 right-0 p-4 opacity-50 hidden md:block">
                     <Zap size={16} className="text-cyan-400" />
                </div>
                
                {/* Scanline overlay over image */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] pointer-events-none mix-blend-overlay z-20"></div>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Description & Context Footer */}
      {(currentMessage?.contextInfo || (!isMobile && currentMessage?.scenePrompt)) && (
        <div className="relative z-20 p-4 bg-slate-950/90 border-t border-cyan-900/30 backdrop-blur-md">
            {currentMessage?.contextInfo && (
                <div className="flex items-start gap-2 mb-2 pb-2 border-b border-cyan-900/30">
                    <MapPin size={14} className="text-cyan-500 mt-0.5" />
                    <p className="text-cyan-100 font-tech text-xs tracking-wider uppercase shadow-cyan-500/20 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                        {currentMessage.contextInfo}
                    </p>
                </div>
            )}
            
            {!isMobile && (
                <>
                    <h3 className="text-cyan-600 font-tech text-[10px] uppercase tracking-widest mb-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        {t.visualCortex}
                    </h3>
                    <p className="text-slate-400 text-xs font-data font-light leading-relaxed opacity-60 line-clamp-2">
                        "{currentMessage?.scenePrompt}"
                    </p>
                </>
            )}
        </div>
      )}
    </div>
  );
};