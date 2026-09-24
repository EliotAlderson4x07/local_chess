import React, { useState } from 'react';
import { loginWithEmail, registerWithEmail, loginWithGoogle, logoutUser } from '../services/firebase.ts';
import { PlayerProfile } from '../types/chess.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: PlayerProfile;
  onAuthSuccess: (profile: PlayerProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onAuthSuccess
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!email || !password) {
          throw new Error('Por favor completa todos los campos.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        const userProf = await registerWithEmail(email, password, nickname || 'Maestro');
        onAuthSuccess(userProf);
        onClose();
      } else {
        if (!email || !password) {
          throw new Error('Ingresa correo y contraseña.');
        }
        const userProf = await loginWithEmail(email, password);
        onAuthSuccess(userProf);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al autenticar';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        setErrorMsg('Credenciales incorrectas o usuario no registrado.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setErrorMsg('Este correo electrónico ya está registrado.');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const userProf = await loginWithGoogle();
      onAuthSuccess(userProf);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con Google';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      const guest: PlayerProfile = {
        nickname: 'Invitado_' + Math.floor(Math.random() * 900 + 100),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        aperturaFavorita: 'Defensa Siciliana',
        bio: 'Jugador sin cuenta',
        eloBullet: 800,
        eloBlitz: 800,
        eloRapido: 800,
        eloClasico: 800,
        amigos: [],
        partidasJugadas: 0,
        partidasGanadas: 0,
        partidasPerdidas: 0,
        misionesCompletadas: 0
      };
      onAuthSuccess(guest);
      onClose();
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#312e2b] border border-[#3f3c38] w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl p-1"
        >
          ✕
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-[#7fa650] rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <span className="text-2xl">♟️</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">
            {currentProfile.email
              ? 'Cuenta de Jugador'
              : isRegister
              ? 'Crear Cuenta ChessMaster'
              : 'Iniciar Sesión'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {currentProfile.email
              ? `Conectado como ${currentProfile.email}`
              : 'Accede a tu Elo, partidas multijugador y amigos en la nube'}
          </p>
        </div>

        {currentProfile.email ? (
          <div className="space-y-4">
            <div className="bg-[#262421] p-4 rounded-2xl border border-[#3f3c38] flex items-center space-x-3">
              <img
                src={currentProfile.avatar}
                alt="Avatar"
                className="w-12 h-12 rounded-xl object-cover border border-[#7fa650]"
              />
              <div>
                <div className="font-bold text-white text-sm">{currentProfile.nickname}</div>
                <div className="text-xs text-gray-400">{currentProfile.email}</div>
                <div className="text-xs font-mono text-[#7fa650] font-bold mt-1">
                  Blitz: {currentProfile.eloBlitz} | Bullet: {currentProfile.eloBullet}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 font-bold rounded-xl text-sm transition"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div>
            {/* Google Quick Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2.5 shadow cursor-pointer mb-4"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Gmail / Google</span>
            </button>

            <div className="flex items-center my-3 text-gray-500 text-xs">
              <div className="flex-1 h-px bg-[#3f3c38]" />
              <span className="px-2 font-mono">o con correo</span>
              <div className="flex-1 h-px bg-[#3f3c38]" />
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 bg-red-950/80 border border-red-500 rounded-xl text-xs text-red-200 text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                    Nombre o Apodo
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="Ej. BobbyFischer99"
                    maxLength={20}
                    className="w-full bg-[#262421] border border-[#3f3c38] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#7fa650]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                  Correo Electrónico (Gmail)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu_correo@gmail.com"
                  className="w-full bg-[#262421] border border-[#3f3c38] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#7fa650]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-[#262421] border border-[#3f3c38] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#7fa650]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#7fa650] hover:bg-[#537a38] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow shadow-[#7fa650]/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Entrar a mi Cuenta'}
              </button>
            </form>

            <div className="text-center mt-4 text-xs text-gray-400">
              {isRegister ? (
                <span>
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => {
                      setIsRegister(false);
                      setErrorMsg('');
                    }}
                    className="text-[#7fa650] hover:underline font-bold"
                  >
                    Inicia Sesión
                  </button>
                </span>
              ) : (
                <span>
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => {
                      setIsRegister(true);
                      setErrorMsg('');
                    }}
                    className="text-[#7fa650] hover:underline font-bold"
                  >
                    Crear Cuenta Gratis
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
