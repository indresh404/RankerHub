export const streakHistory = [
  { day: "Mon", status: "completed", date: "May 17" },
  { day: "Tue", status: "completed", date: "May 18" },
  { day: "Wed", status: "completed", date: "May 19" },
  { day: "Thu", status: "completed", date: "May 20" },
  { day: "Fri", status: "completed", date: "May 21" },
  { day: "Sat", status: "current", date: "May 22" },
  { day: "Sun", status: "pending", date: "May 23" },
];

export const focusStats = {
  totalHours: 148,
  activeStreak: 12,
  longestStreak: 45,
  dailyGoalMins: 60,
  dailyProgressMins: 45,
  focusModeSessions: 24,
};

export const habitCards = [
  {
    id: "h1",
    title: "GitHub Contribution",
    description: "Make at least one commit or pull request every single day.",
    frequency: "Daily",
    streak: 12,
    category: "Coding",
    progress: 100,
    icon: "git",
  },
  {
    id: "h2",
    title: "Algorithm Practice",
    description: "Solve a minimum of one medium or hard challenge.",
    frequency: "Daily",
    streak: 5,
    category: "Problem Solving",
    progress: 50,
    icon: "code",
  },
  {
    id: "h3",
    title: "Technical Reading",
    description: "Spend 20 minutes reading dev articles or documentation.",
    frequency: "Daily",
    streak: 8,
    category: "Learning",
    progress: 100,
    icon: "book",
  },
  {
    id: "h4",
    title: "Code Review",
    description: "Review a peer's PR or inspect open-source files.",
    frequency: "Weekly",
    streak: 3,
    category: "Collaboration",
    progress: 75,
    icon: "eye",
  },
];

export const weeklyHeatmap = [
  // 1 = commit, 0 = no activity, 2 = high activity
  { week: 1, days: [1, 2, 0, 1, 1, 0, 2] },
  { week: 2, days: [2, 1, 1, 2, 0, 1, 1] },
  { week: 3, days: [1, 1, 0, 2, 2, 1, 0] },
  { week: 4, days: [2, 2, 1, 1, 1, 2, 2] },
];
