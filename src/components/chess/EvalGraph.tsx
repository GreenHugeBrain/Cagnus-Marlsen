import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface EvalGraphProps {
  evaluations: (number | null)[]; // Array of scores (centipawns) or null if not analyzed
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

export function EvalGraph({ evaluations, currentMoveIndex, onMoveClick }: EvalGraphProps) {
  const data = useMemo(() => {
    return evaluations.map((score, index) => {
      // Cap the score for visualization purposes (e.g., +/- 1000 centipawns)
      let cappedScore = 0;
      if (score !== null) {
        cappedScore = Math.max(-1000, Math.min(1000, score));
      }
      return {
        move: index,
        score: cappedScore / 100, // Convert to pawns
        isWhiteAdvantage: cappedScore > 0,
      };
    });
  }, [evaluations]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      return (
        <div className="bg-zinc-900 border border-white/10 p-2 rounded shadow-xl text-xs font-mono text-white">
          Move {payload[0].payload.move}: {score > 0 ? '+' : ''}{score.toFixed(2)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-24 bg-zinc-900/60 rounded-xl border border-white/5 overflow-hidden relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          onClick={(e) => {
            if (e && e.activePayload && e.activePayload.length > 0) {
              onMoveClick(e.activePayload[0].payload.move);
            }
          }}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="50%" stopColor="#10b981" stopOpacity={0}/>
              <stop offset="50%" stopColor="#ef4444" stopOpacity={0}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/>
            </linearGradient>
          </defs>
          <YAxis domain={[-10, 10]} hide />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2 }} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorScore)" 
            isAnimationActive={false}
          />
          {currentMoveIndex >= 0 && currentMoveIndex < data.length && (
            <ReferenceLine x={currentMoveIndex} stroke="#3b82f6" strokeWidth={2} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
