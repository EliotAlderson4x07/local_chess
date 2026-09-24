import React from 'react';
import { GameMode } from '../types/chess.ts';

interface GameOverModalProps {
  isOpen: boolean;
  isWin: boolean;
  isDraw: boolean;
  reason: string;
  gameMode: GameMode;
  eloDelta: number;
  newElo: number;
  onPlayAgain: () => void;
  onClose: () => void;
  onReviewGame?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  isWin,
  isDraw,
  reason,
  gameMode,
  eloDelta,
  newElo,
  onPlayAgain,
  onClose,
  onReviewGame
}) => {
  if (!isOpen) return null;

  const resultImage = isWin ? 'assets/victoria.jpg' : 'assets/derrota.jpg';
  const fallbackImage = isWin
    ? 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
    : 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#312e2b] border border-[#3f3c38] rounded-3xl overflow-hidden shadow-2xl text-center">
        {/* Banner with local asset and graceful fallback */}
        <div className="w-full h-44 bg-black relative">
          <img
            src={resultImage}
            alt="Resultado"
            className="w-full h-full object-cover"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src = fallbackImage;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#312e2b] to-transparent" />
        </div>

        <div className="p-6 -mt-8 relative">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl border-2 border-white flex items-center justify-center text-3xl shadow-lg mb-3 ${
              isWin ? 'bg-[#7fa650]' : isDraw ? 'bg-amber-600' : 'bg-red-800'
            }`}
          >
            {isWin ? '🏆' : isDraw ? '🤝' : '💀'}
          </div>

          <h3 className="text-2xl font-extrabold text-white">
            {isWin ? '¡Victoria!' : isDraw ? 'Tablas' : 'Derrota'}
          </h3>
          <p className="text-xs text-gray-300 mt-1 mb-5">{reason}</p>

          {/* Elo Summary Card */}
          <div className="bg-[#262421] border border-[#3f3c38] rounded-xl p-3 w-full mb-5 flex items-center justify-around font-mono">
            <div>
              <span className="text-[10px] text-gray-400 block font-sans">Modalidad</span>
              <span className="font-bold text-sm text-white uppercase">{gameMode}</span>
            </div>
            <div className="h-8 w-px bg-[#3f3c38]" />
            <div>
              <span className="text-[10px] text-gray-400 block font-sans">Variación Elo</span>
              <span
                className={`font-extrabold text-base ${
                  eloDelta > 0
                    ? 'text-[#7fa650]'
                    : eloDelta < 0
                    ? 'text-red-400'
                    : 'text-gray-300'
                }`}
              >
                {eloDelta > 0 ? `+${eloDelta}` : eloDelta}
              </span>
            </div>
            <div className="h-8 w-px bg-[#3f3c38]" />
            <div>
              <span className="text-[10px] text-gray-400 block font-sans">Nuevo Elo</span>
              <span className="font-extrabold text-base text-white">{newElo}</span>
            </div>
          </div>

          {onReviewGame && (
            <button
              onClick={onReviewGame}
              className="w-full py-2.5 mb-2.5 bg-[#262421] hover:bg-[#383531] text-[#7fa650] hover:text-[#9bc763] font-bold text-sm rounded-xl border border-[#7fa650] transition flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              <span>🔍</span> Revisión de Partida (Evaluación IA)
            </button>
          )}

          <div className="flex space-x-2">
            <button
              onClick={onPlayAgain}
              className="flex-1 py-2.5 bg-[#7fa650] hover:bg-[#537a38] text-white font-bold text-sm rounded-xl transition shadow-lg cursor-pointer"
            >
              Jugar Otra Partida
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-[#262421] hover:bg-[#3f3c38] text-gray-300 font-semibold text-sm rounded-xl border border-[#3f3c38] transition cursor-pointer"
            >
              Ver Tablero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
