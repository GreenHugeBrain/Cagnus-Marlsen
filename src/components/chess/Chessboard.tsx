import React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export type Square = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

interface ChessboardProps {
  onSquareClick?: (square: Square) => void;
  highlightedSquares?: Partial<Record<Square, 'correct' | 'incorrect' | 'target' | 'hint'>>;
  showCoordinates?: boolean;
  flipped?: boolean;
  disabled?: boolean;
  pieces?: Record<Square, { type: string; color: 'w' | 'b' }>;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export function Chessboard({
  onSquareClick,
  highlightedSquares = {},
  showCoordinates = true,
  flipped = false,
  disabled = false,
  pieces = {} as Record<Square, { type: string; color: 'w' | 'b' }>,
}: ChessboardProps) {
  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="relative w-full max-w-[400px] aspect-square rounded-lg overflow-hidden shadow-2xl border border-white/10 select-none">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {ranks.map((rank, rankIndex) =>
          files.map((file, fileIndex) => {
            const square = `${file}${rank}` as Square;
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            const highlight = highlightedSquares[square];
            const piece = pieces[square];

            return (
              <div
                key={square}
                onClick={() => !disabled && onSquareClick?.(square)}
                className={cn(
                  "relative flex items-center justify-center w-full h-full text-xs sm:text-sm font-medium transition-colors duration-200",
                  isLight ? "bg-[#e2e8f0] text-[#475569]" : "bg-[#64748b] text-[#e2e8f0]",
                  !disabled && onSquareClick && "cursor-pointer",
                  highlight === 'correct' && "bg-emerald-500/80 text-white",
                  highlight === 'incorrect' && "bg-red-500/80 text-white",
                  highlight === 'target' && "bg-blue-500/80 text-white",
                  highlight === 'hint' && "bg-yellow-500/80 text-white"
                )}
              >
                {/* Coordinates */}
                {showCoordinates && fileIndex === 0 && (
                  <span className="absolute top-1 left-1 opacity-70 font-semibold text-[10px] sm:text-xs">
                    {rank}
                  </span>
                )}
                {showCoordinates && rankIndex === 7 && (
                  <span className="absolute bottom-1 right-1 opacity-70 font-semibold text-[10px] sm:text-xs">
                    {file}
                  </span>
                )}

                {/* Piece (if any) */}
                {piece && (
                  <motion.img
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={`https://www.chess.com/chesspieces/neo/150/${piece.color}${piece.type}.png`}
                    alt={`${piece.color}${piece.type}`}
                    className="w-[80%] h-[80%] drop-shadow-md pointer-events-none"
                    draggable={false}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
