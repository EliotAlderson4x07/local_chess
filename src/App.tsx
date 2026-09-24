import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import confetti from 'canvas-confetti';

import {
  ActiveView,
  Difficulty,
  GameMode,
  LeaderboardEntry,
  Mission,
  MoveRecord,
  OnlineRoom,
  PlayerProfile,
  PlayerSide,
  TimeControlConfig,
  Premove,
  GameAnalysisReport,
  PieceSkinId
} from './types/chess.ts';
import { COMPETITIVE_TIME_CONTROLS, DEFAULT_TIME_CONTROL } from './constants/timeControls.ts';
import { soundService } from './services/audio.ts';
import { calculateEloChange } from './services/elo.ts';
import { computeBestMove, evaluateBotDrawOffer, BotDrawEvaluation } from './services/ai.ts';
import { analyzeGame } from './services/analysis.ts';
import {
  isFirestoreActive,
  loadLeaderboardData,
  syncPlayerToStorage,
  subscribeToAuth,
  subscribeToRoom,
  updateOnlineRoomMove,
  resignOnlineRoom
} from './services/firebase.ts';

import { ChessBoard } from './components/ChessBoard.tsx';
import { PlayerHud } from './components/PlayerHud.tsx';
import { GameControls } from './components/GameControls.tsx';
import { MoveHistory } from './components/MoveHistory.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { CinematicModal } from './components/CinematicModal.tsx';
import { StoryView } from './components/StoryView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { MultiplayerLobby } from './components/MultiplayerLobby.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { GameReviewModal } from './components/GameReviewModal.tsx';
import { DrawOfferModal } from './components/DrawOfferModal.tsx';
import { DailyTacticsView } from './components/DailyTacticsView.tsx';
import { PremiumCheckoutModal } from './components/PremiumCheckoutModal.tsx';
import { RevivePieceModal } from './components/RevivePieceModal.tsx';
import { NukePhase } from './components/NukeExplosionOverlay.tsx';

const DEFAULT_PROFILE: PlayerProfile = {
  nickname: 'Invitado_' + Math.floor(Math.random() * 899 + 100),
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  aperturaFavorita: 'Defensa Siciliana',
  bio: 'Ajedrecista aficionado (Cuenta Invitado)',
  eloBullet: 800,
  eloBlitz: 800,
  eloRapido: 800,
  eloClasico: 800,
  amigos: [],
  partidasJugadas: 0,
  partidasGanadas: 0,
  partidasPerdidas: 0,
  misionesCompletadas: 0,
  isRegistered: false
};

const BOT_DATA: Record<Difficulty, { name: string; elo: number; badge: string; avatar: string }> = {
  easy: {
    name: 'Bot Novato',
    elo: 600,
    badge: 'Novato',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80'
  },
  medium: {
    name: 'Bot Intermedio',
    elo: 1200,
    badge: 'Intermedio',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
  },
  hard: {
    name: 'Bot Avanzado',
    elo: 1650,
    badge: 'Avanzado',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80'
  },
  master: {
    name: 'Bot Gran Maestro FIDE',
    elo: 2200,
    badge: 'GM FIDE',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
  }
};

const STORY_MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'Misión 1: Peón Rebelde',
    icon: '♟️',
    difficulty: 'Novato',
    stars: '★☆☆',
    desc: 'Un contingente de peones fronterizos intenta rebelarse. Restablece la disciplina con solidez posicional.',
    speakerName: 'Capitán Peón',
    dialogue: '¡Nuestras filas avanzan sin temor! Si deseas someternos, tendrás que dominar las columnas centrales.',
    requiredElo: 600,
    botDifficulty: 'easy',
    completed: false
  },
  {
    id: 2,
    title: 'Misión 2: Emboscada de Caballos',
    icon: '♞',
    difficulty: 'Intermedio',
    stars: '★★☆',
    desc: 'La caballería pesada acecha desde casillas oscuras con horquillas letales. Requiere visión táctica aguda.',
    speakerName: 'Lord Caballo',
    dialogue: 'Nuestros saltos no conocen fronteras. Una casilla descuidada y perderás tu dama en un parpadeo.',
    requiredElo: 1200,
    botDifficulty: 'medium',
    completed: false
  },
  {
    id: 3,
    title: 'Misión 3: Jaque al Gran Maestro',
    icon: '👑',
    difficulty: 'Gran Maestro',
    stars: '★★★',
    desc: 'El salón del trono se abre. Enfréntate al Gran Maestro supremo en el duelo definitivo por la corona.',
    speakerName: 'Gran Maestro Supremo',
    dialogue: 'Has llegado lejos, aprendiz. Demuestra si tu visión trasciende las 64 casillas sagradas de Caissa.',
    requiredElo: 1650,
    botDifficulty: 'hard',
    completed: false
  }
];

export default function App() {
  // Navigation View
  const [activeView, setActiveView] = useState<ActiveView>('play');

  // Competitive Time Controls (FIDE / Blitz / Bullet / Rapid / Classical)
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlConfig>(DEFAULT_TIME_CONTROL);

  // Player Side Choice
  const [playerSideChoice, setPlayerSideChoice] = useState<PlayerSide>('w');
  const [myColor, setMyColor] = useState<'w' | 'b'>('w');
  const botColor: 'w' | 'b' = myColor === 'w' ? 'b' : 'w';

  // Bot Thinking state
  const [isBotThinking, setIsBotThinking] = useState(false);

  // User Profile
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem('chessmaster_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isRegistered: Boolean(parsed.isRegistered && parsed.uid)
        };
      }
    } catch {}
    return DEFAULT_PROFILE;
  });

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCinematicOpen, setIsCinematicOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [gameOverResult, setGameOverResult] = useState({
    isWin: false,
    isDraw: false,
    reason: '',
    eloDelta: 0,
    newElo: 800
  });

  // Audio mute
  const [isMuted, setIsMuted] = useState(false);

  // Prejugadas (Premoves)
  const [premove, setPremove] = useState<Premove | null>(null);

  // Game Review / Analysis Modal state
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [gameReviewReport, setGameReviewReport] = useState<GameAnalysisReport | null>(null);

  // Bot Draw Offer Evaluation Modal
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [drawEvaluation, setDrawEvaluation] = useState<BotDrawEvaluation | null>(null);

  // Online Multiplayer State
  const [currentOnlineRoom, setCurrentOnlineRoom] = useState<OnlineRoom | null>(null);
  const [isMultiplayer, setIsMultiplayer] = useState(false);

  // Chess Engine & Board State
  const gameRef = useRef<Chess>(new Chess());
  const [currentFen, setCurrentFen] = useState(gameRef.current.fen());
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [opponentInfo, setOpponentInfo] = useState(BOT_DATA.medium);
  const [isFlipped, setIsFlipped] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);

  // Captured pieces and advantage
  const [capturedByWhite, setCapturedByWhite] = useState<string[]>([]);
  const [capturedByBlack, setCapturedByBlack] = useState<string[]>([]);

  // Timers (in seconds)
  const [timeWhite, setTimeWhite] = useState(DEFAULT_TIME_CONTROL.initialSeconds);
  const [timeBlack, setTimeBlack] = useState(DEFAULT_TIME_CONTROL.initialSeconds);
  const [isGameActive, setIsGameActive] = useState(true);

  // Active Story Mission Tracker
  const [currentActiveMission, setCurrentActiveMission] = useState<Mission | null>(null);

  // VIP Plan, Piece Skins & Chaos Powers State
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [premiumReason, setPremiumReason] = useState<string | undefined>(undefined);
  const [targetingMode, setTargetingMode] = useState<{
    active: boolean;
    targetColor: 'w' | 'b';
    onSelectTarget: (square: Square) => void;
  } | null>(null);
  const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);
  const [reviveTargeting, setReviveTargeting] = useState<{
    active: boolean;
    pieceType: PieceSymbol;
    onSelectSquare: (square: Square) => void;
  } | null>(null);
  const [nukePhase, setNukePhase] = useState<NukePhase>(null);
  const [chaosNotification, setChaosNotification] = useState<string | null>(null);

  // Leaderboard state
  const [leaderboardFilter, setLeaderboardFilter] = useState<GameMode>('blitz');
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [firestoreActive, setFirestoreActive] = useState(false);

  // Sync Firebase & Load Profile
  useEffect(() => {
    setFirestoreActive(isFirestoreActive());
    if (profile.isRegistered && profile.uid) {
      syncPlayerToStorage(profile);
    }
    loadLeaderboardData(leaderboardFilter, profile).then(setLeaderboardEntries);

    const unsubAuth = subscribeToAuth(firebaseUser => {
      if (firebaseUser) {
        setProfile(prev => {
          const updated: PlayerProfile = {
            ...prev,
            uid: firebaseUser.uid,
            email: firebaseUser.email || prev.email,
            nickname: firebaseUser.displayName || prev.nickname,
            avatar: firebaseUser.photoURL || prev.avatar,
            isRegistered: true
          };
          syncPlayerToStorage(updated);
          loadLeaderboardData(leaderboardFilter, updated).then(setLeaderboardEntries);
          return updated;
        });
      } else {
        setProfile(prev => {
          if (prev.isRegistered) {
            const guest: PlayerProfile = {
              ...DEFAULT_PROFILE,
              nickname: 'Invitado_' + Math.floor(Math.random() * 899 + 100),
              isRegistered: false,
              uid: undefined,
              email: undefined
            };
            loadLeaderboardData(leaderboardFilter, guest).then(setLeaderboardEntries);
            return guest;
          }
          return prev;
        });
      }
    });

    return () => unsubAuth();
  }, []);

  // Update Bot Profile when difficulty changes in solo mode
  useEffect(() => {
    if (!currentActiveMission && !isMultiplayer) {
      setOpponentInfo(BOT_DATA[difficulty]);
    }
  }, [difficulty, currentActiveMission, isMultiplayer]);

  // Online Room Subscription
  useEffect(() => {
    if (!currentOnlineRoom) return;

    const unsubRoom = subscribeToRoom(currentOnlineRoom.id, updatedRoom => {
      if (!updatedRoom) return;
      setCurrentOnlineRoom(updatedRoom);

      // Synchronize chess board
      if (updatedRoom.fen !== gameRef.current.fen()) {
        gameRef.current.load(updatedRoom.fen);
        setCurrentFen(updatedRoom.fen);
        setMoveHistory(updatedRoom.moves);
        const last = updatedRoom.moves[updatedRoom.moves.length - 1];
        if (last) {
          setLastMove({ from: last.from as Square, to: last.to as Square });
          if (last.captured) {
            soundService.playCapture();
          } else {
            soundService.playMove();
          }
        }
      }

      // Synchronize players info and orientation
      const isMeWhite = updatedRoom.whitePlayer.uid === (profile.uid || profile.nickname);
      setMyColor(isMeWhite ? 'w' : 'b');
      setIsFlipped(!isMeWhite);

      if (isMeWhite && updatedRoom.blackPlayer) {
        setOpponentInfo({
          name: updatedRoom.blackPlayer.nickname,
          elo: updatedRoom.blackPlayer.elo,
          badge: 'Online',
          avatar: updatedRoom.blackPlayer.avatar
        });
      } else if (!isMeWhite) {
        setOpponentInfo({
          name: updatedRoom.whitePlayer.nickname,
          elo: updatedRoom.whitePlayer.elo,
          badge: 'Online',
          avatar: updatedRoom.whitePlayer.avatar
        });
      }

      // Check online game over
      if (updatedRoom.status === 'ended' && updatedRoom.winner) {
        const myColorFlag = isMeWhite ? 'w' : 'b';
        const didIWin = updatedRoom.winner === myColorFlag;
        const isDraw = updatedRoom.winner === 'draw';
        handleGameEnd(didIWin, isDraw, updatedRoom.endReason || 'Fin de partida online');
      }
    });

    return () => unsubRoom();
  }, [currentOnlineRoom?.id, profile.uid, profile.nickname]);

  // Handle Game End & Elo Updates
  const handleGameEnd = useCallback(
    (isWin: boolean, isDraw: boolean, reason: string) => {
      setIsGameActive(false);
      setIsBotThinking(false);
      soundService.playGameOver(isWin);

      if (isWin) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      // Calculate Elo change according to category
      const score = isWin ? 1 : isDraw ? 0.5 : 0;
      const category = selectedTimeControl.category;
      const currentElo =
        category === 'bullet'
          ? profile.eloBullet
          : category === 'blitz'
          ? profile.eloBlitz
          : category === 'rapid'
          ? profile.eloRapido
          : profile.eloClasico || 800;

      const { delta, newRating } = calculateEloChange(currentElo, opponentInfo.elo, score);

      // Update player profile
      const updatedProfile: PlayerProfile = {
        ...profile,
        eloBullet: category === 'bullet' ? newRating : profile.eloBullet,
        eloBlitz: category === 'blitz' ? newRating : profile.eloBlitz,
        eloRapido: category === 'rapid' ? newRating : profile.eloRapido,
        eloClasico: category === 'classical' ? newRating : profile.eloClasico || 800,
        partidasJugadas: profile.partidasJugadas + 1,
        partidasGanadas: isWin ? profile.partidasGanadas + 1 : profile.partidasGanadas,
        partidasPerdidas: !isWin && !isDraw ? profile.partidasPerdidas + 1 : profile.partidasPerdidas,
        misionesCompletadas:
          isWin && currentActiveMission && currentActiveMission.id > profile.misionesCompletadas
            ? currentActiveMission.id
            : profile.misionesCompletadas
      };

      setProfile(updatedProfile);
      syncPlayerToStorage(updatedProfile);
      if (updatedProfile.isRegistered) {
        loadLeaderboardData(leaderboardFilter, updatedProfile).then(setLeaderboardEntries);
      }

      setGameOverResult({
        isWin,
        isDraw,
        reason,
        eloDelta: delta,
        newElo: newRating
      });
      setIsGameOverOpen(true);
    },
    [selectedTimeControl.category, profile, opponentInfo.elo, currentActiveMission]
  );

  // Timer Countdown Effect
  useEffect(() => {
    if (!isGameActive) return;

    const timer = setInterval(() => {
      const turn = gameRef.current.turn();
      if (turn === 'w') {
        setTimeWhite(prev => {
          if (prev <= 1) {
            const isWhitePlayer = myColor === 'w';
            handleGameEnd(!isWhitePlayer, false, isWhitePlayer ? 'Derrota por tiempo' : '¡Victoria por tiempo del rival!');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTimeBlack(prev => {
          if (prev <= 1) {
            const isBlackPlayer = myColor === 'b';
            handleGameEnd(!isBlackPlayer, false, isBlackPlayer ? 'Derrota por tiempo' : '¡Victoria por tiempo del rival!');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, myColor, handleGameEnd]);

  // Execute Bot Move Function (Direct and Reliable)
  const triggerBotMove = useCallback(() => {
    if (isMultiplayer || !isGameActive) return;
    const game = gameRef.current;

    // Check if it's the bot's turn
    if (game.turn() !== botColor || game.isGameOver()) return;

    setIsBotThinking(true);

    // Realistic calculation delay for competitive feel
    const delay = difficulty === 'master' ? 650 : difficulty === 'hard' ? 500 : 380;

    setTimeout(() => {
      if (!isGameActive || game.turn() !== botColor || game.isGameOver()) {
        setIsBotThinking(false);
        return;
      }

      const botMove = computeBestMove(game, difficulty, botColor);

      if (botMove) {
        const moveResult = game.move(botMove);
        if (moveResult) {
          setLastMove({ from: moveResult.from as Square, to: moveResult.to as Square });

          // Apply Fischer increment to Bot's clock
          if (selectedTimeControl.incrementSeconds > 0) {
            if (botColor === 'w') {
              setTimeWhite(prev => prev + selectedTimeControl.incrementSeconds);
            } else {
              setTimeBlack(prev => prev + selectedTimeControl.incrementSeconds);
            }
          }

          if (moveResult.captured) {
            if (botColor === 'w') {
              setCapturedByWhite(prev => [...prev, `b${moveResult.captured!.toUpperCase()}`]);
            } else {
              setCapturedByBlack(prev => [...prev, `w${moveResult.captured!.toUpperCase()}`]);
            }
            soundService.playCapture();
          } else {
            soundService.playMove();
          }

          if (game.isCheck()) {
            soundService.playCheck();
          }

          setMoveHistory(prev => [
            ...prev,
            {
              san: moveResult.san,
              from: moveResult.from,
              to: moveResult.to,
              color: botColor,
              captured: moveResult.captured
            }
          ]);

          setCurrentFen(game.fen());
          setIsBotThinking(false);

          // Check if bot delivered checkmate or drew
          if (game.isCheckmate()) {
            handleGameEnd(false, false, 'Jaque mate. El rival se alza con la victoria.');
          } else if (game.isDraw() || game.isStalemate()) {
            handleGameEnd(false, true, 'Tablas por ahogado o material insuficiente.');
          }
        }
      } else {
        setIsBotThinking(false);
      }
    }, delay);
  }, [isMultiplayer, isGameActive, botColor, difficulty, selectedTimeControl.incrementSeconds, handleGameEnd]);

  // Restart / Start New Game
  const startNewGame = useCallback((overrideSide?: PlayerSide, overrideTimeControl?: TimeControlConfig) => {
    gameRef.current.reset();
    setLastMove(null);
    setMoveHistory([]);
    setCapturedByWhite([]);
    setCapturedByBlack([]);
    setIsBotThinking(false);
    setPremove(null);
    setIsReviewOpen(false);
    setIsDrawModalOpen(false);
    setDrawEvaluation(null);
    setTargetingMode(null);
    setReviveTargeting(null);
    setIsReviveModalOpen(false);
    setNukePhase(null);
    setChaosNotification(null);

    const tc = overrideTimeControl || selectedTimeControl;
    setTimeWhite(tc.initialSeconds);
    setTimeBlack(tc.initialSeconds);

    // Resolve color
    const side = overrideSide || playerSideChoice;
    let resolvedColor: 'w' | 'b' = 'w';
    if (side === 'random') {
      resolvedColor = Math.random() < 0.5 ? 'w' : 'b';
    } else {
      resolvedColor = side;
    }

    setMyColor(resolvedColor);
    setIsFlipped(resolvedColor === 'b');
    setIsGameActive(true);
    setIsGameOverOpen(false);
    setCurrentFen(gameRef.current.fen());

    // If human is Black, the bot plays White and moves first immediately!
    if (resolvedColor === 'b' && !isMultiplayer) {
      setIsBotThinking(true);
      setTimeout(() => {
        const game = gameRef.current;
        const openingMove = computeBestMove(game, difficulty, 'w');
        if (openingMove) {
          const res = game.move(openingMove);
          if (res) {
            setLastMove({ from: res.from as Square, to: res.to as Square });
            soundService.playMove();
            setMoveHistory([
              {
                san: res.san,
                from: res.from,
                to: res.to,
                color: 'w'
              }
            ]);
            setCurrentFen(game.fen());
          }
        }
        setIsBotThinking(false);
      }, 500);
    }
  }, [selectedTimeControl, playerSideChoice, isMultiplayer, difficulty]);

  // Watch for bot turn in solo mode whenever currentFen changes
  useEffect(() => {
    if (!isGameActive || isMultiplayer) return;
    const game = gameRef.current;
    if (game.turn() === botColor && !game.isGameOver()) {
      triggerBotMove();
    }
  }, [currentFen, isGameActive, isMultiplayer, botColor, triggerBotMove]);

  // Player Move Handler
  const game = gameRef.current;
  const currentTurn = game.turn();
  const isPlayerTurn = isMultiplayer
    ? currentOnlineRoom?.turn === myColor
    : currentTurn === myColor && !isBotThinking;

  const handlePlayerMove = (from: Square, to: Square, promotion: PieceSymbol = 'q'): boolean => {
    if (targetingMode?.active || reviveTargeting?.active || nukePhase !== null) return false;
    if (!isPlayerTurn || game.isGameOver()) return false;

    try {
      const moveResult = game.move({
        from,
        to,
        promotion
      });

      if (moveResult) {
        setLastMove({ from, to });

        // Apply Fischer increment to player's clock
        if (selectedTimeControl.incrementSeconds > 0) {
          if (myColor === 'w') {
            setTimeWhite(prev => prev + selectedTimeControl.incrementSeconds);
          } else {
            setTimeBlack(prev => prev + selectedTimeControl.incrementSeconds);
          }
        }

        if (moveResult.captured) {
          if (myColor === 'w') {
            setCapturedByWhite(prev => [...prev, `b${moveResult.captured!.toUpperCase()}`]);
          } else {
            setCapturedByBlack(prev => [...prev, `w${moveResult.captured!.toUpperCase()}`]);
          }
          soundService.playCapture();
        } else {
          soundService.playMove();
        }

        if (game.isCheck()) {
          soundService.playCheck();
        }

        const newRecord: MoveRecord = {
          san: moveResult.san,
          from: moveResult.from,
          to: moveResult.to,
          color: moveResult.color,
          captured: moveResult.captured
        };

        const updatedHistory = [...moveHistory, newRecord];
        setMoveHistory(updatedHistory);
        setCurrentFen(game.fen());

        // Multiplayer Firestore update
        if (isMultiplayer && currentOnlineRoom) {
          const nextTurn = game.turn();
          updateOnlineRoomMove(
            currentOnlineRoom.id,
            game.fen(),
            nextTurn,
            newRecord,
            moveHistory,
            game.isCheckmate(),
            game.isDraw() || game.isStalemate(),
            timeWhite,
            timeBlack
          );
        }

        // Check if game has ended
        if (game.isCheckmate()) {
          handleGameEnd(true, false, '¡Jaque Mate! Has vencido con maestría.');
        } else if (game.isDraw() || game.isStalemate()) {
          handleGameEnd(false, true, 'Partida finalizada en Tablas.');
        }

        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  // Auto-execute registered premove as soon as turn switches to player
  useEffect(() => {
    if (!premove || !isPlayerTurn || !isGameActive) return;
    const game = gameRef.current;
    if (game.isGameOver()) {
      setPremove(null);
      return;
    }

    const legalFromMoves = game.moves({ square: premove.from as Square, verbose: true });
    const isLegal = legalFromMoves.some(m => m.to === premove.to);

    if (isLegal) {
      handlePlayerMove(
        premove.from as Square,
        premove.to as Square,
        (premove.promotion as PieceSymbol) || 'q'
      );
    }
    setPremove(null);
  }, [isPlayerTurn, currentFen, premove, isGameActive]);

  // Run Game Review / Analysis
  const handleRunGameAnalysis = useCallback(() => {
    if (moveHistory.length === 0) return;
    const report = analyzeGame(moveHistory);
    setGameReviewReport(report);
    setIsReviewOpen(true);
  }, [moveHistory]);

  // Toggle Sound
  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundService.setMuted(next);
  };

  // VIP Plan & Chaos Superpowers Handlers
  const handleOpenPremiumModal = (reason?: string) => {
    setPremiumReason(reason);
    setIsPremiumModalOpen(true);
  };

  const handleChangePieceSkin = (skin: PieceSkinId) => {
    if (!profile.isPremium && skin !== 'classic') {
      handleOpenPremiumModal(`Para desbloquear la skin "${skin}", suscríbete al Plan Premium con métodos de pago.`);
      return;
    }
    const updated: PlayerProfile = {
      ...profile,
      activePieceSkin: skin
    };
    setProfile(updated);
    syncPlayerToStorage(updated);
    setChaosNotification(`🎨 Skin activada con éxito.`);
    setTimeout(() => setChaosNotification(null), 2500);
  };

  const handleGenerateTenQueens = () => {
    if (!profile.isPremium) {
      handleOpenPremiumModal('Para generar un ejército de 10 Reinas en mitad de la partida, activa el Plan Premium.');
      return;
    }
    if (!isGameActive) {
      setChaosNotification('⚠️ Inicia una partida antes de usar los poderes de Caos.');
      setTimeout(() => setChaosNotification(null), 3000);
      return;
    }

    const currentChess = gameRef.current;
    const color = myColor;
    const board = currentChess.board();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    let existingQueens = 0;
    const pawnSquares: Square[] = [];
    const emptySquares: Square[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        const sq = `${files[c]}${8 - r}` as Square;
        if (piece && piece.type === 'q' && piece.color === color) {
          existingQueens++;
        } else if (piece && piece.type === 'p' && piece.color === color) {
          pawnSquares.push(sq);
        } else if (!piece) {
          emptySquares.push(sq);
        }
      }
    }

    let needed = Math.max(0, 10 - existingQueens);
    if (needed === 0) needed = 2;

    // 1. Replace pawns with Queens
    while (pawnSquares.length > 0 && needed > 0) {
      const sq = pawnSquares.shift()!;
      currentChess.remove(sq);
      currentChess.put({ type: 'q', color }, sq);
      needed--;
    }

    // 2. Put on empty squares
    while (emptySquares.length > 0 && needed > 0) {
      const sq = emptySquares.shift()!;
      currentChess.put({ type: 'q', color }, sq);
      needed--;
    }

    setCurrentFen(currentChess.fen());
    soundService.playPowerUp();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });

    setChaosNotification('👑 ¡INVASIÓN DE 10 REINAS ACTIVADA! El tablero está bajo tu dominio.');
    setTimeout(() => setChaosNotification(null), 4500);

    const updatedProf: PlayerProfile = {
      ...profile,
      chaosPowersUsed: (profile.chaosPowersUsed || 0) + 1
    };
    setProfile(updatedProf);
    syncPlayerToStorage(updatedProf);
  };

  const handleTriggerObliteratePiece = () => {
    if (!profile.isPremium) {
      handleOpenPremiumModal('Para aniquilar cualquier ficha rival con el rayo destructor, activa el Plan Premium.');
      return;
    }
    if (!isGameActive) {
      setChaosNotification('⚠️ Inicia una partida antes de usar el Rayo Destructor.');
      setTimeout(() => setChaosNotification(null), 3000);
      return;
    }

    const opponentColor = myColor === 'w' ? 'b' : 'w';
    setTargetingMode({
      active: true,
      targetColor: opponentColor,
      onSelectTarget: square => handleSelectTargetForObliterate(square)
    });
    setChaosNotification('🎯 MIRA ACTIVA: Haz clic en la ficha enemiga que deseas vaporizar.');
  };

  const handleSelectTargetForObliterate = (square: Square) => {
    const currentChess = gameRef.current;
    const piece = currentChess.get(square);
    if (!piece) return;

    soundService.playObliterate();

    if (piece.type === 'k') {
      setTargetingMode(null);
      setChaosNotification('⚡ ¡REY RIVAL ANIQUILADO! Victoria inmediata.');
      setTimeout(() => setChaosNotification(null), 4000);
      handleGameEnd(true, false, '¡Victoria Cósmica! El Rey rival ha sido aniquilado por el rayo destructor.');
      return;
    }

    currentChess.remove(square);
    setCurrentFen(currentChess.fen());
    setTargetingMode(null);

    if (piece.color === 'w') {
      setCapturedByBlack(prev => [...prev, `w${piece.type.toUpperCase()}`]);
    } else {
      setCapturedByWhite(prev => [...prev, `b${piece.type.toUpperCase()}`]);
    }

    setChaosNotification(`⚡ ¡Pieza rival (${piece.type.toUpperCase()}) en ${square} aniquilada!`);
    setTimeout(() => setChaosNotification(null), 3500);

    const updatedProf: PlayerProfile = {
      ...profile,
      chaosPowersUsed: (profile.chaosPowersUsed || 0) + 1
    };
    setProfile(updatedProf);
    syncPlayerToStorage(updatedProf);
  };

  // VIP Revive Allied Piece Handlers
  const handleTriggerRevivePiece = () => {
    if (!profile.isPremium) {
      handleOpenPremiumModal('Para revivir a tus piezas caídas en el tablero, activa el Plan Premium con métodos de pago.');
      return;
    }
    if (!isGameActive) {
      setChaosNotification('⚠️ Inicia una partida antes de revivir piezas.');
      setTimeout(() => setChaosNotification(null), 3000);
      return;
    }
    setIsReviveModalOpen(true);
  };

  const executeRevive = (pieceType: PieceSymbol, square: Square) => {
    const currentChess = gameRef.current;
    const color = myColor;

    const existing = currentChess.get(square);
    if (existing) {
      setChaosNotification(`⚠️ La casilla ${square} ya está ocupada.`);
      setTimeout(() => setChaosNotification(null), 2500);
      return;
    }

    const placed = currentChess.put({ type: pieceType, color }, square);
    if (!placed) {
      setChaosNotification(`⚠️ No se pudo colocar la pieza en ${square}.`);
      setTimeout(() => setChaosNotification(null), 2500);
      return;
    }

    setCurrentFen(currentChess.fen());
    setReviveTargeting(null);
    soundService.playRevivePiece();

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });

    const capturedKey = `${color}${pieceType.toUpperCase()}`;
    if (color === 'w') {
      setCapturedByBlack(prev => {
        const idx = prev.indexOf(capturedKey);
        if (idx !== -1) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      });
    } else {
      setCapturedByWhite(prev => {
        const idx = prev.indexOf(capturedKey);
        if (idx !== -1) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      });
    }

    const names: Record<PieceSymbol, string> = {
      q: 'Dama',
      r: 'Torre',
      b: 'Alfil',
      n: 'Caballo',
      p: 'Peón',
      k: 'Rey'
    };

    setChaosNotification(`✨ ¡${names[pieceType] || 'Pieza'} aliada revivida con éxito en ${square}!`);
    setTimeout(() => setChaosNotification(null), 4000);

    const updatedProf: PlayerProfile = {
      ...profile,
      chaosPowersUsed: (profile.chaosPowersUsed || 0) + 1
    };
    setProfile(updatedProf);
    syncPlayerToStorage(updatedProf);
  };

  const handleConfirmRevive = (pieceType: PieceSymbol, placementMode: 'auto' | 'manual') => {
    setIsReviveModalOpen(false);

    if (placementMode === 'manual') {
      setReviveTargeting({
        active: true,
        pieceType,
        onSelectSquare: (sq: Square) => executeRevive(pieceType, sq)
      });
      setChaosNotification(`✨ MIRA DE RESURRECCIÓN: Haz clic en una casilla vacía para invocar tu ${pieceType.toUpperCase()}.`);
      return;
    }

    const currentChess = gameRef.current;
    const files = ['d', 'e', 'c', 'f', 'b', 'g', 'a', 'h'];
    const ranks = myColor === 'w' ? ['1', '2', '3', '4'] : ['8', '7', '6', '5'];

    let targetSquare: Square | null = null;
    for (const r of ranks) {
      for (const f of files) {
        const sq = `${f}${r}` as Square;
        if (!currentChess.get(sq)) {
          targetSquare = sq;
          break;
        }
      }
      if (targetSquare) break;
    }

    if (targetSquare) {
      executeRevive(pieceType, targetSquare);
    } else {
      setReviveTargeting({
        active: true,
        pieceType,
        onSelectSquare: (sq: Square) => executeRevive(pieceType, sq)
      });
      setChaosNotification('✨ Tu territorio está lleno. Haz clic en cualquier casilla vacía del tablero.');
    }
  };

  // VIP Tactical Nuke Handler
  const handleTriggerNuke = () => {
    if (!profile.isPremium) {
      handleOpenPremiumModal('Para lanzar una Nuke táctica al tablero y forzar tablas inmediatas, activa el Plan Premium.');
      return;
    }
    if (!isGameActive) {
      setChaosNotification('⚠️ Inicia una partida antes de lanzar la Nuke.');
      setTimeout(() => setChaosNotification(null), 3000);
      return;
    }
    if (nukePhase !== null) return;

    setTargetingMode(null);
    setReviveTargeting(null);

    setNukePhase('countdown');
    soundService.playNukeSiren();
    setChaosNotification('🚨 ¡ALERTA NUCLEAR TÁCTICA! Detonación inminente en 3, 2, 1...');

    setTimeout(() => {
      setNukePhase('blast');
      soundService.playNukeExplosion();

      const currentChess = gameRef.current;
      const board = currentChess.board();
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const fallenWhite: string[] = [];
      const fallenBlack: string[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type !== 'k') {
            const sq = `${files[c]}${8 - r}` as Square;
            currentChess.remove(sq);
            if (piece.color === 'w') {
              fallenBlack.push(`w${piece.type.toUpperCase()}`);
            } else {
              fallenWhite.push(`b${piece.type.toUpperCase()}`);
            }
          }
        }
      }

      if (fallenBlack.length > 0) setCapturedByBlack(prev => [...prev, ...fallenBlack]);
      if (fallenWhite.length > 0) setCapturedByWhite(prev => [...prev, ...fallenWhite]);

      setCurrentFen(currentChess.fen());
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });

      setTimeout(() => {
        setNukePhase('fallout');
        setChaosNotification('☢️ ¡TABLAS POR CATACLISMO NUCLEAR! Solo los Reyes sobrevivieron.');

        handleGameEnd(
          false,
          false,
          '☢️ Tablas forzadas por Cataclismo Nuclear. Todos los aliados y enemigos fueron aniquilados; solo los dos Reyes sobrevivieron a la detonación.'
        );

        setTimeout(() => {
          setNukePhase(null);
          setChaosNotification(null);
        }, 3500);
      }, 1900);
    }, 2200);

    const updatedProf: PlayerProfile = {
      ...profile,
      chaosPowersUsed: (profile.chaosPowersUsed || 0) + 1
    };
    setProfile(updatedProf);
    syncPlayerToStorage(updatedProf);
  };

  // Launch Story Mission
  const handleSelectStoryMission = (mission: Mission) => {
    setSelectedMission(mission);
    setIsCinematicOpen(true);
  };

  const handleStartMissionBattle = () => {
    if (!selectedMission) return;
    setIsCinematicOpen(false);
    setIsMultiplayer(false);
    setCurrentOnlineRoom(null);
    setCurrentActiveMission(selectedMission);
    setDifficulty(selectedMission.botDifficulty);
    setOpponentInfo({
      name: selectedMission.title,
      elo: selectedMission.requiredElo,
      badge: selectedMission.difficulty,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80'
    });
    setActiveView('play');
    startNewGame('w');
  };

  // Enter online multiplayer room
  const handleEnterOnlineRoom = (room: OnlineRoom) => {
    setCurrentOnlineRoom(room);
    setIsMultiplayer(true);
    setCurrentActiveMission(null);
    const tcMatch = COMPETITIVE_TIME_CONTROLS.find(c => c.category === room.mode) || DEFAULT_TIME_CONTROL;
    setSelectedTimeControl(tcMatch);
    gameRef.current.load(room.fen);
    setCurrentFen(room.fen);
    setMoveHistory(room.moves);
    setTimeWhite(room.whitePlayer.timeLeft);
    setTimeBlack(room.blackPlayer ? room.blackPlayer.timeLeft : room.initialSeconds);
    setIsGameActive(room.status === 'playing');
    setActiveView('play');
  };

  // Resign action
  const handleResign = () => {
    if (isMultiplayer && currentOnlineRoom) {
      resignOnlineRoom(currentOnlineRoom.id, myColor);
    }
    handleGameEnd(false, false, 'Te has rendido de la partida.');
  };

  // Handle Offer Draw: Bots analyze their win probability; if > 30%, bot MUST NOT accept draw
  const handleOfferDraw = () => {
    if (!isGameActive) return;
    const game = gameRef.current;
    if (game.isGameOver()) return;

    if (isMultiplayer) {
      handleGameEnd(false, true, 'Tablas pactadas por acuerdo mutuo en sala multijugador.');
      return;
    }

    // Bot of current difficulty analyzes win probability
    const evaluation = evaluateBotDrawOffer(game, botColor, difficulty);
    setDrawEvaluation(evaluation);
    setIsDrawModalOpen(true);

    if (evaluation.shouldAccept) {
      soundService.playDrawAccept();
    } else {
      soundService.playDrawReject();
    }
  };

  // Calculate material advantages
  const pieceWeights: Record<string, number> = { P: 1, N: 3, B: 3, R: 5, Q: 9 };
  const whitePoints = capturedByWhite.reduce(
    (acc, p) => acc + (pieceWeights[p[1].toUpperCase()] || 0),
    0
  );
  const blackPoints = capturedByBlack.reduce(
    (acc, p) => acc + (pieceWeights[p[1].toUpperCase()] || 0),
    0
  );

  const whiteAdvantage = Math.max(0, whitePoints - blackPoints);
  const blackAdvantage = Math.max(0, blackPoints - whitePoints);

  // Turn status label
  const turnStatusText = isBotThinking
    ? '🤖 El bot está calculando...'
    : isPlayerTurn
    ? `Tu turno (${myColor === 'w' ? 'Blancas ⚪' : 'Negras ⚫'})`
    : isMultiplayer && currentOnlineRoom?.status === 'waiting'
    ? 'Esperando rival en la sala...'
    : 'Turno del oponente...';

  // Opening label
  const openingLabel = moveHistory.length === 0 ? 'Posición inicial' : profile.aperturaFavorita;

  return (
    <div className="min-h-screen flex flex-col bg-[#262421] text-white selection:bg-[#7fa650] selection:text-white">
      {/* Top Navbar */}
      <header className="bg-[#312e2b] border-b border-[#3f3c38] sticky top-0 z-40 px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setIsMultiplayer(false);
              setCurrentOnlineRoom(null);
              setActiveView('play');
            }}
            className="flex items-center space-x-2 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 bg-[#7fa650] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <span className="text-xl">♟️</span>
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                ChessMaster <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-[#7fa650] text-white font-extrabold rounded-full">FIDE LIVE</span>
              </span>
              <p className="text-[10px] sm:text-[11px] text-gray-400 -mt-1 hidden sm:block">
                Ajedrez Competitivo Oficial & Multijugador
              </p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 ml-4">
            <button
              onClick={() => {
                setIsMultiplayer(false);
                setCurrentOnlineRoom(null);
                setActiveView('play');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeView === 'play' && !isMultiplayer
                  ? 'bg-[#7fa650] text-white shadow'
                  : 'text-gray-300 hover:text-white hover:bg-[#3f3c38]'
              }`}
            >
              ⚔️ Jugar vs Bot
            </button>
            <button
              onClick={() => setActiveView('multiplayer')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeView === 'multiplayer' || isMultiplayer
                  ? 'bg-[#7fa650] text-white shadow'
                  : 'text-gray-300 hover:text-white hover:bg-[#3f3c38]'
              }`}
            >
              🌐 Multijugador
            </button>
            <button
              onClick={() => setActiveView('story')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeView === 'story'
                  ? 'bg-[#7fa650] text-white shadow'
                  : 'text-gray-300 hover:text-white hover:bg-[#3f3c38]'
              }`}
            >
              📖 Historia
            </button>
            <button
              onClick={() => {
                setIsMultiplayer(false);
                setCurrentOnlineRoom(null);
                setActiveView('dailyTactics');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'dailyTactics'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-300 hover:text-white hover:bg-[#3f3c38]'
              }`}
            >
              <span>🎯</span> Táctica Diaria
            </button>
            <button
              onClick={() => {
                setActiveView('leaderboard');
                loadLeaderboardData(leaderboardFilter, profile).then(setLeaderboardEntries);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeView === 'leaderboard'
                  ? 'bg-[#7fa650] text-white shadow'
                  : 'text-gray-300 hover:text-white hover:bg-[#3f3c38]'
              }`}
            >
              🏆 Clasificación
            </button>
            {moveHistory.length > 0 && (
              <button
                onClick={handleRunGameAnalysis}
                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all bg-[#262421] hover:bg-[#383531] text-[#7fa650] hover:text-[#9bc763] border border-[#7fa650]/40 shadow cursor-pointer flex items-center gap-1.5"
                title="Revisar y clasificar jugadas con el Entrenador IA"
              >
                <span>🔍</span> Revisión
              </button>
            )}
          </nav>
        </div>

        {/* User quick badge & auth buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* VIP Plan & Payment Methods Button */}
          <button
            onClick={() => handleOpenPremiumModal('Explora los métodos de pago y ventajas del Plan Premium VIP')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95 ${
              profile.isPremium
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 border border-amber-400'
                : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/50'
            }`}
            title="Plan Premium VIP y Métodos de Pago"
          >
            <span className="text-sm">👑</span>
            <span className="hidden sm:inline">{profile.isPremium ? 'VIP Activo' : 'Plan VIP'}</span>
          </button>

          <button
            onClick={toggleSound}
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
            className="p-2 text-gray-300 hover:text-white bg-[#262421] hover:bg-[#3f3c38] rounded-xl border border-[#3f3c38] transition cursor-pointer"
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
          </button>

          {profile.email ? (
            <div
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center space-x-2 bg-[#262421] hover:bg-[#3f3c38] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#7fa650] cursor-pointer transition shadow"
            >
              <img
                src={profile.avatar}
                alt={profile.nickname}
                className="w-7 h-7 rounded-full bg-[#7fa650] border border-white/20 object-cover"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                  {profile.nickname}
                </div>
                <div className="text-[10px] text-[#7fa650] font-semibold mt-0.5 leading-none">
                  ⚡ {profile.eloBlitz}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-3 py-1.5 bg-[#7fa650] hover:bg-[#537a38] text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
            >
              <span>🔑</span> Iniciar Sesión
            </button>
          )}

          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 text-gray-300 hover:text-white bg-[#262421] hover:bg-[#3f3c38] rounded-xl border border-[#3f3c38] transition cursor-pointer"
            title="Ajustes de Perfil"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 pb-16 md:pb-6 flex flex-col justify-center items-center">
        {/* Chaos Powers Notification Banner */}
        {chaosNotification && (
          <div className="w-full max-w-xl mb-3 py-2.5 px-4 bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border border-amber-500/70 text-amber-200 text-xs sm:text-sm font-extrabold rounded-2xl text-center shadow-2xl flex items-center justify-between gap-2">
            <span className="truncate flex-1">{chaosNotification}</span>
            {targetingMode?.active && (
              <button
                onClick={() => {
                  setTargetingMode(null);
                  setChaosNotification(null);
                }}
                className="text-[10px] bg-red-800 hover:bg-red-700 text-white font-black px-2 py-1 rounded-lg shrink-0 cursor-pointer"
              >
                Cancelar Mira ✕
              </button>
            )}
            {reviveTargeting?.active && (
              <button
                onClick={() => {
                  setReviveTargeting(null);
                  setChaosNotification(null);
                }}
                className="text-[10px] bg-amber-800 hover:bg-amber-700 text-white font-black px-2 py-1 rounded-lg shrink-0 cursor-pointer"
              >
                Cancelar Invocación ✕
              </button>
            )}
          </div>
        )}

        {/* 1. PLAY VIEW */}
        {activeView === 'play' && (
          <div className="w-full flex flex-col lg:flex-row gap-4 items-center lg:items-start justify-center">
            {/* Board Column */}
            <div className="w-full max-w-[560px] flex flex-col gap-2">
              {/* Opponent HUD */}
              <PlayerHud
                name={opponentInfo.name}
                avatar={opponentInfo.avatar}
                rating={opponentInfo.elo}
                badgeText={opponentInfo.badge}
                badgeColor="text-amber-300 bg-amber-500/20 border-amber-500/30"
                timeLeftSeconds={isFlipped ? timeWhite : timeBlack}
                incrementSeconds={selectedTimeControl.incrementSeconds}
                isActiveTurn={!isPlayerTurn && isGameActive}
                isThinking={isBotThinking}
                capturedPieces={isFlipped ? capturedByWhite : capturedByBlack}
                advantagePoints={isFlipped ? whiteAdvantage : blackAdvantage}
              />

              {/* Strict Perfectly Squared Chess Board with Premoves and Right-click arrows */}
              <ChessBoard
                game={game}
                isFlipped={isFlipped}
                onMove={handlePlayerMove}
                lastMove={lastMove}
                disabled={!isGameActive || Boolean(nukePhase)}
                playerColor={myColor}
                isPlayerTurn={isPlayerTurn}
                premove={premove}
                onSetPremove={setPremove}
                pieceSkin={profile.activePieceSkin || 'classic'}
                targetingMode={targetingMode}
                nukePhase={nukePhase}
                reviveTargeting={reviveTargeting}
              />

              {/* Player HUD */}
              <PlayerHud
                name={profile.nickname}
                avatar={profile.avatar}
                rating={
                  selectedTimeControl.category === 'bullet'
                    ? profile.eloBullet
                    : selectedTimeControl.category === 'blitz'
                    ? profile.eloBlitz
                    : selectedTimeControl.category === 'rapid'
                    ? profile.eloRapido
                    : profile.eloClasico || 800
                }
                badgeText={myColor === 'w' ? 'Tú (Blancas ⚪)' : 'Tú (Negras ⚫)'}
                badgeColor="text-[#7fa650] bg-[#7fa650]/20 border-[#7fa650]/30"
                timeLeftSeconds={isFlipped ? timeBlack : timeWhite}
                incrementSeconds={selectedTimeControl.incrementSeconds}
                isActiveTurn={isPlayerTurn && isGameActive}
                capturedPieces={isFlipped ? capturedByBlack : capturedByWhite}
                advantagePoints={isFlipped ? blackAdvantage : whiteAdvantage}
              />
            </div>

            {/* Sidebar Controls Column */}
            <div className="w-full lg:w-[380px] flex flex-col gap-3">
              <GameControls
                timeControls={COMPETITIVE_TIME_CONTROLS}
                selectedTimeControl={selectedTimeControl}
                onChangeTimeControl={tc => {
                  if (isMultiplayer) return;
                  setSelectedTimeControl(tc);
                  startNewGame(playerSideChoice, tc);
                }}
                currentDifficulty={difficulty}
                onChangeDifficulty={d => {
                  if (isMultiplayer) return;
                  setDifficulty(d);
                }}
                playerSide={playerSideChoice}
                onChangePlayerSide={side => {
                  if (isMultiplayer) return;
                  setPlayerSideChoice(side);
                  startNewGame(side, selectedTimeControl);
                }}
                onRestart={() => startNewGame()}
                onOfferDraw={handleOfferDraw}
                onResign={handleResign}
                onFlipBoard={() => setIsFlipped(!isFlipped)}
                turnStatusText={turnStatusText}
                isPlayerTurn={isPlayerTurn}
                isBotThinking={isBotThinking}
                openingName={openingLabel}
                evalScore={whiteAdvantage > 0 ? `+${whiteAdvantage}` : blackAdvantage > 0 ? `-${blackAdvantage}` : '0.0'}
                isMultiplayer={isMultiplayer}
                onOpenAnalysis={moveHistory.length > 0 ? handleRunGameAnalysis : undefined}
                hasMoves={moveHistory.length > 0}
                isPremium={profile.isPremium}
                activePieceSkin={profile.activePieceSkin || 'classic'}
                onChangePieceSkin={handleChangePieceSkin}
                onOpenPremiumModal={handleOpenPremiumModal}
                onGenerateTenQueens={handleGenerateTenQueens}
                onTriggerObliteratePiece={handleTriggerObliteratePiece}
                isTargetingActive={Boolean(targetingMode?.active)}
                onCancelTargeting={() => {
                  setTargetingMode(null);
                  setChaosNotification(null);
                }}
                onTriggerRevivePiece={handleTriggerRevivePiece}
                onTriggerNuke={handleTriggerNuke}
                isNukeActive={Boolean(nukePhase)}
                isReviveTargetingActive={Boolean(reviveTargeting?.active)}
                onCancelReviveTargeting={() => {
                  setReviveTargeting(null);
                  setChaosNotification(null);
                }}
              />

              <MoveHistory moves={moveHistory} />
            </div>
          </div>
        )}

        {/* 2. MULTIPLAYER LOBBY */}
        {activeView === 'multiplayer' && (
          <MultiplayerLobby
            player={profile}
            onEnterRoom={handleEnterOnlineRoom}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* 3. STORY VIEW */}
        {activeView === 'story' && (
          <StoryView
            missions={STORY_MISSIONS}
            completedCount={profile.misionesCompletadas}
            onSelectMission={handleSelectStoryMission}
          />
        )}

        {/* 4. LEADERBOARD VIEW */}
        {activeView === 'leaderboard' && (
          <LeaderboardView
            filterMode={leaderboardFilter}
            onChangeFilterMode={mode => {
              setLeaderboardFilter(mode);
              loadLeaderboardData(mode, profile).then(setLeaderboardEntries);
            }}
            entries={leaderboardEntries}
            isFirestoreActive={firestoreActive}
            currentProfile={profile}
            onOpenAuth={() => setIsAuthOpen(true)}
            onRefresh={() => {
              loadLeaderboardData(leaderboardFilter, profile).then(setLeaderboardEntries);
            }}
            onChallenge={nick => {
              setIsMultiplayer(false);
              setCurrentOnlineRoom(null);
              setOpponentInfo({
                name: nick,
                elo: Math.floor(Math.random() * 400 + 800),
                badge: 'Desafío',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
              });
              setActiveView('play');
              startNewGame();
            }}
          />
        )}

        {/* 5. DAILY TACTICS VIEW */}
        {activeView === 'dailyTactics' && (
          <DailyTacticsView
            player={profile}
            onUpdateProfile={updated => {
              setProfile(updated);
              if (updated.isRegistered && updated.uid) {
                syncPlayerToStorage(updated);
              }
            }}
            onBackToPlay={() => {
              setIsMultiplayer(false);
              setCurrentOnlineRoom(null);
              setActiveView('play');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#312e2b] border-t border-[#3f3c38] flex justify-around py-2 px-1">
        <button
          onClick={() => {
            setIsMultiplayer(false);
            setCurrentOnlineRoom(null);
            setActiveView('play');
          }}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeView === 'play' ? 'text-[#7fa650]' : 'text-gray-400'
          }`}
        >
          <span className="text-lg">♟️</span> Jugar
        </button>
        <button
          onClick={() => {
            setIsMultiplayer(false);
            setCurrentOnlineRoom(null);
            setActiveView('dailyTactics');
          }}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeView === 'dailyTactics' ? 'text-amber-400' : 'text-gray-400'
          }`}
        >
          <span className="text-lg">🎯</span> Táctica
        </button>
        <button
          onClick={() => setActiveView('multiplayer')}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeView === 'multiplayer' ? 'text-[#7fa650]' : 'text-gray-400'
          }`}
        >
          <span className="text-lg">🌐</span> Online
        </button>
        <button
          onClick={() => setActiveView('story')}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeView === 'story' ? 'text-[#7fa650]' : 'text-gray-400'
          }`}
        >
          <span className="text-lg">⚔️</span> Historia
        </button>
        <button
          onClick={() => {
            setActiveView('leaderboard');
            loadLeaderboardData(leaderboardFilter, profile).then(setLeaderboardEntries);
          }}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeView === 'leaderboard' ? 'text-[#7fa650]' : 'text-gray-400'
          }`}
        >
          <span className="text-lg">🏆</span> Ranking
        </button>
        <button
          onClick={() => setIsAuthOpen(true)}
          className="flex flex-col items-center text-xs font-semibold text-gray-400 hover:text-white"
        >
          <span className="text-lg">👤</span> Cuenta
        </button>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentProfile={profile}
        onAuthSuccess={updatedProf => {
          setProfile(updatedProf);
          syncPlayerToStorage(updatedProf);
          loadLeaderboardData(leaderboardFilter, updatedProf).then(setLeaderboardEntries);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSave={updated => {
          setProfile(updated);
          syncPlayerToStorage(updated);
        }}
        onChallengeFriend={friend => {
          setIsMultiplayer(false);
          setCurrentOnlineRoom(null);
          setOpponentInfo({
            name: friend,
            elo: Math.floor(Math.random() * 400 + 800),
            badge: 'Amigo',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
          });
          setActiveView('play');
          startNewGame();
        }}
      />

      {/* Cinematic Modal */}
      <CinematicModal
        isOpen={isCinematicOpen}
        mission={selectedMission}
        onStartBattle={handleStartMissionBattle}
        onSkip={handleStartMissionBattle}
      />

      {/* Game Over Result Modal */}
      <GameOverModal
        isOpen={isGameOverOpen}
        isWin={gameOverResult.isWin}
        isDraw={gameOverResult.isDraw}
        reason={gameOverResult.reason}
        gameMode={selectedTimeControl.category}
        eloDelta={gameOverResult.eloDelta}
        newElo={gameOverResult.newElo}
        onPlayAgain={() => startNewGame()}
        onClose={() => setIsGameOverOpen(false)}
        onReviewGame={moveHistory.length > 0 ? handleRunGameAnalysis : undefined}
      />

      {/* Game Review / Move Evaluation Modal */}
      {gameReviewReport && (
        <GameReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          report={gameReviewReport}
          whiteName={myColor === 'w' ? profile.nickname : opponentInfo.name}
          blackName={myColor === 'w' ? opponentInfo.name : profile.nickname}
          isFlipped={isFlipped}
        />
      )}

      {/* Bot Draw Offer Analysis Modal */}
      <DrawOfferModal
        isOpen={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        evaluation={drawEvaluation}
        botName={opponentInfo.name}
        botAvatar={opponentInfo.avatar}
        botBadge={opponentInfo.badge}
        onAcceptProceed={() => {
          setIsDrawModalOpen(false);
          handleGameEnd(
            false,
            true,
            `Tablas aceptadas por ${opponentInfo.name} (${drawEvaluation?.winChancePercent || 0}% de probabilidad de victoria ≤ 30%).`
          );
        }}
      />

      {/* Premium Plan & VIP Checkout Modal with Payment Methods */}
      <PremiumCheckoutModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        player={profile}
        initialReason={premiumReason}
        onSuccess={updatedPlayer => {
          setProfile(updatedPlayer);
          syncPlayerToStorage(updatedPlayer);
        }}
      />

      {/* VIP Revive Allied Piece Modal */}
      <RevivePieceModal
        isOpen={isReviveModalOpen}
        onClose={() => setIsReviveModalOpen(false)}
        playerColor={myColor}
        capturedAllies={myColor === 'w' ? capturedByBlack : capturedByWhite}
        pieceSkin={profile.activePieceSkin || 'classic'}
        onConfirmRevive={handleConfirmRevive}
      />
    </div>
  );
}
