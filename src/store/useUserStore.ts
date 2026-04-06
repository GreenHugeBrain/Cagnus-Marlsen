import { create } from 'zustand';

interface UserState {
  xp: number;
  level: number;
  streak: number;
  lastPlayedDate: string | null;
  addXp: (amount: number) => void;
  updateStreak: () => void;
}

const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;

export const useUserStore = create<UserState>((set) => ({
  xp: 0,
  level: 1,
  streak: 0,
  lastPlayedDate: null,
  addXp: (amount) =>
    set((state) => {
      const newXp = state.xp + amount;
      return { xp: newXp, level: calculateLevel(newXp) };
    }),
  updateStreak: () =>
    set((state) => {
      const today = new Date().toISOString().split('T')[0];
      if (state.lastPlayedDate === today) return state; // Already played today

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (state.lastPlayedDate === yesterdayStr) {
        return { streak: state.streak + 1, lastPlayedDate: today };
      } else {
        return { streak: 1, lastPlayedDate: today };
      }
    }),
}));
