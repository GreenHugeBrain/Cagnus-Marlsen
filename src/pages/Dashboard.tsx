import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { useUserStore } from '@/src/store/useUserStore';
import { Target, Keyboard, BrainCircuit, Flame, Trophy } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  onSelectMode: (mode: 'square' | 'input' | 'puzzle') => void;
}

export function Dashboard({ onSelectMode }: DashboardProps) {
  const { xp, level, streak } = useUserStore();

  const modes = [
    {
      id: 'square',
      title: 'Square Training',
      description: 'Find squares on an empty board as fast as possible.',
      icon: Target,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'hover:border-blue-500/50',
    },
    {
      id: 'input',
      title: 'Blindfold Move Input',
      description: 'Play a game using only algebraic notation.',
      icon: Keyboard,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'hover:border-emerald-500/50',
    },
    {
      id: 'puzzle',
      title: 'Visualization Puzzles',
      description: 'Track pieces in your head and answer questions.',
      icon: BrainCircuit,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'hover:border-purple-500/50',
      disabled: false,
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-8">
      
      {/* Header / Stats */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-900/50 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back!</h1>
          <p className="text-zinc-400 mt-1">Ready to improve your visualization?</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-yellow-500">
              <Trophy className="w-5 h-5" />
              <span className="text-2xl font-bold">{level}</span>
            </div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Level</span>
          </div>
          
          <div className="w-px h-10 bg-white/10" />
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-blue-400">
              <span className="text-2xl font-bold">{xp}</span>
            </div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total XP</span>
          </div>

          <div className="w-px h-10 bg-white/10" />

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-orange-500">
              <Flame className="w-5 h-5" />
              <span className="text-2xl font-bold">{streak}</span>
            </div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Day Streak</span>
          </div>
        </div>
      </div>

      {/* Modes Grid */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Training Modes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode, idx) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card 
                  className={`h-full cursor-pointer transition-all duration-300 ${mode.border} ${mode.disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/5'}`}
                  onClick={() => !mode.disabled && onSelectMode(mode.id as any)}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mode.bg}`}>
                      <Icon className={`w-6 h-6 ${mode.color}`} />
                    </div>
                    <CardTitle className="text-xl">{mode.title}</CardTitle>
                    <CardDescription className="text-sm mt-2 leading-relaxed">
                      {mode.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
