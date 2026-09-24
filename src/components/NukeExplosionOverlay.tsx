import React, { useEffect, useState } from 'react';

export type NukePhase = 'countdown' | 'blast' | 'fallout' | null;

interface NukeExplosionOverlayProps {
  phase: NukePhase;
  countdownSeconds?: number;
  onExplosionComplete?: () => void;
}

export const NukeExplosionOverlay: React.FC<NukeExplosionOverlayProps> = ({
  phase,
  countdownSeconds = 3,
  onExplosionComplete
}) => {
  const [currentCount, setCurrentCount] = useState(countdownSeconds);

  useEffect(() => {
    if (phase === 'countdown') {
      setCurrentCount(countdownSeconds);
      const timer = setInterval(() => {
        setCurrentCount(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 700);
      return () => clearInterval(timer);
    }
  }, [phase, countdownSeconds]);

  if (!phase) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-2xl flex items-center justify-center">
      {/* 1. COUNTDOWN / ALARM PHASE */}
      {phase === 'countdown' && (
        <div className="absolute inset-0 bg-red-950/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 animate-pulse">
          {/* Top & Bottom Hazard Stripes */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-[repeating-linear-gradient(45deg,#000,#000_12px,#eab308_12px,#eab308_24px)] opacity-90 shadow-md" />
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-[repeating-linear-gradient(45deg,#000,#000_12px,#eab308_12px,#eab308_24px)] opacity-90 shadow-md" />

          {/* Nuclear Icon & Target Scope */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-dashed border-red-500 animate-spin flex items-center justify-center" style={{ animationDuration: '4s' }} />
            <div className="w-20 h-20 rounded-full border-2 border-red-400 absolute animate-ping" />
            <span className="text-5xl absolute filter drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
              ☢️
            </span>
          </div>

          <div className="text-center space-y-1">
            <span className="bg-red-600 text-white font-black text-[11px] sm:text-xs uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-red-400 animate-bounce inline-block">
              🚨 MISIL NUCLEAR TÁCTICO DETECTADO 🚨
            </span>
            <p className="text-red-200 text-xs font-bold tracking-wide">
              IMPACTO TOTAL EN EL TABLERO
            </p>
            <div className="text-5xl sm:text-6xl font-black text-amber-300 drop-shadow-[0_0_25px_rgba(245,158,11,1)] font-mono">
              0{currentCount}
            </div>
            <p className="text-[10px] sm:text-xs text-amber-200/90 font-medium max-w-xs mx-auto">
              Solo los Reyes sobrevivirán al bombardeo. Se forzarán Tablas por insuficiencia material.
            </p>
          </div>
        </div>
      )}

      {/* 2. BLAST DETONATION PHASE */}
      {phase === 'blast' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Intense Blinding Flash */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100 via-white to-amber-200 opacity-95 animate-ping" style={{ animationDuration: '0.4s' }} />
          
          {/* Nuclear Fireball Ball */}
          <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-300 shadow-[0_0_120px_rgba(245,158,11,1)] animate-nuke-fireball blur-sm" />

          {/* Expanding Shockwaves */}
          <div className="absolute w-64 h-64 rounded-full border-8 border-orange-400 animate-nuke-shockwave" />
          <div className="absolute w-64 h-64 rounded-full border-8 border-yellow-200 animate-nuke-shockwave" style={{ animationDelay: '0.2s' }} />

          {/* Mushroom Cloud Center Graphic */}
          <div className="relative z-10 flex flex-col items-center justify-center transform -translate-y-4">
            <div className="text-7xl sm:text-8xl animate-bounce filter drop-shadow-[0_0_40px_rgba(239,68,68,1)]">
              💥
            </div>
            <span className="text-2xl sm:text-3xl font-black text-yellow-300 drop-shadow-[0_0_20px_#000] tracking-wider uppercase">
              ¡DETONACIÓN!
            </span>
          </div>
        </div>
      )}

      {/* 3. POST-BLAST FALLOUT HAZE */}
      {phase === 'fallout' && (
        <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[0.5px] flex flex-col items-center justify-end p-4 animate-radiation-pulse">
          {/* Floating radioactive particles */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.25)_0%,transparent_70%)]" />

          <div className="relative z-10 bg-zinc-950/90 border border-emerald-500/70 text-emerald-300 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 max-w-sm text-center">
            <span className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>☢️</span>
            <div>
              <p className="text-xs font-black uppercase text-emerald-400 tracking-wide">
                Cataclismo Nuclear Completado
              </p>
              <p className="text-[11px] text-gray-300 font-semibold">
                Solo los Reyes resistieron la radiación. Tablas decretadas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
