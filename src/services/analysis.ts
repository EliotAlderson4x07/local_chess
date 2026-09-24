import { Chess, Square } from 'chess.js';
import { AnalyzedMove, GameAnalysisReport, MoveClassification, MoveRecord } from '../types/chess.ts';

// Piece Material Values
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece-Square Tables (White perspective)
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

// Returns static evaluation in centipawns strictly from White's perspective (+ = White, - = Black)
export function evaluatePositionWhitePerspective(game: Chess): number {
  if (game.isCheckmate()) {
    // If it is White's turn and mated -> -9999; if Black's turn and mated -> +9999
    return game.turn() === 'w' ? -9999 : 9999;
  }
  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type] || 0;
      let positionalVal = 0;
      const squareIndex = piece.color === 'w' ? (7 - r) * 8 + c : r * 8 + c;

      if (piece.type === 'p') positionalVal = PAWN_PST[squareIndex];
      else if (piece.type === 'n') positionalVal = KNIGHT_PST[squareIndex];
      else if (piece.type === 'b') positionalVal = BISHOP_PST[squareIndex];

      const pieceTotal = baseVal + positionalVal;
      if (piece.color === 'w') {
        score += pieceTotal;
      } else {
        score -= pieceTotal;
      }
    }
  }

  if (game.isCheck()) {
    score += game.turn() === 'w' ? -50 : 50;
  }

  return score;
}

// Find top move and evaluation
function findBestMove(game: Chess): { bestMove: { san: string; from: string; to: string } | null; bestScore: number } {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) {
    return { bestMove: null, bestScore: evaluatePositionWhitePerspective(game) };
  }

  const isWhite = game.turn() === 'w';
  let bestScore = isWhite ? -Infinity : Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    game.move(move);
    // Depth 1-2 evaluation
    let score = evaluatePositionWhitePerspective(game);
    // If opponent has checkmate on reply
    if (game.isCheckmate()) {
      score = isWhite ? 9999 : -9999;
    }
    game.undo();

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return {
    bestMove: { san: bestMove.san, from: bestMove.from, to: bestMove.to },
    bestScore: bestScore === -Infinity || bestScore === Infinity ? evaluatePositionWhitePerspective(game) : bestScore
  };
}

const COMMON_BOOK_MOVES = new Set([
  'e4', 'd4', 'c4', 'Nf3', 'g3', 'f4', 'b3', 'Nc3',
  'e5', 'c5', 'e6', 'c6', 'd5', 'Nf6', 'g6', 'd6',
  'Bc4', 'Bb5', 'Nc3', 'Nf3', 'Be2', 'd3', 'exd5', 'cxd4', 'Nxd4', 'O-O'
]);

export function analyzeGame(moves: MoveRecord[]): GameAnalysisReport {
  const simulation = new Chess();
  const analyzedMoves: AnalyzedMove[] = [];

  const whiteStats: Record<MoveClassification, number> = {
    brilliant: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missed_win: 0
  };

  const blackStats: Record<MoveClassification, number> = {
    brilliant: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missed_win: 0
  };

  let whiteAccSum = 0;
  let whiteMoveCount = 0;
  let blackAccSum = 0;
  let blackMoveCount = 0;

  for (let i = 0; i < moves.length; i++) {
    const record = moves[i];
    const isWhiteTurn = record.color === 'w';
    const moveNumber = Math.floor(i / 2) + 1;

    // Evaluation and best move BEFORE the move was played
    const { bestMove, bestScore } = findBestMove(simulation);
    const evalBefore = evaluatePositionWhitePerspective(simulation);

    // Apply the played move
    let playedValid = false;
    try {
      const res = simulation.move({
        from: record.from as Square,
        to: record.to as Square,
        promotion: 'q'
      });
      if (res) playedValid = true;
    } catch {
      // Fallback SAN
      try {
        simulation.move(record.san);
        playedValid = true;
      } catch {}
    }

    if (!playedValid) continue;

    const evalAfter = evaluatePositionWhitePerspective(simulation);

    // Calculate quality loss (drop in centipawns for the moving player)
    // For White: higher is better, so drop = bestScore - evalAfter
    // For Black: lower is better, so drop = evalAfter - bestScore
    const rawDrop = isWhiteTurn ? bestScore - evalAfter : evalAfter - bestScore;
    const drop = Math.max(0, Math.round(rawDrop));

    // Calculate accuracy for this move
    const accuracy = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-0.0035 * drop))));
    if (isWhiteTurn) {
      whiteAccSum += accuracy;
      whiteMoveCount++;
    } else {
      blackAccSum += accuracy;
      blackMoveCount++;
    }

    // Determine Classification
    let classification: MoveClassification = 'good';
    let comment = '';

    const isMatchBest = bestMove && (bestMove.san === record.san || (bestMove.from === record.from && bestMove.to === record.to));
    const wasWinningBefore = isWhiteTurn ? evalBefore > 280 : evalBefore < -280;
    const isNowEqualOrWorse = isWhiteTurn ? evalAfter <= 60 : evalAfter >= -60;

    // 1. Brilliant check: sacrifice of piece leading to winning eval
    const isSacrifice = record.captured && ['q', 'r'].includes(record.captured.toLowerCase()) === false &&
      ['n', 'b', 'r', 'q'].includes(simulation.get(record.to as Square)?.type || '');

    if (isSacrifice && ((isWhiteTurn && evalAfter > 250) || (!isWhiteTurn && evalAfter < -250))) {
      classification = 'brilliant';
      comment = '¡Jugada brillante! Un sacrificio táctico impecable que asegura una ventaja contundente.';
    } else if (isMatchBest) {
      classification = 'best';
      comment = '¡La mejor jugada del motor! Desarrollas óptimamente y mantienes el control.';
    } else if (moveNumber <= 4 && COMMON_BOOK_MOVES.has(record.san)) {
      classification = 'book';
      comment = 'Jugada de libro teórico. Sigues los principios canónicos de la apertura.';
    } else if (wasWinningBefore && isNowEqualOrWorse) {
      classification = 'missed_win';
      comment = `Oportunidad perdida: dejaste escapar una posición ganadora. La jugada decisiva era ${bestMove?.san || ''}.`;
    } else if (drop <= 25) {
      classification = 'excellent';
      comment = 'Excelente jugada, conserva la ventaja estratégica.';
    } else if (drop <= 75) {
      classification = 'good';
      comment = 'Buena jugada sólida y constructiva.';
    } else if (drop <= 160) {
      classification = 'inaccuracy';
      comment = `Imprecisión: cediste parte de tu iniciativa. La mejor opción era ${bestMove?.san || ''}.`;
    } else if (drop <= 320) {
      classification = 'mistake';
      comment = `Error táctico: debilita tu posición o permite contrajuego rival. Era preferible ${bestMove?.san || ''}.`;
    } else {
      classification = 'blunder';
      comment = `¡Grave error! Pierdes material clave o comprometes la defensa. La jugada clave era ${bestMove?.san || ''}.`;
    }

    if (isWhiteTurn) {
      whiteStats[classification]++;
    } else {
      blackStats[classification]++;
    }

    analyzedMoves.push({
      ...record,
      moveNumber,
      classification,
      evalCentipawns: evalAfter,
      evalDrop: drop,
      bestMoveSan: bestMove?.san || record.san,
      bestMoveFrom: bestMove?.from || record.from,
      bestMoveTo: bestMove?.to || record.to,
      comment
    });
  }

  const whiteAccuracy = whiteMoveCount > 0 ? Math.round(whiteAccSum / whiteMoveCount) : 80;
  const blackAccuracy = blackMoveCount > 0 ? Math.round(blackAccSum / blackMoveCount) : 80;

  // General Coach summary
  let coachSummary = 'Partida equilibrada y disputada. ';
  if (whiteAccuracy > 85 && blackAccuracy > 85) {
    coachSummary = '¡Duelo de altísimo nivel! Ambos bandos demostraron una técnica posicional muy depurada.';
  } else if (whiteStats.blunder > 2 || blackStats.blunder > 2) {
    coachSummary = 'Partida dinámica con complicaciones tácticas y varios momentos críticos donde la iniciativa cambió de bando.';
  } else if (whiteStats.brilliant > 0 || blackStats.brilliant > 0) {
    coachSummary = '¡Hubo destellos de genialidad táctica con sacrificios espectaculares sobre el tablero!';
  } else {
    coachSummary = 'Buen combate posicional. Repasar las imprecisiones te ayudará a dominar el medio juego.';
  }

  return {
    whiteAccuracy,
    blackAccuracy,
    whiteStats,
    blackStats,
    analyzedMoves,
    coachSummary
  };
}

export const CLASSIFICATION_META: Record<
  MoveClassification,
  { label: string; icon: string; badgeClass: string; color: string }
> = {
  brilliant: {
    label: 'Brillante',
    icon: '💎',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
    color: '#06b6d4'
  },
  best: {
    label: 'La Mejor',
    icon: '🌟',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
    color: '#10b981'
  },
  excellent: {
    label: 'Excelente',
    icon: '✨',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/50',
    color: '#14b8a6'
  },
  good: {
    label: 'Buena',
    icon: '👍',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/50',
    color: '#3b82f6'
  },
  book: {
    label: 'Teoría / Libro',
    icon: '📖',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    color: '#f59e0b'
  },
  inaccuracy: {
    label: 'Imprecisión',
    icon: '❓',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50',
    color: '#eab308'
  },
  mistake: {
    label: 'Error',
    icon: '⚠️',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/50',
    color: '#f97316'
  },
  blunder: {
    label: 'Grave Error',
    icon: '💀',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-400/50',
    color: '#ef4444'
  },
  missed_win: {
    label: 'Oportunidad Perdida',
    icon: '🎯',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/50',
    color: '#f43f5e'
  }
};
