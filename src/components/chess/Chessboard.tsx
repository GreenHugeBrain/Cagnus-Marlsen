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

const PIECE_URLS: Record<string, string> = {
  wp: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  wr: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  wn: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  wb: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  wq: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  wk: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  bp: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
  br: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  bn: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  bb: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  bq: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  bk: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
};

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
                    src={PIECE_URLS[`${piece.color}${piece.type}`]}
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
