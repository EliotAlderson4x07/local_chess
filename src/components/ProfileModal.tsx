import React, { useState } from 'react';
import { PlayerProfile } from '../types/chess.ts';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onSave: (updated: PlayerProfile) => void;
  onChallengeFriend: (nick: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onChallengeFriend
}) => {
  const [nickname, setNickname] = useState(profile.nickname);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [aperturaFavorita, setAperturaFavorita] = useState(profile.aperturaFavorita);
  const [bio, setBio] = useState(profile.bio);
  const [friends, setFriends] = useState<string[]>(profile.amigos || []);
  const [newFriendNick, setNewFriendNick] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (url: string) => {
    setAvatar(url);
    setCustomAvatarUrl('');
  };

  const handleCustomUrlChange = (url: string) => {
    setCustomAvatarUrl(url);
    if (url.trim()) {
      setAvatar(url.trim());
    }
  };

  const handleAddFriend = () => {
    const trimmed = newFriendNick.trim();
    if (!trimmed) return;
    if (trimmed.toLowerCase() === nickname.toLowerCase()) {
      alert('No puedes añadirte a ti mismo como amigo.');
      return;
    }
    if (friends.includes(trimmed)) {
      alert('Este jugador ya está en tu lista de amigos.');
      return;
    }
    setFriends([...friends, trimmed]);
    setNewFriendNick('');
  };

  const handleRemoveFriend = (nick: string) => {
    setFriends(friends.filter(f => f !== nick));
  };

  const handleSave = () => {
    const updated: PlayerProfile = {
      ...profile,
      nickname: nickname.trim() || profile.nickname,
      avatar: avatar || AVATAR_PRESETS[0],
      aperturaFavorita,
      bio,
      amigos: friends
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#312e2b] border border-[#3f3c38] w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#3f3c38]">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <span>⚙️</span> Perfil de Jugador
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg p-1 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Avatar selector */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
              Foto de Perfil (Avatar)
            </label>
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={avatar}
                alt="Avatar Actual"
                className="w-16 h-16 rounded-2xl bg-[#262421] object-cover border-2 border-[#7fa650] shadow-md"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = AVATAR_PRESETS[0];
                }}
              />
              <div className="flex-1">
                <span className="text-xs text-gray-400 block mb-1.5">Elige un preset rápido:</span>
                <div className="flex space-x-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition ${
                        avatar === preset ? 'border-[#7fa650] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-2">
              <label className="text-[11px] text-gray-400 block mb-1">
                O introduce URL de imagen personalizada:
              </label>
              <input
                type="url"
                value={customAvatarUrl}
                onChange={e => handleCustomUrlChange(e.target.value)}
                placeholder="https://ejemplo.com/mi-avatar.jpg"
                className="w-full bg-[#262421] border border-[#3f3c38] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7fa650]"
              />
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Nombre o Apodo de Ajedrecista
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              placeholder="Tu nombre de jugador..."
              className="w-full bg-[#262421] border border-[#3f3c38] rounded-xl px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-[#7fa650]"
            />
          </div>

          {/* Favorite opening */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Apertura Favorita
            </label>
            <select
              value={aperturaFavorita}
              onChange={e => setAperturaFavorita(e.target.value)}
              className="w-full bg-[#262421] border border-[#3f3c38] rounded-xl px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-[#7fa650] cursor-pointer"
            >
              <option value="Defensa Siciliana">Defensa Siciliana (1. e4 c5)</option>
              <option value="Apertura Ruy López">Apertura Española / Ruy López (1. e4 e5 2. Nf3 Nc6 3. Bb5)</option>
              <option value="Gambito de Dama">Gambito de Dama (1. d4 d5 2. c4)</option>
              <option value="Defensa Francesa">Defensa Francesa (1. e4 e6)</option>
              <option value="Defensa Caro-Kann">Defensa Caro-Kann (1. e4 c6)</option>
              <option value="Defensa India de Rey">Defensa India de Rey (1. d4 Nf6 2. c4 g6)</option>
              <option value="Apertura Italiana">Apertura Italiana (1. e4 e5 2. Nf3 Nc6 3. Bc4)</option>
              <option value="Sistema Londres">Sistema Londres (1. d4 y 2. Bf4)</option>
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Biografía Corta
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={120}
              placeholder="Escribe tu lema o descripción de juego..."
              className="w-full bg-[#262421] border border-[#3f3c38] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#7fa650]"
            />
          </div>

          {/* Elo ratings */}
          <div className="bg-[#262421] p-3.5 rounded-2xl border border-[#3f3c38]">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Calificaciones de Elo Competitivo Oficial
            </span>
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="bg-[#312e2b] p-2 rounded-xl border border-[#3f3c38]">
                <span className="text-[10px] text-gray-400 block font-sans">⚡ Bullet</span>
                <span className="font-extrabold text-base text-yellow-400">{profile.eloBullet}</span>
              </div>
              <div className="bg-[#312e2b] p-2 rounded-xl border border-[#3f3c38]">
                <span className="text-[10px] text-gray-400 block font-sans">🔥 Blitz</span>
                <span className="font-extrabold text-base text-[#7fa650]">{profile.eloBlitz}</span>
              </div>
              <div className="bg-[#312e2b] p-2 rounded-xl border border-[#3f3c38]">
                <span className="text-[10px] text-gray-400 block font-sans">⏱️ Rápido</span>
                <span className="font-extrabold text-base text-sky-400">{profile.eloRapido}</span>
              </div>
              <div className="bg-[#312e2b] p-2 rounded-xl border border-[#3f3c38]">
                <span className="text-[10px] text-gray-400 block font-sans">🏛️ Clásico</span>
                <span className="font-extrabold text-base text-amber-500">{profile.eloClasico || 800}</span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 mt-2 px-1">
              <span>
                Partidas: <b className="text-white">{profile.partidasJugadas}</b>
              </span>
              <span>
                Victorias: <b className="text-[#7fa650]">{profile.partidasGanadas}</b>
              </span>
              <span>
                Derrotas: <b className="text-red-400">{profile.partidasPerdidas}</b>
              </span>
            </div>
          </div>

          {/* Friends list */}
          <div className="bg-[#262421] p-3.5 rounded-2xl border border-[#3f3c38]">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Sistema de Amigos
            </span>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newFriendNick}
                onChange={e => setNewFriendNick(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                placeholder="Nickname de amigo a añadir..."
                className="flex-1 bg-[#312e2b] border border-[#3f3c38] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7fa650]"
              />
              <button
                type="button"
                onClick={handleAddFriend}
                className="px-3 py-1.5 bg-[#7fa650] hover:bg-[#537a38] text-white text-xs font-bold rounded-xl transition"
              >
                Añadir
              </button>
            </div>

            {friends.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No tienes amigos añadidos todavía.</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {friends.map(friend => (
                  <div
                    key={friend}
                    className="flex items-center justify-between bg-[#312e2b] px-3 py-1.5 rounded-xl border border-[#3f3c38]"
                  >
                    <span className="text-xs font-semibold text-white">{friend}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onChallengeFriend(friend);
                          onClose();
                        }}
                        className="text-[11px] bg-[#7fa650] hover:bg-[#537a38] text-white px-2 py-0.5 rounded-lg font-bold"
                      >
                        Desafiar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFriend(friend)}
                        className="text-xs text-red-400 hover:text-red-300 px-1"
                        title="Eliminar amigo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-[#3f3c38] flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#262421] hover:bg-[#3f3c38] text-gray-300 font-bold text-xs rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#7fa650] hover:bg-[#537a38] text-white font-bold text-xs rounded-xl transition shadow"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
