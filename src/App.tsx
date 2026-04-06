import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Analysis } from './pages/Analysis';
import { ChessComGame } from './services/chessCom';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize, Minimize } from 'lucide-react';

export default function App() {
  const [selectedGame, setSelectedGame] = useState<{ game: ChessComGame; username: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-zinc-100 font-sans selection:bg-blue-500/30 flex flex-col">
      
      {/* Top Navigation Bar */}
      <nav className="w-full h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedGame(null)}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg leading-none">AI</span>
          </div>
          <span className="font-semibold tracking-tight text-lg">Chess Analyzer</span>
        </div>
        
        <button 
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!selectedGame ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1 flex flex-col justify-center overflow-y-auto"
            >
              <Home onSelectGame={(game, username) => setSelectedGame({ game, username })} />
            </motion.div>
          ) : (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex-1 flex flex-col"
            >
              <Analysis 
                game={selectedGame.game} 
                username={selectedGame.username} 
                onBack={() => setSelectedGame(null)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
