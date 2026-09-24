import { Square, PieceSymbol } from 'chess.js';

export type CompetitiveCategory = 'bullet' | 'blitz' | 'rapid' | 'classical';

export type GameMode = 'bullet' | 'blitz' | 'rapid' | 'classical';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'master';

export type ActiveView = 'play' | 'story' | 'leaderboard' | 'multiplayer' | 'analysis' | 'dailyTactics';

export type PieceSkinId = 'classic' | 'cyberpunk' | 'royal_gold' | 'ice_fire' | 'emerald_ruby';

export interface PieceSkinTheme {
  id: PieceSkinId;
  name: string;
  tagline: string;
  whiteColorName: string;
  blackColorName: string;
  whiteFill: string;
  whiteStroke: string;
  blackFill: string;
  blackStroke: string;
  whiteFilter?: string;
  blackFilter?: string;
  icon: string;
}

export interface DailyTacticMove {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  san?: string;
}

export interface DailyTacticPuzzle {
  id: string;
  dayIndex: number;
  title: string;
  theme: string;
  difficulty: 'Fácil' | 'Intermedio' | 'Avanzado' | 'Maestro';
  eloBonus: number;
  fen: string;
  playerColor: 'w' | 'b';
  description: string;
  hint: string;
  explanation: string;
  moves: DailyTacticMove[];
}

export interface DailySolvedRecord {
  date: string;
  puzzleId: string;
  eloBonus: number;
  attempts: number;
  solvedAt: string;
}

export type PlayerSide = 'w' | 'b' | 'random';

export interface TimeControlConfig {
  id: string;
  name: string;
  shortName: string;
  category: CompetitiveCategory;
  initialSeconds: number;
  incrementSeconds: number;
  icon: string;
  description: string;
}

export interface PlayerProfile {
  uid?: string;
  email?: string;
  nickname: string;
  avatar: string;
  aperturaFavorita: string;
  bio: string;
  eloBullet: number;
  eloBlitz: number;
  eloRapido: number;
  eloClasico: number;
  amigos: string[];
  partidasJugadas: number;
  partidasGanadas: number;
  partidasPerdidas: number;
  misionesCompletadas: number;
  tacticasResueltas?: number;
  rachaDiaria?: number;
  ultimaTacticaFecha?: string;
  isPremium?: boolean;
  premiumTier?: 'monthly' | 'yearly' | 'lifetime';
  activePieceSkin?: PieceSkinId;
  chaosPowersUsed?: number;
  createdAt?: string;
  isRegistered?: boolean;
}

export interface BotProfile {
  name: string;
  elo: number;
  badge: string;
  avatar: string;
  difficulty: Difficulty;
  description?: string;
}

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  captured?: string;
}

export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win';

export interface AnalyzedMove extends MoveRecord {
  moveNumber: number;
  classification: MoveClassification;
  evalCentipawns: number; // Positional evaluation from White's perspective (+ = White, - = Black)
  evalDrop: number; // How much quality was lost compared to best move
  bestMoveSan: string;
  bestMoveFrom: string;
  bestMoveTo: string;
  comment: string;
}

export interface GameAnalysisReport {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteStats: Record<MoveClassification, number>;
  blackStats: Record<MoveClassification, number>;
  analyzedMoves: AnalyzedMove[];
  coachSummary: string;
}

export interface BoardArrow {
  from: string;
  to: string;
  color?: string;
}

export interface Premove {
  from: string;
  to: string;
  promotion?: string;
}

export interface Mission {
  id: number;
  title: string;
  icon: string;
  difficulty: string;
  stars: string;
  desc: string;
  speakerName: string;
  dialogue: string;
  requiredElo: number;
  botDifficulty: Difficulty;
  completed: boolean;
}

export interface LeaderboardEntry {
  uid?: string;
  nickname: string;
  avatar: string;
  aperturaFavorita: string;
  eloBullet: number;
  eloBlitz: number;
  eloRapido: number;
  eloClasico?: number;
  partidasGanadas: number;
  isRegistered?: boolean;
}

export interface OnlineRoom {
  id: string;
  name: string;
  mode: GameMode;
  timeControlId?: string;
  initialSeconds: number;
  incrementSeconds: number;
  fen: string;
  turn: 'w' | 'b';
  status: 'waiting' | 'playing' | 'ended';
  whitePlayer: {
    uid: string;
    nickname: string;
    avatar: string;
    elo: number;
    timeLeft: number;
  };
  blackPlayer?: {
    uid: string;
    nickname: string;
    avatar: string;
    elo: number;
    timeLeft: number;
  } | null;
  moves: MoveRecord[];
  winner?: 'w' | 'b' | 'draw' | null;
  endReason?: string;
  lastMoveTimestamp?: number;
  createdAt: number;
}
