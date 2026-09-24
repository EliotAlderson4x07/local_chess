import React, { useEffect, useRef } from 'react';
import { MoveRecord } from '../types/chess.ts';

interface MoveHistoryProps {
  moves: MoveRecord[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [moves]);

  // Group into pairs (turn 1: white, black)
  const pairedMoves: Array<{ turnNumber: number; white: string; black?: string }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairedMoves.push({
      turnNumber: Math.floor(i / 2) + 1,
      white: moves[i].san,
      black: moves[i + 1] ? moves[i + 1].san : undefined
    });
  }

  return (
    <div className="bg-[#312e2b] border border-[#3f3c38] rounded-2xl p-4 shadow-md flex-1 flex flex-col min-h-[220px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm text-gray-200 flex items-center gap-1.5">
          <span>📋</span> Registro de Movimientos
        </h3>
        <span className="text-xs bg-[#262421] px-2 py-0.5 rounded text-gray-400 font-mono">
          {moves.length} jugadas
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 max-h-[230px] overflow-y-auto bg-[#262421] rounded-xl p-2.5 font-mono text-xs text-gray-300 space-y-1 border border-[#3f3c38]"
      >
        {pairedMoves.length === 0 ? (
          <div className="text-gray-500 italic text-center py-8">Las jugadas aparecerán aquí...</div>
        ) : (
          pairedMoves.map(pair => (
            <div
              key={pair.turnNumber}
              className="flex items-center py-0.5 px-1.5 rounded hover:bg-[#312e2b] transition"
            >
              <span className="w-10 text-gray-500 text-[11px]">{pair.turnNumber}.</span>
              <span className="w-24 text-white font-semibold">{pair.white}</span>
              <span className="w-24 text-gray-300">{pair.black || ''}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
