import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { SquareTraining } from './pages/SquareTraining';
import { BlindfoldMoveInput } from './pages/BlindfoldMoveInput';
import { VisualizationPuzzles } from './pages/VisualizationPuzzles';
import { useUserStore } from './store/useUserStore';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize, Minimize } from 'lucide-react';

type ViewMode = 'dashboard' | 'square' | 'input' | 'puzzle';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const updateStreak = useUserStore(state => state.updateStreak);

  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

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
    <div className="min-h-screen bg-[#0f1115] text-zinc-100 font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation Bar (Minimal) */}
      <nav className="w-full h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f1115]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg leading-none">B</span>
          </div>
          <span className="font-semibold tracking-tight text-lg">Blindfold Chess</span>
        </div>
        
        <button 
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Toggle Focus Mode"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col justify-center"
            >
              <Dashboard onSelectMode={setCurrentView} />
            </motion.div>
          )}
          
          {currentView === 'square' && (
            <motion.div
              key="square"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col justify-center"
            >
              <SquareTraining onBack={() => setCurrentView('dashboard')} />
            </motion.div>
          )}

          {currentView === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col justify-center"
            >
              <BlindfoldMoveInput onBack={() => setCurrentView('dashboard')} />
            </motion.div>
          )}

          {currentView === 'puzzle' && (
            <motion.div
              key="puzzle"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="w-full flex-1 flex flex-col justify-center"
            >
              <VisualizationPuzzles onBack={() => setCurrentView('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
