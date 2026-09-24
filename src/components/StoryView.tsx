import React from 'react';
import { Mission } from '../types/chess.ts';

interface StoryViewProps {
  missions: Mission[];
  completedCount: number;
  onSelectMission: (mission: Mission) => void;
}

export const StoryView: React.FC<StoryViewProps> = ({
  missions,
  completedCount,
  onSelectMission
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-[#312e2b] border border-[#3f3c38] rounded-3xl p-5 sm:p-8 shadow-2xl">
      {/* Hero Multimedia Cover */}
      <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 bg-[#262421] border border-[#3f3c38] flex items-center justify-center">
        <img
          src="assets/portada.jpg"
          alt="Portada Historia"
          className="w-full h-full object-cover brightness-75"
          onError={e => {
            (e.currentTarget as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1200&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#312e2b] via-[#312e2b]/40 to-transparent flex flex-col justify-end p-5 sm:p-6">
          <span className="text-[#7fa650] font-mono text-xs font-bold uppercase tracking-wider">
            Modo Campaña
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Crónicas del Tablero: El Ascenso
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl">
            Supera 3 pruebas tácticas para coronarte Maestro Supremo del Reino de Caissa.
          </p>
        </div>
      </div>

      {/* 3 Missions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {missions.map(mission => {
          const isUnlocked = mission.id === 1 || completedCount >= mission.id - 1;
          const isCompleted = completedCount >= mission.id;

          return (
            <div
              key={mission.id}
              className={`p-5 rounded-2xl border relative flex flex-col justify-between transition ${
                isUnlocked
                  ? 'bg-[#262421] border-[#7fa650] shadow-lg'
                  : 'bg-[#262421]/60 border-[#3f3c38] opacity-70'
              }`}
            >
              <div
                className={`absolute -top-3 left-4 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isUnlocked
                    ? 'bg-[#7fa650] text-white'
                    : 'bg-gray-600 text-gray-200'
                }`}
              >
                {isCompleted ? '✓ Completada' : isUnlocked ? 'Disponible' : 'Bloqueada'}
              </div>

              <div>
                <div className="text-3xl mb-2 mt-1">{mission.icon}</div>
                <h3 className="font-bold text-white text-base">{mission.title}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{mission.desc}</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-300">
                  <span className="text-amber-400">{mission.stars}</span>
                  <span>{mission.difficulty}</span>
                </div>
              </div>

              <button
                disabled={!isUnlocked}
                onClick={() => onSelectMission(mission)}
                className={`mt-4 w-full py-2 text-xs font-bold rounded-xl transition shadow ${
                  isUnlocked
                    ? 'bg-[#7fa650] hover:bg-[#537a38] text-white cursor-pointer'
                    : 'bg-[#3f3c38] text-gray-500 cursor-not-allowed'
                }`}
              >
                {isCompleted ? 'Volver a Jugar' : isUnlocked ? 'Iniciar Misión' : `Completa Misión ${mission.id - 1}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
