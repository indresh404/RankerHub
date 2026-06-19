/**
 * Calculate the detailed breakdown of how a user's rank is determined
 * @param {Object} userData - User data from Firestore
 * @returns {Object} Breakdown object with all point categories and explanations
 */
export const calculateRankingBreakdown = (userData) => {
  if (!userData) {
    return {
      gitPoints: { total: 0, commits: 0, prs: 0, reviews: 0, githubStreak: 0, explanation: "No GitHub activity yet" },
      codingVersePoints: { total: 0, explanation: "Complete challenges to earn points" },
      streakPoints: { total: 0, dailyStreak: 0, maxCap: 100, explanation: "Daily login streak (max 100 XP per cycle)" },
      referralPoints: { total: 0, successfulReferrals: 0, explanation: "Earn 100 XP per successful referral" },
      totalPoints: 0,
      pointsBreakdown: []
    };
  }

  const points = userData.points || {};

  // Git Points Breakdown (read from the actual schema: userData.githubStats + userData.githubStreak)
  const githubStats = userData.githubStats || {};
  const commits = githubStats.commits || 0;
  const prs = githubStats.prs || 0;
  const reviews = githubStats.reviews || 0;
  const githubStreak = userData.githubStreak || 0;

  const gitPointsDetail = {
    commits: commits * 2,
    prs: prs * 5,
    reviews: reviews * 10,
    githubStreak: githubStreak * 10,
    get total() {
      return this.commits + this.prs + this.reviews + this.githubStreak;
    },
    explanation: `GitHub contributions: ${commits} commits × 2 + ${prs} PRs × 5 + ${reviews} reviews × 10 + ${githubStreak} streak × 10`
  };

  // Coding Verse Points Breakdown (precomputed total stored on points.codingVersePoints;
  // per-difficulty completion counts aren't tracked separately in Firestore)
  const codingVersePointsTotal = points.codingVersePoints || 0;

  const codingVerseDetail = {
    total: codingVersePointsTotal,
    explanation: `CodingVerse Arena challenges solved: ${codingVersePointsTotal} XP earned`
  };

  // Streak Points Breakdown (read from userData.streak, the live login streak)
  const currentStreak = userData.streak || 0;
  const maxStreakCap = 100;

  const streakDetail = {
    dailyStreak: currentStreak * 10,
    maxCap: maxStreakCap,
    get total() {
      return Math.min(this.dailyStreak, this.maxCap);
    },
    currentConsecutiveDays: currentStreak,
    explanation: `Daily login streak: ${currentStreak} consecutive days × 10 XP (capped at ${maxStreakCap} XP per cycle)`
  };

  // Referral Points Breakdown (derive successful referral count from points.referralPoints,
  // since each successful referral awards 100 XP to the referrer)
  const referralPointsTotal = points.referralPoints || 0;
  const successfulReferrals = Math.floor(referralPointsTotal / 100);

  const referralDetail = {
    successfulReferrals,
    total: referralPointsTotal,
    explanation: `Successful referrals: ${successfulReferrals} × 100 XP per person`
  };

  // Use the authoritative totalPoints from Firestore to stay consistent with the rest of the app
  const totalFromBreakdown = points.totalPoints || 0;

  // Build detailed breakdown array for UI
  const pointsBreakdown = [
    {
      category: "🐙 GitHub Contributions",
      points: gitPointsDetail.total,
      details: [
        { label: "Commits", value: commits, multiplier: 2, total: gitPointsDetail.commits },
        { label: "Pull Requests", value: prs, multiplier: 5, total: gitPointsDetail.prs },
        { label: "Code Reviews", value: reviews, multiplier: 10, total: gitPointsDetail.reviews },
        { label: "GitHub Streak", value: githubStreak, multiplier: 10, total: gitPointsDetail.githubStreak }
      ]
    },
    {
      category: "💻 Coding Challenges",
      points: codingVerseDetail.total,
      details: [
        { label: "CodingVerse XP", value: codingVersePointsTotal, multiplier: 1, total: codingVersePointsTotal }
      ]
    },
    {
      category: "🔥 Daily Streak",
      points: streakDetail.total,
      details: [
        {
          label: "Consecutive Days",
          value: currentStreak,
          multiplier: 10,
          total: streakDetail.dailyStreak,
          note: `Capped at ${maxStreakCap} XP per cycle`
        }
      ]
    },
    {
      category: "🤝 Referrals",
      points: referralDetail.total,
      details: [
        { label: "Successful Referrals", value: successfulReferrals, multiplier: 100, total: referralDetail.total }
      ]
    }
  ].filter(item => item.points > 0); // Only show categories with points

  return {
    gitPoints: gitPointsDetail,
    codingVersePoints: codingVerseDetail,
    streakPoints: streakDetail,
    referralPoints: referralDetail,
    totalPoints: totalFromBreakdown,
    pointsBreakdown,
    rank: userData.rank || "N/A",
    nextMilestone: {
      points: Math.ceil(totalFromBreakdown / 250) * 250,
      pointsNeeded: Math.ceil(totalFromBreakdown / 250) * 250 - totalFromBreakdown
    }
  };
};

/**
 * Get a human-readable explanation for why a user has their current rank
 * @param {Object} breakdown - The breakdown object from calculateRankingBreakdown
 * @returns {string} Human-readable explanation
 */
export const getRankExplanation = (breakdown) => {
  const { totalPoints, pointsBreakdown } = breakdown;

  if (pointsBreakdown.length === 0) {
    return "Start earning points by completing challenges, contributing to GitHub, or logging in daily!";
  }

  const categories = pointsBreakdown.map(cat => cat.category).join(", ");
  return `Your rank is based on ${totalPoints} total points earned from: ${categories}`;
};