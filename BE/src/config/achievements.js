export const ACHIEVEMENTS = {
  streak_7: {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Duy trì streak 7 ngày',
    icon: '🔥',
    rarity: 'common',
    check: (habit) => habit.currentStreak >= 7,
    rewards: { streakShields: 1 }
  },
  
  streak_14: {
    id: 'streak_14',
    title: 'Two Weeks Strong',
    description: 'Duy trì streak 14 ngày',
    icon: '💪',
    rarity: 'common',
    check: (habit) => habit.currentStreak >= 14,
    rewards: { freezeTokens: 1 }
  },
  
  streak_30: {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Duy trì streak 30 ngày',
    icon: '⭐',
    rarity: 'rare',
    check: (habit) => habit.currentStreak >= 30,
    rewards: { streakShields: 1, freezeTokens: 1 }
  },
  
  streak_60: {
    id: 'streak_60',
    title: 'Streak Champion',
    description: 'Duy trì streak 60 ngày',
    icon: '👑',
    rarity: 'rare',
    check: (habit) => habit.currentStreak >= 60,
    rewards: { streakShields: 2, freezeTokens: 2 }
  },
  
  streak_100: {
    id: 'streak_100',
    title: 'Century Legend',
    description: 'Duy trì streak 100 ngày',
    icon: '💎',
    rarity: 'epic',
    check: (habit) => habit.currentStreak >= 100,
    rewards: { streakShields: 3, freezeTokens: 3, reviveTokens: 1 }
  },
  
  streak_365: {
    id: 'streak_365',
    title: 'Year Champion',
    description: 'Duy trì streak 365 ngày',
    icon: '🏆',
    rarity: 'legendary',
    check: (habit) => habit.currentStreak >= 365,
    rewards: { streakShields: 5, freezeTokens: 5, reviveTokens: 2 }
  },
  
  // ===== TOTAL COMPLETIONS ACHIEVEMENTS =====
  total_10: {
    id: 'total_10',
    title: 'First Steps',
    description: 'Hoàn thành 10 lần',
    icon: '🎯',
    rarity: 'common',
    check: (habit) => habit.totalCompletions >= 10,
    rewards: { streakShields: 1 }
  },
  
  total_50: {
    id: 'total_50',
    title: 'Getting Started',
    description: 'Hoàn thành 50 lần',
    icon: '🎖️',
    rarity: 'common',
    check: (habit) => habit.totalCompletions >= 50,
    rewards: { freezeTokens: 1 }
  },
  
  total_100: {
    id: 'total_100',
    title: 'Dedicated',
    description: 'Hoàn thành 100 lần',
    icon: '🌟',
    rarity: 'rare',
    check: (habit) => habit.totalCompletions >= 100,
    rewards: { streakShields: 2, freezeTokens: 1 }
  },
  
  total_500: {
    id: 'total_500',
    title: 'Habit Master',
    description: 'Hoàn thành 500 lần',
    icon: '💪',
    rarity: 'epic',
    check: (habit) => habit.totalCompletions >= 500,
    rewards: { streakShields: 3, freezeTokens: 2, reviveTokens: 1 }
  },
  
  total_1000: {
    id: 'total_1000',
    title: 'Legendary Master',
    description: 'Hoàn thành 1000 lần',
    icon: '👑',
    rarity: 'legendary',
    check: (habit) => habit.totalCompletions >= 1000,
    rewards: { streakShields: 4, freezeTokens: 3, reviveTokens: 2 }
  }
};
