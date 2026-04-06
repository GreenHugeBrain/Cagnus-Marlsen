import React, { useState, useEffect, useCallback } from 'react';
import { Chessboard, Square } from '@/src/components/chess/Chessboard';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { useUserStore } from '@/src/store/useUserStore';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Target, Zap, Clock } from 'lucide-react';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

const getRandomSquare = (): Square => {
  const file = FILES[Math.floor(Math.random() * FILES.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  return `${file}${rank}` as Square;
};

export function SquareTraining({ onBack }: { onBack: () => void }) {
  const [targetSquare, setTargetSquare] = useState<Square>(getRandomSquare());
  const [highlighted, setHighlighted] = useState<Partial<Record<Square, 'correct' | 'incorrect'>>>({});
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [showCoords, setShowCoords] = useState(true);
  
  const addXp = useUserStore(state => state.addXp);

  const startGame = () => {
    setScore(0);
    setAttempts(0);
    setTimeLeft(60);
    setIsActive(true);
    setTargetSquare(getRandomSquare());
    setHighlighted({});
  };

  const endGame = useCallback(() => {
    setIsActive(false);
    const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
    const xpGained = score * 5 + (accuracy > 80 ? 20 : 0);
    if (xpGained > 0) addXp(xpGained);
  }, [attempts, score, addXp]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      endGame();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, endGame]);

  const handleSquareClick = (square: Square) => {
    if (!isActive) return;

    setAttempts(prev => prev + 1);
    
    if (square === targetSquare) {
      setScore(prev => prev + 1);
      setHighlighted({ [square]: 'correct' });
      setTimeout(() => {
        setTargetSquare(getRandomSquare());
        setHighlighted({});
      }, 300);
    } else {
      setHighlighted({ [square]: 'incorrect', [targetSquare]: 'hint' });
      setTimeout(() => {
        setHighlighted({});
      }, 800);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="w-full flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-300">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="font-mono">{score}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="font-mono">{timeLeft}s</span>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Square Training</CardTitle>
          <CardDescription>Find the requested square as fast as possible.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="target"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-4xl font-bold text-white tracking-widest uppercase"
              >
                {targetSquare}
              </motion.div>
            ) : (
              <motion.div
                key="start"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                {attempts > 0 && (
                  <div className="text-center mb-4">
                    <p className="text-lg text-zinc-300">Time's up!</p>
                    <p className="text-2xl font-bold text-white">Score: {score}</p>
                    <p className="text-sm text-zinc-400">Accuracy: {Math.round((score / attempts) * 100)}%</p>
                  </div>
                )}
                <Button size="lg" onClick={startGame} className="w-full gap-2">
                  <Zap className="w-5 h-5" /> {attempts > 0 ? 'Play Again' : 'Start Training'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCoords(!showCoords)}
                  className="w-full"
                >
                  {showCoords ? 'Hide Coordinates (Hard)' : 'Show Coordinates (Easy)'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="w-full flex justify-center">
            <Chessboard 
              onSquareClick={handleSquareClick}
              highlightedSquares={highlighted}
              showCoordinates={showCoords}
              disabled={!isActive}
            />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
