import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { useUserStore } from '@/src/store/useUserStore';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Play, CheckCircle2, XCircle } from 'lucide-react';

const PUZZLES = [
  {
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
    question: 'What piece is on b5?',
    options: ['White Bishop', 'Black Bishop', 'White Knight', 'None'],
    answer: 'White Bishop'
  },
  {
    moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'],
    question: 'What piece is on b4?',
    options: ['White Knight', 'Black Bishop', 'Black Knight', 'White Pawn'],
    answer: 'Black Bishop'
  },
  {
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4'],
    question: 'What piece is on d4?',
    options: ['White Pawn', 'Black Pawn', 'White Knight', 'Black Knight'],
    answer: 'White Knight'
  },
  {
    moves: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'h6', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'],
    question: 'Is Black in checkmate?',
    options: ['Yes', 'No'],
    answer: 'Yes'
  }
];

export function VisualizationPuzzles({ onBack }: { onBack: () => void }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'question' | 'result'>('start');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const addXp = useUserStore(state => state.addXp);
  const puzzle = PUZZLES[puzzleIndex];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing') {
      if (currentMoveIndex < puzzle.moves.length) {
        timer = setTimeout(() => {
          setCurrentMoveIndex(prev => prev + 1);
        }, 1500); // 1.5 seconds per move
      } else {
        timer = setTimeout(() => {
          setGameState('question');
        }, 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [gameState, currentMoveIndex, puzzle.moves.length]);

  const handleStart = () => {
    setGameState('playing');
    setCurrentMoveIndex(0);
    setSelectedOption(null);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setGameState('result');
    if (option === puzzle.answer) {
      addXp(20);
    }
  };

  const handleNext = () => {
    setPuzzleIndex((prev) => (prev + 1) % PUZZLES.length);
    setGameState('start');
    setCurrentMoveIndex(0);
    setSelectedOption(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 space-y-6">
      <div className="w-full flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="text-sm font-medium text-zinc-400">
          Puzzle {puzzleIndex + 1} of {PUZZLES.length}
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>Visualization Puzzles</CardTitle>
          <CardDescription>Memorize the moves and answer the question.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center min-h-[300px] justify-center">
          
          <AnimatePresence mode="wait">
            {gameState === 'start' && (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-zinc-400 text-center max-w-sm">
                  You will see a sequence of {puzzle.moves.length} moves. Try to visualize the board in your head.
                </p>
                <Button size="lg" onClick={handleStart} className="gap-2 mt-4">
                  <Play className="w-5 h-5" /> Start Sequence
                </Button>
              </motion.div>
            )}

            {gameState === 'playing' && (
              <motion.div
                key="playing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-8 w-full"
              >
                <div className="text-5xl font-bold text-white tracking-widest">
                  {currentMoveIndex < puzzle.moves.length ? puzzle.moves[currentMoveIndex] : '...'}
                </div>
                
                {/* Progress bar */}
                <div className="w-full max-w-xs h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentMoveIndex / puzzle.moves.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {(gameState === 'question' || gameState === 'result') && (
              <motion.div
                key="question"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 w-full"
              >
                <h3 className="text-2xl font-semibold text-center text-white">
                  {puzzle.question}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                  {puzzle.options.map((option) => {
                    let variant: any = "secondary";
                    if (gameState === 'result') {
                      if (option === puzzle.answer) variant = "success";
                      else if (option === selectedOption) variant = "danger";
                      else variant = "outline";
                    }

                    return (
                      <Button
                        key={option}
                        variant={variant}
                        size="lg"
                        className={`h-16 text-lg ${gameState === 'result' ? 'pointer-events-none' : ''}`}
                        onClick={() => handleOptionSelect(option)}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>

                {gameState === 'result' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 mt-4"
                  >
                    <div className={`flex items-center gap-2 text-lg font-medium ${selectedOption === puzzle.answer ? 'text-emerald-400' : 'text-red-400'}`}>
                      {selectedOption === puzzle.answer ? (
                        <><CheckCircle2 className="w-6 h-6" /> Correct! +20 XP</>
                      ) : (
                        <><XCircle className="w-6 h-6" /> Incorrect. The answer is {puzzle.answer}.</>
                      )}
                    </div>
                    <Button onClick={handleNext} className="mt-2">
                      Next Puzzle
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </CardContent>
      </Card>
    </div>
  );
}
