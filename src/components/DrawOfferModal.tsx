import React from 'react';
import { BotDrawEvaluation } from '../services/ai.ts';

interface DrawOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: BotDrawEvaluation | null;
  botName: string;
  botAvatar: string;
  botBadge: string;
  onAcceptProceed?: () => void;
}

export const DrawOfferModal: React.FC<DrawOfferModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  botName,
  botAvatar,
  botBadge,
  onAcceptProceed
}) => {
  if (!isOpen || !evaluation) return null;

  const isRejected = !evaluation.shouldAccept;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#312e2b] border border-[#3f3c38] rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        {/* Decorative background glow */}
        <div
          className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isRejected ? 'bg-red-500' : 'bg-emerald-500'
          }`}
        />

        {/* Header with bot info */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-[#3f3c38]">
          <div className="relative">
            <img
              src={botAvatar}
              alt={botName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#7fa650] shadow"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80';
              }}
            />
            <span className="absolute -bottom-1 -right-1 text-base">
              {isRejected ? '⚔️' : '🤝'}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-white leading-tight">{botName}</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#262421] text-amber-300 border border-[#3f3c38]">
                {botBadge}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Análisis del motor de ajedrez ante tu oferta de tablas
            </p>
          </div>
        </div>

        {/* Decision Banner */}
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isRejected
              ? 'bg-red-950/40 border-red-500/50 text-red-200'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold ${
              isRejected ? 'bg-red-600/30 text-red-400' : 'bg-emerald-600/30 text-emerald-400'
            }`}
          >
            {isRejected ? '✕' : '✓'}
          </div>
          <div>
            <span className="font-extrabold text-sm block">
              {isRejected ? 'Oferta de Tablas Rechazada' : 'Oferta de Tablas Aceptada'}
            </span>
            <p className="text-xs opacity-90 leading-relaxed mt-0.5">
              {isRejected
                ? 'El bot calculó que sus posibilidades de victoria son superiores al 30%.'
                : 'El bot calculó que sus opciones de victoria son de 30% o inferiores.'}
            </p>
          </div>
        </div>

        {/* Win Probability Gauge */}
        <div className="bg-[#262421] p-4 rounded-2xl border border-[#3f3c38] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <span>📊</span> Posibilidades de victoria del bot:
            </span>
            <span
              className={`font-mono font-extrabold text-base ${
                isRejected ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {evaluation.winChancePercent}%
            </span>
          </div>

          {/* Progress bar with 30% threshold */}
          <div className="relative w-full h-4 bg-[#1f1d1a] rounded-full overflow-hidden border border-[#3f3c38]">
            {/* 30% threshold marker background */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-emerald-500/20"
              style={{ width: '30%' }}
              title="Zona de aceptación de tablas (≤ 30%)"
            />
            {/* Actual fill */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isRejected
                  ? 'bg-gradient-to-r from-amber-500 to-red-500'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${Math.max(4, evaluation.winChancePercent)}%` }}
            />
            {/* 30% line marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow z-10"
              style={{ left: '30%' }}
            />
          </div>

          {/* Scale labels */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
            <span>0% (Derrota)</span>
            <span className="text-amber-300 font-bold bg-[#312e2b] px-1.5 py-0.5 rounded border border-[#3f3c38]">
              Umbral 30%
            </span>
            <span>100% (Victoria)</span>
          </div>

          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-[#3f3c38]/50">
            <span>
              Regla: <strong className="text-gray-200">Si victoria &gt; 30% ➔ No acepta tablas</strong>
            </span>
            <span
              className={`font-bold ${
                isRejected ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {evaluation.winChancePercent > 30
                ? `${evaluation.winChancePercent}% > 30% ➔ Continúa`
                : `${evaluation.winChancePercent}% ≤ 30% ➔ Empate`}
            </span>
          </div>
        </div>

        {/* Bot speech bubble */}
        <div className="relative bg-[#262421] p-3.5 rounded-2xl border border-[#3f3c38] text-xs text-gray-200 italic leading-relaxed">
          <span className="text-gray-500 not-italic font-bold block mb-1">
            💬 Mensaje de {botName}:
          </span>
          &ldquo;{evaluation.botQuote}&rdquo;
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          {isRejected ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#7fa650] hover:bg-[#537a38] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              Continuar Partida ⚔️
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onAcceptProceed) onAcceptProceed();
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              Aceptar Resultado de Tablas 🤝
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
