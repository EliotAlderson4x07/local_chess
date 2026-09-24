/**
 * Standard Elo Rating Algorithm:
 * R_nuevo = R_actual + K * (S - E)
 * E = 1 / (1 + 10^((R_rival - R_actual) / 400))
 * K = 32
 */

export function calculateEloChange(
  currentRating: number,
  opponentRating: number,
  score: 1 | 0.5 | 0, // 1: Victoria, 0.5: Tablas, 0: Derrota
  kFactor: number = 32
): { delta: number; newRating: number; expectedScore: number } {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
  const rawDelta = kFactor * (score - expectedScore);
  const delta = Math.round(rawDelta);
  const newRating = Math.max(100, currentRating + delta);

  return {
    delta,
    newRating,
    expectedScore
  };
}
