import React, { useState } from 'react';
import { PieceSymbol } from 'chess.js';
import { PieceSvg } from '../constants/pieces.tsx';
import { PieceSkinId } from '../types/chess.ts';

interface RevivePieceModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerColor: 'w' | 'b';
  capturedAllies: string[];
  pieceSkin?: PieceSkinId;
  onConfirmRevive: (pieceType: PieceSymbol, placementMode: 'auto' | 'manual') => void;
}

interface PieceOption {
  type: PieceSymbol;
  name: string;
  points: number;
  description: string;
}

const PIECE_OPTIONS: PieceOption[] = [
  { type: 'q', name: 'Dama / Reina', points: 9, description: 'La fuerza suprema del tablero con movilidad ilimitada.' },
  { type: 'r', name: 'Torre Real', points: 5, description: 'Domina columnas y filas con poder destructivo lineal.' },
  { type: 'b', name: 'Alfil Místico', points: 3, description: 'Corta diagonales y controla casillas clave a distancia.' },
  { type: 'n', name: 'Caballo de Guerra', points: 3, description: 'Salta sobre piezas rivales para asestar ataques sorpresa.' },
  { type: 'p', name: 'Peón Valiente', points: 1, description: 'Avanza hacia la coronación o defiende tu enroque.' },
];

export const RevivePieceModal: React.FC<RevivePieceModalProps> = ({
  isOpen,
  onClose,
  playerColor,
  capturedAllies,
  pieceSkin = 'classic',
  onConfirmRevive
}) => {
  const [selectedPiece, setSelectedPiece] = useState<PieceSymbol>('q');

  if (!isOpen) return null;

  // Count captured pieces of each type for playerColor
  // capturedAllies contains strings like 'wQ', 'wP', 'wR' or 'bQ', etc.
  const counts: Record<PieceSymbol, number> = {
    q: 0,
    r: 0,
    b: 0,
    n: 0,
    p: 0,
    k: 0
  };

  capturedAllies.forEach(str => {
    const symbol = str.slice(1).toLowerCase() as PieceSymbol;
    if (counts[symbol] !== undefined) {
      counts[symbol]++;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#24211e] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative flex flex-col gap-4 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#312e2b] transition cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 shrink-0">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">
                Resurrección de Piezas Aliadas
              </h3>
              <span className="text-[10px] bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-black px-2 py-0.5 rounded-full shadow">
                VIP
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Devuelve a la vida a cualquier pieza caída para alterar el destino de la partida.
            </p>
          </div>
        </div>

        {/* Piece Selection List */}
        <div className="space-y-2 mt-1">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
            Selecciona la pieza a revivir:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {PIECE_OPTIONS.map(opt => {
              const isSelected = selectedPiece === opt.type;
              const fallenCount = counts[opt.type];

              return (
                <div
                  key={opt.type}
                  onClick={() => setSelectedPiece(opt.type)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10'
                      : 'bg-[#2b2723] hover:bg-[#332e29] border-[#3f3c38]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1d1b18] border border-[#3f3c38] flex items-center justify-center shrink-0">
                    <div className="w-9 h-9">
                      <PieceSvg type={opt.type} color={playerColor} skin={pieceSkin} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white truncate">
                        {opt.name}
                      </span>
                      <span className="text-[10px] text-amber-400 font-extrabold ml-1">
                        +{opt.points} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {fallenCount > 0 ? (
                        <span className="text-[10px] bg-red-950/80 text-red-300 font-bold px-1.5 py-0.5 rounded border border-red-500/30">
                          {fallenCount} caída{fallenCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                          Invocación Extra
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Placement Choices */}
        <div className="bg-[#1e1c19] border border-[#3a3631] rounded-2xl p-3.5 space-y-2.5">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-300">
            ¿Cómo deseas posicionar tu pieza revivida?
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onConfirmRevive(selectedPiece, 'auto')}
              className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <span>⚡</span> Invocación Inmediata
              </span>
              <span className="text-[9px] font-bold text-zinc-900/80">
                (Fila defensiva libre)
              </span>
            </button>

            <button
              onClick={() => onConfirmRevive(selectedPiece, 'manual')}
              className="py-2.5 px-3 bg-[#312e2b] hover:bg-[#3f3c38] border border-amber-500/50 hover:border-amber-400 text-amber-300 font-black text-xs rounded-xl shadow transition active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <span>🎯</span> Elegir en Tablero
              </span>
              <span className="text-[9px] font-bold text-amber-200/70">
                (Clic en casilla libre)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
