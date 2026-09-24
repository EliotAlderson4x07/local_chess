import React from 'react';
import { Difficulty, PieceSkinId, PlayerSide, TimeControlConfig } from '../types/chess.ts';
import { COMPETITIVE_TIME_CONTROLS } from '../constants/timeControls.ts';

interface GameControlsProps {
  timeControls: TimeControlConfig[];
  selectedTimeControl: TimeControlConfig;
  onChangeTimeControl: (tc: TimeControlConfig) => void;
  currentDifficulty: Difficulty;
  onChangeDifficulty: (diff: Difficulty) => void;
  playerSide: PlayerSide;
  onChangePlayerSide: (side: PlayerSide) => void;
  onRestart: () => void;
  onOfferDraw: () => void;
  onResign: () => void;
  onFlipBoard: () => void;
  turnStatusText: string;
  isPlayerTurn: boolean;
  isBotThinking?: boolean;
  openingName: string;
  evalScore: string;
  isMultiplayer?: boolean;
  onOpenAnalysis?: () => void;
  hasMoves?: boolean;
  isPremium?: boolean;
  activePieceSkin?: PieceSkinId;
  onChangePieceSkin?: (skin: PieceSkinId) => void;
  onOpenPremiumModal?: (reason?: string) => void;
  onGenerateTenQueens?: () => void;
  onTriggerObliteratePiece?: () => void;
  isTargetingActive?: boolean;
  onCancelTargeting?: () => void;
  onTriggerRevivePiece?: () => void;
  onTriggerNuke?: () => void;
  isNukeActive?: boolean;
  isReviveTargetingActive?: boolean;
  onCancelReviveTargeting?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  timeControls = COMPETITIVE_TIME_CONTROLS,
  selectedTimeControl,
  onChangeTimeControl,
  currentDifficulty,
  onChangeDifficulty,
  playerSide,
  onChangePlayerSide,
  onRestart,
  onOfferDraw,
  onResign,
  onFlipBoard,
  turnStatusText,
  isPlayerTurn,
  isBotThinking = false,
  openingName,
  evalScore,
  isMultiplayer = false,
  onOpenAnalysis,
  hasMoves = false,
  isPremium = false,
  activePieceSkin = 'classic',
  onChangePieceSkin,
  onOpenPremiumModal,
  onGenerateTenQueens,
  onTriggerObliteratePiece,
  isTargetingActive = false,
  onCancelTargeting,
  onTriggerRevivePiece,
  onTriggerNuke,
  isNukeActive = false,
  isReviveTargetingActive = false,
  onCancelReviveTargeting
}) => {
  return (
    <div className="bg-[#312e2b] border border-[#3f3c38] rounded-2xl p-4 shadow-xl flex flex-col gap-3.5">
      {/* Turn indicator & Eval */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#3f3c38]">
        <div className="flex items-center space-x-2">
          <span
            className={`w-3 h-3 rounded-full transition-all ${
              isBotThinking
                ? 'bg-amber-400 animate-pulse'
                : isPlayerTurn
                ? 'bg-[#7fa650] animate-ping'
                : 'bg-gray-500'
            }`}
          />
          <span className="font-extrabold text-sm text-white">{turnStatusText}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase">Eval:</span>
          <span className="text-xs font-mono font-bold text-white bg-[#262421] px-2.5 py-0.5 rounded-lg border border-[#3f3c38]">
            {evalScore}
          </span>
        </div>
      </div>

      {/* Competitive Modes & Settings */}
      {!isMultiplayer && (
        <div className="space-y-3 bg-[#262421]/60 p-3 rounded-xl border border-[#3f3c38]/70">
          {/* Time Controls Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-1">
                <span>⏱️</span> Modos de Ajedrez Competitivo
              </label>
              <span className="text-[10px] font-mono text-[#7fa650] font-bold">
                {selectedTimeControl.category.toUpperCase()}
              </span>
            </div>
            <select
              value={selectedTimeControl.id}
              onChange={e => {
                const found = timeControls.find(tc => tc.id === e.target.value);
                if (found) onChangeTimeControl(found);
              }}
              className="w-full bg-[#262421] text-white text-xs font-semibold py-2 px-3 rounded-xl border border-[#3f3c38] focus:outline-none focus:border-[#7fa650] cursor-pointer"
            >
              <optgroup label="⚡ BULLET (Ultra-Rápido)">
                {timeControls
                  .filter(tc => tc.category === 'bullet')
                  .map(tc => (
                    <option key={tc.id} value={tc.id}>
                      {tc.shortName} — {tc.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🔥 BLITZ (Relámpago FIDE)">
                {timeControls
                  .filter(tc => tc.category === 'blitz')
                  .map(tc => (
                    <option key={tc.id} value={tc.id}>
                      {tc.shortName} — {tc.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="⏱️ RÁPIDO (FIDE Rapid)">
                {timeControls
                  .filter(tc => tc.category === 'rapid')
                  .map(tc => (
                    <option key={tc.id} value={tc.id}>
                      {tc.shortName} — {tc.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="🏛️ CLÁSICO (Torneo FIDE)">
                {timeControls
                  .filter(tc => tc.category === 'classical')
                  .map(tc => (
                    <option key={tc.id} value={tc.id}>
                      {tc.shortName} — {tc.name}
                    </option>
                  ))}
              </optgroup>
            </select>
            <p className="text-[10px] text-gray-400 mt-1 italic">{selectedTimeControl.description}</p>
          </div>

          {/* Difficulty & Player Color Side */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-300 block mb-1">
                🤖 Nivel del Rival
              </label>
              <select
                value={currentDifficulty}
                onChange={e => onChangeDifficulty(e.target.value as Difficulty)}
                className="w-full bg-[#262421] text-white text-xs font-semibold py-2 px-2.5 rounded-xl border border-[#3f3c38] focus:outline-none focus:border-[#7fa650] cursor-pointer"
              >
                <option value="easy">Novato (~600)</option>
                <option value="medium">Intermedio (~1200)</option>
                <option value="hard">Avanzado (~1650)</option>
                <option value="master">Gran Maestro (~2200+)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-300 block mb-1">
                ♟️ Jugar con
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => onChangePlayerSide('w')}
                  title="Jugar con Blancas"
                  className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                    playerSide === 'w'
                      ? 'bg-white text-gray-900 border-white shadow'
                      : 'bg-[#262421] text-gray-300 border-[#3f3c38] hover:border-gray-400'
                  }`}
                >
                  ⚪ Blancas
                </button>
                <button
                  type="button"
                  onClick={() => onChangePlayerSide('b')}
                  title="Jugar con Negras"
                  className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                    playerSide === 'b'
                      ? 'bg-black text-white border-gray-500 shadow'
                      : 'bg-[#262421] text-gray-300 border-[#3f3c38] hover:border-gray-400'
                  }`}
                >
                  ⚫ Negras
                </button>
                <button
                  type="button"
                  onClick={() => onChangePlayerSide('random')}
                  title="Bando Aleatorio"
                  className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center border ${
                    playerSide === 'random'
                      ? 'bg-[#7fa650] text-white border-[#7fa650] shadow'
                      : 'bg-[#262421] text-gray-300 border-[#3f3c38] hover:border-gray-400'
                  }`}
                >
                  🎲 Azar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis button if moves have been made */}
      {onOpenAnalysis && (
        <button
          onClick={onOpenAnalysis}
          disabled={!hasMoves}
          className="w-full py-2 bg-[#262421] hover:bg-[#383531] disabled:opacity-40 text-[#7fa650] hover:text-[#9bc763] text-xs font-extrabold rounded-xl border border-[#7fa650]/60 transition flex items-center justify-center gap-2 shadow cursor-pointer"
        >
          <span>🔍</span> Revisión de Partida (Evaluación de Jugadas)
        </button>
      )}

      {/* 👑 VIP CHAOS & SUPERPOWERS PANEL */}
      <div className="bg-gradient-to-br from-[#2a2417] via-[#241f14] to-[#1c1a17] border border-amber-500/40 rounded-2xl p-3.5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl filter drop-shadow">👑</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  PODERES VIP EN PARTIDA
                </h4>
                {isPremium ? (
                  <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-black px-1.5 py-0.5 rounded-full shadow">
                    VIP ACTIVO
                  </span>
                ) : (
                  <span className="text-[9px] bg-[#3f3c38] text-amber-300 font-extrabold px-1.5 py-0.5 rounded-full">
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 leading-tight">
                {isPremium
                  ? '10 reinas, aniquilar ficha, revivir aliada y Nuke táctica.'
                  : 'Desbloquea 10 reinas, revivir fichas, Nuke y skins VIP.'}
              </p>
            </div>
          </div>

          {!isPremium && onOpenPremiumModal && (
            <button
              onClick={() => onOpenPremiumModal('Desbloquea el Plan Premium con métodos de pago y usa todos los poderes')}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 text-[10px] font-black rounded-xl transition shadow cursor-pointer active:scale-95 shrink-0"
            >
              Activar VIP ✨
            </button>
          )}
        </div>

        {/* Superpowers 2x2 grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onGenerateTenQueens}
            className="py-2.5 px-2 bg-gradient-to-br from-[#3d3319] to-[#2b2413] hover:from-[#4d4020] hover:to-[#382f18] border border-amber-500/60 text-amber-300 hover:text-amber-200 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 group"
            title="Genera un ejército de hasta 10 Reinas en tu partida"
          >
            <span className="text-sm group-hover:scale-125 transition-transform">👑</span>
            <span className="truncate">10 Reinas</span>
          </button>

          <button
            onClick={isTargetingActive ? onCancelTargeting : onTriggerObliteratePiece}
            className={`py-2.5 px-2 border text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 group ${
              isTargetingActive
                ? 'bg-red-600 hover:bg-red-700 border-red-300 text-white animate-pulse'
                : 'bg-gradient-to-br from-[#3d1919] to-[#291313] hover:from-[#522222] hover:to-[#381a1a] border-red-500/60 text-red-300 hover:text-red-200'
            }`}
            title="Haz clic sobre cualquier ficha rival para aniquilarla al instante"
          >
            <span className="text-sm group-hover:scale-125 transition-transform">⚡</span>
            <span className="truncate">{isTargetingActive ? 'Cancelar Mira ✕' : 'Aniquilar Ficha'}</span>
          </button>

          <button
            onClick={isReviveTargetingActive ? onCancelReviveTargeting : onTriggerRevivePiece}
            className={`py-2.5 px-2 border text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 group ${
              isReviveTargetingActive
                ? 'bg-amber-600 hover:bg-amber-700 border-amber-300 text-white animate-pulse'
                : 'bg-gradient-to-br from-[#1a3028] to-[#12221c] hover:from-[#234237] hover:to-[#182e26] border-emerald-500/60 text-emerald-300 hover:text-emerald-200'
            }`}
            title="Devuelve a la vida a cualquier pieza aliada caída"
          >
            <span className="text-sm group-hover:scale-125 transition-transform">✨</span>
            <span className="truncate">{isReviveTargetingActive ? 'Cancelar Revivir ✕' : 'Revivir Pieza'}</span>
          </button>

          <button
            onClick={onTriggerNuke}
            disabled={isNukeActive}
            className={`py-2.5 px-2 border text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-95 group ${
              isNukeActive
                ? 'bg-yellow-600 text-white border-yellow-300 animate-pulse cursor-not-allowed opacity-80'
                : 'bg-gradient-to-br from-[#3f2a13] to-[#291a0c] hover:from-[#573919] hover:to-[#382310] border-orange-500/60 text-orange-300 hover:text-orange-200'
            }`}
            title="Detona una Nuke en el tablero: extermina todas las fichas salvo los Reyes y decreta Tablas inmediatas"
          >
            <span className="text-sm group-hover:scale-125 transition-transform">☢️</span>
            <span className="truncate">{isNukeActive ? '¡Detonando!' : 'Nuke Tablas'}</span>
          </button>
        </div>

        {/* Active targeting warning banner */}
        {isTargetingActive && (
          <div className="bg-red-950/80 border border-red-500/60 rounded-xl p-2 text-center text-xs text-red-200 animate-pulse flex items-center justify-between gap-2">
            <span className="font-extrabold text-[11px]">
              🎯 Haz clic en cualquier ficha rival del tablero para destruirla
            </span>
            <button
              onClick={onCancelTargeting}
              className="text-[10px] bg-red-800 hover:bg-red-700 text-white px-2 py-0.5 rounded font-bold"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Active revive targeting warning banner */}
        {isReviveTargetingActive && (
          <div className="bg-amber-950/80 border border-amber-500/60 rounded-xl p-2 text-center text-xs text-amber-200 animate-pulse flex items-center justify-between gap-2">
            <span className="font-extrabold text-[11px]">
              ✨ Haz clic en cualquier casilla libre para resucitar tu pieza
            </span>
            <button
              onClick={onCancelReviveTargeting}
              className="text-[10px] bg-amber-800 hover:bg-amber-700 text-white px-2 py-0.5 rounded font-bold"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Active Nuke alert warning banner */}
        {isNukeActive && (
          <div className="bg-yellow-950/90 border border-yellow-500 rounded-xl p-2 text-center text-xs text-yellow-200 animate-bounce flex items-center justify-center gap-2">
            <span className="text-sm">☢️</span>
            <span className="font-black text-[11px] uppercase tracking-wider">
              ¡IMPACTO NUCLEAR EN PROCESO! Tablas forzadas
            </span>
          </div>
        )}

        {/* Skin Selector */}
        {onChangePieceSkin && (
          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between gap-2">
            <label className="text-[10px] font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <span>🎨</span> Skin Fichas:
            </label>
            <select
              value={activePieceSkin || 'classic'}
              onChange={e => onChangePieceSkin(e.target.value as PieceSkinId)}
              className="bg-[#1a1816] text-white text-[11px] font-bold py-1.5 px-2 rounded-lg border border-[#3f3c38] focus:border-amber-500 outline-none cursor-pointer flex-1 text-right"
            >
              <option value="classic">♟️ Clásico Torneo (Marfil / Ébano)</option>
              <option value="cyberpunk">⚡ Neón Cyberpunk (Cyan / Magenta)</option>
              <option value="royal_gold">👑 Oro Real & Obsidiana (24K)</option>
              <option value="ice_fire">🔥 Fuego & Hielo Cósmico</option>
              <option value="emerald_ruby">💎 Esmeralda & Rubí Real</option>
            </select>
          </div>
        )}
      </div>

      {/* Game action buttons */}
      <div className="grid grid-cols-3 gap-2 pt-0.5">
        <button
          onClick={onRestart}
          className="py-2.5 px-2 bg-[#7fa650] hover:bg-[#537a38] text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
        >
          <span>🔄</span> Nueva Partida
        </button>
        <button
          onClick={onOfferDraw}
          className="py-2.5 px-2 bg-[#262421] hover:bg-[#3f3c38] text-gray-200 text-xs font-bold rounded-xl border border-[#3f3c38] transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>🤝</span> Tablas
        </button>
        <button
          onClick={onResign}
          className="py-2.5 px-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-xl border border-red-800/40 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>🏳️</span> Rendirse
        </button>
      </div>

      {/* Helpful shortcuts & annotations note */}
      <div className="bg-[#262421]/40 rounded-xl px-2.5 py-1.5 text-[10px] text-gray-400 flex items-center justify-between border border-[#3f3c38]/40">
        <span>💡 Clic der.: Arrastra para flechas</span>
        <span>⚡ Prejugadas en turno rival</span>
      </div>

      {/* Footer helper */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1 pt-2 border-t border-[#3f3c38]/60">
        <button
          onClick={onFlipBoard}
          className="hover:text-white flex items-center gap-1.5 font-semibold transition cursor-pointer"
        >
          <span>🔃</span> Voltear tablero
        </button>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-400">Apertura:</span>
          <span
            className="text-[11px] font-bold text-[#7fa650] truncate max-w-[170px]"
            title={openingName}
          >
            {openingName}
          </span>
        </div>
      </div>
    </div>
  );
};
