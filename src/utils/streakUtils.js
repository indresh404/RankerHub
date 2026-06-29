/**
 * Returns today's date string in YYYY-MM-DD format (user's local timezone)
 */
export const getTodayString = () => {
  return new Date().toLocaleDateString("en-CA");
};

/**
 * Returns yesterday's date string in YYYY-MM-DD format
 */
export const getYesterdayString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toLocaleDateString("en-CA");
};

/**
 * Calculates updated streak with 1-day grace period logic
 */
export const calculateStreak = (
  lastActiveDate,
  currentStreak,
  streakFreezes = 0,
) => {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  // Already active today — no change
  if (lastActiveDate === today) {
    return {
      newStreak: currentStreak,
      newLastActiveDate: lastActiveDate,
      newStreakFreezes: streakFreezes,
      usedFreeze: false,
    };
  }

  // Active yesterday — continue streak normally
  if (lastActiveDate === yesterday) {
    return {
      newStreak: currentStreak + 1,
      newLastActiveDate: today,
      newStreakFreezes: streakFreezes,
      usedFreeze: false,
    };
  }

  // Missed exactly 1 day — use freeze if available
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoString = twoDaysAgo.toLocaleDateString("en-CA");

  if (lastActiveDate === twoDaysAgoString && streakFreezes > 0) {
    return {
      newStreak: currentStreak + 1,
      newLastActiveDate: today,
      newStreakFreezes: streakFreezes - 1,
      usedFreeze: true,
    };
  }

  // Streak broken — reset
  return {
    newStreak: 1,
    newLastActiveDate: today,
    newStreakFreezes: streakFreezes,
    usedFreeze: false,
  };
};
