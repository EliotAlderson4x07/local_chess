import { TimeControlConfig } from '../types/chess.ts';

export const COMPETITIVE_TIME_CONTROLS: TimeControlConfig[] = [
  // 1. BULLET MODES (Ultra-rápido)
  {
    id: 'bullet_1_0',
    name: '1 min | Clásico',
    shortName: '1|0',
    category: 'bullet',
    initialSeconds: 60,
    incrementSeconds: 0,
    icon: '⚡',
    description: 'Partida relámpago extrema a 1 minuto sin incremento'
  },
  {
    id: 'bullet_1_1',
    name: '1 min + 1s | FIDE Bullet',
    shortName: '1|1',
    category: 'bullet',
    initialSeconds: 60,
    incrementSeconds: 1,
    icon: '⚡',
    description: '1 minuto con 1 segundo de incremento por jugada'
  },
  {
    id: 'bullet_2_1',
    name: '2 min + 1s | Bullet Pro',
    shortName: '2|1',
    category: 'bullet',
    initialSeconds: 120,
    incrementSeconds: 1,
    icon: '⚡',
    description: '2 minutos más 1 segundo de incremento'
  },

  // 2. BLITZ MODES (Relámpago FIDE)
  {
    id: 'blitz_3_0',
    name: '3 min | Blitz Rápido',
    shortName: '3|0',
    category: 'blitz',
    initialSeconds: 180,
    incrementSeconds: 0,
    icon: '🔥',
    description: '3 minutos por jugador a muerte súbita'
  },
  {
    id: 'blitz_3_2',
    name: '3 min + 2s | Blitz FIDE Oficial',
    shortName: '3|2',
    category: 'blitz',
    initialSeconds: 180,
    incrementSeconds: 2,
    icon: '🔥',
    description: 'Control oficial del Campeonato Mundial de Blitz FIDE'
  },
  {
    id: 'blitz_5_0',
    name: '5 min | Blitz Clásico',
    shortName: '5|0',
    category: 'blitz',
    initialSeconds: 300,
    incrementSeconds: 0,
    icon: '🔥',
    description: 'El blitz tradicional de los clubes de ajedrez'
  },
  {
    id: 'blitz_5_3',
    name: '5 min + 3s | Blitz con Incremento',
    shortName: '5|3',
    category: 'blitz',
    initialSeconds: 300,
    incrementSeconds: 3,
    icon: '🔥',
    description: '5 minutos con 3 segundos de incremento por jugada'
  },

  // 3. RAPID MODES (Rápido FIDE)
  {
    id: 'rapid_10_0',
    name: '10 min | Rápido Estándar',
    shortName: '10|0',
    category: 'rapid',
    initialSeconds: 600,
    incrementSeconds: 0,
    icon: '⏱️',
    description: 'El formato rápido más popular en línea'
  },
  {
    id: 'rapid_15_10',
    name: '15 min + 10s | Rápido FIDE Oficial',
    shortName: '15|10',
    category: 'rapid',
    initialSeconds: 900,
    incrementSeconds: 10,
    icon: '⏱️',
    description: 'Control oficial de los Campeonatos Rápidos de la FIDE'
  },
  {
    id: 'rapid_30_0',
    name: '30 min | Rápido Reflexivo',
    shortName: '30|0',
    category: 'rapid',
    initialSeconds: 1800,
    incrementSeconds: 0,
    icon: '⏱️',
    description: 'Partida reflexiva ideal para estudiar tácticas y aperturas'
  },

  // 4. CLASSICAL MODES (Clásico de Torneo)
  {
    id: 'classical_60_0',
    name: '60 min | Clásico de Torneo',
    shortName: '60|0',
    category: 'classical',
    initialSeconds: 3600,
    incrementSeconds: 0,
    icon: '🏛️',
    description: 'Partida larga de maestría con análisis profundo'
  },
  {
    id: 'classical_30_30',
    name: '30 min + 30s | Clásico Liga FIDE',
    shortName: '30|30',
    category: 'classical',
    initialSeconds: 1800,
    incrementSeconds: 30,
    icon: '🏛️',
    description: 'Formato estándar de ligas federadas y torneos'
  }
];

export const DEFAULT_TIME_CONTROL = COMPETITIVE_TIME_CONTROLS[3]; // 3|0 Blitz
