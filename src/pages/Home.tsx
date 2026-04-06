import React, { useState } from 'react';
import { fetchRecentGames, ChessComGame } from '@/src/services/chessCom';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/Card';
import { Search, Loader2, Calendar, Swords, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface HomeProps {
  onSelectGame: (game: ChessComGame, username: string) => void;
}

export function Home({ onSelectGame }: HomeProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const fetchedGames = await fetchRecentGames(username.trim());
      setGames(fetchedGames);
      if (fetchedGames.length === 0) {
        setError('No recent games found for this user.');
      }
    } catch (err) {
      setError('Failed to fetch games. Please check the username and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getResultColor = (game: ChessComGame, user: string) => {
    const isWhite = game.white.username.toLowerCase() === user.toLowerCase();
    const userResult = isWhite ? game.white.result : game.black.result;
    
    if (userResult === 'win') return 'text-emerald-400';
    if (['checkmated', 'timeout', 'resigned', 'lose'].includes(userResult)) return 'text-red-400';
    return 'text-zinc-400'; // Draw or other
  };

  const getResultText = (game: ChessComGame, user: string) => {
    const isWhite = game.white.username.toLowerCase() === user.toLowerCase();
    const userResult = isWhite ? game.white.result : game.black.result;
    
    if (userResult === 'win') return 'Won';
    if (['checkmated', 'timeout', 'resigned', 'lose'].includes(userResult)) return 'Lost';
    return 'Draw';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-4 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 mb-4 shadow-2xl shadow-blue-500/10"
        >
          <Swords className="w-10 h-10 text-blue-400" />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-white"
        >
          AI Chess Analyzer
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-zinc-400 max-w-xl mx-auto"
        >
          Import your games from Chess.com and analyze them with a powerful built-in Stockfish engine.
        </motion.p>
      </div>

      <Card className="max-w-xl mx-auto bg-zinc-900/80 border-white/5">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Chess.com username..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <Button type="submit" disabled={isLoading || !username.trim()} className="px-6">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch Games'}
            </Button>
          </form>
          {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
        </CardContent>
      </Card>

      {games.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-semibold text-white px-2">Recent Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((game) => {
              const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
              const opponent = isWhite ? game.black : game.white;
              const resultColor = getResultColor(game, username);
              const resultText = getResultText(game, username);

              return (
                <Card 
                  key={game.uuid} 
                  className="hover:border-blue-500/30 transition-colors cursor-pointer group bg-zinc-900/40"
                  onClick={() => onSelectGame(game, username)}
                >
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-400">vs</span>
                        <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {opponent.username}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                          {opponent.rating}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(game.end_time * 1000), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {game.time_class}
                        </span>
                      </div>
                    </div>
                    <div className={`font-bold ${resultColor}`}>
                      {resultText}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
