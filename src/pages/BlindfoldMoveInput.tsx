import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, Square } from '@/src/components/chess/Chessboard';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { useUserStore } from '@/src/store/useUserStore';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, EyeOff, Send, RefreshCw, Undo, ArrowLeftRight } from 'lucide-react';

export function BlindfoldMoveInput({ onBack }: { onBack: () => void }) {
  const [chess] = useState(new Chess());
  const [moveInput, setMoveInput] = useState('');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showBoard, setShowBoard] = useState(false);
  const [pieces, setPieces] = useState<Record<Square, { type: string; color: 'w' | 'b' }>>({});
  const [flipped, setFlipped] = useState(false);
  
  const addXp = useUserStore(state => state.addXp);
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePieces = () => {
    const board = chess.board();
    const newPieces: Record<string, any> = {};
    board.forEach((row, i) => {
      row.forEach((piece, j) => {
        if (piece) {
          const file = String.fromCharCode(97 + j);
          const rank = 8 - i;
          newPieces[`${file}${rank}`] = { type: piece.type, color: piece.color };
        }
      });
    });
    setPieces(newPieces);
  };

  useEffect(() => {
    updatePieces();
  }, [chess]);

  const handleMoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveInput.trim()) return;

    try {
      const move = chess.move(moveInput);
      if (move) {
        setMoveHistory(prev => [...prev, move.san]);
        setMoveInput('');
        setError(null);
        updatePieces();
        addXp(2); // 2 XP per correct move
        
        if (chess.isCheckmate()) {
          setError('Checkmate! You win!');
          addXp(50);
        } else if (chess.isDraw()) {
          setError('Draw!');
        }
      }
    } catch (err) {
      setError('Invalid move. Try again.');
    }
    inputRef.current?.focus();
  };

  const handleUndo = () => {
    const undoMove = chess.undo();
    if (undoMove) {
      setMoveHistory(prev => prev.slice(0, -1));
      updatePieces();
      setError(null);
    }
  };

  const handleReset = () => {
    chess.reset();
    setMoveHistory([]);
    setMoveInput('');
    setError(null);
    setShowBoard(false);
    updatePieces();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="w-full flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleUndo} className="gap-2" size="sm" disabled={moveHistory.length === 0}>
            <Undo className="w-4 h-4" /> Undo
          </Button>
          <Button variant="outline" onClick={() => setFlipped(!flipped)} className="gap-2" size="sm">
            <ArrowLeftRight className="w-4 h-4" /> Flip
          </Button>
          <Button variant="outline" onClick={handleReset} className="gap-2" size="sm">
            <RefreshCw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left Column: Input & History */}
        <Card className="flex flex-col h-[500px]">
          <CardHeader>
            <CardTitle>Blindfold Move Input</CardTitle>
            <CardDescription>Play chess by entering algebraic notation.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            
            <div className="flex-1 overflow-y-auto mb-4 bg-zinc-950/50 rounded-xl p-4 border border-white/5">
              {moveHistory.length === 0 ? (
                <p className="text-zinc-500 text-center mt-4">No moves played yet. You play as {flipped ? 'Black' : 'White'}.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                    <React.Fragment key={i}>
                      <div className="flex gap-2">
                        <span className="text-zinc-500 w-6">{i + 1}.</span>
                        <span className="text-zinc-200 font-medium">{moveHistory[i * 2]}</span>
                      </div>
                      <div className="text-zinc-400 font-medium">
                        {moveHistory[i * 2 + 1] || ''}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleMoveSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={moveInput}
                onChange={(e) => setMoveInput(e.target.value)}
                placeholder="e.g. e4, Nf3, O-O"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                autoFocus
                autoComplete="off"
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 text-sm text-center ${error.includes('Checkmate') || error.includes('Draw') ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {error}
              </motion.p>
            )}

          </CardContent>
        </Card>

        {/* Right Column: Board (Hidden by default) */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-full max-w-[400px]">
            <div className={`transition-opacity duration-500 ${showBoard ? 'opacity-100' : 'opacity-10 blur-md pointer-events-none'}`}>
              <Chessboard 
                pieces={pieces}
                showCoordinates={true}
                disabled={true}
                flipped={flipped}
              />
            </div>
            
            {!showBoard && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowBoard(true)}
                  className="gap-2 shadow-xl"
                >
                  <Eye className="w-4 h-4" /> Reveal Position
                </Button>
              </div>
            )}
          </div>
          
          {showBoard && (
            <Button variant="ghost" onClick={() => setShowBoard(false)} className="gap-2 text-zinc-400">
              <EyeOff className="w-4 h-4" /> Hide Board
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
