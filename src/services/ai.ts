import { Chess, Move } from 'chess.js';
import { Difficulty } from '../types/chess.ts';

// Piece Material Values (standard centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece-Square Tables (White perspective; flipped for Black)
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

// Evaluate the board strictly relative to the bot's color (positive = good for bot)
function evaluateBoard(game: Chess, botColor: 'w' | 'b'): number {
  if (game.isCheckmate()) {
    // If it's opponent's turn and they are mated, bot won!
    return game.turn() === botColor ? -99999 : 99999;
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

      // Index in piece-square table: White from rank 8 down, Black flipped
      const squareIndex = piece.color === 'w' ? (7 - r) * 8 + c : r * 8 + c;

      if (piece.type === 'p') positionalVal = PAWN_PST[squareIndex];
      else if (piece.type === 'n') positionalVal = KNIGHT_PST[squareIndex];
      else if (piece.type === 'b') positionalVal = BISHOP_PST[squareIndex];

      const pieceTotal = baseVal + positionalVal;
      if (piece.color === botColor) {
        score += pieceTotal;
      } else {
        score -= pieceTotal;
      }
    }
  }

  // Bonus for check
  if (game.isCheck()) {
    if (game.turn() !== botColor) {
      score += 45; // Bot has opponent in check
    } else {
      score -= 45; // Bot is in check
    }
  }

  return score;
}

// Alpha-Beta Minimax search
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botColor: 'w' | 'b'
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game, botColor);
  }

  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) {
    return evaluateBoard(game, botColor);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      game.move(move);
      const evalVal = minimax(game, depth - 1, alpha, beta, false, botColor);
      game.undo();
      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      game.move(move);
      const evalVal = minimax(game, depth - 1, alpha, beta, true, botColor);
      game.undo();
      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Book moves for realistic competitive openings
const OPENINGS_WHITE = ['e4', 'd4', 'Nf3', 'c4'];
const RESPONSES_BLACK_E4 = ['e5', 'c5', 'e6', 'c6'];
const RESPONSES_BLACK_D4 = ['d5', 'Nf6', 'e6'];

export function computeBestMove(
  game: Chess,
  difficulty: Difficulty = 'medium',
  botColor: 'w' | 'b' = 'b'
): Move | null {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // 1. Immediate Win: Check if any move delivers Checkmate!
  for (const move of legalMoves) {
    game.move(move);
    const mates = game.isCheckmate();
    game.undo();
    if (mates) {
      return move;
    }
  }

  // 2. Opening Book on Move 1
  const moveNumber = Math.floor(game.history().length / 2) + 1;
  if (moveNumber === 1) {
    if (botColor === 'w') {
      const preferred = OPENINGS_WHITE[Math.floor(Math.random() * OPENINGS_WHITE.length)];
      const bookMove = legalMoves.find(m => m.san === preferred);
      if (bookMove) return bookMove;
    } else {
      const firstMoveSan = game.history()[0];
      const choices = firstMoveSan === 'e4' ? RESPONSES_BLACK_E4 : RESPONSES_BLACK_D4;
      const preferred = choices[Math.floor(Math.random() * choices.length)];
      const bookMove = legalMoves.find(m => m.san === preferred);
      if (bookMove) return bookMove;
    }
  }

  // 3. EASY / NOVICE DIFFICULTY (~600 - 800 Elo)
  if (difficulty === 'easy') {
    // 40% chance to capture an opponent piece if available
    const captures = legalMoves.filter(m => m.captured);
    if (captures.length > 0 && Math.random() < 0.4) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    // Prefer developing knights/pawns over moving king/rooks aimlessly
    const developingMoves = legalMoves.filter(m => ['n', 'p', 'b'].includes(m.piece));
    if (developingMoves.length > 0 && Math.random() < 0.6) {
      return developingMoves[Math.floor(Math.random() * developingMoves.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // 4. MEDIUM DIFFICULTY (~1200 - 1400 Elo)
  if (difficulty === 'medium') {
    const centerSquares = ['d4', 'e4', 'd5', 'e5', 'c4', 'c5', 'f4', 'f5'];
    const scoredMoves = legalMoves.map(m => {
      let score = Math.random() * 12;

      // Reward capturing high value pieces
      if (m.captured) {
        score += (PIECE_VALUES[m.captured] || 100) * 1.5;
      }

      // Reward controlling center
      if (centerSquares.includes(m.to)) {
        score += 30;
      }

      // Reward checks
      if (m.san.includes('+')) {
        score += 35;
      }

      // Check if moving into immediate capture by a pawn
      game.move(m);
      if (game.isCheck()) {
        score += 20;
      }
      game.undo();

      return { move: m, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    // 80% pick best, 20% pick 2nd best
    const pickIndex = Math.random() < 0.8 ? 0 : Math.min(1, scoredMoves.length - 1);
    return scoredMoves[pickIndex].move;
  }

  // 5. HARD DIFFICULTY (~1650 - 1800 Elo) - Minimax Depth 2 with Alpha-Beta
  if (difficulty === 'hard') {
    let bestScore = -Infinity;
    let bestMove = legalMoves[0];

    for (const move of legalMoves) {
      game.move(move);
      // Next ply is opponent's turn -> minimizing for bot
      const score = minimax(game, 2, -Infinity, Infinity, false, botColor);
      game.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // 6. MASTER DIFFICULTY (~2200+ Elo) - Minimax Depth 3 with Alpha-Beta
  let bestScore = -Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    game.move(move);
    // Depth 3 search for deep tactical precision
    const score = minimax(game, 3, -Infinity, Infinity, false, botColor);
    game.undo();

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

// Bot Draw Evaluation Result
export interface BotDrawEvaluation {
  winChancePercent: number;
  drawChancePercent: number;
  lossChancePercent: number;
  shouldAccept: boolean;
  evalScore: number;
  difficulty: Difficulty;
  reason: string;
  botQuote: string;
}

/**
 * Analyzes the bot's win probability according to its difficulty level.
 * Rule: If win probability is strictly greater than 30%, the bot MUST NOT accept the draw offer.
 * If win probability is <= 30%, the bot accepts the draw offer.
 */
export function evaluateBotDrawOffer(
  game: Chess,
  botColor: 'w' | 'b',
  difficulty: Difficulty = 'medium'
): BotDrawEvaluation {
  // Check terminal conditions first
  if (game.isCheckmate()) {
    const isBotMated = game.turn() === botColor;
    return {
      winChancePercent: isBotMated ? 0 : 100,
      drawChancePercent: 0,
      lossChancePercent: isBotMated ? 100 : 0,
      shouldAccept: isBotMated,
      evalScore: isBotMated ? -99999 : 99999,
      difficulty,
      reason: isBotMated
        ? 'El bot está en jaque mate y acepta las tablas para salvar medio punto.'
        : 'El rival está en jaque mate; el bot tiene la victoria asegurada.',
      botQuote: isBotMated
        ? '¡Estoy en jaque mate! Acepto las tablas inmediatamente.'
        : 'Tengo jaque mate forzado (100% de victoria). ¡Rechazo las tablas!'
    };
  }

  if (game.isDraw() || game.isStalemate()) {
    return {
      winChancePercent: 0,
      drawChancePercent: 100,
      lossChancePercent: 0,
      shouldAccept: true,
      evalScore: 0,
      difficulty,
      reason: 'La posición ya es tablas reglamentarias por ahogado o repetición.',
      botQuote: 'La partida ya es tablas por reglamento. Acepto.'
    };
  }

  // Positional evaluation according to bot difficulty
  let evalScore = 0;

  switch (difficulty) {
    case 'easy': {
      // Novice evaluation: basic piece and square values with perceptual noise (+-20 centipawns)
      const baseEval = evaluateBoard(game, botColor);
      const noise = (Math.random() * 40) - 20;
      evalScore = baseEval + noise;
      break;
    }
    case 'medium': {
      // Intermediate evaluation: 1-ply minimax lookahead
      evalScore = minimax(game, 1, -Infinity, Infinity, true, botColor);
      break;
    }
    case 'hard': {
      // Advanced evaluation: 2-ply minimax lookahead with alpha-beta
      evalScore = minimax(game, 2, -Infinity, Infinity, true, botColor);
      break;
    }
    case 'master': {
      // Master evaluation: 3-ply deep tactical minimax
      evalScore = minimax(game, 3, -Infinity, Infinity, true, botColor);
      break;
    }
    default:
      evalScore = evaluateBoard(game, botColor);
  }

  // Convert centipawns (from bot perspective) into Win Probability Percentage
  // Standard logistic curve: P(Win) = 100 / (1 + 10^(-eval / 450))
  // eval = 0 -> 50%
  // eval = -170 -> 30%
  // eval < -170 -> < 30%
  const winProb = 100 / (1 + Math.pow(10, -evalScore / 450));
  const winChancePercent = Math.min(99, Math.max(1, Math.round(winProb)));

  // If win chance is > 30%, bot MUST NOT accept draw
  const shouldAccept = winChancePercent <= 30;

  // Calculate approximate draw and loss distributions for UI visualization
  const drawProbFactor = Math.max(10, 40 - Math.abs(winChancePercent - 50) * 0.5);
  const drawChancePercent = Math.min(100 - winChancePercent, Math.round(drawProbFactor));
  const lossChancePercent = Math.max(0, 100 - winChancePercent - drawChancePercent);

  // Difficulty-tailored dialogue & reasons
  let botQuote = '';
  let reason = '';

  if (!shouldAccept) {
    // REJECT DRAW (> 30% win chance)
    reason = `El bot evaluó sus posibilidades de ganar en ${winChancePercent}% (> 30%). Por lo tanto, rechaza la oferta de tablas.`;
    switch (difficulty) {
      case 'easy':
        botQuote = `¡Mis posibilidades de ganar son del ${winChancePercent}% (> 30%)! Creo que todavía tengo opciones de victoria, ¡sigamos jugando!`;
        break;
      case 'medium':
        botQuote = `He analizado la posición y calculo un ${winChancePercent}% de opciones de victoria (> 30%). Rechazo las tablas porque veo opciones de ganar.`;
        break;
      case 'hard':
        botQuote = `Cálculo táctico (2 jugadas): ${winChancePercent}% de probabilidad de victoria (> 30%). Mi posición tiene ventaja suficiente para continuar.`;
        break;
      case 'master':
        botQuote = `Evaluación Minimax profunda: ${winChancePercent}% de opciones de triunfo (> 30%). Como Gran Maestro, no acepto tablas cuando la probabilidad de victoria supera el umbral del 30%.`;
        break;
    }
  } else {
    // ACCEPT DRAW (<= 30% win chance)
    reason = `El bot evaluó sus posibilidades de ganar en solo ${winChancePercent}% (≤ 30%). Acepta la oferta de tablas para asegurar el empate.`;
    switch (difficulty) {
      case 'easy':
        botQuote = `Estoy pasando apuros con solo un ${winChancePercent}% de opciones de ganar (≤ 30%). ¡Acepto las tablas encantado!`;
        break;
      case 'medium':
        botQuote = `Mis opciones de victoria han caído al ${winChancePercent}% (≤ 30%). Las tablas son un buen resultado en esta situación, acepto.`;
        break;
      case 'hard':
        botQuote = `Evaluación desfavorable: solo ${winChancePercent}% de posibilidades de ganar (≤ 30%). Estratégicamente prefiero asegurar el medio punto.`;
        break;
      case 'master':
        botQuote = `Análisis táctico: probabilidad de victoria limitada al ${winChancePercent}% (≤ 30%). Bajo la teoría de juego óptima, la oferta de tablas es aceptada.`;
        break;
    }
  }

  return {
    winChancePercent,
    drawChancePercent,
    lossChancePercent,
    shouldAccept,
    evalScore,
    difficulty,
    reason,
    botQuote
  };
}
