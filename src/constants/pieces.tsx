import React from 'react';
import { PieceSkinId, PieceSkinTheme } from '../types/chess.ts';

export const PIECE_SKIN_THEMES: Record<PieceSkinId, PieceSkinTheme> = {
  classic: {
    id: 'classic',
    name: 'Clásico Torneo',
    tagline: 'Tradición en marfil y ébano noble',
    whiteColorName: 'Blanco Marfil',
    blackColorName: 'Ébano Carbón',
    whiteFill: '#ffffff',
    whiteStroke: '#18181b',
    blackFill: '#242426',
    blackStroke: '#ffffff',
    icon: '♟️'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neón Cyberpunk',
    tagline: 'Láseres cyan y magenta resplandecientes',
    whiteColorName: 'Cyan Neón Eléctrico',
    blackColorName: 'Magenta Neón Fucsia',
    whiteFill: '#00e5ff',
    whiteStroke: '#003340',
    blackFill: '#ff007f',
    blackStroke: '#ffffff',
    whiteFilter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.8))',
    blackFilter: 'drop-shadow(0 0 5px rgba(255, 0, 127, 0.8))',
    icon: '⚡'
  },
  royal_gold: {
    id: 'royal_gold',
    name: 'Oro Real & Obsidiana',
    tagline: 'Lujo imperial con grabados de oro puro',
    whiteColorName: 'Oro Puro 24K',
    blackColorName: 'Obsidiana Imperial Dorada',
    whiteFill: '#ffd700',
    whiteStroke: '#6b4700',
    blackFill: '#1a1824',
    blackStroke: '#ffd700',
    whiteFilter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.75))',
    blackFilter: 'drop-shadow(0 0 5px rgba(216, 180, 254, 0.6))',
    icon: '👑'
  },
  ice_fire: {
    id: 'ice_fire',
    name: 'Fuego & Hielo Cósmico',
    tagline: 'Glaciar ártico contra magma volcánico',
    whiteColorName: 'Hielo Ártico Cristalino',
    blackColorName: 'Magma Volcánico Ígneo',
    whiteFill: '#d2f6ff',
    whiteStroke: '#005870',
    blackFill: '#ff3700',
    blackStroke: '#420a00',
    whiteFilter: 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.75))',
    blackFilter: 'drop-shadow(0 0 5px rgba(255, 61, 0, 0.85))',
    icon: '🔥'
  },
  emerald_ruby: {
    id: 'emerald_ruby',
    name: 'Esmeralda & Rubí Real',
    tagline: 'Gemas de la corona talladas a mano',
    whiteColorName: 'Esmeralda Sagrada',
    blackColorName: 'Rubí Sangre Imperial',
    whiteFill: '#00e676',
    whiteStroke: '#004720',
    blackFill: '#e91e63',
    blackStroke: '#ffffff',
    whiteFilter: 'drop-shadow(0 0 5px rgba(0, 230, 118, 0.75))',
    blackFilter: 'drop-shadow(0 0 5px rgba(233, 30, 99, 0.75))',
    icon: '💎'
  }
};

interface PieceSvgProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  skin?: PieceSkinId;
  className?: string;
}

export const PieceSvg: React.FC<PieceSvgProps> = ({
  type,
  color,
  skin = 'classic',
  className = 'w-full h-full'
}) => {
  const isWhite = color === 'w';
  const theme = PIECE_SKIN_THEMES[skin] || PIECE_SKIN_THEMES.classic;

  const fill = isWhite ? theme.whiteFill : theme.blackFill;
  const stroke = isWhite ? theme.whiteStroke : theme.blackStroke;
  const filter = isWhite ? theme.whiteFilter : theme.blackFilter;

  const strokeWidth = isWhite ? '1.6' : '1.3';

  switch (type) {
    case 'p':
      return (
        <svg
          viewBox="0 0 45 45"
          className={className}
          style={filter ? { filter } : undefined}
        >
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      );
    case 'n':
      return (
        <svg
          viewBox="0 0 45 45"
          className={className}
          style={filter ? { filter } : undefined}
        >
          <path
            d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 18,25 21,23 15,22 13,17 14,14 15,11 18,10 22,10 z"
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
          <circle cx="20" cy="15" r="1.5" fill={stroke} />
        </svg>
      );
    case 'b':
      return (
        <svg
          viewBox="0 0 45 45"
          className={className}
          style={filter ? { filter } : undefined}
        >
          <path
            d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -5.5,0 -14,-0.5 -24,0 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 .5,-1.5 0,-2 0,-2 0,-7.5 -2.5,-16 -7.5,-20 -5,4 -7.5,12.5 -7.5,20 0,0 -.5,.5 0,2 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle
            cx="22.5"
            cy="8"
            r="2"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'r':
      return (
        <svg
          viewBox="0 0 45 45"
          className={className}
          style={filter ? { filter } : undefined}
        >
          <path
            d="m 9,39 27,0 0,-3 -3,-2 0,-16 3,-2 0,-5 -4,0 0,3 -4,0 0,-3 -5,0 0,3 -4,0 0,-3 -7,0 0,5 3,2 0,16 -3,2 0,3 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 12,36 21,0 m -18,-18 15,0"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
          />
        </svg>
      );
    case 'q':
      return (
        <svg
          viewBox="0 0 45 45"
          className={className}
          style={filter ? { filter } : undefined}
        >
          <path
            d="m 9,26 c 8.5,-1.5 21,-1.5 27,0 l 2,-12 -7,5 -4,-8 -4.5,8 -7,-5 2.5,12 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1.5,2.5 -1.5,2.5 -1.5,1.5 0.5,2.5 0.5,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0.5,-2.5 0,0 0,-1.5 -1.5,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4-8.5,-1.5 -18.5,-1.5 -27,0 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="6" cy="12" r="2" fill={fill} stroke={stroke} strokeWidth="1" />
          <circle cx="14" cy="9" r="2" fill={fill} stroke={stroke} strokeWidth="1" />
          <circle cx="22.5" cy="6" r="2" fill={fill} stroke={stroke} strokeWidth="1" />
          <circle cx="31" cy="9" r="2" fill={fill} stroke={stroke} strokeWidth="1" />
          <circle cx="39" cy="12" r="2" fill={fill} stroke={stroke} strokeWidth="1" />
        </svg>
      );
    case 'k':
      return (
        <svg
          viewBox="0 0 45 45"
          className={className}
          style={filter ? { filter } : undefined}
        >
          <path
            d="m 22.5,11.63 0,5.38 M 20,13.5 l 5,0"
            fill="none"
            stroke={stroke}
            strokeWidth="1.8"
          />
          <path
            d="m 22.5,25 c 0,0 4.5,-7.5 3,-10.5 -1.5,-3 -6,-3 -7.5,0 -1.5,3 3,10.5 3,10.5"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 11.5,37 c 5.5,3.5 15.5,3.5 21,0 v -7 c 0,0 9,-4.5 6,-10.5 -4,-1 -6,2 -6,2 0,0 0,-4 -6,-4 -6,0 -6,4 -6,4 0,0 -2,-3 -6,-2 -3,6 6,10.5 6,10.5 v 7 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      );
  }
};
