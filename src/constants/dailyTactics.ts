import { DailyTacticPuzzle } from '../types/chess.ts';

export const DAILY_TACTICS_PUZZLES: DailyTacticPuzzle[] = [
  {
    id: 'tactic-opera-mate',
    dayIndex: 1,
    title: 'El Mate Inmortal de la Ópera',
    theme: 'Desviación & Sacrificio de Dama',
    difficulty: 'Intermedio',
    eloBonus: 25,
    fen: '4kb1r/p2r1ppp/4qn2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 2 15',
    playerColor: 'w',
    description: 'Partida histórica: Paul Morphy contra los aristócratas en la Ópera de París (1858). Sacrifica la dama y remata la partida.',
    hint: 'Primero destruye la pieza clavada en d7. Luego desvía al caballo defensor con jaque de dama.',
    explanation: '1. Axd7+ Cxd7 2. Db8+! Cxb8 3. Td8# Una obra maestra de la historia donde Morphy entrega la dama para sellar un mate impecable con alfil y torre.',
    moves: [
      { from: 'b5', to: 'd7', san: 'Bxd7+' },
      { from: 'f6', to: 'd7', san: 'Nxd7' },
      { from: 'b3', to: 'b8', san: 'Qb8+' },
      { from: 'd7', to: 'b8', san: 'Nxb8' },
      { from: 'd1', to: 'd8', san: 'Rd8#' }
    ]
  },
  {
    id: 'tactic-reti-mate',
    dayIndex: 2,
    title: 'El Sacrificio Genial de Réti',
    theme: 'Doble Jaque & Coordinación de Piezas',
    difficulty: 'Avanzado',
    eloBonus: 30,
    fen: 'rnb1kb1r/pp3ppp/2p5/4q3/4n3/3Q4/PPPB1PPP/2KR1BNR w kq - 0 9',
    playerColor: 'w',
    description: 'Richard Réti contra Tartakower (Viena, 1910). Encuentra el sacrificio de dama que abre la red de mate de alfil y torre.',
    hint: 'La casilla d8 invita a la dama. Luego viene un jaque a la descubierta doble que nadie puede tapar.',
    explanation: '1. Dd8+! Rxd8 2. Ag5+ Rc7 3. Ad8# El doble jaque es letal porque el rey está obligado a moverse, culminando en un mate estético.',
    moves: [
      { from: 'd3', to: 'd8', san: 'Qd8+' },
      { from: 'e8', to: 'd8', san: 'Kxd8' },
      { from: 'd2', to: 'g5', san: 'Bg5+' },
      { from: 'd8', to: 'c7', san: 'Kc7' },
      { from: 'g5', to: 'd8', san: 'Bd8#' }
    ]
  },
  {
    id: 'tactic-philidor-mate',
    dayIndex: 3,
    title: 'El Mate del Ahogado de Philidor',
    theme: 'Mate de la Coz & Asfixia Real',
    difficulty: 'Avanzado',
    eloBonus: 30,
    fen: '5r1k/6pp/8/3Q2N1/8/8/5PPP/7K w - - 0 1',
    playerColor: 'w',
    description: 'El rey negro se resguarda en el rincón h8. Emplea la clásica secuencia de doble jaque y asfixia con caballo.',
    hint: 'Inicia con un jaque de caballo en f7, continúa con doble jaque en h6 y entrega la dama en g8.',
    explanation: '1. Cf7+ Rg8 2. Ch6+ Rh8 3. Dg8+! Txg8 4. Cf7# Las propias piezas negras encarcelan a su rey impidiéndole escapar del caballo.',
    moves: [
      { from: 'g5', to: 'f7', san: 'Nf7+' },
      { from: 'h8', to: 'g8', san: 'Kg8' },
      { from: 'f7', to: 'h6', san: 'Nh6+' },
      { from: 'g8', to: 'h8', san: 'Kh8' },
      { from: 'd5', to: 'g8', san: 'Qg8+' },
      { from: 'f8', to: 'g8', san: 'Rxg8' },
      { from: 'h6', to: 'f7', san: 'Nf7#' }
    ]
  },
  {
    id: 'tactic-legal-trap',
    dayIndex: 4,
    title: 'La Celada Inmortal de Légal',
    theme: 'Pseudoclavada & Mate en el Centro',
    difficulty: 'Intermedio',
    eloBonus: 25,
    fen: 'rn1qkbnr/ppp2p1p/3p2p1/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5',
    playerColor: 'w',
    description: 'El alfil negro cree tener clavado a tu caballo en f3 sobre la dama. ¡Demuestra que puedes mover el caballo!',
    hint: 'El caballo toma en e5 entregando la dama blanca. Si el rival muerde el cebo, el punto f7 queda indefenso.',
    explanation: '1. Cxe5! Axd1 2. Axf7+ Re7 3. Cd5# El rey negro queda atrapado en el centro por los dos caballos y el alfil activo.',
    moves: [
      { from: 'f3', to: 'e5', san: 'Nxe5' },
      { from: 'g4', to: 'd1', san: 'Bxd1' },
      { from: 'c4', to: 'f7', san: 'Bxf7+' },
      { from: 'e8', to: 'e7', san: 'Ke7' },
      { from: 'c3', to: 'd5', san: 'Nd5#' }
    ]
  },
  {
    id: 'tactic-anastasia-mate',
    dayIndex: 5,
    title: 'El Clásico Mate de Anastasia',
    theme: 'Apertura de Columna H & Torre',
    difficulty: 'Intermedio',
    eloBonus: 25,
    fen: '5r1k/4N1pp/8/7Q/8/3R4/5PPP/6K1 w - - 0 1',
    playerColor: 'w',
    description: 'El caballo en e7 ejerce una influencia descomunal sobre las casillas g8 y g6. Abre la columna h.',
    hint: 'Sacrifica la dama en h7 para desmantelar la defensa y pasar la torre de d3 a h3.',
    explanation: '1. Dxh7+! Rxh7 2. Th3# El caballo bloquea las casillas de escape en g8 y g6 mientras la torre aplica el jaque mate definitivo.',
    moves: [
      { from: 'h5', to: 'h7', san: 'Qxh7+' },
      { from: 'h8', to: 'h7', san: 'Kxh7' },
      { from: 'd3', to: 'h3', san: 'Rh3#' }
    ]
  },
  {
    id: 'tactic-backrank-deflection',
    dayIndex: 6,
    title: 'Desviación en la Primera Fila',
    theme: 'Mate del Pasillo & Sobrecarga Defensiva',
    difficulty: 'Fácil',
    eloBonus: 15,
    fen: 'r5k1/5ppp/8/q7/4Q3/8/5PPP/4R1K1 w - - 0 1',
    playerColor: 'w',
    description: 'El enroque negro sufre de debilidad en la octava fila por falta de casilla de escape (aire).',
    hint: 'La dama en e4 puede irrumpir en e8 sacrificándose para que la torre remate.',
    explanation: '1. De8+! Txe8 2. Txe8# Desviar la pieza protectora es uno de los métodos más directos y efectivos del ajedrez.',
    moves: [
      { from: 'e4', to: 'e8', san: 'Qe8+' },
      { from: 'a8', to: 'e8', san: 'Rxe8' },
      { from: 'e1', to: 'e8', san: 'Rxe8#' }
    ]
  },
  {
    id: 'tactic-royal-fork',
    dayIndex: 7,
    title: 'Horquilla Real de Caballo',
    theme: 'Ataque Doble & Ganancia de Dama',
    difficulty: 'Fácil',
    eloBonus: 20,
    fen: 'r2q3k/6pp/8/6N1/8/8/5PPP/5RK1 w - - 0 1',
    playerColor: 'w',
    description: 'La dama negra y su monarca se hallan alineados a distancia de bifurcación de caballo.',
    hint: 'Busca una casilla donde el caballo amenace al rey en jaque y a la dama simultáneamente.',
    explanation: '1. Cf7+ Rg8 2. Cxd8 La horquilla real gana la dama limpia dejando un final totalmente victorioso.',
    moves: [
      { from: 'g5', to: 'f7', san: 'Nf7+' },
      { from: 'h8', to: 'g8', san: 'Kg8' },
      { from: 'f7', to: 'd8', san: 'Nxd8' }
    ]
  },
  {
    id: 'tactic-arabian-mate',
    dayIndex: 8,
    title: 'El Histórico Mate Árabe',
    theme: 'Patrón Ancestral de Torre y Caballo',
    difficulty: 'Fácil',
    eloBonus: 15,
    fen: '7k/R6p/5N2/8/8/8/5PPP/6K1 w - - 0 1',
    playerColor: 'w',
    description: 'Uno de los esquemas de mate documentados más antiguos de la historia del ajedrez.',
    hint: 'Lleva la torre a la casilla vecina al rey en la columna h con el respaldo del caballo.',
    explanation: '1. Th7# El caballo en f6 defiende la torre en h7 y neutraliza las casillas g8 y h7.',
    moves: [
      { from: 'a7', to: 'h7', san: 'Rh7#' }
    ]
  }
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTacticPuzzleForDate(dateStr: string = getTodayDateString()): DailyTacticPuzzle {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_TACTICS_PUZZLES.length;
  return DAILY_TACTICS_PUZZLES[index];
}
