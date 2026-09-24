import React, { useState, useEffect } from 'react';
import { GameMode, OnlineRoom, PlayerProfile } from '../types/chess.ts';
import { createOnlineRoom, joinOnlineRoom, subscribeToRooms } from '../services/firebase.ts';

interface MultiplayerLobbyProps {
  player: PlayerProfile;
  onEnterRoom: (room: OnlineRoom) => void;
  onOpenAuth: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  player,
  onEnterRoom,
  onOpenAuth
}) => {
  const [rooms, setRooms] = useState<OnlineRoom[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('blitz');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsub = subscribeToRooms(list => {
      setRooms(list);
    });
    return () => unsub();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player.uid && !player.email) {
      onOpenAuth();
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const initialTime =
        selectedMode === 'bullet'
          ? 60
          : selectedMode === 'blitz'
          ? 180
          : selectedMode === 'rapid'
          ? 600
          : 3600;

      const safeRoomName = newRoomName.trim() || `Sala de ${player.nickname}`;
      const timeControlId = `${selectedMode}_standard`;

      const roomId = await createOnlineRoom(
        safeRoomName,
        selectedMode,
        player,
        initialTime,
        0,
        timeControlId
      );

      setIsCreating(false);
      setNewRoomName('');
      // Open room immediately as host
      onEnterRoom({
        id: roomId,
        name: safeRoomName,
        mode: selectedMode,
        timeControlId,
        initialSeconds: initialTime,
        incrementSeconds: 0,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        turn: 'w',
        status: 'waiting',
        whitePlayer: {
          uid: player.uid || player.nickname,
          nickname: player.nickname,
          avatar: player.avatar,
          elo:
            selectedMode === 'bullet'
              ? player.eloBullet
              : selectedMode === 'blitz'
              ? player.eloBlitz
              : selectedMode === 'rapid'
              ? player.eloRapido
              : player.eloClasico || 800,
          timeLeft: initialTime
        },
        blackPlayer: null,
        moves: [],
        winner: null,
        createdAt: Date.now()
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creando sala.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (room: OnlineRoom) => {
    if (!player.uid && !player.email) {
      onOpenAuth();
      return;
    }
    setErrorMsg('');
    try {
      const initialTime = room.initialSeconds || (room.mode === 'bullet' ? 60 : room.mode === 'blitz' ? 180 : 600);
      if (room.whitePlayer.uid === (player.uid || player.nickname)) {
        // Already host
        onEnterRoom(room);
        return;
      }
      await joinOnlineRoom(room.id, player, initialTime);
      onEnterRoom({
        ...room,
        status: 'playing',
        blackPlayer: {
          uid: player.uid || player.nickname,
          nickname: player.nickname,
          avatar: player.avatar,
          elo:
            room.mode === 'bullet'
              ? player.eloBullet
              : room.mode === 'blitz'
              ? player.eloBlitz
              : room.mode === 'rapid'
              ? player.eloRapido
              : player.eloClasico || 800,
          timeLeft: initialTime
        }
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al unirse a la sala.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#312e2b] border border-[#3f3c38] rounded-3xl p-5 sm:p-7 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#3f3c38]">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>🌐</span> Multijugador en Línea (Firestore)
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Crea una sala o únete a una partida en tiempo real contra otros jugadores conectados
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!player.email && (
            <button
              onClick={onOpenAuth}
              className="px-3 py-2 bg-[#262421] hover:bg-[#3f3c38] text-amber-300 rounded-xl text-xs font-bold border border-amber-500/40 transition cursor-pointer"
            >
              🔑 Iniciar Sesión
            </button>
          )}

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-[#7fa650] hover:bg-[#537a38] text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
          >
            <span>➕</span> {isCreating ? 'Cancelar' : 'Crear Sala'}
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-950/70 border border-red-500 rounded-xl text-xs text-red-200 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-red-300 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Create Room Form Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreateRoom}
          className="mt-4 bg-[#262421] p-4 rounded-2xl border border-[#7fa650] grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
              Nombre de la Sala
            </label>
            <input
              type="text"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              placeholder={`Sala de ${player.nickname}`}
              maxLength={26}
              className="w-full bg-[#312e2b] border border-[#3f3c38] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7fa650]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
              Tiempo (Modalidad)
            </label>
            <select
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value as GameMode)}
              className="w-full bg-[#312e2b] border border-[#3f3c38] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7fa650] cursor-pointer"
            >
              <option value="bullet">⚡ Bullet (1 min)</option>
              <option value="blitz">🔥 Blitz (3 min)</option>
              <option value="rapid">⏱️ Rápido (10 min)</option>
              <option value="classical">🏛️ Clásico (60 min)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#7fa650] hover:bg-[#537a38] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Publicar y Esperar Rival'}
          </button>
        </form>
      )}

      {/* Available Rooms Grid */}
      <div className="mt-5">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">
          Salas Disponibles ({rooms.length})
        </h3>

        {rooms.length === 0 ? (
          <div className="text-center py-12 bg-[#262421]/60 rounded-2xl border border-dashed border-[#3f3c38]">
            <span className="text-3xl block mb-2">⌛</span>
            <p className="text-sm font-bold text-white">No hay salas abiertas en este momento</p>
            <p className="text-xs text-gray-400 mt-1">
              ¡Crea la primera sala y desafía a tus amigos o rivales!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rooms.map(room => {
              const isWaiting = room.status === 'waiting';
              const isHost = room.whitePlayer.uid === (player.uid || player.nickname);

              return (
                <div
                  key={room.id}
                  className="bg-[#262421] border border-[#3f3c38] hover:border-[#7fa650] rounded-2xl p-4 transition shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={room.whitePlayer.avatar}
                      alt={room.whitePlayer.nickname}
                      className="w-10 h-10 rounded-xl bg-[#312e2b] object-cover border border-[#3f3c38]"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white truncate max-w-[130px]">
                          {room.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            isWaiting
                              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
                              : 'text-amber-400 border-amber-500/40 bg-amber-950/30'
                          }`}
                        >
                          {isWaiting ? 'Esperando' : 'En Curso'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center space-x-2">
                        <span>Host: {room.whitePlayer.nickname}</span>
                        <span>•</span>
                        <span className="font-mono text-[#7fa650] font-bold uppercase">
                          {room.mode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isWaiting ? (
                      <button
                        onClick={() => handleJoin(room)}
                        className="px-3.5 py-1.5 bg-[#7fa650] hover:bg-[#537a38] text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
                      >
                        {isHost ? 'Volver a Sala' : 'Unirse ⚔️'}
                      </button>
                    ) : isHost || room.blackPlayer?.uid === (player.uid || player.nickname) ? (
                      <button
                        onClick={() => onEnterRoom(room)}
                        className="px-3.5 py-1.5 bg-[#312e2b] hover:bg-[#3f3c38] text-[#7fa650] font-bold text-xs rounded-xl border border-[#7fa650] transition cursor-pointer"
                      >
                        Reanudar
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 font-semibold px-2 py-1">
                        Llena
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
