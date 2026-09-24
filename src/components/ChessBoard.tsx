import React, { useState, useRef } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { PieceSvg } from '../constants/pieces.tsx';
import { BoardArrow, PieceSkinId, Premove } from '../types/chess.ts';
import { NukeExplosionOverlay, NukePhase } from './NukeExplosionOverlay.tsx';

interface ChessBoardProps {
  game: Chess;
  isFlipped: boolean;
  onMove: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
  lastMove: { from: Square; to: Square } | null;
  disabled?: boolean;
  playerColor?: 'w' | 'b';
  isPlayerTurn?: boolean;
  premove?: Premove | null;
  onSetPremove?: (pm: Premove | null) => void;
  externalArrows?: BoardArrow[];
  moveBadge?: { square: Square; icon: string; label: string } | null;
  pieceSkin?: PieceSkinId;
  targetingMode?: {
    active: boolean;
    targetColor: 'w' | 'b';
    onSelectTarget: (square: Square) => void;
  } | null;
  nukePhase?: NukePhase;
  reviveTargeting?: {
    active: boolean;
    pieceType: PieceSymbol;
    onSelectSquare: (square: Square) => void;
  } | null;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  isFlipped,
  onMove,
  lastMove,
  disabled = false,
  playerColor = 'w',
  isPlayerTurn = true,
  premove = null,
  onSetPremove,
  externalArrows = [],
  moveBadge = null,
  pieceSkin = 'classic',
  targetingMode = null,
  nukePhase = null,
  reviveTargeting = null
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Right-click user drawings
  const [userArrows, setUserArrows] = useState<BoardArrow[]>([]);
  const [highlightedSquares, setHighlightedSquares] = useState<Set<string>>(new Set());
  const rightClickStartRef = useRef<Square | null>(null);

  // Legal moves for currently selected square
  const legalMoves = selectedSquare
    ? game.moves({ square: selectedSquare, verbose: true })
    : [];

  const legalTargets = new Set(legalMoves.map(m => m.to));

  const isKingInCheck = game.isCheck();
  let checkSquare: Square | null = null;
  if (isKingInCheck) {
    const turn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          checkSquare = `${files[c]}${8 - r}` as Square;
        }
      }
    }
  }

  // Clear user markings on left click
  const clearMarkings = () => {
    if (userArrows.length > 0 || highlightedSquares.size > 0) {
      setUserArrows([]);
      setHighlightedSquares(new Set());
    }
  };

  const handleSquareClick = (square: Square) => {
    clearMarkings();
    if (disabled) return;

    // 0. SPECIAL VIP: Revive Piece mode (place on empty square)
    if (reviveTargeting?.active) {
      const existing = game.get(square);
      if (!existing) {
        reviveTargeting.onSelectSquare(square);
        return;
      }
    }

    // 0.1 SPECIAL VIP CHAOS: Targeting mode (Obliterate enemy piece)
    if (targetingMode?.active) {
      const targetPiece = game.get(square);
      if (targetPiece && targetPiece.color === targetingMode.targetColor) {
        targetingMode.onSelectTarget(square);
        return;
      }
    }

    // 1. IF IT IS PLAYER'S TURN: Standard Move
    if (isPlayerTurn) {
      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          return;
        }

        if (legalTargets.has(square)) {
          const piece = game.get(selectedSquare);
          if (
            piece &&
            piece.type === 'p' &&
            ((piece.color === 'w' && square.endsWith('8')) ||
              (piece.color === 'b' && square.endsWith('1')))
          ) {
            setPendingPromotion({ from: selectedSquare, to: square });
            return;
          }

          const success = onMove(selectedSquare, square);
          if (success) {
            setSelectedSquare(null);
            return;
          }
        }
      }

      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
      }
      return;
    }

    // 2. IF NOT PLAYER'S TURN: PREMOVE HANDLING
    if (!isPlayerTurn && onSetPremove) {
      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null);
          onSetPremove(null);
          return;
        }

        // Register premove
        onSetPremove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        return;
      }

      const piece = game.get(square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
      } else {
        setSelectedSquare(null);
        if (premove) onSetPremove(null);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    clearMarkings();
    if (disabled) return;

    const piece = game.get(square);
    if (!piece) {
      e.preventDefault();
      return;
    }

    // Allow dragging own piece for live move or premove
    if (isPlayerTurn && piece.color === game.turn()) {
      setDraggedSquare(square);
      setSelectedSquare(square);
      e.dataTransfer.setData('text/plain', square);
    } else if (!isPlayerTurn && piece.color === playerColor) {
      setDraggedSquare(square);
      setSelectedSquare(square);
      e.dataTransfer.setData('text/plain', square);
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const fromSquare = (e.dataTransfer.getData('text/plain') as Square) || draggedSquare;
    if (!fromSquare || fromSquare === targetSquare) {
      setDraggedSquare(null);
      return;
    }

    if (isPlayerTurn) {
      const legalFromMoves = game.moves({ square: fromSquare, verbose: true });
      if (legalFromMoves.some(m => m.to === targetSquare)) {
        const piece = game.get(fromSquare);
        if (
          piece &&
          piece.type === 'p' &&
          ((piece.color === 'w' && targetSquare.endsWith('8')) ||
            (piece.color === 'b' && targetSquare.endsWith('1')))
        ) {
          setPendingPromotion({ from: fromSquare, to: targetSquare });
          setDraggedSquare(null);
          return;
        }

        onMove(fromSquare, targetSquare);
      }
    } else if (onSetPremove) {
      // Register premove on drop
      onSetPremove({ from: fromSquare, to: targetSquare });
    }

    setSelectedSquare(null);
    setDraggedSquare(null);
  };

  const handleSelectPromotion = (pieceType: PieceSymbol) => {
    if (pendingPromotion) {
      onMove(pendingPromotion.from, pendingPromotion.to, pieceType);
      setPendingPromotion(null);
      setSelectedSquare(null);
    }
  };

  // Right-click event handlers for arrows and square highlights
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) {
      // Right-click down
      rightClickStartRef.current = square;
    }
  };

  const handleMouseUp = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) {
      const startSquare = rightClickStartRef.current;
      rightClickStartRef.current = null;
      if (!startSquare) return;

      if (startSquare === square) {
        // Toggle square highlight
        setHighlightedSquares(prev => {
          const next = new Set(prev);
          if (next.has(square)) next.delete(square);
          else next.add(square);
          return next;
        });
      } else {
        // Toggle arrow
        setUserArrows(prev => {
          const exists = prev.some(a => a.from === startSquare && a.to === square);
          if (exists) {
            return prev.filter(a => !(a.from === startSquare && a.to === square));
          } else {
            return [...prev, { from: startSquare, to: square, color: '#7fa650' }];
          }
        });
      }
    }
  };

  // Convert square ('e4') to center percentage (x: 0..100, y: 0..100)
  const getSquareCenter = (sq: string) => {
    if (!sq || sq.length < 2) return { x: 50, y: 50 };
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const fileIndex = files.indexOf(sq[0]);
    const rankIndex = parseInt(sq[1], 10) - 1;

    const col = isFlipped ? 7 - fileIndex : fileIndex;
    const row = isFlipped ? rankIndex : 7 - rankIndex;

    const x = ((col + 0.5) / 8) * 100;
    const y = ((row + 0.5) / 8) * 100;
    return { x, y };
  };

  // 64 squares calculated with strict 8x8 orientation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const squares: Square[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const fileIndex = isFlipped ? 7 - c : c;
      const rankIndex = isFlipped ? r + 1 : 8 - r;
      squares.push(`${files[fileIndex]}${rankIndex}` as Square);
    }
  }

  const allArrows = [...userArrows, ...externalArrows];

  return (
    <div className="w-full flex justify-center items-center select-none">
      {/* Board wrapper enforcing strict square geometry */}
      <div
        onContextMenu={e => e.preventDefault()}
        className={`w-full max-w-[560px] aspect-square relative bg-[#21201d] p-2 sm:p-2.5 rounded-2xl shadow-2xl border-2 border-[#3f3c38] flex flex-col transition-transform ${
          nukePhase === 'blast' ? 'animate-nuke-shake ring-4 ring-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.8)]' : ''
        }`}
      >
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 rounded-xl overflow-hidden shadow-inner border border-black/30 relative">
          {/* Nuke Detonation FX Overlay */}
          {nukePhase && <NukeExplosionOverlay phase={nukePhase} />}

          {squares.map((square, index) => {
            const colIndex = index % 8;
            const rowIndex = Math.floor(index / 8);
            const isLight = (rowIndex + colIndex) % 2 === 0;

            const piece = game.get(square);
            const isSelected = selectedSquare === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isCheck = checkSquare === square;
            const isLegalTarget = legalTargets.has(square);
            const isHighlighted = highlightedSquares.has(square);

            // Premove indicator
            const isPremoveSquare = premove && (premove.from === square || premove.to === square);

            let squareBgClass = isLight ? 'bg-[#ebecd0]' : 'bg-[#7fa650]';
            if (isPremoveSquare) squareBgClass = 'bg-red-600/85';
            else if (isSelected) squareBgClass = 'bg-[#f7f769]/90';
            else if (isLastMove) squareBgClass = 'bg-[#baca44]/80';
            else if (isCheck) squareBgClass = 'bg-red-500/85 animate-pulse';

            const fileCoord = square[0];
            const rankCoord = square[1];
            const showFileCoord = rowIndex === 7;
            const showRankCoord = colIndex === 0;

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onMouseDown={e => handleMouseDown(e, square)}
                onMouseUp={e => handleMouseUp(e, square)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, square)}
                className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none transition-colors duration-75 ${squareBgClass}`}
              >
                {/* Right-click highlight circle */}
                {isHighlighted && (
                  <div className="absolute inset-1 rounded-full border-4 border-amber-400/80 bg-amber-400/20 pointer-events-none z-15" />
                )}

                {/* Coordinates */}
                {showRankCoord && (
                  <span
                    className={`absolute top-0.5 left-1 text-[9px] sm:text-[11px] font-extrabold select-none pointer-events-none ${
                      isLight ? 'text-[#7fa650]' : 'text-[#ebecd0]'
                    }`}
                  >
                    {rankCoord}
                  </span>
                )}
                {showFileCoord && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[9px] sm:text-[11px] font-extrabold select-none pointer-events-none ${
                      isLight ? 'text-[#7fa650]' : 'text-[#ebecd0]'
                    }`}
                  >
                    {fileCoord}
                  </span>
                )}

                {/* Piece Image/Vector */}
                {piece && (
                  <div
                    draggable={
                      !disabled &&
                      !targetingMode?.active &&
                      ((isPlayerTurn && piece.color === game.turn()) ||
                        (!isPlayerTurn && piece.color === playerColor))
                    }
                    onDragStart={e => handleDragStart(e, square)}
                    className={`w-[85%] h-[85%] flex items-center justify-center transform transition-transform duration-75 hover:scale-105 active:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] pointer-events-auto z-10 ${
                      targetingMode?.active && piece.color === targetingMode.targetColor
                        ? 'cursor-crosshair scale-110 animate-bounce'
                        : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <PieceSvg type={piece.type} color={piece.color} skin={pieceSkin} />
                  </div>
                )}

                {/* VIP Targeting Crosshair Overlay */}
                {targetingMode?.active && piece && piece.color === targetingMode.targetColor && (
                  <div className="absolute inset-0 bg-red-600/20 border-2 border-red-500 rounded-lg pointer-events-none z-30 flex items-center justify-center animate-pulse">
                    <span className="text-red-400 text-lg font-black drop-shadow">⌖</span>
                  </div>
                )}

                {/* VIP Revive Target on Empty Squares */}
                {reviveTargeting?.active && !piece && (
                  <div className="absolute inset-1 sm:inset-1.5 border-2 border-dashed border-amber-400 bg-amber-400/20 rounded-xl pointer-events-none z-30 flex items-center justify-center animate-pulse shadow-md">
                    <span className="text-amber-300 text-xs sm:text-sm font-black drop-shadow animate-bounce">✨</span>
                  </div>
                )}

                {/* Move Target Indicator Dot */}
                {isLegalTarget && !piece && (
                  <div className="w-[30%] h-[30%] rounded-full bg-black/25 pointer-events-none z-20" />
                )}

                {/* Capture Ring Indicator */}
                {isLegalTarget && piece && (
                  <div className="absolute inset-1 sm:inset-1.5 border-[4px] sm:border-[5px] border-black/30 rounded-full pointer-events-none z-20" />
                )}

                {/* Move Classification Badge (Analysis Mode) */}
                {moveBadge && moveBadge.square === square && (
                  <div
                    title={moveBadge.label}
                    className="absolute -top-1.5 -right-1.5 z-30 bg-[#262421] rounded-full p-0.5 shadow-lg border border-white/40 animate-bounce text-sm sm:text-base leading-none"
                  >
                    {moveBadge.icon}
                  </div>
                )}
              </div>
            );
          })}

          {/* SVG Overlay for Arrows (Right-click & Engine suggestions) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-25 overflow-visible"
            viewBox="0 0 100 100"
          >
            <defs>
              <marker
                id="arrowhead-green"
                markerWidth="4"
                markerHeight="4"
                refX="2.5"
                refY="2"
                orient="auto"
              >
                <polygon points="0 0, 4 2, 0 4" fill="#7fa650" />
              </marker>
              <marker
                id="arrowhead-gold"
                markerWidth="4"
                markerHeight="4"
                refX="2.5"
                refY="2"
                orient="auto"
              >
                <polygon points="0 0, 4 2, 0 4" fill="#f59e0b" />
              </marker>
              <marker
                id="arrowhead-cyan"
                markerWidth="4"
                markerHeight="4"
                refX="2.5"
                refY="2"
                orient="auto"
              >
                <polygon points="0 0, 4 2, 0 4" fill="#06b6d4" />
              </marker>
            </defs>

            {allArrows.map((arrow, idx) => {
              const start = getSquareCenter(arrow.from);
              const end = getSquareCenter(arrow.to);
              const isGold = arrow.color === '#f59e0b';
              const isCyan = arrow.color === '#06b6d4';
              const markerId = isGold
                ? 'arrowhead-gold'
                : isCyan
                ? 'arrowhead-cyan'
                : 'arrowhead-green';
              const strokeColor = arrow.color || '#7fa650';

              return (
                <line
                  key={`${arrow.from}-${arrow.to}-${idx}`}
                  x1={`${start.x}%`}
                  y1={`${start.y}%`}
                  x2={`${end.x}%`}
                  y2={`${end.y}%`}
                  stroke={strokeColor}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  opacity="0.85"
                  markerEnd={`url(#${markerId})`}
                />
              );
            })}
          </svg>
        </div>

        {/* Premove floating indicator message */}
        {premove && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-red-600/95 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-lg border border-white/30 flex items-center gap-1.5 animate-pulse">
            <span>⚡ Prejugada programada: {premove.from} ➔ {premove.to}</span>
            <button
              onClick={() => onSetPremove && onSetPremove(null)}
              className="text-white hover:text-red-200 ml-1 font-bold text-xs"
              title="Cancelar prejugada"
            >
              ✕
            </button>
          </div>
        )}

        {/* Promotion Modal */}
        {pendingPromotion && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-50 p-4">
            <div className="bg-[#312e2b] p-4 rounded-2xl border-2 border-[#7fa650] shadow-2xl text-center">
              <h3 className="font-bold text-white text-sm sm:text-base mb-3">Elige pieza de coronación</h3>
              <div className="flex space-x-2">
                {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map(type => (
                  <button
                    key={type}
                    onClick={() => handleSelectPromotion(type)}
                    className="w-14 h-14 bg-[#262421] hover:bg-[#7fa650] rounded-xl p-2 border border-[#3f3c38] transition transform hover:scale-110 flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <PieceSvg type={type} color={game.turn()} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
