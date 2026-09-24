import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { AnalyzedMove, GameAnalysisReport, MoveClassification } from '../types/chess.ts';
import { CLASSIFICATION_META } from '../services/analysis.ts';
import { ChessBoard } from './ChessBoard.tsx';

interface GameReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: GameAnalysisReport;
  whiteName: string;
  blackName: string;
  isFlipped?: boolean;
}

export const GameReviewModal: React.FC<GameReviewModalProps> = ({
  isOpen,
  onClose,
  report,
  whiteName,
  blackName,
  isFlipped = false
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showBestArrow, setShowBestArrow] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'review' | 'stats'>('review');

  const moves = report.analyzedMoves;
  const totalSteps = moves.length;

  // Build board state up to currentStep
  const currentBoard = React.useMemo(() => {
    const sim = new Chess();
    for (let i = 0; i < currentStep; i++) {
      try {
        sim.move({
          from: moves[i].from as Square,
          to: moves[i].to as Square,
          promotion: 'q'
        });
      } catch {
        try {
          sim.move(moves[i].san);
        } catch {}
      }
    }
    return sim;
  }, [currentStep, moves]);

  const currentMove: AnalyzedMove | undefined = currentStep > 0 ? moves[currentStep - 1] : undefined;

  // Autoplay through moves
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps]);

  if (!isOpen) return null;

  const lastMoveInfo = currentMove
    ? { from: currentMove.from as Square, to: currentMove.to as Square }
    : null;

  // Compute evaluation bar height percentage (50% = equal 0.0, 100% = White winning +500, 0% = Black winning -500)
  const evalCp = currentMove ? currentMove.evalCentipawns : 0;
  const clampedEval = Math.max(-800, Math.min(800, evalCp));
  const whiteBarPercent = Math.round(50 + (clampedEval / 800) * 45);

  const evalLabel =
    evalCp >= 9000
      ? 'M'
      : evalCp <= -9000
      ? '-M'
      : evalCp > 0
      ? `+${(evalCp / 100).toFixed(1)}`
      : `${(evalCp / 100).toFixed(1)}`;

  // Best move arrow
  const externalArrows =
    showBestArrow && currentMove && currentMove.bestMoveFrom && currentMove.bestMoveTo
      ? [
          {
            from: currentMove.bestMoveFrom,
            to: currentMove.bestMoveTo,
            color: '#f59e0b' // Gold arrow for engine's best move suggestion
          }
        ]
      : [];

  const currentMeta = currentMove ? CLASSIFICATION_META[currentMove.classification] : null;

  const categories: MoveClassification[] = [
    'brilliant',
    'best',
    'excellent',
    'good',
    'book',
    'inaccuracy',
    'mistake',
    'blunder',
    'missed_win'
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#262421] border border-[#3f3c38] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
        {/* Top Header */}
        <div className="bg-[#312e2b] px-5 py-3.5 border-b border-[#3f3c38] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔍</span>
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                Revisión de Partida <span className="text-[#7fa650] text-xs font-mono px-2 py-0.5 bg-[#262421] rounded-full border border-[#7fa650]/40">IA Coach</span>
              </h2>
              <p className="text-xs text-gray-400">Análisis posicional y clasificación de jugadas jugada a jugada</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab(activeTab === 'review' ? 'stats' : 'review')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                activeTab === 'stats'
                  ? 'bg-[#7fa650] text-white border-transparent'
                  : 'bg-[#262421] text-gray-300 border-[#3f3c38] hover:bg-[#383531]'
              }`}
            >
              {activeTab === 'stats' ? 'Tablero ♟️' : 'Resumen / Estadísticas 📊'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-[#262421] hover:bg-red-500/20 border border-[#3f3c38] transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Accuracy Comparison Banner */}
        <div className="bg-[#1e1c1a] px-5 py-3 border-b border-[#3f3c38] flex flex-wrap items-center justify-between gap-4">
          {/* White Accuracy */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black font-extrabold flex items-center justify-center text-sm shadow">
              ♔
            </div>
            <div>
              <span className="text-xs font-bold text-gray-200 block truncate max-w-[130px]">{whiteName}</span>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-gray-400">Precisión:</span>
                <span className="text-sm font-extrabold text-[#7fa650] font-mono">{report.whiteAccuracy}%</span>
              </div>
            </div>
          </div>

          {/* Coach general statement */}
          <div className="hidden md:flex flex-1 max-w-md bg-[#262421] px-3.5 py-1.5 rounded-xl border border-[#3f3c38] items-center space-x-2 text-xs text-gray-300">
            <span className="text-base">🧠</span>
            <span className="truncate">{report.coachSummary}</span>
          </div>

          {/* Black Accuracy */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-xs font-bold text-gray-200 block truncate max-w-[130px]">{blackName}</span>
              <div className="flex items-center justify-end space-x-1.5">
                <span className="text-xs text-gray-400">Precisión:</span>
                <span className="text-sm font-extrabold text-[#7fa650] font-mono">{report.blackAccuracy}%</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#11100e] text-white border border-[#3f3c38] font-extrabold flex items-center justify-center text-sm shadow">
              ♚
            </div>
          </div>
        </div>

        {/* Main Body */}
        {activeTab === 'review' ? (
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Board Area + Evaluation Bar (Cols 1-7) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full flex items-stretch justify-center gap-2.5">
                {/* Vertical Evaluation Bar */}
                <div className="w-6 sm:w-7 bg-[#1c1a17] rounded-xl overflow-hidden border border-[#3f3c38] flex flex-col-reverse relative shadow-inner">
                  <div
                    className="w-full bg-[#f0f0f0] transition-all duration-300"
                    style={{ height: `${whiteBarPercent}%` }}
                  />
                  <div className="absolute inset-x-0 bottom-1 flex justify-center pointer-events-none">
                    <span className="text-[10px] font-mono font-black text-black select-none">
                      {evalLabel}
                    </span>
                  </div>
                </div>

                {/* ChessBoard with Analysis Overlay */}
                <div className="flex-1 max-w-[480px]">
                  <ChessBoard
                    game={currentBoard}
                    isFlipped={isFlipped}
                    onMove={() => false}
                    lastMove={lastMoveInfo}
                    disabled={true}
                    externalArrows={externalArrows}
                    moveBadge={
                      currentMove
                        ? {
                            square: currentMove.to as Square,
                            icon: currentMeta?.icon || '•',
                            label: currentMeta?.label || ''
                          }
                        : null
                    }
                  />
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="w-full max-w-[500px] mt-3 bg-[#312e2b] p-2 rounded-2xl border border-[#3f3c38] flex items-center justify-between gap-1 shadow">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(0);
                  }}
                  disabled={currentStep === 0}
                  className="px-3 py-1.5 bg-[#262421] hover:bg-[#3f3c38] disabled:opacity-40 text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  title="Primera jugada"
                >
                  ⏮
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(prev => Math.max(0, prev - 1));
                  }}
                  disabled={currentStep === 0}
                  className="px-4 py-1.5 bg-[#262421] hover:bg-[#3f3c38] disabled:opacity-40 text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  title="Jugada anterior"
                >
                  ◀
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl transition shadow cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#7fa650] hover:bg-[#537a38] text-white'
                  }`}
                >
                  {isPlaying ? '⏸ Pausa' : '▶ Reproducir'}
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(prev => Math.min(totalSteps, prev + 1));
                  }}
                  disabled={currentStep >= totalSteps}
                  className="px-4 py-1.5 bg-[#262421] hover:bg-[#3f3c38] disabled:opacity-40 text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  title="Siguiente jugada"
                >
                  ▶
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(totalSteps);
                  }}
                  disabled={currentStep >= totalSteps}
                  className="px-3 py-1.5 bg-[#262421] hover:bg-[#3f3c38] disabled:opacity-40 text-gray-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  title="Última jugada"
                >
                  ⏭
                </button>
              </div>
            </div>

            {/* Analysis Detail Sidebar (Cols 8-12) */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {/* Current Move Coach Card */}
              {currentMove ? (
                <div className="bg-[#312e2b] border border-[#3f3c38] rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{currentMeta?.icon}</span>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${currentMeta?.badgeClass}`}>
                        {currentMeta?.label}
                      </span>
                    </div>

                    <span className="text-xs text-gray-400 font-mono font-bold">
                      {currentMove.color === 'w' ? 'Blancas' : 'Negras'} • {currentMove.moveNumber}. {currentMove.san}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans mb-3">
                    {currentMove.comment}
                  </p>

                  {/* Engine alternative prompt */}
                  {currentMove.classification !== 'best' && currentMove.classification !== 'brilliant' && currentMove.classification !== 'book' && (
                    <div className="bg-[#262421] rounded-xl p-3 border border-amber-500/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-amber-400 font-bold block">Recomendación del Motor</span>
                        <span className="text-gray-300 font-mono font-bold">{currentMove.bestMoveSan}</span>
                      </div>
                      <button
                        onClick={() => setShowBestArrow(!showBestArrow)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                          showBestArrow
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-[#312e2b] text-gray-400 border-[#3f3c38]'
                        }`}
                      >
                        {showBestArrow ? 'Ocultar Flecha' : 'Mostrar Flecha'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#312e2b] border border-[#3f3c38] rounded-2xl p-5 shadow text-center">
                  <span className="text-3xl block mb-2">🏁</span>
                  <h4 className="text-sm font-bold text-white">Posición Inicial</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Usa los controles de navegación o haz clic en cualquier jugada de la lista para analizarla.
                  </p>
                </div>
              )}

              {/* Move Sequence List with Classification Badges */}
              <div className="bg-[#312e2b] border border-[#3f3c38] rounded-2xl p-3 shadow flex-1 flex flex-col min-h-[220px]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-extrabold uppercase text-gray-400">Jugadas Clasificadas</span>
                  <span className="text-[11px] font-mono text-gray-400">Paso {currentStep} / {totalSteps}</span>
                </div>

                <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
                  {moves.map((m, idx) => {
                    const stepNum = idx + 1;
                    const meta = CLASSIFICATION_META[m.classification];
                    const isSelected = currentStep === stepNum;

                    return (
                      <button
                        key={`${m.san}-${idx}`}
                        onClick={() => {
                          setIsPlaying(false);
                          setCurrentStep(stepNum);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#7fa650] text-white font-extrabold shadow'
                            : 'bg-[#262421] text-gray-300 hover:bg-[#383531]'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-8 font-mono text-[11px] ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            {m.moveNumber}.{m.color === 'w' ? '' : '..'}
                          </span>
                          <span className="font-bold font-mono">{m.san}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span>{meta.icon}</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Stats / Comparison Table View */
          <div className="flex-1 overflow-y-auto p-5 max-w-2xl mx-auto w-full">
            <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 text-center">
              Desglose de Clasificación por Jugador
            </h3>

            <div className="bg-[#312e2b] border border-[#3f3c38] rounded-2xl overflow-hidden shadow">
              <div className="grid grid-cols-12 bg-[#1f1d1b] px-4 py-2.5 text-xs font-bold text-gray-400 border-b border-[#3f3c38]">
                <div className="col-span-3 text-center text-white">{whiteName}</div>
                <div className="col-span-6 text-center">Categoría de Jugada</div>
                <div className="col-span-3 text-center text-white">{blackName}</div>
              </div>

              <div className="divide-y divide-[#3f3c38]/60">
                {categories.map(cat => {
                  const meta = CLASSIFICATION_META[cat];
                  const wCount = report.whiteStats[cat];
                  const bCount = report.blackStats[cat];

                  return (
                    <div
                      key={cat}
                      className="grid grid-cols-12 px-4 py-2.5 items-center text-xs hover:bg-[#262421]/60 transition"
                    >
                      <div className="col-span-3 text-center font-mono font-extrabold text-white text-sm">
                        {wCount}
                      </div>

                      <div className="col-span-6 flex items-center justify-center space-x-2">
                        <span className="text-base">{meta.icon}</span>
                        <span className="font-bold text-gray-200">{meta.label}</span>
                      </div>

                      <div className="col-span-3 text-center font-mono font-extrabold text-white text-sm">
                        {bCount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
