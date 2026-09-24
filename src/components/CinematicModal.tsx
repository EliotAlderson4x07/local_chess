import React from 'react';
import { Mission } from '../types/chess.ts';

interface CinematicModalProps {
  mission: Mission | null;
  isOpen: boolean;
  onStartBattle: () => void;
  onSkip: () => void;
}

export const CinematicModal: React.FC<CinematicModalProps> = ({
  mission,
  isOpen,
  onStartBattle,
  onSkip
}) => {
  if (!isOpen || !mission) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#312e2b] border-2 border-[#7fa650] rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Video / GIF asset container with fallback */}
        <div className="w-full h-64 sm:h-80 bg-black relative flex items-center justify-center overflow-hidden">
          <video
            className="w-full h-full object-cover"
            playsInline
            muted
            loop
            autoPlay
            onError={e => {
              (e.currentTarget as HTMLVideoElement).style.display = 'none';
            }}
          >
            <source src="assets/intro.mp4" type="video/mp4" />
          </video>

          <img
            src="assets/intro.gif"
            alt="Cinemática"
            className="w-full h-full object-cover absolute inset-0 -z-10"
            onError={e => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=1200&q=80';
            }}
          />

          {/* Mission Tag Badge */}
          <div className="absolute top-4 left-4 bg-[#7fa650]/90 text-white font-mono text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
            Misión {mission.id}
          </div>
        </div>

        {/* Narrative Dialogue Box */}
        <div className="p-6 bg-[#312e2b] border-t border-[#3f3c38] flex flex-col justify-between">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#7fa650] flex-shrink-0 flex items-center justify-center text-2xl border border-white/20 shadow">
              {mission.icon}
            </div>
            <div>
              <div className="font-extrabold text-sm text-[#7fa650]">{mission.speakerName}</div>
              <p className="text-sm text-gray-200 mt-1 leading-relaxed italic">
                "{mission.dialogue}"
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#3f3c38]">
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-white transition"
            >
              Saltar cinemática ➔
            </button>
            <button
              onClick={onStartBattle}
              className="px-5 py-2 bg-[#7fa650] hover:bg-[#537a38] text-white text-xs font-bold rounded-xl transition shadow"
            >
              Comenzar Partida ⚔️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
