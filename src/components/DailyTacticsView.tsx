import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import confetti from 'canvas-confetti';
import { BoardArrow, DailySolvedRecord, DailyTacticPuzzle, PlayerProfile } from '../types/chess.ts';
import {
  DAILY_TACTICS_PUZZLES,
  getTodayDateString,
  getTacticPuzzleForDate
} from '../constants/dailyTactics.ts';
import { ChessBoard } from './ChessBoard.tsx';
import { soundService } from '../services/audio.ts';

interface DailyTacticsViewProps {
  player: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onBackToPlay: () => void;
}

export const DailyTacticsView: React.FC<DailyTacticsViewProps> = ({
  player,
  onUpdateProfile,
  onBackToPlay
}) => {
  const todayDateStr = getTodayDateString();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayDateStr);
  const [currentPuzzle, setCurrentPuzzle] = useState<DailyTacticPuzzle>(() =>
    getTacticPuzzleForDate(todayDateStr)
  );

  // Local storage records of solved daily puzzles
  const [solvedRecords, setSolvedRecords] = useState<Record<string, DailySolvedRecord>>(() => {
    try {
      const saved = localStorage.getItem('chessmaster_daily_tactics_solved');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Engine & Board state
  const gameRef = useRef<Chess>(new Chess(currentPuzzle.fen));
  const [currentFen, setCurrentFen] = useState(currentPuzzle.fen);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isWaitingOpponent, setIsWaitingOpponent] = useState(false);

  // Feedback & UI State
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [attempts, setAttempts] = useState(1);

  const isTodayPuzzle = selectedDateStr === todayDateStr;
  const isAlreadySolvedToday = Boolean(solvedRecords[selectedDateStr]?.date);

  // Load a new puzzle whenever selected puzzle / date changes
  const initPuzzle = useCallback((puzzle: DailyTacticPuzzle) => {
    gameRef.current = new Chess(puzzle.fen);
    setCurrentFen(puzzle.fen);
    setCurrentMoveIndex(0);
    setLastMove(null);
    setIsWaitingOpponent(false);
    setFeedbackMessage(null);
    setFeedbackType(null);
    setShowHint(false);
    setIsSolved(false);
    setSolutionRevealed(false);
    setAttempts(1);
  }, []);

  useEffect(() => {
    const puzzle = getTacticPuzzleForDate(selectedDateStr);
    setCurrentPuzzle(puzzle);
    initPuzzle(puzzle);
  }, [selectedDateStr, initPuzzle]);

  // Handle player's move on the board
  const handleMove = (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
    if (isSolved || isWaitingOpponent) return false;

    const game = gameRef.current;
    const expectedPlayerMove = currentPuzzle.moves[currentMoveIndex];

    if (!expectedPlayerMove) return false;

    // Check if player's move matches the expected tactic solution
    const isCorrectFrom = from.toLowerCase() === expectedPlayerMove.from.toLowerCase();
    const isCorrectTo = to.toLowerCase() === expectedPlayerMove.to.toLowerCase();

    if (isCorrectFrom && isCorrectTo) {
      try {
        const moveRes = game.move({
          from,
          to,
          promotion: promotion || expectedPlayerMove.promotion || 'q'
        });

        if (!moveRes) return false;

        setCurrentFen(game.fen());
        setLastMove({ from, to });
        setShowHint(false);

        // Sound effect
        if (moveRes.captured) {
          soundService.playCapture();
        } else {
          soundService.playMove();
        }

        const nextMoveIndex = currentMoveIndex + 1;

        // Check if tactic is complete!
        if (nextMoveIndex >= currentPuzzle.moves.length) {
          handlePuzzleSuccess();
          return true;
        }

        // Tactic continues: Opponent's forced response
        setIsWaitingOpponent(true);
        setFeedbackMessage('¡Excelente jugada! Analizando respuesta rival...');
        setFeedbackType('info');

        setTimeout(() => {
          const opponentMove = currentPuzzle.moves[nextMoveIndex];
          if (opponentMove) {
            try {
              const oppRes = game.move({
                from: opponentMove.from as Square,
                to: opponentMove.to as Square,
                promotion: opponentMove.promotion || 'q'
              });

              if (oppRes) {
                setCurrentFen(game.fen());
                setLastMove({
                  from: opponentMove.from as Square,
                  to: opponentMove.to as Square
                });

                if (oppRes.captured) {
                  soundService.playCapture();
                } else {
                  soundService.playMove();
                }

                const afterOpponentIndex = nextMoveIndex + 1;
                setCurrentMoveIndex(afterOpponentIndex);
                setIsWaitingOpponent(false);

                if (afterOpponentIndex >= currentPuzzle.moves.length) {
                  handlePuzzleSuccess();
                } else {
                  setFeedbackMessage('¡Tu turno! Encuentra el siguiente movimiento ganador.');
                  setFeedbackType('info');
                }
              }
            } catch (err) {
              console.error('Error applying opponent move:', err);
              setIsWaitingOpponent(false);
            }
          }
        }, 550);

        return true;
      } catch (err) {
        console.error('Move execution error:', err);
        return false;
      }
    } else {
      // Incorrect move
      soundService.playDrawReject();
      setAttempts(prev => prev + 1);
      setFeedbackMessage('❌ Esa no es la mejor jugada táctica. ¡Inténtalo de nuevo!');
      setFeedbackType('error');
      return false;
    }
  };

  // Called when all moves in the puzzle are completed
  const handlePuzzleSuccess = () => {
    setIsSolved(true);
    setFeedbackMessage('🎉 ¡TÁCTICA RESUELTA CON ÉXITO!');
    setFeedbackType('success');
    soundService.playGameOver(true);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    // Award bonus Elo only if solution was not revealed and not already claimed for this day
    if (!solutionRevealed && !solvedRecords[selectedDateStr]) {
      const bonus = currentPuzzle.eloBonus;

      // Calculate streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const currentStreak = player.ultimaTacticaFecha === yesterdayStr ? (player.rachaDiaria || 0) + 1 : 1;

      const updatedProfile: PlayerProfile = {
        ...player,
        eloRapido: player.eloRapido + bonus,
        eloBlitz: player.eloBlitz + bonus,
        tacticasResueltas: (player.tacticasResueltas || 0) + 1,
        rachaDiaria: currentStreak,
        ultimaTacticaFecha: selectedDateStr
      };

      onUpdateProfile(updatedProfile);

      // Record in local storage
      const newRecord: DailySolvedRecord = {
        date: selectedDateStr,
        puzzleId: currentPuzzle.id,
        eloBonus: bonus,
        attempts,
        solvedAt: new Date().toISOString()
      };

      const updatedRecords = { ...solvedRecords, [selectedDateStr]: newRecord };
      setSolvedRecords(updatedRecords);
      try {
        localStorage.setItem('chessmaster_daily_tactics_solved', JSON.stringify(updatedRecords));
      } catch (e) {
        console.warn('Storage save warning:', e);
      }
    }
  };

  // Show Solution step-by-step
  const handleRevealSolution = () => {
    setSolutionRevealed(true);
    setShowHint(false);

    // Replay full line
    const simGame = new Chess(currentPuzzle.fen);
    for (const m of currentPuzzle.moves) {
      simGame.move({
        from: m.from as Square,
        to: m.to as Square,
        promotion: m.promotion || 'q'
      });
    }

    gameRef.current = simGame;
    setCurrentFen(simGame.fen());
    const lastM = currentPuzzle.moves[currentPuzzle.moves.length - 1];
    setLastMove({ from: lastM.from as Square, to: lastM.to as Square });
    setIsSolved(true);
    setFeedbackMessage('Solución revelada. (No se otorgarán puntos Elo extra por esta táctica).');
    setFeedbackType('info');
  };

  // Hint arrow
  const nextExpected = currentPuzzle.moves[currentMoveIndex];
  const hintArrows: BoardArrow[] =
    showHint && nextExpected
      ? [
          {
            from: nextExpected.from as Square,
            to: nextExpected.to as Square,
            color: '#eab308'
          }
        ]
      : [];

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col gap-5">
      {/* Top Banner & Navigation Header */}
      <div className="bg-[#312e2b] border border-[#3f3c38] rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Táctica Diaria
              </h1>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1 Reto Único al Día
              </span>
              {isAlreadySolvedToday && (
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  ✓ Resuelta Hoy
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Resuelve el problema táctico diario para ganar puntos Elo extra y mejorar tu cálculo.
            </p>
          </div>
        </div>

        {/* Player Stats Capsule */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-[#262421] border border-[#3f3c38] px-3.5 py-2 rounded-2xl flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase leading-tight">
                Racha Diaria
              </span>
              <span className="font-extrabold text-sm text-amber-400">
                {player.rachaDiaria || 0} {player.rachaDiaria === 1 ? 'día' : 'días'}
              </span>
            </div>
          </div>

          <div className="bg-[#262421] border border-[#3f3c38] px-3.5 py-2 rounded-2xl flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase leading-tight">
                Tácticas Superadas
              </span>
              <span className="font-extrabold text-sm text-white">
                {player.tacticasResueltas || 0}
              </span>
            </div>
          </div>

          <button
            onClick={onBackToPlay}
            className="px-3.5 py-2 rounded-2xl bg-[#262421] hover:bg-[#3f3c38] text-gray-300 hover:text-white border border-[#3f3c38] text-xs font-bold transition cursor-pointer"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive ChessBoard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[560px] bg-[#312e2b] p-3 sm:p-5 rounded-3xl border border-[#3f3c38] shadow-2xl relative">
            {/* Status indicator bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#3f3c38]/60 text-xs">
              <span className="font-semibold text-gray-300 flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    currentPuzzle.playerColor === 'w' ? 'bg-white' : 'bg-gray-700 border border-white'
                  }`}
                />
                Juegan {currentPuzzle.playerColor === 'w' ? 'Blancas' : 'Negras'}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-[11px]">Progreso:</span>
                <span className="font-mono font-bold text-amber-300 bg-[#262421] px-2 py-0.5 rounded-lg border border-[#3f3c38]">
                  {Math.floor(currentMoveIndex / 2) + 1} / {Math.ceil(currentPuzzle.moves.length / 2)}
                </span>
              </div>
            </div>

            {/* The Chess Board */}
            <div className="aspect-square w-full">
              <ChessBoard
                game={gameRef.current}
                isFlipped={currentPuzzle.playerColor === 'b'}
                onMove={handleMove}
                lastMove={lastMove}
                disabled={isSolved || isWaitingOpponent}
                playerColor={currentPuzzle.playerColor}
                isPlayerTurn={!isWaitingOpponent && !isSolved}
                externalArrows={hintArrows}
                pieceSkin={player.activePieceSkin || 'classic'}
              />
            </div>

            {/* Waiting Opponent Animation Banner */}
            {isWaitingOpponent && (
              <div className="mt-3 py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 text-center flex items-center justify-center gap-2 animate-pulse">
                <span>⏳</span> El rival está respondiendo con su jugada forzada...
              </div>
            )}

            {/* Feedback notification toast */}
            {feedbackMessage && !isWaitingOpponent && (
              <div
                className={`mt-3 py-2.5 px-4 rounded-xl text-xs font-semibold text-center transition-all ${
                  feedbackType === 'success'
                    ? 'bg-emerald-950/70 border border-emerald-500/60 text-emerald-200'
                    : feedbackType === 'error'
                    ? 'bg-red-950/70 border border-red-500/60 text-red-200 animate-shake'
                    : 'bg-[#262421] border border-[#3f3c38] text-gray-200'
                }`}
              >
                {feedbackMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Puzzle Details, Reward & Tools */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Card: Puzzle Metadata */}
          <div className="bg-[#312e2b] border border-[#3f3c38] rounded-3xl p-5 shadow-xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#262421] text-amber-300 border border-[#3f3c38]">
                {currentPuzzle.theme}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                  {currentPuzzle.difficulty}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold">
                  +{currentPuzzle.eloBonus} Elo
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">{currentPuzzle.title}</h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                {currentPuzzle.description}
              </p>
            </div>

            {/* Hint Box */}
            {showHint && (
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-3.5 text-xs text-amber-200 flex flex-col gap-1 animate-fadeIn">
                <span className="font-extrabold flex items-center gap-1.5 text-amber-300">
                  <span>💡</span> Pista Táctica:
                </span>
                <p className="leading-relaxed">{currentPuzzle.hint}</p>
                <span className="text-[10px] text-amber-400/80 mt-1">
                  (Se ha dibujado una flecha dorada en el tablero indicando la casilla clave).
                </span>
              </div>
            )}

            {/* Solved Explanation Box */}
            {isSolved && (
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 text-xs text-emerald-100 flex flex-col gap-1.5 animate-fadeIn">
                <span className="font-extrabold text-sm flex items-center gap-1.5 text-emerald-300">
                  <span>🏆</span> Explicación de la Jugada Magistral:
                </span>
                <p className="leading-relaxed mt-1 text-emerald-200/90">{currentPuzzle.explanation}</p>
                {!solutionRevealed && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/30 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-300 font-semibold">Recompensa añadida al perfil:</span>
                    <span className="font-extrabold font-mono text-emerald-400 bg-emerald-900/50 px-2 py-0.5 rounded">
                      +{currentPuzzle.eloBonus} Elo
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Action Controls */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#3f3c38]/60">
              <button
                onClick={() => setShowHint(true)}
                disabled={isSolved || showHint}
                className="py-2.5 px-2 bg-[#262421] hover:bg-[#383531] disabled:opacity-40 text-amber-300 text-xs font-bold rounded-xl border border-[#3f3c38] transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>💡</span> Pista
              </button>

              <button
                onClick={() => initPuzzle(currentPuzzle)}
                className="py-2.5 px-2 bg-[#262421] hover:bg-[#383531] text-gray-200 text-xs font-bold rounded-xl border border-[#3f3c38] transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>🔄</span> Reiniciar
              </button>

              <button
                onClick={handleRevealSolution}
                disabled={isSolved}
                className="py-2.5 px-2 bg-[#262421] hover:bg-[#383531] disabled:opacity-40 text-red-300 text-xs font-bold rounded-xl border border-[#3f3c38] transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>👁️</span> Solución
              </button>
            </div>
          </div>

          {/* Card: Puzzle Archive / Daily Selector */}
          <div className="bg-[#312e2b] border border-[#3f3c38] rounded-3xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>📚</span> Archivo de Problemas Tácticos
              </h3>
              <span className="text-[10px] text-gray-400">
                {DAILY_TACTICS_PUZZLES.length} disponibles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {DAILY_TACTICS_PUZZLES.map((puzzle, idx) => {
                const isSelected = puzzle.id === currentPuzzle.id;
                return (
                  <button
                    key={puzzle.id}
                    onClick={() => {
                      setCurrentPuzzle(puzzle);
                      initPuzzle(puzzle);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#7fa650]/20 border-[#7fa650] text-white shadow'
                        : 'bg-[#262421] border-[#3f3c38] text-gray-300 hover:text-white hover:bg-[#383531]'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xs font-mono font-bold text-gray-400 w-5">
                        #{idx + 1}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">{puzzle.title}</span>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {puzzle.theme}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-400 shrink-0 ml-2">
                      +{puzzle.eloBonus} Elo
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
