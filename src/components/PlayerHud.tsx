import React from 'react';
import { PieceSvg } from '../constants/pieces.tsx';

interface PlayerHudProps {
  name: string;
  avatar: string;
  rating: number;
  badgeText: string;
  badgeColor?: string;
  timeLeftSeconds: number;
  incrementSeconds?: number;
  isActiveTurn: boolean;
  isThinking?: boolean;
  capturedPieces: string[];
  advantagePoints: number;
}

export const PlayerHud: React.FC<PlayerHudProps> = ({
  name,
  avatar,
  rating,
  badgeText,
  badgeColor = 'text-[#7fa650] bg-[#7fa650]/20 border-[#7fa650]/30',
  timeLeftSeconds,
  incrementSeconds = 0,
  isActiveTurn,
  isThinking = false,
  capturedPieces,
  advantagePoints
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeftSeconds <= 20;

  return (
    <div
      className={`bg-[#312e2b] border rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-md transition-all ${
        isActiveTurn ? 'border-[#7fa650] ring-1 ring-[#7fa650]/40' : 'border-[#3f3c38]'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#262421] object-cover border border-[#3f3c38]"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
            }}
          />
          {isThinking && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          )}
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm sm:text-base text-white max-w-[130px] sm:max-w-[170px] truncate">
              {name}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
              {badgeText}
            </span>
            {isThinking && (
              <span className="text-[10px] text-amber-400 font-semibold animate-pulse hidden sm:inline">
                Calculando jugada...
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
            <span className="font-mono text-gray-300 font-medium">Elo {rating}</span>

            {/* Captured Pieces List */}
            {capturedPieces.length > 0 && (
              <div className="flex items-center space-x-0.5 ml-1">
                {capturedPieces.map((pieceKey, idx) => (
                  <div key={idx} className="w-3.5 h-3.5 inline-block -mr-1">
                    <PieceSvg
                      type={pieceKey[1] as 'p' | 'n' | 'b' | 'r' | 'q'}
                      color={pieceKey[0] as 'w' | 'b'}
                    />
                  </div>
                ))}
              </div>
            )}

            {advantagePoints > 0 && (
              <span className="text-[11px] font-bold text-[#7fa650] font-mono">
                +{advantagePoints}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Digital Countdown Clock with Increment indicator */}
      <div className="flex flex-col items-end">
        <div
          className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border font-mono font-bold text-xl sm:text-2xl tracking-wider shadow-inner transition-all flex items-center gap-1.5 ${
            isLowTime
              ? 'bg-red-950/70 border-red-500 text-red-400 animate-pulse'
              : isActiveTurn
              ? 'bg-[#262421] border-[#7fa650] text-white'
              : 'bg-[#262421] border-[#3f3c38] text-gray-300'
          }`}
        >
          <span>{formatTime(timeLeftSeconds)}</span>
        </div>
        {incrementSeconds > 0 && (
          <span className="text-[10px] font-mono text-gray-400 mt-0.5 mr-1 font-semibold">
            +{incrementSeconds}s / jugada
          </span>
        )}
      </div>
    </div>
  );
};
