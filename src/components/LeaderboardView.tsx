import React from 'react';
import { GameMode, LeaderboardEntry, PlayerProfile } from '../types/chess.ts';

interface LeaderboardViewProps {
  filterMode: GameMode;
  onChangeFilterMode: (mode: GameMode) => void;
  entries: LeaderboardEntry[];
  isFirestoreActive: boolean;
  onRefresh: () => void;
  onChallenge: (nick: string) => void;
  currentProfile?: PlayerProfile;
  onOpenAuth?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  filterMode,
  onChangeFilterMode,
  entries,
  isFirestoreActive,
  onRefresh,
  onChallenge,
  currentProfile,
  onOpenAuth
}) => {
  const isUserRegistered = Boolean(currentProfile?.isRegistered && currentProfile?.uid);

  // Filter only genuine registered players
  const registeredEntries = entries.filter(e => e.isRegistered !== false);

  const myRankIndex = isUserRegistered
    ? registeredEntries.findIndex(
        e =>
          (currentProfile?.uid && e.uid === currentProfile.uid) ||
          e.nickname.toLowerCase() === currentProfile?.nickname.toLowerCase()
      )
    : -1;

  const currentEloForFilter =
    filterMode === 'bullet'
      ? currentProfile?.eloBullet || 800
      : filterMode === 'blitz'
      ? currentProfile?.eloBlitz || 800
      : filterMode === 'rapid'
      ? currentProfile?.eloRapido || 800
      : currentProfile?.eloClasico || 800;

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#312e2b] border border-[#3f3c38] rounded-3xl p-5 sm:p-7 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3f3c38]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <span>🏆</span> Clasificación Oficial
            </h2>
            <span className="bg-[#7fa650]/20 text-[#7fa650] border border-[#7fa650]/50 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Solo Registrados
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Ranking competitivo oficial de jugadores registrados con cuenta ChessMaster
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-[#262421] p-1 rounded-xl border border-[#3f3c38] overflow-x-auto">
          <button
            onClick={() => onChangeFilterMode('bullet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterMode === 'bullet'
                ? 'bg-[#7fa650] text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚡ Bullet
          </button>
          <button
            onClick={() => onChangeFilterMode('blitz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterMode === 'blitz'
                ? 'bg-[#7fa650] text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔥 Blitz
          </button>
          <button
            onClick={() => onChangeFilterMode('rapid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterMode === 'rapid'
                ? 'bg-[#7fa650] text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⏱️ Rápido
          </button>
          <button
            onClick={() => onChangeFilterMode('classical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterMode === 'classical'
                ? 'bg-[#7fa650] text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏛️ Clásico
          </button>
        </div>
      </div>

      {/* Guest vs Registered Banner */}
      {!isUserRegistered ? (
        <div className="mt-4 bg-gradient-to-r from-amber-950/70 via-[#262421] to-amber-950/70 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🔒</span>
            <div>
              <div className="font-extrabold text-amber-300 text-sm flex items-center gap-1.5">
                <span>¿Quieres aparecer en la clasificación oficial?</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                  Invitado
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Actualmente juegas como <strong>invitado</strong>. Solamente las cuentas de usuarios registrados aparecen en la tabla de clasificación y guardan su Elo en la nube.
              </p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="whitespace-nowrap px-4 py-2 bg-[#7fa650] hover:bg-[#537a38] text-white text-xs font-extrabold rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>👤</span> Registrarse / Iniciar Sesión
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 bg-gradient-to-r from-emerald-950/60 via-[#262421] to-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-extrabold text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
                <span>Cuenta Registrada Oficial:</span>
                <span className="text-white font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                  {currentProfile?.nickname}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">✓ Activo en Ranking</span>
              </div>
              <p className="text-[11px] text-gray-300 mt-0.5">
                {myRankIndex >= 0
                  ? `Tu puesto actual en ${filterMode.toUpperCase()} es #${myRankIndex + 1}. Cada partida modifica tu Elo en la nube.`
                  : `Tus partidas oficiales quedan vinculadas a tu cuenta y se sincronizan con la clasificación.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Tu Elo {filterMode}</span>
              <span className="text-base font-extrabold font-mono text-[#7fa650]">
                {currentEloForFilter}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-[#3f3c38] font-semibold">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Jugador Registrado</th>
              <th className="py-2.5 px-3">Apertura Favorita</th>
              <th className="py-2.5 px-3 text-right">Calificación Elo</th>
              <th className="py-2.5 px-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3f3c38]/50 font-medium">
            {registeredEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">
                  No hay jugadores registrados en esta categoría aún.
                  {onOpenAuth && (
                    <button
                      onClick={onOpenAuth}
                      className="ml-2 text-[#7fa650] hover:underline font-bold"
                    >
                      ¡Sé el primero en registrarte!
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              registeredEntries.slice(0, 15).map((entry, idx) => {
                const eloVal =
                  filterMode === 'bullet'
                    ? entry.eloBullet
                    : filterMode === 'blitz'
                    ? entry.eloBlitz
                    : filterMode === 'rapid'
                    ? entry.eloRapido
                    : entry.eloClasico || 800;

                const isMe =
                  isUserRegistered &&
                  ((currentProfile?.uid && entry.uid === currentProfile.uid) ||
                    entry.nickname.toLowerCase() === currentProfile?.nickname.toLowerCase());

                return (
                  <tr
                    key={entry.uid || entry.nickname}
                    className={`transition ${
                      isMe
                        ? 'bg-[#7fa650]/15 hover:bg-[#7fa650]/25 border-l-4 border-l-[#7fa650]'
                        : 'hover:bg-[#262421]/60'
                    }`}
                  >
                    <td className="py-3 px-3">
                      {idx === 0 ? (
                        <span className="text-amber-400 font-extrabold text-base">🥇 1</span>
                      ) : idx === 1 ? (
                        <span className="text-slate-300 font-extrabold text-base">🥈 2</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-600 font-extrabold text-base">🥉 3</span>
                      ) : (
                        <span className="text-gray-500 font-mono">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={entry.avatar}
                          alt={entry.nickname}
                          className="w-7 h-7 rounded-full bg-[#7fa650] object-cover border border-[#3f3c38]"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
                          }}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{entry.nickname}</span>
                            {isMe && (
                              <span className="text-[10px] font-extrabold bg-[#7fa650] text-white px-1.5 py-0.2 rounded-md">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-semibold">
                            <span>✓</span> Usuario Registrado
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-300">
                      <span className="bg-[#262421] px-2 py-0.5 rounded border border-[#3f3c38] text-[11px]">
                        {entry.aperturaFavorita}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-[#7fa650]">
                      {eloVal}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {!isMe ? (
                        <button
                          onClick={() => onChallenge(entry.nickname)}
                          className="px-2.5 py-1 bg-[#262421] hover:bg-[#7fa650] text-gray-200 hover:text-white rounded-lg border border-[#3f3c38] text-xs font-semibold transition cursor-pointer"
                        >
                          Desafiar
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Tu cuenta</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info notice about registered users */}
      <div className="mt-3 text-[11px] text-gray-400 bg-[#262421]/50 p-2.5 rounded-xl border border-[#3f3c38]/50 flex items-center justify-between">
        <span>🛡️ <strong>Regla del Torneo:</strong> Las cuentas anónimas/invitadas están excluidas de la clasificación oficial.</span>
        <span>{registeredEntries.length} jugadores registrados</span>
      </div>

      {/* Persistence status indicator */}
      <div className="mt-3 p-3 bg-[#262421] rounded-xl border border-[#3f3c38] flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isFirestoreActive ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span>
            {isFirestoreActive
              ? 'Sincronizado con Firebase Firestore (Solo cuentas verificadas)'
              : 'Modo local activo'}
          </span>
        </span>
        <button onClick={onRefresh} className="text-[#7fa650] hover:underline font-semibold cursor-pointer">
          Actualizar tabla
        </button>
      </div>
    </div>
  );
};
