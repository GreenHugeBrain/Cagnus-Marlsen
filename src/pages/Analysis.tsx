import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard, Square } from '@/src/components/chess/Chessboard';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent } from '@/src/components/ui/Card';
import { ChessComGame } from '@/src/services/chessCom';
import { StockfishEngine, EngineLine } from '@/src/services/stockfish';
import { EvalGraph } from '@/src/components/chess/EvalGraph';
import { explainMove } from '@/src/services/gemini';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Activity, Settings2, HelpCircle, AlertTriangle, XOctagon, Check, Star, Target, BookOpen, Sparkles, Loader2, Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisProps {
  game: ChessComGame;
  username: string;
  onBack: () => void;
}

type MoveClass = 'best' | 'excellent' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | null;

export function Analysis({ game, username, onBack }: AnalysisProps) {
  const [chess] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [pieces, setPieces] = useState<Record<Square, { type: string; color: 'w' | 'b' }>>({});
  const [openingName, setOpeningName] = useState<string | null>(null);
  
  // Current position evaluation
  const [evaluation, setEvaluation] = useState<{ score: number; mate: number | null; depth: number } | null>(null);
  const [topLines, setTopLines] = useState<EngineLine[]>([]);
  
  // Full game evaluations for the graph
  const [gameEvaluations, setGameEvaluations] = useState<(number | null)[]>([]);
  
  // Explanation state
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  
  // Play mode state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playChess, setPlayChess] = useState<Chess | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [isEngineThinking, setIsEngineThinking] = useState(false);
  
  // Engine settings state
  const [showEngineSettings, setShowEngineSettings] = useState(false);
  const [engineDepth, setEngineDepth] = useState(15);
  const [engineLines, setEngineLines] = useState(3);
  
  const engineRef = useRef<StockfishEngine | null>(null);
  const bgEngineRef = useRef<StockfishEngine | null>(null);
  const playEngineRef = useRef<StockfishEngine | null>(null);
  
  const isUserWhite = game.white.username.toLowerCase() === username.toLowerCase();

  // Initialize game from PGN
  useEffect(() => {
    chess.loadPgn(game.pgn);
    const history = chess.history();
    setMoveHistory(history);
    
    // Extract opening from headers
    const headers = chess.header();
    if (headers.ECOUrl) {
      // Chess.com often puts the opening in the ECOUrl
      const parts = headers.ECOUrl.split('/');
      const opening = parts[parts.length - 1].replace(/-/g, ' ');
      setOpeningName(opening);
    } else if (headers.Opening) {
      setOpeningName(headers.Opening);
    }
    
    // Initialize with 0 for the starting position, then nulls
    const initialEvals = new Array(history.length + 1).fill(null);
    initialEvals[0] = 30; // Starting position is roughly +0.3
    setGameEvaluations(initialEvals);
    
    // Go to the end of the game initially
    setCurrentMoveIndex(history.length - 1);
    
    // Initialize engines
    engineRef.current = new StockfishEngine();
    bgEngineRef.current = new StockfishEngine();
    playEngineRef.current = new StockfishEngine();
    
    // Apply initial settings
    engineRef.current.setMultiPv(engineLines);
    
    // Start background analysis
    let bgIndex = 0;
    const tempChess = new Chess();
    
    const analyzeNext = () => {
      if (bgIndex >= history.length || !bgEngineRef.current) return;
      
      tempChess.move(history[bgIndex]);
      bgEngineRef.current.analyzePosition(tempChess.fen(), (evalData) => {
        // Only record if depth is decent
        if (evalData.depth >= 10) {
          setGameEvaluations(prev => {
            const next = [...prev];
            // Convert mate to a high score
            let score = evalData.score;
            if (evalData.mate !== null) {
              score = evalData.mate > 0 ? 10000 - evalData.mate : -10000 - evalData.mate;
            }
            next[bgIndex + 1] = score; // Store at index + 1 (index 0 is start pos)
            return next;
          });
          
          // Move to next position
          bgIndex++;
          bgEngineRef.current?.stop();
          setTimeout(analyzeNext, 10);
        }
      }, 10); // Fast depth for background
    };
    
    analyzeNext();
    
    return () => {
      if (engineRef.current) engineRef.current.destroy();
      if (bgEngineRef.current) bgEngineRef.current.destroy();
      if (playEngineRef.current) playEngineRef.current.destroy();
    };
  }, [game.pgn, chess]);

  // Update engine settings when they change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMultiPv(engineLines);
      // Re-trigger analysis with new depth
      if (currentMoveIndex >= 0) {
        const tempChess = new Chess();
        for (let i = 0; i <= currentMoveIndex; i++) {
          tempChess.move(moveHistory[i]);
        }
        engineRef.current.analyzePosition(tempChess.fen(), (evalData) => {
          setEvaluation({ score: evalData.score, mate: evalData.mate, depth: evalData.depth });
          setTopLines(evalData.lines);
        }, engineDepth);
      }
    }
  }, [engineLines, engineDepth]);

  // Update board state when currentMoveIndex changes or playChess changes
  useEffect(() => {
    if (moveHistory.length === 0 && !playChess) return;

    // Reset explanation when move changes
    if (!isPlaying) {
      setExplanation(null);
    }

    const tempChess = playChess || new Chess();
    
    if (!playChess) {
      // Reset and replay up to current index
      for (let i = 0; i <= currentMoveIndex; i++) {
        tempChess.move(moveHistory[i]);
      }
    }

    // Update pieces for UI
    const board = tempChess.board();
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

    // Analyze position
    if (engineRef.current && !isPlaying) {
      setEvaluation(null);
      setTopLines([]);
      engineRef.current.analyzePosition(tempChess.fen(), (evalData) => {
        setEvaluation({ score: evalData.score, mate: evalData.mate, depth: evalData.depth });
        setTopLines(evalData.lines);
      }, engineDepth);
    }
  }, [currentMoveIndex, moveHistory, playChess, isPlaying]);

  // Keyboard navigation
  useEffect(() => {
    if (isPlaying) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentMoveIndex(prev => Math.min(moveHistory.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        setCurrentMoveIndex(-1);
      } else if (e.key === 'ArrowDown') {
        setCurrentMoveIndex(moveHistory.length - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHistory.length, isPlaying]);

  const evalPercentage = useMemo(() => {
    if (!evaluation) return 50;
    if (evaluation.mate !== null) {
      return evaluation.mate > 0 ? 100 : 0;
    }
    const score = evaluation.score;
    const winChance = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * score)) - 1);
    return Math.max(0, Math.min(100, winChance));
  }, [evaluation]);

  const getMoveClass = (index: number): MoveClass => {
    const prevEval = gameEvaluations[index];
    const currEval = gameEvaluations[index + 1];
    
    if (prevEval === null || currEval === null) return null;

    const isWhiteMove = index % 2 === 0;
    // Calculate eval drop from the perspective of the player who just moved
    let evalDrop = 0;
    
    if (isWhiteMove) {
      evalDrop = prevEval - currEval;
    } else {
      evalDrop = currEval - prevEval;
    }

    if (evalDrop < 20) return 'best';
    if (evalDrop < 50) return 'excellent';
    if (evalDrop < 100) return 'good';
    if (evalDrop < 200) return 'inaccuracy';
    if (evalDrop < 400) return 'mistake';
    return 'blunder';
  };

  const getMoveClassColor = (cls: MoveClass) => {
    switch (cls) {
      case 'best': return 'text-emerald-400';
      case 'excellent': return 'text-emerald-500';
      case 'good': return 'text-green-500';
      case 'inaccuracy': return 'text-yellow-400';
      case 'mistake': return 'text-orange-500';
      case 'blunder': return 'text-red-500';
      default: return 'text-zinc-300';
    }
  };

  const getMoveClassIcon = (cls: MoveClass) => {
    switch (cls) {
      case 'best': return <Star className="w-3 h-3 text-emerald-400 inline ml-1" />;
      case 'excellent': return <Check className="w-3 h-3 text-emerald-500 inline ml-1" />;
      case 'inaccuracy': return <HelpCircle className="w-3 h-3 text-yellow-400 inline ml-1" />;
      case 'mistake': return <AlertTriangle className="w-3 h-3 text-orange-500 inline ml-1" />;
      case 'blunder': return <XOctagon className="w-3 h-3 text-red-500 inline ml-1" />;
      default: return null;
    }
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      white: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, accuracy: 0 },
      black: { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0, accuracy: 0 }
    };
    
    let whiteTotalDrop = 0;
    let blackTotalDrop = 0;
    let whiteMoves = 0;
    let blackMoves = 0;

    moveHistory.forEach((_, i) => {
      const cls = getMoveClass(i);
      if (!cls) return;
      
      const isWhite = i % 2 === 0;
      const playerStats = isWhite ? stats.white : stats.black;
      playerStats[cls]++;
      
      const prevEval = gameEvaluations[i];
      const currEval = gameEvaluations[i + 1];
      if (prevEval !== null && currEval !== null) {
        const drop = isWhite ? prevEval - currEval : currEval - prevEval;
        if (isWhite) {
          whiteTotalDrop += Math.max(0, drop);
          whiteMoves++;
        } else {
          blackTotalDrop += Math.max(0, drop);
          blackMoves++;
        }
      }
    });
    
    // Rough accuracy calculation based on average centipawn loss
    const calcAccuracy = (totalDrop: number, moves: number) => {
      if (moves === 0) return 100;
      const acpl = totalDrop / moves;
      return Math.max(0, Math.min(100, 100 - (acpl / 10)));
    };
    
    stats.white.accuracy = calcAccuracy(whiteTotalDrop, whiteMoves);
    stats.black.accuracy = calcAccuracy(blackTotalDrop, blackMoves);
    
    return stats;
  }, [gameEvaluations, moveHistory]);

  const handleExplainMove = async () => {
    if (currentMoveIndex < 0) return;
    
    setIsExplaining(true);
    
    // Reconstruct FEN for current position
    const tempChess = new Chess();
    for (let i = 0; i <= currentMoveIndex; i++) {
      tempChess.move(moveHistory[i]);
    }
    
    const fen = tempChess.fen();
    const move = moveHistory[currentMoveIndex];
    
    const prevEval = gameEvaluations[currentMoveIndex] !== null ? (gameEvaluations[currentMoveIndex]! / 100).toFixed(2) : 'Unknown';
    const currEval = gameEvaluations[currentMoveIndex + 1] !== null ? (gameEvaluations[currentMoveIndex + 1]! / 100).toFixed(2) : 'Unknown';
    
    const result = await explainMove(fen, move, currEval, prevEval);
    setExplanation(result);
    setIsExplaining(false);
  };

  const startPlayMode = () => {
    const tempChess = new Chess();
    for (let i = 0; i <= currentMoveIndex; i++) {
      tempChess.move(moveHistory[i]);
    }
    setPlayChess(tempChess);
    setIsPlaying(true);
    setSelectedSquare(null);
  };

  const stopPlayMode = () => {
    setIsPlaying(false);
    setPlayChess(null);
    setSelectedSquare(null);
  };

  const handleSquareClick = (square: Square) => {
    if (!isPlaying || !playChess || isEngineThinking) return;

    if (selectedSquare) {
      try {
        // Try to move
        const move = playChess.move({
          from: selectedSquare,
          to: square,
          promotion: 'q', // Always promote to queen for simplicity in this demo
        });

        if (move) {
          // Valid move
          setPlayChess(new Chess(playChess.fen())); // Trigger re-render
          setSelectedSquare(null);
          
          // Engine's turn
          if (!playChess.isGameOver() && playEngineRef.current) {
            setIsEngineThinking(true);
            playEngineRef.current.analyzePosition(playChess.fen(), (evalData) => {
              if (evalData.lines.length > 0) {
                const bestMove = evalData.lines[0].pv[0];
                // bestMove is usually in UCI format like 'e2e4'
                const from = bestMove.substring(0, 2);
                const to = bestMove.substring(2, 4);
                const promotion = bestMove.length > 4 ? bestMove[4] : undefined;
                
                playChess.move({ from, to, promotion });
                setPlayChess(new Chess(playChess.fen()));
              }
              setIsEngineThinking(false);
            }, 10); // Fast response for playing
          }
        } else {
          // Invalid move, maybe selecting a different piece
          const piece = playChess.get(square);
          if (piece && piece.color === playChess.turn()) {
            setSelectedSquare(square);
          } else {
            setSelectedSquare(null);
          }
        }
      } catch (e) {
        // Invalid move
        const piece = playChess.get(square);
        if (piece && piece.color === playChess.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // Select piece
      const piece = playChess.get(square);
      if (piece && piece.color === playChess.turn()) {
        setSelectedSquare(square);
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Games
        </Button>
        <div className="flex items-center gap-4 text-sm bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white border border-zinc-400"></span>
            <span className="font-semibold text-white">{game.white.username}</span>
            <span className="text-zinc-500">({game.white.rating})</span>
          </div>
          <span className="text-zinc-600 font-bold">vs</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-600"></span>
            <span className="font-semibold text-white">{game.black.username}</span>
            <span className="text-zinc-500">({game.black.rating})</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left: Eval Bar + Board + Graph */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 h-full min-h-0">
          
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Evaluation Bar */}
            <div className="w-8 bg-zinc-800 rounded-lg overflow-hidden relative flex flex-col justify-end border border-white/10 shrink-0">
              <motion.div 
                className="w-full bg-zinc-200 transition-all duration-500 ease-out"
                style={{ height: `${evalPercentage}%` }}
              />
              {evaluation && !isPlaying && (
                <div className={`absolute w-full text-center text-[10px] font-bold py-1 z-10 ${evalPercentage > 50 ? 'text-zinc-900 top-0' : 'text-zinc-200 bottom-0'}`}>
                  {evaluation.mate !== null 
                    ? `M${Math.abs(evaluation.mate)}` 
                    : (evaluation.score > 0 ? '+' : '') + (evaluation.score / 100).toFixed(1)}
                </div>
              )}
            </div>

            {/* Board */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              <div className="w-full max-w-[600px] aspect-square relative">
                <Chessboard 
                  pieces={pieces}
                  flipped={!isUserWhite}
                  showCoordinates={true}
                  disabled={!isPlaying || isEngineThinking}
                  onSquareClick={handleSquareClick}
                  highlightedSquares={selectedSquare ? { [selectedSquare]: 'target' } : undefined}
                />
                {isPlaying && isEngineThinking && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                    <div className="bg-zinc-900/90 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border border-white/10">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Stockfish is thinking...
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation Controls / Play Controls */}
              <div className="flex items-center gap-2 mt-4 bg-zinc-900/80 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                {!isPlaying ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMoveIndex(-1)} disabled={currentMoveIndex === -1}>
                      <ChevronsLeft className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMoveIndex(prev => Math.max(-1, prev - 1))} disabled={currentMoveIndex === -1}>
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMoveIndex(prev => Math.min(moveHistory.length - 1, prev + 1))} disabled={currentMoveIndex === moveHistory.length - 1}>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMoveIndex(moveHistory.length - 1)} disabled={currentMoveIndex === moveHistory.length - 1}>
                      <ChevronsRight className="w-5 h-5" />
                    </Button>
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <Button variant="outline" size="sm" onClick={startPlayMode} className="gap-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300">
                      <Play className="w-4 h-4" />
                      Play from here
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={stopPlayMode} className="gap-2 bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:text-red-300">
                    <X className="w-4 h-4" />
                    Stop Playing
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Evaluation Graph & Blunder Timeline */}
          <div className={`shrink-0 flex flex-col gap-1 transition-opacity duration-300 ${isPlaying ? 'opacity-50 pointer-events-none' : ''}`}>
            <EvalGraph 
              evaluations={gameEvaluations.slice(1)} // Pass evaluations starting from move 1
              currentMoveIndex={currentMoveIndex} 
              onMoveClick={(idx) => !isPlaying && setCurrentMoveIndex(idx)} 
            />
            {/* Blunder Timeline */}
            <div className="h-2 w-full bg-zinc-900/50 rounded-full relative overflow-hidden border border-white/5">
              {moveHistory.map((_, i) => {
                const cls = getMoveClass(i);
                if (cls === 'blunder' || cls === 'mistake') {
                  const left = `${(i / Math.max(1, moveHistory.length - 1)) * 100}%`;
                  return (
                    <div 
                      key={i}
                      className={`absolute top-0 bottom-0 w-1 ${cls === 'blunder' ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{ left }}
                      title={`Move ${i + 1}: ${cls}`}
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>

        {/* Right: Analysis Panel */}
        <div className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-4 h-full min-h-0 transition-opacity duration-300 ${isPlaying ? 'opacity-50 pointer-events-none' : ''}`}>
          
          {/* Game Summary */}
          <Card className="bg-zinc-900/60 border-white/5 shrink-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-zinc-200">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm">Game Accuracy</span>
                </div>
                {openingName && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded-md">
                    <BookOpen className="w-3 h-3" />
                    <span className="truncate max-w-[150px]" title={openingName}>{openingName}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-2xl font-bold text-white mb-1">{summaryStats.white.accuracy.toFixed(1)}%</div>
                  <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">White</div>
                  <div className="flex gap-2 mt-2 text-[10px] font-mono">
                    <span className="text-red-400" title="Blunders">{summaryStats.white.blunder}</span>
                    <span className="text-orange-400" title="Mistakes">{summaryStats.white.mistake}</span>
                    <span className="text-yellow-400" title="Inaccuracies">{summaryStats.white.inaccuracy}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                  <div className="text-2xl font-bold text-white mb-1">{summaryStats.black.accuracy.toFixed(1)}%</div>
                  <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Black</div>
                  <div className="flex gap-2 mt-2 text-[10px] font-mono">
                    <span className="text-red-400" title="Blunders">{summaryStats.black.blunder}</span>
                    <span className="text-orange-400" title="Mistakes">{summaryStats.black.mistake}</span>
                    <span className="text-yellow-400" title="Inaccuracies">{summaryStats.black.inaccuracy}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engine Output & AI Explanation */}
          <Card className="bg-zinc-900/60 border-white/5 shrink-0 shadow-xl flex flex-col">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <Activity className="w-4 h-4" />
                  <span className="font-semibold text-sm">Stockfish 16.1</span>
                </div>
                <div className="flex items-center gap-3">
                  {evaluation && (
                    <span className="text-xs text-zinc-500 font-mono">Depth {evaluation.depth}</span>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Settings2 className="w-4 h-4 text-zinc-400" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                {topLines.length > 0 ? topLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className={`font-mono font-bold w-12 shrink-0 ${line.mate !== null ? 'text-purple-400' : (line.score > 0 ? 'text-emerald-400' : 'text-red-400')}`}>
                      {line.mate !== null 
                        ? `M${Math.abs(line.mate)}` 
                        : (line.score > 0 ? '+' : '') + (line.score / 100).toFixed(2)}
                    </div>
                    <div className="text-zinc-400 font-mono text-xs leading-5 group-hover:text-zinc-200 transition-colors line-clamp-2">
                      {line.pv.join(' ')}
                    </div>
                  </div>
                )) : (
                  <div className="text-zinc-500 text-sm italic py-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    Analyzing position...
                  </div>
                )}
              </div>

              {/* AI Explanation Section */}
              {currentMoveIndex >= 0 && (
                <div className="mt-2 pt-3 border-t border-white/5">
                  <AnimatePresence mode="wait">
                    {!explanation && !isExplaining ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Button 
                          onClick={handleExplainMove}
                          variant="outline" 
                          className="w-full gap-2 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300"
                        >
                          <Sparkles className="w-4 h-4" />
                          Explain Move {moveHistory[currentMoveIndex]}
                        </Button>
                      </motion.div>
                    ) : isExplaining ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center py-4 text-blue-400 gap-2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Generating explanation...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-100 leading-relaxed relative"
                      >
                        <Sparkles className="w-4 h-4 text-blue-400 absolute top-4 left-4" />
                        <div className="pl-6">{explanation}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Move List */}
          <Card className="flex-1 bg-zinc-900/60 border-white/5 overflow-hidden flex flex-col min-h-0 shadow-xl">
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 p-4 text-sm font-mono">
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
                  const whiteMoveIndex = i * 2;
                  const blackMoveIndex = i * 2 + 1;
                  
                  const whiteClass = getMoveClass(whiteMoveIndex);
                  const blackClass = moveHistory[blackMoveIndex] ? getMoveClass(blackMoveIndex) : null;
                  
                  return (
                    <React.Fragment key={i}>
                      <div className="text-zinc-600 text-right pr-2 py-1 select-none">{i + 1}.</div>
                      
                      <div 
                        className={`py-1 px-2 rounded cursor-pointer transition-colors flex items-center justify-between ${currentMoveIndex === whiteMoveIndex ? 'bg-blue-500/20 font-bold' : 'hover:bg-white/5'} ${getMoveClassColor(whiteClass)}`}
                        onClick={() => setCurrentMoveIndex(whiteMoveIndex)}
                      >
                        <span>{moveHistory[whiteMoveIndex]}</span>
                        {getMoveClassIcon(whiteClass)}
                      </div>
                      
                      {moveHistory[blackMoveIndex] ? (
                        <div 
                          className={`py-1 px-2 rounded cursor-pointer transition-colors flex items-center justify-between ${currentMoveIndex === blackMoveIndex ? 'bg-blue-500/20 font-bold' : 'hover:bg-white/5'} ${getMoveClassColor(blackClass)}`}
                          onClick={() => setCurrentMoveIndex(blackMoveIndex)}
                        >
                          <span>{moveHistory[blackMoveIndex]}</span>
                          {getMoveClassIcon(blackClass)}
                        </div>
                      ) : <div />}
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
